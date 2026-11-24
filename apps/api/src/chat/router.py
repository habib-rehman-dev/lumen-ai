import uuid

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from src.chat.service import get_owned_session, recent_history
from src.chat.stream import SSE_HEADERS, event_stream
from src.core.config import get_settings
from src.core.db import get_db
from src.core.security import CurrentUserId
from src.documents.service import resolve_searchable_ids
from src.models import ChatSession, Message
from src.schemas.chat import ChatRequest, ChatSessionDetail, ChatSessionOut

settings = get_settings()
router = APIRouter(tags=["chat"])

MAX_QUESTION_CHARS = 8000

db = Depends(get_db)


@router.post("/chat")
async def chat(
    body: ChatRequest,
    user_id: CurrentUserId,
    db: AsyncSession = db,
):
    question = body.last_user_text()
    if not question:
        raise HTTPException(422, "Empty message")
    if len(question) > MAX_QUESTION_CHARS:
        raise HTTPException(413, "Message too long")

    # 1) Existing chat (ownership checked) or a new one titled from the question
    if body.session_id:
        session = await get_owned_session(db, user_id, body.session_id)
        history = await recent_history(db, session.id, settings.chat_history_messages)
    else:
        session = ChatSession(user_id=user_id, title=question[:60])
        db.add(session)
        history = []

    # 2) Save the user's message BEFORE calling the LLM, so it's never lost
    db.add(Message(session=session, role="user", content=question))
    session.updated_at = func.now()
    await db.commit()
    session_id = session.id

    # 3) Postgres decides which documents are allowed; the graph does the rest
    allowed = await resolve_searchable_ids(db, user_id, body.document_ids)

    inputs = {
        "question": question,
        "history": [{"role": m.role, "content": m.content} for m in history],
        "user_id": user_id,  # from the verified token
        "document_ids": allowed,
        "search_query": "",
        "chunks": [],
        "answer": "",
    }
    return StreamingResponse(
        event_stream(session_id=session_id, inputs=inputs),
        media_type="text/event-stream",
        headers=SSE_HEADERS,
    )


@router.get("/chats", response_model=list[ChatSessionOut])
async def list_chats(user_id: CurrentUserId, db: AsyncSession = db):
    # Sidebar list: only this user's chats, most recent first
    rows = await db.scalars(
        select(ChatSession)
        .where(ChatSession.user_id == user_id)
        .order_by(ChatSession.updated_at.desc())
    )
    return rows.all()


@router.get("/chats/{chat_id}", response_model=ChatSessionDetail)
async def get_chat(chat_id: uuid.UUID, user_id: CurrentUserId, db: AsyncSession = db):
    return await get_owned_session(db, user_id, chat_id, with_messages=True)


@router.delete("/chats/{chat_id}", status_code=204)
async def delete_chat(
    chat_id: uuid.UUID, user_id: CurrentUserId, db: AsyncSession = db
):
    # Bulk delete scoped to the owner. The database's ON DELETE CASCADE
    # removes the messages. Documents are never touched.
    result = await db.execute(
        delete(ChatSession).where(
            ChatSession.id == chat_id, ChatSession.user_id == user_id
        )
    )
    await db.commit()
    if result.rowcount == 0: # type: ignore
        raise HTTPException(404, "Chat not found")
