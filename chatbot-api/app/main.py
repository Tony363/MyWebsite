import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db.connection import create_pool, close_pool, get_pool
from app.routes.health import router as health_router
from app.routes.chat import router as chat_router
from app.services.rate_limiter import start_cleanup_task, stop_cleanup_task

logger = logging.getLogger(__name__)


async def run_migrations() -> None:
  """Run SQL migration files in order."""
  migrations_dir = Path(__file__).parent / "db" / "migrations"
  pool = get_pool()

  for migration_file in sorted(migrations_dir.glob("*.sql")):
    logger.info(f"Running migration: {migration_file.name}")
    sql = migration_file.read_text()
    async with pool.acquire() as conn:
      await conn.execute(sql)


@asynccontextmanager
async def lifespan(app: FastAPI):
  """Manage application startup and shutdown."""
  logging.basicConfig(level=getattr(logging, settings.log_level.upper(), logging.INFO))
  logger.info("Starting chatbot API...")

  # Create database connection pool
  await create_pool()
  logger.info("Database pool created.")

  # Run migrations
  try:
    await run_migrations()
    logger.info("Migrations completed.")
  except Exception as e:
    logger.warning(f"Migration failed (may already be applied): {e}")

  # Start rate limiter cleanup background task
  start_cleanup_task()
  logger.info("Rate limiter cleanup task started.")

  yield

  # Shutdown
  stop_cleanup_task()
  logger.info("Rate limiter cleanup task stopped.")

  await close_pool()
  logger.info("Database pool closed.")


app = FastAPI(
  title="Tony Siu Portfolio Chatbot API",
  description="RAG-enhanced chatbot for tonysiu.dev",
  version="0.1.0",
  lifespan=lifespan,
)

# CORS middleware
allowed_origins = [
  settings.allowed_origin,
  "https://tonysiu-dev.onrender.com",
  "http://localhost:8080",
  "http://localhost:3000",
  "http://127.0.0.1:8080",
]

app.add_middleware(
  CORSMiddleware,
  allow_origins=allowed_origins,
  allow_credentials=True,
  allow_methods=["GET", "POST", "OPTIONS"],
  allow_headers=["*"],
)

# Include routers
app.include_router(health_router)
app.include_router(chat_router)


@app.get("/")
async def root():
  """Root endpoint with basic API information."""
  return {
    "name": "Tony Siu Portfolio Chatbot API",
    "version": "0.1.0",
    "docs": "/docs",
    "health": "/health",
  }
