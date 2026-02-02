// Press Section - Render press items from JSON
(function() {
  'use strict';

  const PRESS_DATA_URL = '/assets/data/press.json';

  function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }

  function renderLoadingSkeleton(container) {
    container.setAttribute('aria-busy', 'true');
    container.innerHTML = `
      <article class="press-card press-card--skeleton" aria-hidden="true">
        <div class="press-card__logo skeleton-pulse"></div>
        <div class="press-card__content">
          <div class="skeleton-line skeleton-line--sm"></div>
          <div class="skeleton-line skeleton-line--lg"></div>
          <div class="skeleton-line skeleton-line--md"></div>
        </div>
      </article>
      <article class="press-card press-card--skeleton" aria-hidden="true">
        <div class="press-card__logo skeleton-pulse"></div>
        <div class="press-card__content">
          <div class="skeleton-line skeleton-line--sm"></div>
          <div class="skeleton-line skeleton-line--lg"></div>
          <div class="skeleton-line skeleton-line--md"></div>
        </div>
      </article>
    `;
  }

  function createPressCard(item) {
    const card = document.createElement('article');
    card.className = `press-card${item.featured ? ' featured' : ''}${item.image ? ' has-image' : ''}`;
    card.setAttribute('role', 'article');

    card.innerHTML = `
      ${item.image ? `
        <div class="press-card__image">
          <img src="${item.image}" alt="${item.title}" loading="lazy">
        </div>
      ` : `
        <div class="press-card__logo">
          <span class="press-card__logo-text">${item.publication}</span>
        </div>
      `}
      <div class="press-card__content">
        <span class="press-card__date">
          <i class="fas fa-calendar-alt" aria-hidden="true"></i>
          ${formatDate(item.date)}
        </span>
        <h3 class="press-card__title">
          <a href="${item.url}" target="_blank" rel="noopener noreferrer">
            ${item.title}
          </a>
        </h3>
        ${item.quote ? `
          <blockquote class="press-card__quote">
            <p>${item.quote}</p>
          </blockquote>
        ` : ''}
        <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="press-card__cta">
          <span>Read Full Article</span>
          <i class="fas fa-external-link-alt" aria-hidden="true"></i>
        </a>
      </div>
    `;

    return card;
  }

  function renderPressItems(items, container) {
    const fragment = document.createDocumentFragment();

    items.forEach(item => {
      fragment.appendChild(createPressCard(item));
    });

    container.innerHTML = '';
    container.appendChild(fragment);
    container.setAttribute('aria-busy', 'false');

    // Initialize ScrollReveal for press cards if available
    if (window.ScrollReveal) {
      ScrollReveal().reveal('.press-card', {
        delay: 200,
        interval: 150,
        origin: 'bottom',
        distance: '30px'
      });
    }
  }

  async function loadPressData() {
    const container = document.getElementById('press-container');
    if (!container) return;

    // Show loading skeleton
    renderLoadingSkeleton(container);

    try {
      const response = await fetch(PRESS_DATA_URL);
      if (!response.ok) throw new Error('Failed to fetch press data');

      const data = await response.json();
      renderPressItems(data, container);
    } catch (error) {
      console.error('Error loading press data:', error);
      container.setAttribute('aria-busy', 'false');
      container.innerHTML = `
        <div class="press-card">
          <div class="press-card__content">
            <p style="color: var(--theme-text-muted);">Unable to load press items.</p>
          </div>
        </div>
      `;
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadPressData);
  } else {
    loadPressData();
  }
})();
