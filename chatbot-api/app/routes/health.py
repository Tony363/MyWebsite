from datetime import datetime, timezone

from fastapi import APIRouter

from app.models.schemas import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
  """Check application health."""
  return HealthResponse(
    status="healthy",
    timestamp=datetime.now(timezone.utc).isoformat(),
    db="disabled",
  )
