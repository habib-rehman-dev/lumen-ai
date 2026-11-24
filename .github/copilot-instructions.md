# Copilot instructions

## Repository commands

This is an npm/Turborepo monorepo. Node.js >=20.9.0 and npm 12.2.1 are expected.

From the repository root:

- `npm run dev` — start workspace development tasks.
- `npm run build` — build all packages and applications.
- `npm run lint` — lint all workspace projects.
- `npm run typecheck` — run TypeScript checks across the workspace.
- `npm run format` — format workspace TypeScript/TSX files.

Run a command for one workspace with Turborepo filtering:

- `npx turbo lint --filter=lumen-web`
- `npx turbo typecheck --filter=lumen-web`
- `npx turbo build --filter=lumen-web`
- `npm --workspace apps/web run lint`
- `npm --workspace packages/ui run typecheck`

The frontend has no configured test runner or test script. The API also has no configured automated test runner, lint script, or type-check script. There are currently no repository test commands or single-test selectors.

API development commands, run from `apps/api/`:

- `npm run dev` or `uv run fastapi dev`
- `npm run start`
- `npm run db:migrate`
- `npm run db:generate -- "migration message"`

The API requires Python >=3.12,<3.13 and environment variables defined by `src/core/config.py`, including database credentials, `GROQ_API_KEY`, and `BACKEND_JWT_SECRET`.

## Architecture

- `apps/web` is a Next.js 16 App Router frontend using React 19, TanStack Query, the AI SDK UI stream protocol, and shared UI components from `packages/ui`.
- `apps/api` is a FastAPI backend. `src/main.py` configures CORS, the database health endpoint, authentication dependencies, document routes, chat routes, and application startup/shutdown.
- The frontend calls same-origin `/api/...` endpoints through helpers in `apps/web/lib/api.ts`. Next.js route handlers/proxy code forwards requests to the backend.
- Backend persistence uses async SQLAlchemy with Alembic migrations. Models are in `apps/api/src/models`; request/response schemas are in `apps/api/src/schemas`; database/session setup is in `apps/api/src/core/db.py`.
- Documents are uploaded and owned per user. `documents/router.py` creates database records and schedules background ingestion. `documents/ingestion.py` opens its own database session and runs blocking ingestion work in a thread.
- RAG ingestion parses supported files, splits text into chunks, embeds them with the configured Hugging Face model, and stores vectors in the configured vector store. Retrieval is centralized in `src/rag/retrieve.py`.
- Retrieval is always scoped by both authenticated `user_id` and the set of document IDs authorized by PostgreSQL. Do not bypass `resolve_searchable_ids` or construct unscoped vector queries.
- Chat requests save the user message before invoking the agent. `src/agent/graph.py` implements the LangGraph flow:
  1. Skip retrieval when no documents are selected.
  2. Rewrite follow-up questions when chat history exists.
  3. Retrieve authorized chunks.
  4. Generate an answer or return a fixed “not found” response.
- `src/chat/stream.py` converts LangGraph output to the Vercel AI UI message SSE protocol, streams only final-answer tokens, selects cited sources, and saves the assistant message after streaming.
- Heavy embedding, parsing, and vector operations must not block the async event loop; existing code uses `asyncio.to_thread`.
- Shared frontend primitives live in `packages/ui`; workspace ESLint and TypeScript presets live in `packages/eslint-config` and `packages/typescript-config`.

## Repository-specific conventions

- Authentication uses `CurrentUserId` from `src/core/security.py`. User IDs must come from the verified token, never from request bodies, query parameters, or LLM output.
- Every chat and document lookup must enforce ownership. Use existing ownership helpers such as `get_owned_session` and `get_owned_document`.
- Background tasks and post-stream operations must create their own `SessionLocal` database session because the request session may already be closed.
- Changes to database models require an Alembic migration. Do not rely on automatic schema creation.
- Document status transitions are meaningful: uploads begin as pending, successful ingestion becomes ready, failures become failed, and deletion uses deleting to hide records while cleanup runs.
- RAG metadata fields `user_id`, `document_id`, and `filename` are used for filtering and citations. Preserve them when changing ingestion or retrieval.
- Retrieval returns `RetrievedChunk` values and citations are generated through `to_citation()`. Preserve the citation shape expected by `apps/web/lib/api.ts`.
- Chat streaming must preserve the AI SDK event names and headers defined in `src/chat/stream.py`.
- The rewrite model is an optimization only. Rewrite failures must fall back to the original question rather than failing the chat.
- Frontend server/client boundaries matter. Hooks using TanStack Query are client components; backend credentials and secrets must remain server-side.
- Use the existing workspace path aliases and package exports rather than introducing relative imports across packages.
- Follow the Next.js guidance in `AGENTS.md`: this repository uses a newer Next.js version with potentially breaking