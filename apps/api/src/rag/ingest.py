from pathlib import Path

from llama_index.core import SimpleDirectoryReader
from llama_index.core.ingestion import IngestionPipeline
from llama_index.core.node_parser import SentenceSplitter
from src.rag.store import (
    delete_document_vectors,
    get_embed_model,
    get_vector_store,
)

SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".txt", ".md", ".csv"}


class IngestionError(Exception):
    """A problem we can explain safely to the user."""


def ingest_file(*, path: str, user_id: str, document_id: str, filename: str) -> int:
    """
    Parse a file and store its chunks in the PostgreSQL vector store.

    This is blocking and CPU-heavy, so the caller runs it in a thread.
    """
    suffix = Path(filename).suffix.lower()

    if suffix not in SUPPORTED_EXTENSIONS:
        raise IngestionError(
            f"Unsupported file type '{suffix or 'unknown'}'. "
            f"Supported: {', '.join(sorted(SUPPORTED_EXTENSIONS))}"
        )

    try:
        documents = SimpleDirectoryReader(
            input_files=[path],
            file_metadata=lambda _: {
                "user_id": user_id,
                "document_id": document_id,
                "filename": filename,
            },
        ).load_data()
    except Exception as exc:
        raise IngestionError(
            "Could not read the file (it may be corrupted or password-protected)."
        ) from exc

    documents = [doc for doc in documents if doc.text and doc.text.strip()]

    if not documents:
        raise IngestionError(
            "No extractable text found (scanned PDFs need OCR, which comes later)."
        )

    for document in documents:
        document.id_ = document_id
        document.metadata["user_id"] = user_id
        document.metadata["document_id"] = document_id
        document.metadata["filename"] = filename

        document.excluded_embed_metadata_keys = [
            "user_id",
            "document_id",
        ]
        document.excluded_llm_metadata_keys = [
            "user_id",
            "document_id",
            "filename",
        ]

    delete_document_vectors(document_id)

    pipeline = IngestionPipeline(
        transformations=[
            SentenceSplitter(chunk_size=400, chunk_overlap=50),
            get_embed_model(),
        ],
        vector_store=get_vector_store(),
    )

    nodes = pipeline.run(documents=documents)
    return len(nodes)
