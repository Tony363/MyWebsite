import logging

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse, StreamingResponse

from app.models.schemas import ChatRequest
from app.services.llm import stream_chat_response
from app.services.prompt_builder import build_system_prompt
from app.services.rate_limiter import check_rate_limit
from app.services.retriever import retrieve_chunks

logger = logging.getLogger(__name__)

router = APIRouter()


def _get_client_ip(request: Request) -> str:
  """Extract client IP from X-Forwarded-For header or fallback to client.host."""
  forwarded = request.headers.get("x-forwarded-for")
  if forwarded:
    # X-Forwarded-For may contain multiple IPs; take the first (original client)
    return forwarded.split(",")[0].strip()
  return request.client.host if request.client else "unknown"


@router.post("/chat")
async def chat(body: ChatRequest, request: Request):
  """Streamed chat endpoint using Server-Sent Events.

  1. Rate-limit by client IP
  2. Retrieve relevant chunks via vector search
  3. Build system prompt with static + retrieved context
  4. Stream Claude response as SSE
  """
  # 1. Rate limit check
  client_ip = _get_client_ip(request)
  if not check_rate_limit(client_ip):
    return JSONResponse(
      status_code=429,
      content={"error": "Rate limit exceeded. Please try again in a moment."},
    )

  try:
    # 2. Extract latest user message for retrieval query
    latest_user_message = ""
    for msg in reversed(body.messages):
      if msg.role == "user":
        latest_user_message = msg.content
        break

    # 3. Retrieve relevant chunks
    chunks = await retrieve_chunks(latest_user_message)

    # 4. Build system prompt
    system_prompt = build_system_prompt(chunks)

    # 5. Convert messages to Anthropic format
    anthropic_messages = [
      {"role": m.role, "content": m.content}
      for m in body.messages
    ]

    # 6. Stream response
    return StreamingResponse(
      stream_chat_response(system_prompt, anthropic_messages),
      media_type="text/event-stream",
      headers={
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    )

  except Exception as e:
    logger.error(f"Chat endpoint error: {e}")
    return JSONResponse(
      status_code=500,
      content={"error": "Internal server error"},
    )
