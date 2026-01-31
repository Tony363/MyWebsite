// GitHub Activity Visualization
(function() {
  'use strict';

  const GITHUB_USERNAME = 'Tony363';
  const GITHUB_API_BASE = 'https://api.github.com';

  // Cache for API responses
  let cachedData = null;
  let cacheTimestamp = null;
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async function fetchGitHubStats() {
    // Check cache
    if (cachedData && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
      return cachedData;
    }

    try {
      const [userResponse, reposResponse, eventsResponse] = await Promise.all([
        fetch(`${GITHUB_API_BASE}/users/${GITHUB_USERNAME}`),
        fetch(`${GITHUB_API_BASE}/users/${GITHUB_USERNAME}/repos?per_page=100&sort=updated`),
        fetch(`${GITHUB_API_BASE}/users/${GITHUB_USERNAME}/events/public?per_page=100`)
      ]);

      if (!userResponse.ok || !reposResponse.ok) {
        throw new Error('GitHub API request failed');
      }

      const user = await userResponse.json();
      const repos = await reposResponse.json();
      const events = eventsResponse.ok ? await eventsResponse.json() : [];

      // Calculate stats
      const totalStars = repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);
      const totalForks = repos.reduce((sum, repo) => sum + (repo.forks_count || 0), 0);

      // Count languages
      const languages = {};
      repos.forEach(repo => {
        if (repo.language) {
          languages[repo.language] = (languages[repo.language] || 0) + 1;
        }
      });

      // Sort languages by count
      const topLanguages = Object.entries(languages)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

      // Count recent contributions from events
      const recentContributions = events.filter(e =>
        ['PushEvent', 'PullRequestEvent', 'IssuesEvent', 'CreateEvent'].includes(e.type)
      ).length;

      // Generate contribution heatmap data (simulated based on events)
      const heatmapData = generateHeatmapData(events);

      cachedData = {
        user: {
          publicRepos: user.public_repos,
          followers: user.followers,
          following: user.following
        },
        stats: {
          totalStars,
          totalForks,
          recentContributions
        },
        topLanguages,
        heatmapData
      };
      cacheTimestamp = Date.now();

      return cachedData;
    } catch (error) {
      console.error('Error fetching GitHub stats:', error);
      throw error;
    }
  }

  function generateHeatmapData(events) {
    // Create a map of dates to contribution counts
    const contributions = {};
    const today = new Date();

    // Initialize last 52 weeks (364 days) with zeros
    for (let i = 0; i < 364; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      contributions[dateKey] = 0;
    }

    // Count contributions from events
    events.forEach(event => {
      const dateKey = event.created_at.split('T')[0];
      if (contributions.hasOwnProperty(dateKey)) {
        contributions[dateKey]++;
      }
    });

    // Convert to array format for rendering
    const weeks = [];
    let currentWeek = [];

    // Start from 52 weeks ago
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 363);

    // Align to Sunday
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);

    for (let i = 0; i < 371; i++) { // 53 weeks max
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);

      if (date > today) break;

      const dateKey = date.toISOString().split('T')[0];
      const count = contributions[dateKey] || 0;

      // Determine level (0-4)
      let level = 0;
      if (count > 0) level = 1;
      if (count >= 3) level = 2;
      if (count >= 5) level = 3;
      if (count >= 8) level = 4;

      currentWeek.push({
        date: dateKey,
        count,
        level
      });

      // New week starts on Sunday
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    // Push remaining days
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return weeks;
  }

  function renderStats(data, container) {
    const statsHTML = `
      <div class="github-stat">
        <span class="github-stat__value">${data.user.publicRepos}</span>
        <span class="github-stat__label">Public Repos</span>
      </div>
      <div class="github-stat">
        <span class="github-stat__value">${data.stats.totalStars}</span>
        <span class="github-stat__label">Total Stars</span>
      </div>
      <div class="github-stat">
        <span class="github-stat__value">${data.user.followers}</span>
        <span class="github-stat__label">Followers</span>
      </div>
      <div class="github-stat">
        <span class="github-stat__value">${data.stats.recentContributions}+</span>
        <span class="github-stat__label">Recent Activity</span>
      </div>
    `;

    container.innerHTML = statsHTML;
  }

  function renderHeatmap(data, container) {
    let weeksHTML = data.heatmapData.map(week => {
      const daysHTML = week.map(day =>
        `<div class="github-heatmap__day" data-level="${day.level}" title="${day.date}: ${day.count} contributions"></div>`
      ).join('');
      return `<div class="github-heatmap__week">${daysHTML}</div>`;
    }).join('');

    container.innerHTML = `
      <div class="github-heatmap__grid">
        ${weeksHTML}
      </div>
      <div class="github-heatmap__legend">
        <span>Less</span>
        <div class="github-heatmap__legend-item" style="background: var(--theme-chip-bg);"></div>
        <div class="github-heatmap__legend-item" style="background: rgba(180, 99, 45, 0.3);"></div>
        <div class="github-heatmap__legend-item" style="background: rgba(180, 99, 45, 0.5);"></div>
        <div class="github-heatmap__legend-item" style="background: rgba(180, 99, 45, 0.7);"></div>
        <div class="github-heatmap__legend-item" style="background: var(--theme-accent);"></div>
        <span>More</span>
      </div>
    `;
  }

  function renderError(container) {
    container.innerHTML = `
      <div class="github-activity__error">
        <i class="fab fa-github" aria-hidden="true"></i>
        <p>Unable to load GitHub activity. <a href="https://github.com/${GITHUB_USERNAME}" target="_blank" rel="noopener">View profile directly</a></p>
      </div>
    `;
  }

  function renderLoading(container) {
    container.innerHTML = `
      <div class="github-activity__loading">
        <i class="fas fa-spinner" aria-hidden="true"></i>
        <span>Loading GitHub activity...</span>
      </div>
    `;
  }

  function renderStatsSkeleton(container) {
    container.setAttribute('aria-busy', 'true');
    container.innerHTML = `
      <div class="github-stat github-stat--skeleton">
        <span class="skeleton-pulse skeleton-stat-value"></span>
        <span class="skeleton-line skeleton-line--sm"></span>
      </div>
      <div class="github-stat github-stat--skeleton">
        <span class="skeleton-pulse skeleton-stat-value"></span>
        <span class="skeleton-line skeleton-line--sm"></span>
      </div>
      <div class="github-stat github-stat--skeleton">
        <span class="skeleton-pulse skeleton-stat-value"></span>
        <span class="skeleton-line skeleton-line--sm"></span>
      </div>
      <div class="github-stat github-stat--skeleton">
        <span class="skeleton-pulse skeleton-stat-value"></span>
        <span class="skeleton-line skeleton-line--sm"></span>
      </div>
    `;
  }

  function renderHeatmapSkeleton(container) {
    container.setAttribute('aria-busy', 'true');
    container.innerHTML = `
      <div class="github-heatmap__skeleton skeleton-pulse" aria-hidden="true"></div>
    `;
  }

  async function initGitHubActivity() {
    const activityContainer = document.getElementById('github-activity');
    if (!activityContainer) return;

    const statsContainer = activityContainer.querySelector('.github-stats');
    const heatmapContainer = activityContainer.querySelector('.github-heatmap');

    // Show loading skeletons
    if (statsContainer) {
      renderStatsSkeleton(statsContainer);
    }
    if (heatmapContainer) {
      renderHeatmapSkeleton(heatmapContainer);
    }
    if (!statsContainer && !heatmapContainer) {
      renderLoading(activityContainer);
    }

    try {
      const data = await fetchGitHubStats();

      if (statsContainer) {
        renderStats(data, statsContainer);
        statsContainer.setAttribute('aria-busy', 'false');
      }

      if (heatmapContainer) {
        renderHeatmap(data, heatmapContainer);
        heatmapContainer.setAttribute('aria-busy', 'false');
      }

      // Initialize ScrollReveal if available
      if (window.ScrollReveal) {
        ScrollReveal().reveal('.github-stat', {
          delay: 100,
          interval: 100,
          origin: 'bottom',
          distance: '20px'
        });
      }
    } catch (error) {
      if (!statsContainer && !heatmapContainer) {
        renderError(activityContainer);
      } else {
        // Show minimal error in containers
        if (statsContainer) {
          statsContainer.setAttribute('aria-busy', 'false');
          statsContainer.innerHTML = '<p style="color: var(--theme-text-muted); text-align: center; grid-column: 1/-1;">Stats unavailable</p>';
        }
        if (heatmapContainer) {
          heatmapContainer.setAttribute('aria-busy', 'false');
          heatmapContainer.innerHTML = '<p style="color: var(--theme-text-muted); text-align: center; padding: 2rem;">Activity data unavailable</p>';
        }
      }
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGitHubActivity);
  } else {
    initGitHubActivity();
  }

  // Export for potential external use
  window.GitHubActivity = {
    refresh: initGitHubActivity
  };
})();
