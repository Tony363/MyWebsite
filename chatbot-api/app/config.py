from pydantic_settings import BaseSettings


class Settings(BaseSettings):
  """Application configuration loaded from environment variables."""

  # API keys
  anthropic_api_key: str = ""
  openai_api_key: str = ""
  voyageai_api_key: str = ""
  github_token: str = ""

  # AI provider
  openai_model: str = "gpt-4o-mini"

  # GitHub
  github_username: str = "Tony363"

  # Database
  database_url: str = "postgresql://user:pass@localhost:5432/chatbot"

  # CORS
  allowed_origin: str = "https://tonysiu.dev"

  # Rate limiting
  max_requests_per_minute: int = 10

  # Retrieval settings
  retrieval_top_k: int = 8
  similarity_threshold: float = 0.3

  # Logging
  log_level: str = "INFO"

  model_config = {
    "env_file": ".env",
    "env_file_encoding": "utf-8",
    "case_sensitive": False,
  }


settings = Settings()
