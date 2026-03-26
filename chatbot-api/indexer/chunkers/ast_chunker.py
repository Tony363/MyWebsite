"""AST-based chunking for Python and JavaScript/TypeScript source files."""

import ast
import logging
from pathlib import PurePosixPath

import tiktoken

from indexer.chunkers.base import BaseChunker, Chunk
from indexer.config import MAX_CHUNK_TOKENS, MIN_CHUNK_TOKENS

logger = logging.getLogger("indexer.chunkers.ast")

# Shared tokenizer for estimating token counts
_enc = tiktoken.get_encoding("cl100k_base")

# Large-class threshold (lines) — methods extracted separately if exceeded
_LARGE_CLASS_LINE_THRESHOLD = 150


def _token_count(text: str) -> int:
  return len(_enc.encode(text))


# ------------------------------------------------------------------
# tree-sitter language helpers
# ------------------------------------------------------------------

def _get_ts_language(ext: str):
  """Return the tree-sitter Language object for the given extension."""
  if ext in (".js", ".jsx"):
    import tree_sitter_javascript as tsjs
    return tsjs.language()
  if ext in (".ts", ".tsx"):
    import tree_sitter_typescript as tsts
    # tree-sitter-typescript exposes .language_typescript() and
    # .language_tsx(); pick the correct one based on extension.
    if ext == ".tsx":
      return tsts.language_tsx()
    return tsts.language_typescript()
  return None


# ------------------------------------------------------------------
# Python chunker (stdlib ast)
# ------------------------------------------------------------------

def _chunk_python(source: str, file_path: str) -> list[Chunk]:
  """Parse Python source with the stdlib *ast* module and emit chunks."""
  try:
    tree = ast.parse(source, filename=file_path)
  except SyntaxError:
    logger.warning("SyntaxError parsing %s — skipping", file_path)
    return []

  lines = source.splitlines(keepends=True)
  chunks: list[Chunk] = []

  # Track which line ranges belong to top-level nodes so we can
  # later collect "module-level" code that is outside functions/classes.
  covered_ranges: list[tuple[int, int]] = []

  for node in ast.iter_child_nodes(tree):
    if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
      start = node.lineno
      end = node.end_lineno or start
      text = "".join(lines[start - 1 : end])
      if _token_count(text) >= MIN_CHUNK_TOKENS:
        chunks.append(Chunk(
          content=text,
          chunk_type="function",
          function_name=node.name,
          start_line=start,
          end_line=end,
        ))
      covered_ranges.append((start, end))

    elif isinstance(node, ast.ClassDef):
      start = node.lineno
      end = node.end_lineno or start
      class_text = "".join(lines[start - 1 : end])
      class_lines = end - start + 1
      covered_ranges.append((start, end))

      if class_lines > _LARGE_CLASS_LINE_THRESHOLD:
        # Emit the class signature + docstring as one chunk, then
        # individual methods as separate chunks.
        _emit_large_class(node, lines, chunks)
      else:
        if _token_count(class_text) >= MIN_CHUNK_TOKENS:
          chunks.append(Chunk(
            content=class_text,
            chunk_type="class",
            class_name=node.name,
            start_line=start,
            end_line=end,
          ))

  # Module-level code: lines not covered by any top-level function/class
  _emit_module_level(lines, covered_ranges, chunks)

  return chunks


def _emit_large_class(
  node: ast.ClassDef, lines: list[str], chunks: list[Chunk]
) -> None:
  """For a large class, emit individual methods as separate chunks."""
  class_name = node.name

  for child in ast.iter_child_nodes(node):
    if isinstance(child, (ast.FunctionDef, ast.AsyncFunctionDef)):
      start = child.lineno
      end = child.end_lineno or start
      text = "".join(lines[start - 1 : end])
      if _token_count(text) >= MIN_CHUNK_TOKENS:
        chunks.append(Chunk(
          content=text,
          chunk_type="function",
          function_name=child.name,
          class_name=class_name,
          start_line=start,
          end_line=end,
        ))

  # Also emit the class itself as a whole (signature, docstring, class
  # vars) so the context is not lost — but only if it meets the minimum.
  start = node.lineno
  end = node.end_lineno or start
  class_text = "".join(lines[start - 1 : end])
  if _token_count(class_text) >= MIN_CHUNK_TOKENS:
    chunks.append(Chunk(
      content=class_text,
      chunk_type="class",
      class_name=class_name,
      start_line=start,
      end_line=end,
    ))


def _emit_module_level(
  lines: list[str],
  covered_ranges: list[tuple[int, int]],
  chunks: list[Chunk],
) -> None:
  """Gather lines not inside any top-level function/class and emit them
  in roughly 100-line segments."""
  covered = set()
  for s, e in covered_ranges:
    covered.update(range(s, e + 1))

  segment: list[str] = []
  seg_start: int | None = None
  seg_end: int = 0
  segment_limit = 100

  def _flush() -> None:
    nonlocal segment, seg_start, seg_end
    if not segment:
      return
    text = "".join(segment)
    if _token_count(text) >= MIN_CHUNK_TOKENS:
      chunks.append(Chunk(
        content=text,
        chunk_type="module_level",
        start_line=seg_start,
        end_line=seg_end,
      ))
    segment = []
    seg_start = None
    seg_end = 0

  for idx, line in enumerate(lines, start=1):
    if idx in covered:
      _flush()
      continue
    if seg_start is None:
      seg_start = idx
    seg_end = idx
    segment.append(line)
    if len(segment) >= segment_limit:
      _flush()

  _flush()


