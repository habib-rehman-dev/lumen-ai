import asyncio
import logging
import uuid

from src.core.db import SessionLocal
from src.models import Document, DocumentStatus
from src.rag.ingest import IngestionError, ingest_file
from src.rag.store import delete_document_vectors

log = logging.getLogger(__name__)


async def ingest_document(document_id: uuid.UUID) -> None:
    # Background tasks outlive the request, so they open their OWN DB session
    async with SessionLocal() as db:
        doc = await db.get(Document, document_id)
        if doc is None or doc.status == DocumentStatus.DELETING:
            return

        error: str | None = None
        try:
            # Heavy work runs in a thread so the API stays responsive
            await asyncio.to_thread(
                ingest_file,
                path=doc.storage_path,
                user_id=doc.user_id,
                document_id=str(doc.id),
                filename=doc.filename,
            )
        except IngestionError as exc:
            error = str(exc)  # safe, user-facing message
        except Exception:
            log.exception("Ingestion crashed for %s", document_id)
            error = "Unexpected error while processing the file."

        # Re-read it from the DB (populate_existing bypasses the cached copy).
        fresh = await db.get(Document, document_id, populate_existing=True)
        if fresh is None or fresh.status == DocumentStatus.DELETING:
            # Row is gone or going: remove any vectors we just wrote
            await asyncio.to_thread(delete_document_vectors, str(document_id))
            return
        doc = fresh

        if error:
            # Never leave half-indexed chunks behind
            await asyncio.to_thread(delete_document_vectors, str(doc.id))
            doc.status, doc.error = DocumentStatus.FAILED, error
        else:
            doc.status, doc.error = DocumentStatus.READY, None
        await db.commit()