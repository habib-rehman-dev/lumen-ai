import asyncio
from dataclasses import dataclass
from functools import lru_cache

from llama_index.core import VectorStoreIndex
from llama_index.core.vector_stores import (
    FilterCondition, FilterOperator, MetadataFilter, MetadataFilters,
)

from src.core.config import get_settings
from src.rag.store import get_embed_model, get_vector_store

settings = get_settings()


@dataclass
class RetrievedChunk:
    """One search hit. Everything a citation needs lives here."""
    text: str
    score: float          # similarity, higher = more relevant
    document_id: str
    filename: str
    page: str | None      # page label for PDFs, None for other types

    def to_citation(self) -> dict:
        # Shape saved in messages.citations and shown in the UI
        return {
            "document_id": self.document_id,
            "filename": self.filename,
            "page": self.page,
            "snippet": self.text[:300],
            "score": round(self.score, 3),
        }


@lru_cache  # built once; it's just a thin wrapper over Chroma + the embed model
def get_index() -> VectorStoreIndex:
    return VectorStoreIndex.from_vector_store(
        get_vector_store(), embed_model=get_embed_model()
    )


def _retrieve_sync(
    query: str, user_id: str, document_ids: list[str], top_k: int, min_score: float
) -> list[RetrievedChunk]:
    # Lock 1: only this user's chunks. Lock 2: only the allowed documents.
    # Both must match (AND), so one bug can't leak another user's data.
    filters = MetadataFilters(
        filters=[
            MetadataFilter(key="user_id", value=user_id, operator=FilterOperator.EQ),
            MetadataFilter(key="document_id", value=document_ids, operator=FilterOperator.IN),
        ],
        condition=FilterCondition.AND,
    )
    retriever = get_index().as_retriever(similarity_top_k=top_k, filters=filters)
    nodes = retriever.retrieve(query)  # embeds the query, then searches Chroma

    return [
        RetrievedChunk(
            text=n.node.get_content(),
            score=n.score or 0.0,
            document_id=n.node.metadata["document_id"],
            filename=n.node.metadata["filename"],
            page=n.node.metadata.get("page_label"),
        )
        for n in nodes
        if (n.score or 0.0) >= min_score  # drop weak matches
    ]


async def retrieve(
    query: str,
    user_id: str,
    document_ids: list[str],
    top_k: int | None = None,
    min_score: float | None = None,
) -> list[RetrievedChunk]:
    """THE function the chat and the LangGraph agent will call.
    An empty list means 'nothing relevant found' (the caller must not guess)."""
    if not query.strip() or not document_ids:
        return []  # nothing to search; also avoids an empty IN filter
    return await asyncio.to_thread(
        _retrieve_sync,
        query,
        user_id,
        document_ids,
        top_k or settings.retrieval_top_k,
        settings.retrieval_min_score if min_score is None else min_score,
    )