import asyncio
import logging
from pathlib import PurePosixPath

import httpx

from indexer.config import (
  EXCLUDED_DIRS,
  EXCLUDED_FILES,
  GITHUB_TOKEN,
  GITHUB_USERNAME,
  MAX_CONCURRENT_REQUESTS,
  MAX_FILE_SIZE,
  SUPPORTED_EXTENSIONS,
)

logger = logging.getLogger("indexer.github_crawler")

_BASE_URL = "https://api.github.com"
_MAX_RETRIES = 5
_INITIAL_BACKOFF = 1.0  # seconds


class GitHubCrawler:
  """Fetches repository metadata and file contents from the GitHub API."""

  def __init__(self) -> None:
    self._headers = {
      "Accept": "application/vnd.github.v3+json",
      "User-Agent": "tonysiu-indexer",
    }
    if GITHUB_TOKEN:
      self._headers["Authorization"] = f"token {GITHUB_TOKEN}"

    self._client = httpx.AsyncClient(
      base_url=_BASE_URL,
      headers=self._headers,
      timeout=30.0,
    )
    self._semaphore = asyncio.Semaphore(MAX_CONCURRENT_REQUESTS)

  # ------------------------------------------------------------------
  # Public API
  # ------------------------------------------------------------------

  async def fetch_repos(self) -> list[dict]:
    """Fetch all non-fork repos for the configured username.

    Paginates through all pages and returns a list of lightweight dicts.
    """
    repos: list[dict] = []
    page = 1
    per_page = 100

    while True:
      data = await self._get(
        f"/users/{GITHUB_USERNAME}/repos",
        params={"type": "owner", "per_page": per_page, "page": page},
      )
      if not data:
        break

      for r in data:
        if r.get("fork"):
          continue
        repos.append({
          "name": r["name"],
          "full_name": r["full_name"],
          "default_branch": r.get("default_branch", "main"),
          "html_url": r["html_url"],
          "description": r.get("description") or "",
          "language": r.get("language") or "",
          "stargazers_count": r.get("stargazers_count", 0),
        })

      if len(data) < per_page:
        break
      page += 1

    return repos

  async def get_head_sha(self, repo_name: str, branch: str) -> str:
    """Return the HEAD commit SHA for *repo_name*'s *branch*."""
    data = await self._get(f"/repos/{repo_name}/git/ref/heads/{branch}")
    return data["object"]["sha"]

  async def fetch_file_tree(
    self, repo_name: str, sha: str
  ) -> list[dict]:
    """Return the filtered recursive tree for the given commit SHA.

    Only files with supported extensions that are not inside excluded
    directories and not in the excluded-files list are returned.  Files
    larger than MAX_FILE_SIZE (reported by the tree endpoint) are also
    skipped.
    """
    data = await self._get(
      f"/repos/{repo_name}/git/trees/{sha}",
      params={"recursive": "1"},
    )
    if not data or "tree" not in data:
      logger.warning("Empty tree for %s @ %s", repo_name, sha)
      return []

    filtered: list[dict] = []
    for entry in data["tree"]:
      if entry.get("type") != "blob":
        continue

      path = entry["path"]
      size = entry.get("size", 0)

      # Skip files that are too large
      if size > MAX_FILE_SIZE:
        continue

      # Check extension
      ext = PurePosixPath(path).suffix
      if ext not in SUPPORTED_EXTENSIONS:
        continue

      # Check excluded directories
      parts = PurePosixPath(path).parts
      if any(part in EXCLUDED_DIRS for part in parts):
        continue

      # Check excluded file names
      filename = PurePosixPath(path).name
      if filename in EXCLUDED_FILES:
        continue

      filtered.append({"path": path, "size": size})

    return filtered

  async def fetch_file_content(
    self, repo_name: str, file_path: str
  ) -> str:
    """Fetch the raw content of a single file."""
    raw_headers = {
      **self._headers,
      "Accept": "application/vnd.github.v3.raw",
    }
    return await self._get_raw(
      f"/repos/{repo_name}/contents/{file_path}",
      headers=raw_headers,
    )

  async def fetch_files_batch(
    self, repo_name: str, file_paths: list[str]
  ) -> dict[str, str]:
    """Fetch multiple files concurrently, respecting the semaphore.

    Returns a mapping of *file_path -> content* for every file that was
    fetched successfully.  Individual failures are logged and skipped.
    """

    async def _fetch_one(path: str) -> tuple[str, str | None]:
      async with self._semaphore:
        try:
          content = await self.fetch_file_content(repo_name, path)
          return (path, content)
        except Exception:
          logger.warning(
            "Failed to fetch %s/%s — skipping",
            repo_name,
            path,
            exc_info=True,
          )
          return (path, None)

    results = await asyncio.gather(
      *[_fetch_one(p) for p in file_paths]
    )
    return {path: content for path, content in results if content is not None}

  # ------------------------------------------------------------------
  # Internal helpers
  # ------------------------------------------------------------------

  async def _get(
    self, path: str, *, params: dict | None = None
  ) -> dict | list | None:
    """Issue a GET request with exponential-backoff retry on 403/429."""
    backoff = _INITIAL_BACKOFF
    for attempt in range(_MAX_RETRIES):
      resp = await self._client.get(path, params=params)
      if resp.status_code in (403, 429):
        retry_after = resp.headers.get("Retry-After")
        wait = float(retry_after) if retry_after else backoff
        logger.warning(
          "Rate-limited (%s) on %s — retrying in %.1fs (attempt %d/%d)",
          resp.status_code,
          path,
          wait,
          attempt + 1,
          _MAX_RETRIES,
        )
        await asyncio.sleep(wait)
        backoff *= 2
        continue
      resp.raise_for_status()
      return resp.json()
    # Final attempt — let it raise
    resp = await self._client.get(path, params=params)
    resp.raise_for_status()
    return resp.json()

  async def _get_raw(
    self, path: str, *, headers: dict | None = None
  ) -> str:
    """Issue a GET request that returns raw text with retry logic."""
    backoff = _INITIAL_BACKOFF
    hdrs = headers or self._headers
    for attempt in range(_MAX_RETRIES):
      resp = await self._client.get(path, headers=hdrs)
      if resp.status_code in (403, 429):
        retry_after = resp.headers.get("Retry-After")
        wait = float(retry_after) if retry_after else backoff
        logger.warning(
          "Rate-limited (%s) on %s — retrying in %.1fs (attempt %d/%d)",
          resp.status_code,
          path,
          wait,
          attempt + 1,
          _MAX_RETRIES,
        )
        await asyncio.sleep(wait)
        backoff *= 2
        continue
      resp.raise_for_status()
      return resp.text
    resp = await self._client.get(path, headers=hdrs)
    resp.raise_for_status()
    return resp.text

  async def close(self) -> None:
    """Close the underlying HTTP client."""
    await self._client.aclose()
