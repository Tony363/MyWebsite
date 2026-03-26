"""Database writer for upserting chunk data and indexing state."""

import logging
from datetime import datetime, timezone

import asyncpg

logger = logging.getLogger("indexer.db_writer")


class DbWriter:
  """Writes chunk and indexing-state records to PostgreSQL via asyncpg."""

  def __init__(self, pool: asyncpg.Pool) -> None:
    self._pool = pool

  async def upsert_repo_chunks(
    self, repo_name: str, chunks: list[dict]
  ) -> int:
    """Delete all existing chunks for *repo_name* and insert new ones.

    Runs inside a transaction so the repo is never left in a partial
    state.  Returns the number of inserted rows.
    """
    async with self._pool.acquire() as conn:
      async with conn.transaction():
        await conn.execute(
          "DELETE FROM chunks WHERE repo_name = $1",
          repo_name,
        )

        # Batch insert using executemany for performance
        insert_sql = """
          INSERT INTO chunks (
            repo_name, file_path, language, chunk_type,
            function_name, class_name, heading_path,
            content, start_line, end_line,
            token_count, sha, embedding
          ) VALUES (
            $1, $2, $3, $4,
            $5, $6, $7,
            $8, $9, $10,
            $11, $12, $13
          )
        """

        records = [
          (
            c["repo_name"],
            c["file_path"],
            c.get("language"),
            c["chunk_type"],
            c.get("function_name"),
            c.get("class_name"),
            c.get("heading_path"),
            c["content"],
            c.get("start_line"),
            c.get("end_line"),
            c.get("token_count"),
            c["sha"],
            _format_embedding(c.get("embedding")),
          )
          for c in chunks
        ]

        await conn.executemany(insert_sql, records)
        count = len(records)
        logger.info(
          "Upserted %d chunks for %s", count, repo_name
        )
        return count

  async def update_indexing_state(
    self,
    repo_name: str,
    sha: str,
    file_count: int,
    chunk_count: int,
  ) -> None:
    """Upsert the indexing state for a repository."""
    now = datetime.now(timezone.utc)
    async with self._pool.acquire() as conn:
      await conn.execute(
        """
        INSERT INTO indexing_state (
          repo_name, last_indexed_sha, last_indexed_at,
          file_count, chunk_count, status
        ) VALUES ($1, $2, $3, $4, $5, 'completed')
        ON CONFLICT (repo_name) DO UPDATE SET
          last_indexed_sha = $2,
          last_indexed_at = $3,
          file_count = $4,
          chunk_count = $5,
          status = 'completed'
        """,
        repo_name,
        sha,
        now,
        file_count,
        chunk_count,
      )

  async def get_last_indexed_sha(self, repo_name: str) -> str | None:
    """Return the last indexed SHA for a repo, or None if never indexed."""
    async with self._pool.acquire() as conn:
      row = await conn.fetchrow(
        "SELECT last_indexed_sha FROM indexing_state WHERE repo_name = $1",
        repo_name,
      )
      if row is None:
        return None
      return row["last_indexed_sha"]


def _format_embedding(embedding: list[float] | None) -> str | None:
  """Convert a Python list of floats to the pgvector string format."""
  if embedding is None:
    return None
  return "[" + ",".join(str(v) for v in embedding) + "]"
