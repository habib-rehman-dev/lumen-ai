import uuid
from datetime import datetime
from enum import StrEnum

from sqlalchemy import BigInteger, DateTime, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from src.core.db import Base


class DocumentStatus(StrEnum):
    # The ingestion lifecycle of one uploaded file
    PENDING = "pending"  # saved, waiting for ingestion
    READY = "ready"  # chunks are in Chroma, usable in chat
    FAILED = "failed"  # ingestion crashed; see `error`
    DELETING = "deleting"  # cleanup in progress


class Document(Base):
    __tablename__ = "documents"

    # Dedup rule: the same user can't store the same file content twice
    __table_args__ = (UniqueConstraint("user_id", "sha256", name="uq_user_file"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    # Comes from the verified auth token (Auth.js user id), never from the request body
    user_id: Mapped[str] = mapped_column(String(255), index=True)
    filename: Mapped[str] = mapped_column(String(500))
    sha256: Mapped[str] = mapped_column(String(64))  # hash of file bytes
    mime_type: Mapped[str] = mapped_column(String(255))
    size_bytes: Mapped[int] = mapped_column(BigInteger)
    storage_path: Mapped[str] = mapped_column(String(1000))  # where the raw file lives
    status: Mapped[str] = mapped_column(String(20), default=DocumentStatus.PENDING)
    error: Mapped[str | None] = mapped_column(Text, default=None)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
