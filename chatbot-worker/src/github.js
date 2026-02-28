const GITHUB_CACHE_TTL = 3600; // 1 hour

export async function fetchGitHubData(env) {
  const cacheKey = 'github:repos';

  // Try cache first
  const cached = await env.CHATBOT_KV.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const username = env.GITHUB_USERNAME || 'Tony363';
  const headers = { 'User-Agent': 'tonysiu-chatbot' };
  if (env.GITHUB_TOKEN) {
    headers['Authorization'] = `token ${env.GITHUB_TOKEN}`;
  }

  try {
    // Fetch repos
    const reposResponse = await fetch(
      `https://api.github.com/users/${username}/repos?sort=updated&per_page=10&type=owner`,
      { headers }
    );

    if (!reposResponse.ok) {
      throw new Error(`GitHub API error: ${reposResponse.status}`);
    }

    const repos = await reposResponse.json();

    // Filter non-forks and get top repos
    const ownRepos = repos.filter((r) => !r.fork).slice(0, 10);

    // Fetch READMEs for top 5 repos
    const repoData = await Promise.all(
      ownRepos.slice(0, 5).map(async (repo) => {
        let readme = '';
        try {
          const readmeResponse = await fetch(
            `https://api.github.com/repos/${username}/${repo.name}/readme`,
            {
              headers: {
                ...headers,
                Accept: 'application/vnd.github.v3.raw',
              },
            }
          );
          if (readmeResponse.ok) {
            readme = (await readmeResponse.text()).substring(0, 2000);
          }
        } catch {
          // README not available — skip
        }

        return {
          name: repo.name,
          description: repo.description || '',
          language: repo.language || '',
          stars: repo.stargazers_count,
          url: repo.html_url,
          readme: readme,
        };
      })
    );

    // Add remaining repos without README
    const remaining = ownRepos.slice(5).map((repo) => ({
      name: repo.name,
      description: repo.description || '',
      language: repo.language || '',
      stars: repo.stargazers_count,
      url: repo.html_url,
    }));

    const result = {
      repos: [...repoData, ...remaining],
      fetchedAt: new Date().toISOString(),
    };

    // Cache result
    await env.CHATBOT_KV.put(cacheKey, JSON.stringify(result), {
      expirationTtl: GITHUB_CACHE_TTL,
    });

    return result;
  } catch (error) {
    console.log(
      JSON.stringify({ event: 'github_error', error: error.message })
    );

    // Return stale cache if available
    const stale = await env.CHATBOT_KV.get(cacheKey);
    if (stale) return JSON.parse(stale);

    return { repos: [], fetchedAt: null, error: error.message };
  }
}
