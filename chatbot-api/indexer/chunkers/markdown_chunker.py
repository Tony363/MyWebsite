"""Heading-based chunking for Markdown and reStructuredText files."""

import logging
import re

import tiktoken

from indexer.chunkers.base import BaseChunker, Chunk
from indexer.config import MAX_CHUNK_TOKENS, MIN_CHUNK_TOKENS

logger = logging.getLogger("indexer.chunkers.markdown")

_enc = tiktoken.get_encoding("cl100k_base")
_HEADING_RE = re.compile(r"^(#{1,6})\s+(.+)$")


def _token_count(text: str) -> int:
  return len(_enc.encode(text))


class MarkdownChunker(BaseChunker):
  """Split Markdown documents at heading boundaries."""

  def chunk(self, source: str, file_path: str) -> list[Chunk]:
    lines = source.splitlines(keepends=True)
    chunks: list[Chunk] = []

    # State
    heading_stack: list[tuple[int, str]] = []  # (level, heading_text)
    section_lines: list[str] = []
    section_start: int = 1
    in_code_fence = False

    def _heading_path() -> str | None:
      if not heading_stack:
        return None
      return " > ".join(
        f"{'#' * level} {text}" for level, text in heading_stack
      )

    def _flush() -> None:
      nonlocal section_lines, section_start
      if not section_lines:
        return
      text = "".join(section_lines)
      hp = _heading_path()
      start = section_start
      end = start + len(section_lines) - 1

      tokens = _token_count(text)
      if tokens > MAX_CHUNK_TOKENS:
        # Split at paragraph boundaries
        _split_large_section(text, hp, start, chunks)
      elif tokens >= MIN_CHUNK_TOKENS:
        chunks.append(Chunk(
          content=text,
          chunk_type="doc_section",
          heading_path=hp,
          start_line=start,
          end_line=end,
        ))
      # If tokens < MIN_CHUNK_TOKENS we defer merging to a post-pass
      else:
        # Store for potential merging
        chunks.append(Chunk(
          content=text,
          chunk_type="doc_section",
          heading_path=hp,
          start_line=start,
          end_line=end,
        ))

      section_lines = []

    for idx, line in enumerate(lines, start=1):
      stripped = line.strip()

      # Track fenced code blocks
      if stripped.startswith("```"):
        in_code_fence = not in_code_fence
        section_lines.append(line)
        continue

      if in_code_fence:
        section_lines.append(line)
        continue

      # Check for heading
      m = _HEADING_RE.match(stripped)
      if m:
        _flush()
        section_start = idx

        level = len(m.group(1))
        heading_text = m.group(2).strip()

        # Pop headings at the same or deeper level
        while heading_stack and heading_stack[-1][0] >= level:
          heading_stack.pop()
        heading_stack.append((level, heading_text))

        section_lines = [line]
        continue

      section_lines.append(line)

    # Flush remaining content
    _flush()

    # Post-pass: merge small chunks with the next section
    chunks = _merge_small_chunks(chunks)

    return chunks


def _split_large_section(
  text: str,
  heading_path: str | None,
  start_line: int,
  chunks: list[Chunk],
) -> None:
  """Split a section that exceeds MAX_CHUNK_TOKENS at paragraph
  boundaries (double newline)."""
  paragraphs = text.split("\n\n")
  current: list[str] = []
  current_tokens = 0
  line_offset = start_line

  for para in paragraphs:
    para_tokens = _token_count(para)

    if current and current_tokens + para_tokens > MAX_CHUNK_TOKENS:
      chunk_text = "\n\n".join(current)
      para_lines = chunk_text.count("\n") + 1
      if _token_count(chunk_text) >= MIN_CHUNK_TOKENS:
        chunks.append(Chunk(
          content=chunk_text,
          chunk_type="doc_section",
          heading_path=heading_path,
          start_line=line_offset,
          end_line=line_offset + para_lines - 1,
        ))
      line_offset += para_lines
      current = []
      current_tokens = 0

    current.append(para)
    current_tokens += para_tokens

  if current:
    chunk_text = "\n\n".join(current)
    para_lines = chunk_text.count("\n") + 1
    if _token_count(chunk_text) >= MIN_CHUNK_TOKENS:
      chunks.append(Chunk(
        content=chunk_text,
        chunk_type="doc_section",
        heading_path=heading_path,
        start_line=line_offset,
        end_line=line_offset + para_lines - 1,
      ))


def _merge_small_chunks(chunks: list[Chunk]) -> list[Chunk]:
  """Merge consecutive chunks that are below MIN_CHUNK_TOKENS."""
  if not chunks:
    return chunks

  merged: list[Chunk] = []
  buffer: Chunk | None = None

  for chunk in chunks:
    if buffer is None:
      buffer = chunk
      continue

    buf_tokens = _token_count(buffer.content)
    if buf_tokens < MIN_CHUNK_TOKENS:
      # Merge buffer with current chunk
      buffer = Chunk(
        content=buffer.content + chunk.content,
        chunk_type="doc_section",
        heading_path=chunk.heading_path or buffer.heading_path,
        start_line=buffer.start_line,
        end_line=chunk.end_line,
      )
    else:
      merged.append(buffer)
      buffer = chunk

  if buffer is not None:
    merged.append(buffer)

  return merged
