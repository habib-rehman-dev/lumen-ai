import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class MessagePart(BaseModel):
    type: str                  # AI SDK parts look like {"type": "text", "text": "..."}
    text: str | None = None


class IncomingMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    parts: list[MessagePart] = []


class ChatRequest(BaseModel):
    session_id: uuid.UUID | None = None         # None = start a new chat
    messages: list[IncomingMessage] = Field(min_length=1)
    document_ids: list[uuid.UUID] | None = None  # None = all ready documents

    def last_user_text(self) -> str:
        """We only trust the LAST user message from the frontend.
        Older history is loaded from our own database instead."""
        for m in reversed(self.messages):
            if m.role == "user":
                text = "".join(p.text or "" for p in m.parts if p.type == "text").strip()
                if text:
                    return text
        return ""


class MessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    role: str
    content: str
    citations: list | None
    created_at: datetime


# class ChatSessionOut(BaseModel):
#     model_config = ConfigDict(from_attributes=True)
#     id: uuid.UUID
#     title: str
#     created_at: datetime
#     updated_at: datetime


class ChatSessionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    title: str
    document_ids: list[str] | None = None   # None = whole library
    created_at: datetime
    updated_at: datetime
class ChatSessionDetail(ChatSessionOut):
    messages: list[MessageOut]
