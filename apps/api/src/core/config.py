from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Reads values from the .env file; ignores variables we don't declare
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "RAG Workspace API"

    # Required: app will refuse to start if these are missing
    database_url: str
    groq_api_key: str

    backend_jwt_secret: str  # used to sign JWTs for auth between Next.js and FastAPI

    # Where raw uploads and vectors live (local dev defaults)
    upload_dir: str = "./data/uploads"
    chroma_path: str = "./data/chroma"
    max_upload_mb: int = 25

    # Local embedding model (Groq has no embeddings)
    embedding_model: str = "BAAI/bge-small-en-v1.5"

    # Frontend origins allowed to call this API
    cors_origins: list[str] = ["http://localhost:3000"]

    TABLE_NAME: str = "document_vectors"

    supabase_db_host: str
    supabase_db_port: int
    supabase_db_name: str
    supabase_db_user: str
    supabase_db_password: str

    # How many chunks to fetch per question
    retrieval_top_k: int = 5

    # Chunks scoring below this are treated as "not relevant" (0 to 1, cosine).
    # 0.35 is a starting guess for bge-small; we tune it with real documents.
    retrieval_min_score: float = 0.35

    # Check the current model name in the Groq console; names change over time
    groq_model: str = "llama-3.3-70b-versatile"
    chat_history_messages: int = 10  # how many past messages the LLM sees
    llm_timeout_seconds: float = 60

    # Small, fast model used only to rewrite follow-up questions.
    # Verify the current name in the Groq console.
    groq_rewrite_model: str = "llama-3.1-8b-instant"

    internal_api_key: str


@lru_cache  # build Settings once, reuse everywhere
def get_settings() -> Settings:
    return Settings()  # type: ignore
