# import json
# import logging
# import uuid
# from collections.abc import AsyncIterator

# from src.chat.llm import stream_llm
# from src.chat.service import save_assistant_message
# from src.rag.retrieve import RetrievedChunk

# log = logging.getLogger(__name__)

# # Tells the AI SDK which stream protocol this is; the other headers stop
# # proxies from buffering the stream
# SSE_HEADERS = {
#     "x-vercel-ai-ui-message-stream": "v1",
#     "Cache-Control": "no-cache",
#     "X-Accel-Buffering": "no",
# }


# def sse(payload: dict | str) -> str:
#     """Formats one Server-Sent Event line."""
#     data = payload if isinstance(payload, str) else json.dumps(payload, ensure_ascii=False)
#     return f"data: {data}\n\n"


# async def event_stream(
#     *,
#     session_id: uuid.UUID,
#     messages: list[dict],
#     chunks: list[RetrievedChunk],
#     fixed_answer: str | None,   # set when we skip the LLM (nothing to search)
# ) -> AsyncIterator[str]:
#     message_id, text_id = uuid.uuid4().hex, uuid.uuid4().hex
#     citations = [c.to_citation() for c in chunks]
#     parts: list[str] = []

#     yield sse({"type": "start", "messageId": message_id})
#     # Custom data part: tells the frontend the (possibly new) chat id
#     yield sse({"type": "data-session", "data": {"id": str(session_id)}})
#     yield sse({"type": "text-start", "id": text_id})

#     try:
#         if fixed_answer:
#             parts.append(fixed_answer)
#             yield sse({"type": "text-delta", "id": text_id, "delta": fixed_answer})
#         else:
#             async for delta in stream_llm(messages):
#                 parts.append(delta)
#                 yield sse({"type": "text-delta", "id": text_id, "delta": delta})
#     except Exception:
#         log.exception("LLM streaming failed")
#         yield sse({"type": "error", "errorText": "The AI service failed. Please try again."})
#         yield sse("[DONE]")
#         return  # partial answers are not saved

#     yield sse({"type": "text-end", "id": text_id})
#     if citations:
#         # Custom data part: the frontend renders these as source cards
#         yield sse({"type": "data-citations", "data": citations})

#     try:
#         await save_assistant_message(session_id, "".join(parts), citations)
#     except Exception:
#         log.exception("Could not save assistant message")  # e.g. chat deleted mid-stream

#     yield sse({"type": "finish"})
#     yield sse("[DONE]")






import json
import logging
import re
import uuid
from collections.abc import AsyncIterator

from src.agent.graph import get_graph
from src.chat.service import save_assistant_message
from src.rag.retrieve import RetrievedChunk

log = logging.getLogger(__name__)

SSE_HEADERS = {
    "x-vercel-ai-ui-message-stream": "v1",
    "Cache-Control": "no-cache",
    "X-Accel-Buffering": "no",
}

# Nodes whose answer is a fixed message (not streamed from the LLM)
FIXED_ANSWER_NODES = {"no_documents", "not_found"}


def sse(payload: dict | str) -> str:
    data = payload if isinstance(payload, str) else json.dumps(payload, ensure_ascii=False)
    return f"data: {data}\n\n"


def select_citations(answer: str, chunks: list[RetrievedChunk]) -> list[dict]:
    """Keeps only the sources the model actually cited as [n].
    'index' lets the UI match each source card to its [n] in the text."""
    all_cites = [{**c.to_citation(), "index": i} for i, c in enumerate(chunks, start=1)]
    used = {int(n) for n in re.findall(r"\[(\d+)\]", answer)}
    picked = [c for c in all_cites if c["index"] in used]
    return picked or all_cites  # if the model cited nothing, show everything retrieved


async def event_stream(*, session_id: uuid.UUID, inputs: dict) -> AsyncIterator[str]:
    message_id, text_id = uuid.uuid4().hex, uuid.uuid4().hex
    parts: list[str] = []
    chunks: list[RetrievedChunk] = []

    yield sse({"type": "start", "messageId": message_id})
    yield sse({"type": "data-session", "data": {"id": str(session_id)}})
    yield sse({"type": "text-start", "id": text_id})

    try:
        # Two streams at once:
        #  "messages" = LLM tokens as they are generated
        #  "updates"  = what each node returned when it finished
        async for mode, data in get_graph().astream(
            inputs, stream_mode=["messages", "updates"]
        ):
            if mode == "messages":
                token, meta = data
                # Only the final-answer node is shown; the rewrite LLM stays invisible
                if meta.get("langgraph_node") == "generate" and isinstance(token.content, str) and token.content:
                    parts.append(token.content)
                    yield sse({"type": "text-delta", "id": text_id, "delta": token.content})
            else:  # "updates"
                for node, update in data.items():
                    update = update or {}
                    if node == "retrieve":
                        chunks = [RetrievedChunk(**c) for c in update.get("chunks", [])]
                    elif node in FIXED_ANSWER_NODES and update.get("answer"):
                        parts.append(update["answer"])
                        yield sse({"type": "text-delta", "id": text_id, "delta": update["answer"]})
    except Exception:
        log.exception("Agent run failed")
        yield sse({"type": "error", "errorText": "The AI service failed. Please try again."})
        yield sse("[DONE]")
        return  # partial answers are not saved

    answer = "".join(parts)
    citations = select_citations(answer, chunks)

    yield sse({"type": "text-end", "id": text_id})
    if citations:
        yield sse({"type": "data-citations", "data": citations})

    try:
        await save_assistant_message(session_id, answer, citations)
    except Exception:
        log.exception("Could not save assistant message")

    yield sse({"type": "finish"})
    yield sse("[DONE]")