# ------------------------------------------------------------------
# JavaScript / TypeScript chunker (tree-sitter)
# ------------------------------------------------------------------

def _chunk_js_ts(source: str, file_path: str, ext: str) -> list[Chunk]:
  """Parse JS/TS source with tree-sitter and emit chunks."""
  try:
    import tree_sitter as ts
  except ImportError:
    logger.warning("tree-sitter not installed — skipping %s", file_path)
    return []

  language = _get_ts_language(ext)
  if language is None:
    logger.warning("No tree-sitter language for %s", ext)
    return []

  try:
    parser = ts.Parser(language)
  except Exception:
    logger.warning("Failed to create parser for %s", file_path, exc_info=True)
    return []

  source_bytes = source.encode("utf-8")
  try:
    tree = parser.parse(source_bytes)
  except Exception:
    logger.warning("tree-sitter parse error for %s", file_path, exc_info=True)
    return []

  chunks: list[Chunk] = []
  _walk_ts_node(tree.root_node, source_bytes, chunks, class_name=None)
  return chunks


def _walk_ts_node(
  node,
  source_bytes: bytes,
  chunks: list[Chunk],
  class_name: str | None,
) -> None:
  """Recursively walk the tree-sitter AST and extract chunks."""
  for child in node.children:
    ntype = child.type

    # --- export_statement wrapping a declaration -----------------------
    if ntype == "export_statement":
      _walk_ts_node(child, source_bytes, chunks, class_name)
      continue

    # --- function_declaration -----------------------------------------
    if ntype == "function_declaration":
      _emit_ts_chunk(child, source_bytes, chunks, "function", class_name)
      continue

    # --- class_declaration --------------------------------------------
    if ntype == "class_declaration":
      cname = _ts_node_name(child)
      text = _ts_text(child, source_bytes)
      if _token_count(text) >= MIN_CHUNK_TOKENS:
        chunks.append(Chunk(
          content=text,
          chunk_type="class",
          class_name=cname,
          start_line=child.start_point[0] + 1,
          end_line=child.end_point[0] + 1,
        ))
      # Also recurse into the class body for methods
      body = _find_child(child, "class_body")
      if body:
        _walk_ts_node(body, source_bytes, chunks, class_name=cname)
      continue

    # --- method_definition (inside a class) ---------------------------
    if ntype == "method_definition":
      _emit_ts_chunk(child, source_bytes, chunks, "function", class_name)
      continue

    # --- variable / lexical declaration with arrow function -----------
    if ntype in ("variable_declaration", "lexical_declaration"):
      for decl in child.children:
        if decl.type == "variable_declarator":
          value = _find_child(decl, "arrow_function")
          if value is not None:
            name_node = _find_child(decl, "identifier")
            fname = name_node.text.decode("utf-8") if name_node else None
            text = _ts_text(child, source_bytes)  # include const/let
            if _token_count(text) >= MIN_CHUNK_TOKENS:
              chunks.append(Chunk(
                content=text,
                chunk_type="function",
                function_name=fname,
                class_name=class_name,
                start_line=child.start_point[0] + 1,
                end_line=child.end_point[0] + 1,
              ))
      continue

    # Recurse into other statement-level nodes (e.g. if, try, etc.)
    # but only at the module level to avoid emitting nested helpers.
    if class_name is None:
      _walk_ts_node(child, source_bytes, chunks, class_name)


def _emit_ts_chunk(
  node,
  source_bytes: bytes,
  chunks: list[Chunk],
  chunk_type: str,
  class_name: str | None,
) -> None:
  fname = _ts_node_name(node)
  text = _ts_text(node, source_bytes)
  if _token_count(text) < MIN_CHUNK_TOKENS:
    return
  chunks.append(Chunk(
    content=text,
    chunk_type=chunk_type,
    function_name=fname,
    class_name=class_name,
    start_line=node.start_point[0] + 1,
    end_line=node.end_point[0] + 1,
  ))


def _ts_text(node, source_bytes: bytes) -> str:
  return source_bytes[node.start_byte : node.end_byte].decode("utf-8")


def _ts_node_name(node) -> str | None:
  name_node = _find_child(node, "identifier") or _find_child(node, "property_identifier")
  if name_node is not None:
    return name_node.text.decode("utf-8")
  return None


def _find_child(node, child_type: str):
  for c in node.children:
    if c.type == child_type:
      return c
  return None


# ------------------------------------------------------------------
# Public interface
# ------------------------------------------------------------------

class AstChunker(BaseChunker):
  """Route to Python or JS/TS AST chunker based on file extension."""

  def chunk(self, source: str, file_path: str) -> list[Chunk]:
    ext = PurePosixPath(file_path).suffix.lower()
    if ext == ".py":
      return _chunk_python(source, file_path)
    if ext in (".js", ".jsx", ".ts", ".tsx"):
      return _chunk_js_ts(source, file_path, ext)
    logger.warning("Unsupported extension %s for AST chunking", ext)
    return []
