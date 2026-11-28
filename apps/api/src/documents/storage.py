import hashlib
import os
import tempfile
import uuid
from pathlib import Path
from urllib.parse import urlsplit

import aiofiles
import boto3
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


def persist_temp_file(tmp_path: Path, doc_id: uuid.UUID, filename: str) -> str:
    """Persist an upload locally or in S3, returning its storage identifier."""
    suffix = Path(filename).suffix.lower()
    if settings.storage_backend == "s3":
        bucket = settings.s3_bucket_name
        if bucket is None:
            raise RuntimeError("S3_BUCKET_NAME is required when STORAGE_BACKEND=s3")
        key = f"documents/{doc_id}{suffix}"
        with tmp_path.open("rb") as file_data:
            boto3.client("s3", region_name=settings.aws_region).put_object(
                Bucket=bucket, Key=key, Body=file_data
            )
        return f"s3://{bucket}/{key}"

    dest = UPLOAD_DIR / f"{doc_id}{suffix}"
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    os.replace(tmp_path, dest)
    return str(dest)


def is_s3_storage_path(storage_path: str) -> bool:
    return storage_path.startswith("s3://")


def _parse_s3_path(storage_path: str) -> tuple[str, str]:
    parsed = urlsplit(storage_path)
    bucket, key = parsed.netloc, parsed.path.lstrip("/")
    if parsed.scheme != "s3" or not bucket or not key:
        raise ValueError(f"Invalid S3 storage path: {storage_path!r}")
    return bucket, key


def materialize_for_ingestion(storage_path: str) -> Path:
    """Download an S3 object to a temporary file for the existing file parser."""
    if not is_s3_storage_path(storage_path):
        return Path(storage_path)

    bucket, key = _parse_s3_path(storage_path)
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    fd, filename = tempfile.mkstemp(
        prefix="ingest-", suffix=Path(key).suffix, dir=TMP_DIR
    )
    os.close(fd)
    local_path = Path(filename)
    try:
        boto3.client("s3", region_name=settings.aws_region).download_file(
            bucket, key, str(local_path)
        )
    except BaseException:
        local_path.unlink(missing_ok=True)
        raise
    return local_path


def cleanup_ingestion_file(storage_path: str, local_path: Path) -> None:
    if is_s3_storage_path(storage_path):
        local_path.unlink(missing_ok=True)


def delete_stored_file(storage_path: str) -> None:
    if is_s3_storage_path(storage_path):
        bucket, key = _parse_s3_path(storage_path)
        boto3.client("s3", region_name=settings.aws_region).delete_object(
            Bucket=bucket, Key=key
        )
        return
    Path(storage_path).unlink(missing_ok=True)
