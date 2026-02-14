// Press Page - Render full article sections from JSON
(function() {
  'use strict';

  const PRESS_DATA_URL = '/assets/data/press.json';

  function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }

  function createArticleSection(item) {
    const article = document.createElement('section');
    article.className = 'press-article';
    article.id = `article-${item.id}`;
    article.setAttribute('aria-labelledby', `heading-${item.id}`);

    const contextCardsHTML = (item.contextCards || []).map(card => `
      <article class="context-card">
        <div class="context-card__icon">
          <i class="${card.icon}" aria-hidden="true"></i>
        </div>
        <h3 class="context-card__title">${card.title}</h3>
        <p class="context-card__text">${card.text}</p>
      </article>
    `).join('');

    article.innerHTML = `
      <div class="article-section" data-article-url="${item.url}" data-article-title="${item.title}" data-share-text="${item.shareText || ''}">
        <div class="article-section__badge">
          <img src="${item.logo}" alt="${item.publication} logo" width="24" height="24">
          <span class="article-section__badge-pub">${item.publication}</span>
          <span class="article-section__badge-date">${formatDate(item.date)}</span>
        </div>
        <div class="article-section__header">
          <h2 id="heading-${item.id}" class="article-section__title">
            ${item.title}
          </h2>
        </div>

        <figure class="article-screenshot" role="group" aria-labelledby="caption-${item.id}">
          <a href="${item.url}" target="_blank" rel="noopener noreferrer">
            <img src="${item.image}"
                 alt="${item.publication} article screenshot: ${item.title}"
                 loading="lazy">
          </a>
          <figcaption id="caption-${item.id}" class="sr-only">
            Screenshot of the ${item.publication} article about ${item.title}
          </figcaption>
          <div class="article-screenshot__share" role="group" aria-label="Share article">
            <button type="button" class="share-btn share-btn--twitter" data-share="twitter" aria-label="Share on Twitter">
              <i class="fab fa-twitter" aria-hidden="true"></i>
              <span>Tweet</span>
            </button>
            <button type="button" class="share-btn share-btn--linkedin" data-share="linkedin" aria-label="Share on LinkedIn">
              <i class="fab fa-linkedin-in" aria-hidden="true"></i>
              <span>Share</span>
            </button>
            <button type="button" class="share-btn share-btn--copy" data-share="copy" aria-label="Copy link to clipboard">
              <i class="fas fa-link" aria-hidden="true"></i>
              <span>Copy Link</span>
            </button>
          </div>
        </figure>
      </div>

      <div class="context-section">
        <div class="context-section__header">
          <h2 class="context-section__title">
            <i class="fas fa-lightbulb" aria-hidden="true"></i>
            Why ${item.publication} Highlighted This
          </h2>
          <p class="context-section__subtitle">Key themes from the article</p>
        </div>
        <div class="context-grid">
          ${contextCardsHTML}
        </div>
      </div>

      <div class="press-quote-section">
        <div class="press-quote">
          <i class="fas fa-quote-left press-quote__icon" aria-hidden="true"></i>
          <blockquote>
            <p class="press-quote__text">
              "${item.quote}"
            </p>
          </blockquote>
          <div class="press-quote__author">
            <img src="/assets/images/resume_photo.jpeg" alt="Tony Siu" loading="lazy">
            <div class="press-quote__author-info">
              <div class="press-quote__author-name">Tony Siu</div>
              <div class="press-quote__author-title">Founding AI Engineer & Community Builder</div>
            </div>
          </div>
        </div>
      </div>

      <div class="press-cta">
        <a href="${item.url}"
           target="_blank"
           rel="noopener noreferrer"
           class="press-cta__btn">
          <span>Read Full Article on ${item.publication}</span>
          <i class="fas fa-external-link-alt" aria-hidden="true"></i>
        </a>
      </div>
    `;

    return article;
  }

  function renderHeroBadges(items, container) {
    if (!container) return;

    const fragment = document.createDocumentFragment();
    items.forEach(item => {
      const badge = document.createElement('div');
      badge.className = 'press-hero__badge';
      badge.innerHTML = `
        <img src="${item.logo}" alt="${item.publication} logo" width="32" height="32">
        <span class="press-hero__badge-text">${item.publication}</span>
      `;
      fragment.appendChild(badge);
    });

    container.innerHTML = '';
    container.appendChild(fragment);
  }

  function renderArticles(items, container) {
    const fragment = document.createDocumentFragment();
    items.forEach(item => {
      fragment.appendChild(createArticleSection(item));
    });

    container.innerHTML = '';
    container.appendChild(fragment);
    container.setAttribute('aria-busy', 'false');

    // Initialize ScrollReveal if available
    if (window.ScrollReveal) {
      ScrollReveal().reveal('.press-article .article-section', {
        delay: 200,
        origin: 'bottom',
        distance: '30px'
      });
      ScrollReveal().reveal('.press-article .context-card', {
        delay: 200,
        interval: 100,
        origin: 'bottom',
        distance: '20px'
      });
      ScrollReveal().reveal('.press-article .press-quote-section', {
        delay: 300,
        origin: 'bottom',
        distance: '20px'
      });
    }
  }

  async function loadPressPage() {
    const container = document.getElementById('press-articles-container');
    const badgesContainer = document.getElementById('press-hero-badges');
    if (!container) return;

    container.setAttribute('aria-busy', 'true');

    try {
      const response = await fetch(PRESS_DATA_URL);
      if (!response.ok) throw new Error('Failed to fetch press data');

      const data = await response.json();
      renderHeroBadges(data, badgesContainer);
      renderArticles(data, container);
    } catch (error) {
      console.error('Error loading press page:', error);
      container.setAttribute('aria-busy', 'false');
      container.innerHTML = `
        <div class="article-section">
          <p style="color: var(--theme-text-muted); text-align: center; padding: 4rem;">Unable to load press articles.</p>
        </div>
      `;
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadPressPage);
  } else {
    loadPressPage();
  }
})();
