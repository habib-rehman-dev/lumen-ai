import hashlib
import uuid
from pathlib import Path

import aiofiles
from fastapi import HTTPException, UploadFile
from src.core.config import get_settings

settings = get_settings()
UPLOAD_DIR = Path(settings.upload_dir)
TMP_DIR = UPLOAD_DIR / "_tmp"


async def save_to_temp(file: UploadFile) -> tuple[Path, str, int]:
    """Streams the upload to a temp file in 1 MB chunks while computing its
    SHA-256 hash. Never loads the whole file in memory.
    Returns (temp_path, sha256_hex, size_in_bytes)."""
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    max_bytes = settings.max_upload_mb * 1024 * 1024
    tmp_path = TMP_DIR / f"{uuid.uuid4().hex}.part"
    hasher = hashlib.sha256()
    size = 0

    try:
        async with aiofiles.open(tmp_path, "wb") as out:
            while chunk := await file.read(1024 * 1024):
                size += len(chunk)
                if size > max_bytes:  # stop early; don't accept huge files
                    raise HTTPException(
                        413, f"File exceeds {settings.max_upload_mb} MB"
                    )
                hasher.update(chunk)
                await out.write(chunk)
    except BaseException:
        tmp_path.unlink(missing_ok=True)  # never leave partial files behind
        raise

    if size == 0:
        tmp_path.unlink(missing_ok=True)
        raise HTTPException(400, "Empty file")
    return tmp_path, hasher.hexdigest(), size


def final_path(doc_id: uuid.UUID, filename: str) -> Path:
    """Stored name is the document's UUID, never the user's filename.
    This blocks path-traversal tricks like '../../etc/passwd'."""
    return UPLOAD_DIR / f"{doc_id}{Path(filename).suffix.lower()}"
