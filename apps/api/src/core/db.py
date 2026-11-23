from sqlalchemy.ext.asyncio import (
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase
from src.core.config import get_settings

settings = get_settings()

# One engine for the whole app; pool_pre_ping drops dead connections
engine = create_async_engine(settings.database_url, pool_pre_ping=True)

# Factory that creates DB sessions; expire_on_commit=False keeps objects
# usable after commit (important in async code)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    """All table models inherit from this."""


async def get_db():
    """FastAPI dependency: gives each request its own session,
    and closes it automatically when the request ends."""
    async with SessionLocal() as session:
        yield session
