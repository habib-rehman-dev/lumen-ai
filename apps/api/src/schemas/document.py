import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DocumentOut(BaseModel):
    """What the API returns about a document (never exposes storage_path or sha256)."""
    model_config = ConfigDict(from_attributes=True)  # build from SQLAlchemy objects

    id: uuid.UUID
    filename: str
    mime_type: str
    size_bytes: int
    status: str
    error: str | None
    created_at: datetime