import asyncio
import logging
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from src.documents.storage import delete_stored_file, persist_temp_file, save_to_temp
from src.models import Document, DocumentStatus
from src.rag.store import delete_document_vectors

log = logging.getLogger(__name__)


async def create_document(
    db: AsyncSession, user_id: str, file: UploadFile
) -> tuple[Document, bool]:
    """Returns (document, should_ingest).
    should_ingest is False when this user already uploaded the same file."""
    # Keep only the base name, cap its length, and handle missing names
    filename = Path(file.filename or "unnamed").name[:255] or "unnamed"

    tmp_path, sha256, size = await save_to_temp(file)
    try:
        # DEDUP: has THIS user already uploaded identical content?
        existing = await db.scalar(
            select(Document).where(
                Document.user_id == user_id, Document.sha256 == sha256
            )
        )
        if existing:
            if existing.status == DocumentStatus.DELETING:
                raise HTTPException(
                    409, "This file is being deleted. Try again shortly."
                )
            if existing.status == DocumentStatus.FAILED:
                existing.status, existing.error = DocumentStatus.PENDING, None
                await db.commit()
                return existing, True
            return existing, False

        doc_id = uuid.uuid4()
        storage_path = await asyncio.to_thread(
            persist_temp_file, tmp_path, doc_id, filename
        )
        doc = Document(
            id=doc_id,
            user_id=user_id,
            filename=filename,
            sha256=sha256,
            # Client-supplied and NOT trusted; real type detection happens at ingestion
            mime_type=file.content_type or "application/octet-stream",
            size_bytes=size,
            storage_path=storage_path,
            status=DocumentStatus.PENDING,
        )
        db.add(doc)
        try:
            await db.commit()
        except IntegrityError:
            await db.rollback()
            await asyncio.to_thread(delete_stored_file, storage_path)
            existing = await db.scalar(
                select(Document).where(
                    Document.user_id == user_id, Document.sha256 == sha256
                )
            )
            if existing is None:
                raise RuntimeError(
                    "Document disappeared after unique constraint violation"
                )
            return existing, False
        except Exception:
            await db.rollback()
            log.exception(
                "Failed to commit document %s; its stored file may need cleanup",
                doc_id,
            )
            raise
        return doc, True
    finally:
        tmp_path.unlink(missing_ok=True)


async def get_owned_document(
    db: AsyncSession, user_id: str, document_id: uuid.UUID
) -> Document:
    """Fetches a document ONLY if it belongs to this user.
    Returns 404 (not 403) for other people's documents, so ids can't be probed."""
    doc = await db.scalar(
        select(Document).where(Document.id == document_id, Document.user_id == user_id)
    )
    if doc is None:
        raise HTTPException(404, "Document not found")
    return doc


async def delete_document(
    db: AsyncSession, user_id: str, document_id: uuid.UUID
) -> None:
    doc = await get_owned_document(db, user_id, document_id)

    # 1) Mark first: hides it from lists and tells a running ingestion to stop
    doc.status = DocumentStatus.DELETING
    await db.commit()

    # 2) Remove vectors (blocking call, so run it in a thread)
    await asyncio.to_thread(delete_document_vectors, str(doc.id))

    # 3) Remove the raw file (missing_ok = safe to retry)
    await asyncio.to_thread(delete_stored_file, doc.storage_path)

    # 4) Remove the row last, so a failure above leaves a retryable record
    await db.delete(doc)
    await db.commit()


async def resolve_searchable_ids(
    db: AsyncSession, user_id: str, requested: list[uuid.UUID] | None
) -> list[str]:
    """Turns the frontend's selection into a safe list of document ids.
    - requested=None  -> all of the user's ready documents ("select all")
    - otherwise       -> only those that are THEIRS and READY
    Foreign or unfinished ids are silently dropped, never trusted."""
    query = select(Document.id).where(
        Document.user_id == user_id,
        Document.status == DocumentStatus.READY,
    )
    if requested is not None:
        query = query.where(Document.id.in_(requested))
    rows = await db.scalars(query)
    return [str(i) for i in rows.all()]


async def owned_document_ids(
    db: AsyncSession, user_id: str, requested: list[uuid.UUID]
) -> list[str]:
    """Keeps only ids that belong to this user (any status except deleting).
    Used before SAVING a chat's document list, so foreign ids are never stored."""
    rows = await db.scalars(
        select(Document.id).where(
            Document.user_id == user_id,
            Document.id.in_(requested),
            Document.status != DocumentStatus.DELETING,
        )
    )
    return [str(i) for i in rows.all()]