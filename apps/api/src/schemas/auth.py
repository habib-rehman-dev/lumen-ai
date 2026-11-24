import uuid

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class RegisterIn(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    email: EmailStr
    # 128 max: Argon2 is slow, so unlimited-length passwords would be a cheap attack
    password: str = Field(min_length=8, max_length=128)


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class UserOut(BaseModel):
    """Returned to the Next.js server. The hash is never included."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    email: str