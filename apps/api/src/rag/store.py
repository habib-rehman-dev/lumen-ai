from functools import lru_cache

from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.vector_stores.postgres import PGVectorStore
from src.core.config import get_settings

settings = get_settings()
COLLECTION_NAME = "documents"


TABLE_NAME = settings.TABLE_NAME  # for PGVectorStore


@lru_cache  # loads the model once; reused by every request
def get_embed_model() -> HuggingFaceEmbedding:
    return HuggingFaceEmbedding(
        model_name=settings.embedding_model,
        # bge models work better when SEARCH QUERIES carry this prefix.
        # Documents don't. Remove this line if you switch to another model family.
        query_instruction="Represent this sentence for searching relevant passages: ",
        embed_batch_size=16,
    )


# @lru_cache
# def get_collection():
#     """One Chroma collection holds every user's chunks.
#     Isolation is enforced by metadata filters (user_id), not separate databases."""
#     client = chromadb.PersistentClient(path=settings.chroma_path)
#     return client.get_or_create_collection(
#         COLLECTION_NAME,
#         metadata={"hnsw:space": "cosine"},  # cosine similarity (set at creation)
#     )


@lru_cache
def get_vector_store() -> PGVectorStore:
    """Connects LlamaIndex to Supabase PostgreSQL."""

    return PGVectorStore.from_params(
        host=settings.supabase_db_host,
        port=str(settings.supabase_db_port),
        database=settings.supabase_db_name,
        user=settings.supabase_db_user,
        password=settings.supabase_db_password,
        table_name=TABLE_NAME,
        schema_name="public",
        embed_dim=384,  # Replace with your actual model dimensions
        use_jsonb=True,
        hnsw_kwargs={
            "hnsw_dist_method": "vector_cosine_ops",
            "hnsw_m": 16,
            "hnsw_ef_construction": 64,
        },
    )


def delete_document_vectors(document_id: str) -> None:
    """Delete all chunks belonging to a source document."""
    get_vector_store().delete(document_id)
