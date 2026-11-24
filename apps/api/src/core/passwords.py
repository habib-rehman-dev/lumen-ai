import asyncio

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError

_hasher = PasswordHasher()  # Argon2id with safe default settings

# A real hash of a throwaway password. When the email doesn't exist we verify against
# this, so "unknown email" takes as long as "wrong password" (no timing leak).
DUMMY_HASH = _hasher.hash("dummy-password-for-timing")


async def hash_password(password: str) -> str:
    # Hashing is deliberately slow (CPU heavy), so run it off the event loop
    return await asyncio.to_thread(_hasher.hash, password)


async def verify_password(password_hash: str, password: str) -> bool:
    try:
        return await asyncio.to_thread(_hasher.verify, password_hash, password)
    except (VerificationError, InvalidHashError):  # wrong password or corrupt hash
        return False