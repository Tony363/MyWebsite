import json
import logging
from collections.abc import AsyncGenerator

import anthropic
import httpx

from app.config import settings

logger = logging.getLogger(__name__)

# Lazy-initialized async Anthropic client
_anthropic_client: anthropic.AsyncAnthropic | None = None


def _sse_text(text: str) -> str:
  return f"data: {json.dumps({'text': text})}\n\n"


def _sse_done() -> str:
  return "data: [DONE]\n\n"


def _get_anthropic_client() -> anthropic.AsyncAnthropic:
  """Return (or create) the async Anthropic client."""
  global _anthropic_client
  if _anthropic_client is None:
    _anthropic_client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
  return _anthropic_client


async def _stream_anthropic_response(
  system_prompt: str,
  messages: list[dict],
) -> AsyncGenerator[str, None]:
  client = _get_anthropic_client()

  async with client.messages.stream(
    model="claude-haiku-4-5-20251001",
    max_tokens=512,
    system=system_prompt,
    messages=messages,
  ) as stream:
    async for text in stream.text_stream:
      yield _sse_text(text)

  yield _sse_done()


async def _stream_openai_response(
  system_prompt: str,
  messages: list[dict],
) -> AsyncGenerator[str, None]:
  payload = {
    "model": settings.openai_model,
    "max_tokens": 512,
    "stream": True,
    "messages": [
      {"role": "system", "content": system_prompt},
      *messages,
    ],
  }

  headers = {
    "Authorization": f"Bearer {settings.openai_api_key}",
    "Content-Type": "application/json",
  }

  timeout = httpx.Timeout(60.0, connect=10.0)
  async with httpx.AsyncClient(timeout=timeout) as client:
    async with client.stream(
      "POST",
      "https://api.openai.com/v1/chat/completions",
      headers=headers,
      json=payload,
    ) as response:
      response.raise_for_status()

      async for line in response.aiter_lines():
        if not line.startswith("data:"):
          continue

        data = line.removeprefix("data:").strip()
        if data == "[DONE]":
          break

        try:
          event = json.loads(data)
        except json.JSONDecodeError:
          continue

        choice = (event.get("choices") or [{}])[0]
        text = choice.get("delta", {}).get("content")
        if text:
          yield _sse_text(text)

  yield _sse_done()


async def stream_chat_response(
  system_prompt: str,
  messages: list[dict],
) -> AsyncGenerator[str, None]:
  """Stream an AI response as SSE events.

  Yields strings in the format expected by the frontend:
    data: {"text": "partial text"}\\n\\n
    data: [DONE]\\n\\n
  """
  if settings.anthropic_api_key:
    provider = "anthropic"
    stream = _stream_anthropic_response(system_prompt, messages)
  elif settings.openai_api_key:
    provider = "openai"
    stream = _stream_openai_response(system_prompt, messages)
  else:
    logger.error("No AI provider key configured")
    yield _sse_text("The chat service is not configured yet. Please try again later.")
    yield _sse_done()
    return

  try:
    async for chunk in stream:
      yield chunk

  except anthropic.APIConnectionError as e:
    logger.error(f"Anthropic connection error: {e}")
    yield _sse_text("Sorry, I am having trouble connecting right now. Please try again later.")
    yield _sse_done()

  except anthropic.RateLimitError as e:
    logger.error(f"Anthropic rate limit error: {e}")
    yield _sse_text("The AI service is temporarily busy. Please try again in a moment.")
    yield _sse_done()

  except anthropic.APIStatusError as e:
    logger.error(f"Anthropic API error (status {e.status_code}): {e.message}")
    yield _sse_text("Sorry, something went wrong. Please try again later.")
    yield _sse_done()

  except httpx.HTTPStatusError as e:
    logger.error(
      "%s API error (status %s): %s",
      provider,
      e.response.status_code,
      e.response.text[:500],
    )
    yield _sse_text("Sorry, something went wrong. Please try again later.")
    yield _sse_done()

  except httpx.HTTPError as e:
    logger.error(f"{provider} connection error: {e}")
    yield _sse_text("Sorry, I am having trouble connecting right now. Please try again later.")
    yield _sse_done()

  except Exception as e:
    logger.error(f"Unexpected error during streaming: {e}")
    yield _sse_text("An unexpected error occurred. Please try again.")
    yield _sse_done()
