from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.db import get_db
from src.core.passwords import DUMMY_HASH, hash_password, verify_password
from src.core.security import require_internal_key
from src.models import User
from src.schemas.auth import LoginIn, RegisterIn, UserOut

# dependencies=[...] applies the internal-key check to EVERY route in this router
router = APIRouter(
    prefix="/auth", tags=["auth"], dependencies=[Depends(require_internal_key)]
)


@router.post("/register", response_model=UserOut, status_code=201)
async def register(body: RegisterIn, db: AsyncSession = Depends(get_db)):
    user = User(
        email=body.email.lower(),
        name=body.name.strip(),
        password_hash=await hash_password(body.password),
    )
    db.add(user)
    try:
        await db.commit()
    except IntegrityError:
        # The unique index on email caught a duplicate (even a simultaneous one)
        await db.rollback()
        raise HTTPException(409, "An account with this email already exists")
    return user


@router.post("/verify", response_model=UserOut)
async def verify(body: LoginIn, db: AsyncSession = Depends(get_db)):
    user = await db.scalar(select(User).where(User.email == body.email.lower()))
    # Always do one hash check, even for unknown emails (same timing either way)
    ok = await verify_password(user.password_hash if user else DUMMY_HASH, body.password)
    if user is None or not ok:
        # One generic message: never reveal whether the email exists
        raise HTTPException(401, "Invalid email or password")
    return user