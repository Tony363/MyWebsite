from dataclasses import dataclass, field


@dataclass
class Chunk:
  """A single chunk of source code or documentation."""

  content: str
  chunk_type: str  # 'function', 'class', 'module_level', 'doc_section'
  function_name: str | None = None
  class_name: str | None = None
  heading_path: str | None = None
  start_line: int | None = None
  end_line: int | None = None


class BaseChunker:
  """Abstract base class for all chunkers."""

  def chunk(self, source: str, file_path: str) -> list[Chunk]:
    raise NotImplementedError
