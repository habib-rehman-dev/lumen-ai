# Lumen AI

Lumen AI is an AI workspace for chatting with your own documents. Upload files, organize them in a personal library, and ask questions in conversations that retrieve relevant passages and show their sources.

## The problem it solves

General-purpose chat models do not automatically know the contents of your private files, and long documents are difficult to search manually. Lumen AI indexes uploaded documents and uses retrieval-augmented generation (RAG) to provide answers grounded in the documents selected for a chat.

## Key features

- Streamed AI conversations with persistent chat history.
- Document upload and library management, with per-user document access.
- RAG retrieval with source citations and document-level chat scope.
- PDF, DOCX, TXT, Markdown, and CSV ingestion.
- Email-and-password authentication, with optional GitHub and Google sign-in.
- Configurable Groq chat models and local Hugging Face embeddings.

## Architecture and tech stack

This is an npm workspaces/Turborepo monorepo with a Next.js web app and a FastAPI backend.

| Area | Technologies |
| --- | --- |
| Web app | Next.js, React, TypeScript, Auth.js, Tailwind CSS |
| API | Python 3.12, FastAPI, Pydantic Settings, SQLAlchemy (async), Alembic |
| AI and RAG | LangGraph, LangChain, LlamaIndex, Groq, Hugging Face sentence embeddings |
| Persistence | PostgreSQL for users, chats, and documents; PostgreSQL with pgvector for document embeddings |
| Shared workspace | npm workspaces, Turborepo, shared UI and configuration packages |

The web app handles the user interface and authentication. It calls the API, which verifies signed user tokens, manages chat and document records, and streams responses. For document questions, the API retrieves relevant chunks from the vector store and passes them with conversation context to the configured Groq model. Uploaded files are processed asynchronously and indexed for later retrieval.

## Prerequisites

- Node.js 20.9 or later and npm.
- Python 3.12 and [uv](https://docs.astral.sh/uv/).
- PostgreSQL with the pgvector extension available. The project uses a database URL for application data and a PostgreSQL connection for vector storage; these may point to the same database.
- A Groq API key.

## Installation and local development

1. Clone the repository and install the JavaScript workspace dependencies:

   ```bash
   git clone https://github.com/habib-rehman-dev/lumen-ai.git
   cd lumen-ai
   npm ci
   ```

2. Install the API dependencies:

   ```bash
   cd apps/api
   uv sync
   ```

3. Create `apps/api/.env` and set the backend configuration below. The API reads this file from its working directory.

   ```dotenv
   DATABASE_URL=postgresql+asyncpg://USER:PASSWORD@HOST:5432/DATABASE
   GROQ_API_KEY=your-groq-api-key
   BACKEND_JWT_SECRET=use-the-same-random-secret-in-both-apps
   INTERNAL_API_KEY=use-the-same-random-key-in-both-apps

   SUPABASE_DB_HOST=HOST
   SUPABASE_DB_PORT=5432
   SUPABASE_DB_NAME=DATABASE
   SUPABASE_DB_USER=USER
   SUPABASE_DB_PASSWORD=PASSWORD
   ```

   The `SUPABASE_DB_*` settings are the PostgreSQL connection used by the vector store; they can describe a compatible PostgreSQL/pgvector database even if it is not hosted by Supabase. Keep credentials private and URL-encode special characters in `DATABASE_URL`.

4. Create `apps/web/.env.local`:

   ```dotenv
   AUTH_SECRET=generate-a-long-random-secret
   BACKEND_URL=http://localhost:8000
   BACKEND_JWT_SECRET=use-the-same-random-secret-as-the-api
   INTERNAL_API_KEY=use-the-same-random-key-as-the-api
   ```

   Generate secrets locally, for example with `openssl rand -base64 32`. GitHub and Google sign-in are optional; configure `AUTH_GITHUB_ID` and `AUTH_GITHUB_SECRET`, or `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`, in this file to enable either provider. Email-and-password sign-in is available through the app.

5. Apply the database migrations from `apps/api`:

   ```bash
   uv run alembic upgrade head
   ```

6. Start the development apps from the repository root:

   ```bash
   cd ../..
   npm run dev
   ```

   The web app is served at `http://localhost:3000`; the API is served at `http://localhost:8000`. FastAPI's interactive API documentation is available at `http://localhost:8000/docs`.

## Configuration

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Async SQLAlchemy PostgreSQL URL for application data. |
| `GROQ_API_KEY` | Yes | API key used for Groq chat and query-rewrite models. |
| `BACKEND_JWT_SECRET` | Yes | Shared signing secret used by the web app and API to authenticate requests. |
| `INTERNAL_API_KEY` | Yes | Shared key for trusted web-app-to-API authentication calls. |
| `SUPABASE_DB_HOST` | Yes | PostgreSQL host for the vector store. |
| `SUPABASE_DB_PORT` | Yes | PostgreSQL port for the vector store. |
| `SUPABASE_DB_NAME` | Yes | Vector-store database name. |
| `SUPABASE_DB_USER` | Yes | Vector-store database user. |
| `SUPABASE_DB_PASSWORD` | Yes | Vector-store database password. |
| `AUTH_SECRET` | Yes | Auth.js session-signing secret for the web app. |
| `BACKEND_URL` | Yes | Base URL of the FastAPI service, e.g. `http://localhost:8000`. |
| `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET` | No | OAuth credentials to enable GitHub sign-in. |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | No | OAuth credentials to enable Google sign-in. |
| `CORS_ORIGINS` | No | Allowed frontend origins; defaults to `http://localhost:3000`. |

The API also supports optional settings for upload size and directory, embedding and Groq model names, retrieval limits, and chat-history length. See [`apps/api/src/core/config.py`](apps/api/src/core/config.py) for defaults and the complete list.

## Useful commands

Run these from the repository root unless noted:

```bash
npm run dev       # Start workspace development apps
npm run build     # Build the web workspace
npm run lint      # Lint JavaScript/TypeScript workspaces
npm run typecheck # Type-check JavaScript/TypeScript workspaces
```

Database migrations and API commands are run from `apps/api`:

```bash
uv run alembic upgrade head
uv run fastapi dev
```

## Project layout

```text
apps/
  api/       FastAPI service, database models, document ingestion, and RAG
  web/       Next.js application and browser-facing API routes
packages/
  ui/                Shared UI components
  helpers/           Shared utilities
  eslint-config/     Shared ESLint configuration
  typescript-config/ Shared TypeScript configuration
```
