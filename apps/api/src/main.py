import asyncio
import logging
import uuid
from contextlib import asynccontextmanager

logging.basicConfig(level=logging.INFO)

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from src.chat.router import router
from src.core.config import get_settings
from src.core.db import engine, get_db
from src.core.security import CurrentUserId
from src.documents.router import router as documents_router
from src.documents.service import resolve_searchable_ids
from src.rag.retrieve import retrieve
from src.rag.store import get_embed_model  # add to imports
from src.users.router import router as users_router

settings = get_settings()

Dependency = Depends(get_db)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load heavy things ONCE at startup, not on the first user request
    await asyncio.to_thread(get_embed_model)

    yield
    await engine.dispose()


app = FastAPI(title=settings.app_name, lifespan=lifespan)

# Lets your Next.js frontend call this API from the browser
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health(db: AsyncSession = Depends(get_db)):  # noqa: B008
    # SELECT 1 proves the database is reachable, not just the server
    await db.execute(text("SELECT 1"))
    return {"status": "ok"}


@app.get("/me")
async def me(user_id: CurrentUserId):
    # Temporary: proves auth works. We'll remove it later.
    return {"user_id": user_id}


db = Depends(get_db)


@app.post("/debug/retrieve")
async def debug_retrieve(
    q: str,
    user_id: CurrentUserId,
    document_ids: list[uuid.UUID] | None = None,  # repeat ?document_ids=... to select
    db: AsyncSession = db,
):
    allowed = await resolve_searchable_ids(db, user_id, document_ids)

    print(f"Debug retrieve: user {user_id} query {q} allowed {allowed}")

    chunks = await retrieve(q, user_id, allowed)
    return [c.to_citation() for c in chunks]


app.include_router(documents_router)
app.include_router(router, tags=["chat"])

app.include_router(users_router)
