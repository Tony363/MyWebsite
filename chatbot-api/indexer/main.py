"""Indexer orchestrator — crawl, chunk, embed, and store GitHub repos."""

import asyncio
import logging
import time

from app.db.connection import close_pool, create_pool, get_pool
from indexer.chunkers.ast_chunker import AstChunker
from indexer.chunkers.markdown_chunker import MarkdownChunker
from indexer.config import SUPPORTED_EXTENSIONS
from indexer.db_writer import DbWriter
from indexer.embedder import VoyageEmbedder
from indexer.github_crawler import GitHubCrawler

logger = logging.getLogger("indexer")


def _get_language(ext: str) -> str:
  return {
    ".py": "python",
    ".js": "javascript",
    ".jsx": "javascript",
    ".ts": "typescript",
    ".tsx": "typescript",
    ".md": "markdown",
    ".rst": "restructuredtext",
  }.get(ext, "unknown")


async def run_indexer() -> None:
  logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
  )
  start_time = time.time()

  # Initialize infrastructure
  await create_pool()
  pool = get_pool()

  crawler = GitHubCrawler()
  ast_chunker = AstChunker()
  md_chunker = MarkdownChunker()
  embedder = VoyageEmbedder()
  writer = DbWriter(pool)

  total_repos = 0
  total_chunks = 0

  try:
    repos = await crawler.fetch_repos()
    logger.info("Found %d repos", len(repos))

    for repo in repos:
      repo_name = repo["full_name"]
      try:
        count = await _index_repo(
          repo,
          crawler=crawler,
          ast_chunker=ast_chunker,
          md_chunker=md_chunker,
          embedder=embedder,
          writer=writer,
        )
      except Exception:
        logger.error(
          "Failed to index %s — continuing with next repo",
          repo_name,
          exc_info=True,
        )
        # Update state to reflect the failure
        try:
          head_sha = await crawler.get_head_sha(
            repo_name, repo["default_branch"]
          )
          async with pool.acquire() as conn:
            await conn.execute(
              """
              INSERT INTO indexing_state (repo_name, last_indexed_sha, status)
              VALUES ($1, $2, 'failed')
              ON CONFLICT (repo_name) DO UPDATE SET status = 'failed'
              """,
              repo_name,
              head_sha,
            )
        except Exception:
          pass  # best-effort
        continue

      total_repos += 1
      total_chunks += count

  finally:
    await crawler.close()
    await close_pool()

  elapsed = time.time() - start_time
  logger.info(
    "Indexing complete: %d repos, %d total chunks in %.1fs",
    total_repos,
    total_chunks,
    elapsed,
  )


async def _index_repo(
  repo: dict,
  *,
  crawler: GitHubCrawler,
  ast_chunker: AstChunker,
  md_chunker: MarkdownChunker,
  embedder: VoyageEmbedder,
  writer: DbWriter,
) -> int:
  """Index a single repository. Returns the number of chunks stored."""
  repo_name = repo["full_name"]
  branch = repo["default_branch"]

  # Check whether we need to re-index
  head_sha = await crawler.get_head_sha(repo_name, branch)
  last_sha = await writer.get_last_indexed_sha(repo_name)

  if head_sha == last_sha:
    logger.info("Skipping %s (unchanged at %s)", repo_name, head_sha[:8])
    return 0

  logger.info("Indexing %s @ %s ...", repo_name, head_sha[:8])

  # Fetch file tree and contents
  tree = await crawler.fetch_file_tree(repo_name, head_sha)
  if not tree:
    logger.info("No indexable files in %s", repo_name)
    return 0

  file_paths = [f["path"] for f in tree]
  contents = await crawler.fetch_files_batch(repo_name, file_paths)
  logger.info(
    "Fetched %d/%d files from %s", len(contents), len(file_paths), repo_name
  )

  # Chunk every file
  all_chunks: list[dict] = []
  for path, content in contents.items():
    ext = "." + path.rsplit(".", 1)[-1] if "." in path else ""
    if ext in {".md", ".rst"}:
      chunks = md_chunker.chunk(content, path)
    elif ext in SUPPORTED_EXTENSIONS:
      chunks = ast_chunker.chunk(content, path)
    else:
      continue

    for chunk in chunks:
      all_chunks.append({
        "repo_name": repo_name,
        "file_path": path,
        "language": _get_language(ext),
        "chunk_type": chunk.chunk_type,
        "function_name": chunk.function_name,
        "class_name": chunk.class_name,
        "heading_path": chunk.heading_path,
        "content": chunk.content,
        "start_line": chunk.start_line,
        "end_line": chunk.end_line,
        "sha": head_sha,
      })

  if not all_chunks:
    logger.info("No chunks produced for %s", repo_name)
    return 0

  # Embed all chunks
  logger.info("Embedding %d chunks for %s ...", len(all_chunks), repo_name)
  texts = [c["content"] for c in all_chunks]
  embeddings = embedder.embed_batch(texts)
  for chunk, emb in zip(all_chunks, embeddings):
    chunk["embedding"] = emb
    chunk["token_count"] = len(chunk["content"]) // 4  # rough estimate

  # Persist to database
  count = await writer.upsert_repo_chunks(repo_name, all_chunks)
  await writer.update_indexing_state(
    repo_name, head_sha, len(contents), count
  )

  logger.info(
    "Indexed %s: %d chunks from %d files", repo_name, count, len(contents)
  )
  return count


if __name__ == "__main__":
  asyncio.run(run_indexer())
