import logging

import voyageai

from app.config import settings
from app.db.connection import get_pool

logger = logging.getLogger(__name__)

# Lazy-initialized Voyage AI client
_voyage_client: voyageai.AsyncClient | None = None


def _get_voyage_client() -> voyageai.AsyncClient:
  """Return (or create) the async Voyage AI client."""
  global _voyage_client
  if _voyage_client is None:
    _voyage_client = voyageai.AsyncClient(api_key=settings.voyageai_api_key)
  return _voyage_client


async def retrieve_chunks(
  query: str,
  top_k: int | None = None,
  similarity_threshold: float | None = None,
) -> list[dict]:
  """Embed the query and run a cosine-similarity search against pgvector.

  Returns a list of chunk dicts with metadata and similarity score.
  Falls back to an empty list when the chunks table has no rows or on error.
  """
  if top_k is None:
    top_k = settings.retrieval_top_k
  if similarity_threshold is None:
    similarity_threshold = settings.similarity_threshold

  try:
    # 1. Embed the query via Voyage AI
    client = _get_voyage_client()
    embedding_result = await client.embed(
      texts=[query],
      model="voyage-code-3",
      input_type="query",
    )
    query_embedding = embedding_result.embeddings[0]

    # 2. Format embedding as a pgvector-compatible string
    embedding_str = "[" + ",".join(str(v) for v in query_embedding) + "]"

    # 3. Run cosine similarity search
    pool = get_pool()
    async with pool.acquire() as conn:
      rows = await conn.fetch(
        """
        SELECT id, content, repo_name, file_path, language, chunk_type,
               function_name, class_name, heading_path,
               1 - (embedding <=> $1::vector) AS similarity
        FROM chunks
        WHERE 1 - (embedding <=> $1::vector) > $2
        ORDER BY embedding <=> $1::vector
        LIMIT $3
        """,
        embedding_str,
        similarity_threshold,
        top_k,
      )

    # 4. Convert rows to dicts
    chunks = []
    for row in rows:
      chunks.append({
        "id": row["id"],
        "content": row["content"],
        "repo_name": row["repo_name"],
        "file_path": row["file_path"],
        "language": row["language"],
        "chunk_type": row["chunk_type"],
        "function_name": row["function_name"],
        "class_name": row["class_name"],
        "heading_path": row["heading_path"],
        "similarity": float(row["similarity"]),
      })

    return chunks

  except Exception as e:
    logger.warning(f"Retrieval failed (returning empty): {e}")
    return []
