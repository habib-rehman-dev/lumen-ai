from functools import lru_cache

from src.core.config import get_settings
from langchain_groq import ChatGroq

settings = get_settings()


def _make(model: str, temperature: float) -> ChatGroq:
    return ChatGroq(
        api_key=settings.groq_api_key,
        model=model,
        temperature=temperature,
        timeout=settings.llm_timeout_seconds,
        max_retries=2,  # retries network hiccups and rate limits
    )


@lru_cache
def get_llm() -> ChatGroq:
    """Main model that writes the final answer. Low temperature = factual."""
    return _make(settings.groq_model, 0.2)


@lru_cache
def get_rewrite_llm() -> ChatGroq:
    """Small model that only rewrites questions. Temperature 0 = deterministic."""
    return _make(settings.groq_rewrite_model, 0.0)
