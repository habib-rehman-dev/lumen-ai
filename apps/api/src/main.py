import asyncio
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import get_settings
from src.core.db import engine, get_db
from src.core.security import CurrentUserId
from src.documents.router import router as documents_router
from src.rag.store import get_embed_model  # add to imports

settings = get_settings()


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


app.include_router(documents_router)
