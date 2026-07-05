import json
import logging
from collections.abc import AsyncGenerator

import anthropic

from app.config import settings

logger = logging.getLogger(__name__)

# Lazy-initialized async Anthropic client
_client: anthropic.AsyncAnthropic | None = None


def _get_client() -> anthropic.AsyncAnthropic:
  """Return (or create) the async Anthropic client."""
  global _client
  if _client is None:
    _client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
  return _client


async def stream_chat_response(
  system_prompt: str,
  messages: list[dict],
) -> AsyncGenerator[str, None]:
  """Stream a Claude response as SSE events.

  Yields strings in the format expected by the frontend:
    data: {"text": "partial text"}\\n\\n
    data: [DONE]\\n\\n
  """
  client = _get_client()

  try:
    async with client.messages.stream(
      model="claude-haiku-4-5-20251001",
      max_tokens=512,
      system=system_prompt,
      messages=messages,
    ) as stream:
      async for text in stream.text_stream:
        yield f"data: {json.dumps({'text': text})}\n\n"

    # Signal end of stream
    yield "data: [DONE]\n\n"

  except anthropic.APIConnectionError as e:
    logger.error(f"Anthropic connection error: {e}")
    yield f"data: {json.dumps({'text': 'Sorry, I am having trouble connecting right now. Please try again later.'})}\n\n"
    yield "data: [DONE]\n\n"

  except anthropic.RateLimitError as e:
    logger.error(f"Anthropic rate limit error: {e}")
    yield f"data: {json.dumps({'text': 'The AI service is temporarily busy. Please try again in a moment.'})}\n\n"
    yield "data: [DONE]\n\n"

  except anthropic.APIStatusError as e:
    logger.error(f"Anthropic API error (status {e.status_code}): {e.message}")
    yield f"data: {json.dumps({'text': 'Sorry, something went wrong. Please try again later.'})}\n\n"
    yield "data: [DONE]\n\n"

  except Exception as e:
    logger.error(f"Unexpected error during streaming: {e}")
    yield f"data: {json.dumps({'text': 'An unexpected error occurred. Please try again.'})}\n\n"
    yield "data: [DONE]\n\n"
