"""Voyage AI embedding client with batching and rate-limit retries."""

import logging
import time

import tiktoken
import voyageai

from indexer.config import VOYAGEAI_API_KEY

logger = logging.getLogger("indexer.embedder")

_MODEL = "voyage-code-3"
_BATCH_SIZE = 64
_MAX_BATCH_TOKENS = 120_000
_MAX_RETRIES = 5
_INITIAL_BACKOFF = 2.0  # seconds

_enc = tiktoken.get_encoding("cl100k_base")


def _token_count(text: str) -> int:
  return len(_enc.encode(text))


class VoyageEmbedder:
  """Wraps the Voyage AI client for batch code embedding."""

  def __init__(self) -> None:
    self._client = voyageai.Client(api_key=VOYAGEAI_API_KEY)

  def embed_batch(self, texts: list[str]) -> list[list[float]]:
    """Embed a list of texts in batches, respecting size/token limits.

    Returns a list of 1024-d vectors in the same order as *texts*.
    """
    all_embeddings: list[list[float]] = []
    batches = self._build_batches(texts)
    total = len(batches)

    for i, batch in enumerate(batches, start=1):
      logger.debug("Embedding batch %d/%d (%d texts)", i, total, len(batch))
      vectors = self._embed_with_retry(batch)
      all_embeddings.extend(vectors)

    return all_embeddings

  def embed_query(self, query: str) -> list[float]:
    """Embed a single query string and return its vector."""
    result = self._embed_with_retry([query])
    return result[0]

  # ------------------------------------------------------------------
  # Internal helpers
  # ------------------------------------------------------------------

  def _build_batches(self, texts: list[str]) -> list[list[str]]:
    """Split *texts* into batches that satisfy both the item-count and
    token-count limits."""
    batches: list[list[str]] = []
    current_batch: list[str] = []
    current_tokens = 0

    for text in texts:
      t = _token_count(text)
      # If a single text exceeds the limit, truncate it
      if t > _MAX_BATCH_TOKENS:
        text = _enc.decode(_enc.encode(text)[:_MAX_BATCH_TOKENS - 1000])
        t = _token_count(text)

      would_exceed_tokens = current_tokens + t > _MAX_BATCH_TOKENS
      would_exceed_size = len(current_batch) >= _BATCH_SIZE

      if current_batch and (would_exceed_tokens or would_exceed_size):
        batches.append(current_batch)
        current_batch = []
        current_tokens = 0

      current_batch.append(text)
      current_tokens += t

    if current_batch:
      batches.append(current_batch)

    return batches

  def _embed_with_retry(self, texts: list[str]) -> list[list[float]]:
    """Call the Voyage AI API with exponential-backoff on rate limits."""
    backoff = _INITIAL_BACKOFF
    for attempt in range(_MAX_RETRIES):
      try:
        result = self._client.embed(texts, model=_MODEL)
        return result.embeddings
      except Exception as exc:
        exc_str = str(exc).lower()
        is_rate_limit = "rate" in exc_str or "429" in exc_str
        if is_rate_limit and attempt < _MAX_RETRIES - 1:
          logger.warning(
            "Voyage rate limit — retrying in %.1fs (attempt %d/%d)",
            backoff,
            attempt + 1,
            _MAX_RETRIES,
          )
          time.sleep(backoff)
          backoff *= 2
          continue
        raise

    # Should not reach here, but satisfy the type checker
    raise RuntimeError("embed_with_retry exhausted retries")
