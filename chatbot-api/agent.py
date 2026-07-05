"""Dispatch Agents entrypoint for Tony's GitHub Q&A chatbot."""

import os

import httpx
from dispatch_agents import BasePayload, fn, llm
from pydantic import field_validator

_MAX_REPOS = 10
_README_REPOS = 5


class AskGitHubRequest(BasePayload):
  """Question payload for the Dispatch function."""

  question: str

  @field_validator("question")
  @classmethod
  def validate_question(cls, value: str) -> str:
    value = value.strip()
    if not value:
      raise ValueError("question must not be empty")
    if len(value) > 500:
      raise ValueError("question must be 500 characters or fewer")
    return value


class AskGitHubResponse(BasePayload):
  """Answer payload returned by the Dispatch function."""

  answer: str
  citations: list[str]


@fn(name="ask_github")
async def ask_github(payload: AskGitHubRequest) -> AskGitHubResponse:
  """Answer a question about Tony's GitHub using live public GitHub data."""
  repos = await _fetch_repos()
  if not repos:
    return AskGitHubResponse(
      answer="I could not fetch Tony's public GitHub repositories right now.",
      citations=[],
    )

  response = await llm.chat(
    payload.question,
    system=(
      "You answer questions about Tony Siu's GitHub repositories. "
      "Use only the repository context below. Keep answers concise. "
      "Mention relevant repository URLs when useful.\n\n"
      f"{_format_repo_context(repos)}"
    ),
  )

  return AskGitHubResponse(
    answer=response.content.strip(),
    citations=[repo["url"] for repo in repos[:_README_REPOS]],
  )


async def _fetch_repos() -> list[dict]:
  username = os.getenv("GITHUB_USERNAME", "Tony363")
  headers = {
    "Accept": "application/vnd.github+json",
    "User-Agent": "tonysiu-dispatch-agent",
  }
  if token := os.getenv("GITHUB_TOKEN"):
    headers["Authorization"] = f"Bearer {token}"

  async with httpx.AsyncClient(headers=headers, timeout=20.0) as client:
    response = await client.get(
      f"https://api.github.com/users/{username}/repos",
      params={"sort": "updated", "per_page": _MAX_REPOS, "type": "owner"},
    )
    response.raise_for_status()

    repos = [
      {
        "name": repo["name"],
        "full_name": repo["full_name"],
        "description": repo.get("description") or "",
        "language": repo.get("language") or "",
        "stars": repo.get("stargazers_count", 0),
        "url": repo["html_url"],
        "readme": "",
      }
      for repo in response.json()
      if not repo.get("fork")
    ][:_MAX_REPOS]

    for repo in repos[:_README_REPOS]:
      readme = await client.get(
        f"https://api.github.com/repos/{repo['full_name']}/readme",
        headers={**headers, "Accept": "application/vnd.github.raw"},
      )
      if readme.is_success:
        repo["readme"] = readme.text[:1200]

    return repos


def _format_repo_context(repos: list[dict]) -> str:
  return "\n\n".join(
    "\n".join(
      part
      for part in (
        f"Repository: {repo['name']}",
        f"Description: {repo['description']}",
        f"Language: {repo['language']}",
        f"Stars: {repo['stars']}",
        f"URL: {repo['url']}",
        f"README excerpt: {repo['readme']}" if repo.get("readme") else "",
      )
      if part
    )
    for repo in repos
  )


def _demo() -> None:
  context = _format_repo_context([
    {
      "name": "demo",
      "description": "test repo",
      "language": "Python",
      "stars": 1,
      "url": "https://github.com/Tony363/demo",
      "readme": "hello",
    }
  ])
  assert "Repository: demo" in context
  assert "README excerpt: hello" in context


if __name__ == "__main__":
  _demo()
