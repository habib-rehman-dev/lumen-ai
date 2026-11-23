import uuid

from fastapi import HTTPException
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from src.core.db import SessionLocal
from src.models import ChatSession, Message


async def get_owned_session(
    db: AsyncSession, user_id: str, session_id: uuid.UUID, with_messages: bool = False
) -> ChatSession:
    """Only returns the chat if it belongs to this user (404 otherwise)."""
    query = select(ChatSession).where(
        ChatSession.id == session_id, ChatSession.user_id == user_id
    )
    if with_messages:
        # Async SQLAlchemy can't lazy-load, so load messages explicitly
        query = query.options(selectinload(ChatSession.messages))
    chat = await db.scalar(query)
    if chat is None:
        raise HTTPException(404, "Chat not found")
    return chat


async def recent_history(
    db: AsyncSession, session_id: uuid.UUID, limit: int
) -> list[Message]:
    """Last `limit` messages in chronological order."""
    rows = await db.scalars(
        select(Message)
        .where(Message.session_id == session_id)
        .order_by(Message.created_at.desc())
        .limit(limit)
    )
    return list(reversed(rows.all()))


async def save_assistant_message(
    session_id: uuid.UUID, content: str, citations: list[dict]
) -> None:
    """Runs AFTER streaming, so it opens its own DB session
    (the request's session may already be closed)."""
    async with SessionLocal() as db:
        db.add(
            Message(
                session_id=session_id,
                role="assistant",
                content=content,
                citations=citations or None,
            )
        )
        # Bump updated_at so the chat moves to the top of the sidebar
        await db.execute(
            update(ChatSession)
            .where(ChatSession.id == session_id)
            .values(updated_at=func.now())
        )
        await db.commit()
