import logging
from dataclasses import asdict
from functools import lru_cache
from typing import TypedDict

from langgraph.graph import END, START, StateGraph
from src.agent.llm import get_llm, get_rewrite_llm
from src.agent.prompt import REWRITE_PROMPT, build_generate_messages
from src.rag.retrieve import retrieve

log = logging.getLogger(__name__)


class AgentState(TypedDict):
    """The data that flows through the graph. Each node returns only the keys it changes."""

    question: str  # the user's latest message
    history: list[dict]  # earlier turns from our database
    user_id: str  # set by the server from the verified token, never by the LLM
    document_ids: list[str]  # already filtered by Postgres (owned + ready)
    search_query: str  # standalone query used for retrieval
    chunks: list[dict]  # retrieved chunks, kept as plain dicts
    answer: str  # filled by the no_documents / not_found nodes


# ---------- Nodes ----------


async def rewrite_query(state: AgentState) -> dict:
    # First message in a chat: nothing to resolve, so skip the LLM call
    if not state["history"]:
        return {"search_query": state["question"]}
    transcript = "\n".join(
        f"{m['role']}: {m['content'][:500]}" for m in state["history"][-6:]
    )
    try:
        resp = await get_rewrite_llm().ainvoke(
            [
                ("system", REWRITE_PROMPT),
                (
                    "user",
                    f"Conversation:\n{transcript}\n\nFollow-up question: {state['question']}",
                ),
            ]
        )
        query = str(resp.content).strip().strip('"')
    except Exception:
        # Rewriting is only an optimization; never let it break the chat
        log.exception("Query rewrite failed; using the raw question")
        query = ""
    if not query or len(query) > 300:  # empty or rambling output: fall back
        query = state["question"]
    log.info("search query: %r", query)
    return {"search_query": query}


async def retrieve_node(state: AgentState) -> dict:
    # The graph never touches Chroma; it only calls our retrieve() function
    found = await retrieve(
        state["search_query"], state["user_id"], state["document_ids"]
    )
    return {"chunks": [asdict(c) for c in found]}


async def generate(state: AgentState) -> dict:
    messages = build_generate_messages(
        state["history"], state["question"], state["chunks"]
    )
    resp = await get_llm().ainvoke(messages)
    # While this runs, LangGraph streams the tokens out (see stream.py)
    return {"answer": str(resp.content)}


async def no_documents(state: AgentState) -> dict:
    return {
        "answer": (
            "No ready documents are selected. Upload a document or select one "
            "in the sources panel, then ask again."
        )
    }


async def not_found(state: AgentState) -> dict:
    return {
        "answer": "I couldn't find anything relevant to that in your selected documents."
    }


# ---------- Routing (the "decisions" in the graph) ----------


def route_start(state: AgentState) -> str:
    # Don't waste an LLM call if there is nothing to search
    return "rewrite_query" if state["document_ids"] else "no_documents"


def route_after_retrieve(state: AgentState) -> str:
    return "generate" if state["chunks"] else "not_found"


# ---------- Wiring ----------


@lru_cache  # compile once, reuse for every request
def get_graph():
    g = StateGraph(AgentState)
    g.add_node("rewrite_query", rewrite_query)
    g.add_node("retrieve", retrieve_node)
    g.add_node("generate", generate)
    g.add_node("no_documents", no_documents)
    g.add_node("not_found", not_found)

    g.add_conditional_edges(
        START,
        route_start,
        {
            "rewrite_query": "rewrite_query",
            "no_documents": "no_documents",
        },
    )
    g.add_edge("rewrite_query", "retrieve")
    g.add_conditional_edges(
        "retrieve",
        route_after_retrieve,
        {
            "generate": "generate",
            "not_found": "not_found",
        },
    )
    for end_node in ("generate", "no_documents", "not_found"):
        g.add_edge(end_node, END)
    return g.compile()
