import asyncpg
from app.config import settings

_pool: asyncpg.Pool | None = None


async def create_pool() -> asyncpg.Pool:
  """Create and return the async connection pool."""
  global _pool
  _pool = await asyncpg.create_pool(
    dsn=settings.database_url,
    min_size=2,
    max_size=10,
    command_timeout=30,
  )
  return _pool


def get_pool() -> asyncpg.Pool:
  """Return the current connection pool. Raises if not initialized."""
  if _pool is None:
    raise RuntimeError("Database pool is not initialized. Call create_pool() first.")
  return _pool


async def close_pool() -> None:
  """Close the connection pool and release all connections."""
  global _pool
  if _pool is not None:
    await _pool.close()
    _pool = None
