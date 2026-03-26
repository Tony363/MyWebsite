import asyncio
import hashlib
import time
from collections import deque

from app.config import settings

# In-memory sliding window: { hashed_ip: deque([timestamp, ...]) }
_requests: dict[str, deque[float]] = {}
_cleanup_task: asyncio.Task | None = None


def _hash_ip(ip: str) -> str:
  """SHA-256 hash of the client IP for privacy."""
  return hashlib.sha256(ip.encode()).hexdigest()


def check_rate_limit(ip: str) -> bool:
  """Check whether the IP is within the rate limit.

  Returns True if the request is allowed, False if rate-limited.
  """
  hashed = _hash_ip(ip)
  now = time.time()
  window = 60.0  # seconds

  if hashed not in _requests:
    _requests[hashed] = deque()

  timestamps = _requests[hashed]

  # Remove entries outside the sliding window
  while timestamps and timestamps[0] < now - window:
    timestamps.popleft()

  if len(timestamps) >= settings.max_requests_per_minute:
    return False

  timestamps.append(now)
  return True


async def _cleanup_loop() -> None:
  """Background task that prunes stale entries every 30 seconds."""
  while True:
    await asyncio.sleep(30)
    now = time.time()
    cutoff = now - 120.0  # prune entries older than 2 minutes
    stale_keys = []

    for ip_hash, timestamps in _requests.items():
      while timestamps and timestamps[0] < cutoff:
        timestamps.popleft()
      if not timestamps:
        stale_keys.append(ip_hash)

    for key in stale_keys:
      del _requests[key]


def start_cleanup_task() -> None:
  """Start the background cleanup task."""
  global _cleanup_task
  if _cleanup_task is None or _cleanup_task.done():
    _cleanup_task = asyncio.create_task(_cleanup_loop())


def stop_cleanup_task() -> None:
  """Cancel the background cleanup task."""
  global _cleanup_task
  if _cleanup_task is not None and not _cleanup_task.done():
    _cleanup_task.cancel()
    _cleanup_task = None
