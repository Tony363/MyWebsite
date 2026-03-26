from datetime import datetime, timezone

from fastapi import APIRouter

from app.db.connection import get_pool
from app.models.schemas import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
  """Check application health including database connectivity."""
  db_status = "unknown"
  try:
    pool = get_pool()
    async with pool.acquire() as conn:
      await conn.fetchval("SELECT 1")
    db_status = "connected"
  except Exception:
    db_status = "disconnected"

  status = "healthy" if db_status == "connected" else "degraded"

  return HealthResponse(
    status=status,
    timestamp=datetime.now(timezone.utc).isoformat(),
    db=db_status,
  )
