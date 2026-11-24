from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from src.core.config import get_settings

settings = get_settings()

# Reads the "Authorization: Bearer <token>" header.
# auto_error=False lets us return our own clean 401 message.
bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user_id(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),  # noqa: B008
) -> str:
    """Verifies the token and returns the trusted user id.
    Every protected endpoint uses this. user_id NEVER comes from the request body."""
    if creds is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing token")
    try:
        payload = jwt.decode(
            creds.credentials,
            settings.backend_jwt_secret,
            algorithms=["HS256"],  # pin the algorithm (blocks "alg" tricks)
            audience="rag-backend",  # token must be meant for this API
            issuer="rag-frontend",  # and issued by our frontend
            options={"require": ["exp", "sub"]},  # must expire and have a user id
        )
    except jwt.PyJWTError:
        # Covers expired, tampered, wrong audience, malformed, etc.
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token")
    return payload["sub"]


# Shortcut type: use `user_id: CurrentUserId` in any endpoint
CurrentUserId = Annotated[str, Depends(get_current_user_id)]


import secrets

from fastapi import Header  # add to the existing fastapi import line if you prefer


def require_internal_key(x_internal_key: str | None = Header(default=None)) -> None:
    """Only the Next.js server knows this key. Blocks direct calls from the internet."""
    if not x_internal_key or not secrets.compare_digest(
        x_internal_key.encode(), settings.internal_api_key.encode()  # constant-time compare
    ):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Unauthorized")