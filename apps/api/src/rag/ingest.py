from pathlib import Path

from llama_index.core import SimpleDirectoryReader
from llama_index.core.ingestion import IngestionPipeline
from llama_index.core.node_parser import SentenceSplitter
from src.rag.store import delete_document_vectors, get_embed_model, get_vector_store

# Only these types are parsed in v1. Others fail with a clear message.
SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".txt", ".md", ".csv"}


class IngestionError(Exception):
    """A problem we can explain safely to the user."""


def ingest_file(*, path: str, user_id: str, document_id: str, filename: str) -> int:
    """Parses a file and stores its chunks in Chroma. Returns the chunk count.
    This is blocking/CPU-heavy, so the caller runs it in a thread."""
    suffix = Path(filename).suffix.lower()
    if suffix not in SUPPORTED_EXTENSIONS:
        raise IngestionError(
            f"Unsupported file type '{suffix or 'unknown'}'. "
            f"Supported: {', '.join(sorted(SUPPORTED_EXTENSIONS))}"
        )

    # 1) READ: PDFs come back as one Document per page (with page_label)
    try:
        docs = SimpleDirectoryReader(
            input_files=[path],
            # This metadata is copied onto every chunk. It's what makes
            # per-user filtering and citations possible later.
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

    docs = [d for d in docs if d.text and d.text.strip()]  # drop empty pages
    if not docs:
        raise IngestionError(
            "No extractable text found (scanned PDFs need OCR, which comes later)."
        )

    for d in docs:
        # Keep ids out of the text that gets embedded and sent to the LLM
        d.excluded_embed_metadata_keys = ["user_id", "document_id"]
        d.excluded_llm_metadata_keys = ["user_id", "document_id"]

    # Idempotent: clear any chunks from a previous (failed/retried) attempt
    delete_document_vectors(document_id)

    # 2) CHUNK + 3) EMBED + 4) STORE
    pipeline = IngestionPipeline(
        transformations=[
            # 400 tokens keeps chunks under the embedding model's 512 limit
            SentenceSplitter(chunk_size=400, chunk_overlap=50),
            get_embed_model(),
        ],
        vector_store=get_vector_store(),  # nodes are written to Chroma
    )
    nodes = pipeline.run(documents=docs)
    return len(nodes)
