from app.config import settings

# Re-export settings for indexer use
GITHUB_TOKEN = settings.github_token
GITHUB_USERNAME = settings.github_username
VOYAGEAI_API_KEY = settings.voyageai_api_key
DATABASE_URL = settings.database_url

# Indexer-specific constants
MAX_FILE_SIZE = 100_000  # 100KB
MAX_CONCURRENT_REQUESTS = 10
SUPPORTED_EXTENSIONS = {".py", ".js", ".ts", ".jsx", ".tsx", ".md", ".rst"}
EXCLUDED_DIRS = {
  "node_modules", "venv", ".git", "dist", "build",
  "__pycache__", ".venv", "env", ".env",
}
EXCLUDED_FILES = {
  "package-lock.json", "yarn.lock", "pnpm-lock.yaml", "poetry.lock",
}
MIN_CHUNK_TOKENS = 50
MAX_CHUNK_TOKENS = 500
