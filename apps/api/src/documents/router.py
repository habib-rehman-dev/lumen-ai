from fastapi import APIRouter, BackgroundTasks, Depends, Response, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.db import get_db
from src.core.security import CurrentUserId
from src.documents.ingestion import ingest_document
from src.documents.service import create_document
from src.models import Document
from src.schemas.document import DocumentOut
import uuid
from src.documents.service import delete_document, get_owned_document
from src.models import DocumentStatus

router = APIRouter(prefix="/documents", tags=["documents"])



@router.post("",response_model=DocumentOut,  status_code=201)
async def upload_document(
    file: UploadFile,
    background: BackgroundTasks,
    response: Response,
    user_id: CurrentUserId,  # trusted id from the verified token
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    
    doc, should_ingest = await create_document(db, user_id, file)

   
    if should_ingest:
        # Runs AFTER the response is sent, so the upload returns instantly
        background.add_task(ingest_document, doc.id)
    else:
        response.status_code = 200  # duplicate: return the existing document
    return doc


@router.get("", response_model=list[DocumentOut])
async def list_documents(user_id: CurrentUserId, db: AsyncSession = Depends(get_db)):  # noqa: B008
    # Only THIS user's documents, newest first
    result = await db.scalars(
        select(Document)
        .where(Document.user_id == user_id,
            Document.status != DocumentStatus.DELETING,  # hide mid-delete docs
        )
        .order_by(Document.created_at.desc())
    )
    return result.all()


@router.get("/{document_id}", response_model=DocumentOut)
async def get_document(
    document_id: uuid.UUID,
    user_id: CurrentUserId,
    db: AsyncSession = Depends(get_db),
):
    # Handy for the frontend to poll one document's status
    return await get_owned_document(db, user_id, document_id)


@router.delete("/{document_id}", status_code=204)
async def remove_document(
    document_id: uuid.UUID,
    user_id: CurrentUserId,
    db: AsyncSession = Depends(get_db),
):
    await delete_document(db, user_id, document_id)
    # 204 = success with no body