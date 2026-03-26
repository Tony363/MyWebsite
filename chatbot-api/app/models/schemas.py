from pydantic import BaseModel, field_validator


class ChatMessage(BaseModel):
  """A single chat message with role and content."""

  role: str
  content: str

  @field_validator("role")
  @classmethod
  def validate_role(cls, v: str) -> str:
    if v not in ("user", "assistant"):
      raise ValueError("role must be 'user' or 'assistant'")
    return v

  @field_validator("content")
  @classmethod
  def validate_content(cls, v: str) -> str:
    if not v or not v.strip():
      raise ValueError("content must not be empty")
    if len(v) > 500:
      raise ValueError("content must be 500 characters or fewer")
    return v


class ChatRequest(BaseModel):
  """Incoming chat request with message history."""

  messages: list[ChatMessage]
  sessionId: str | None = None

  @field_validator("messages")
  @classmethod
  def validate_messages(cls, v: list[ChatMessage]) -> list[ChatMessage]:
    if len(v) < 1:
      raise ValueError("at least 1 message is required")
    if len(v) > 6:
      raise ValueError("at most 6 messages are allowed")
    return v


class HealthResponse(BaseModel):
  """Response for the health check endpoint."""

  status: str
  timestamp: str
  db: str
