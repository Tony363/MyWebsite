// Press Section - Horizontal carousel rendered from JSON
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
      <article class="press-card press-card--skeleton" aria-hidden="true" style="min-width:100%;flex:0 0 100%">
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
    card.style.minWidth = '100%';
    card.style.flex = '0 0 100%';

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

  function initCarousel(items, container) {
    const wrapper = container.closest('.press-carousel');
    if (!wrapper) return;

    const dotsContainer = wrapper.parentElement.querySelector('.press-carousel__dots');
    const prevBtn = wrapper.querySelector('.press-carousel__prev');
    const nextBtn = wrapper.querySelector('.press-carousel__next');

    // Build cards into track
    const fragment = document.createDocumentFragment();
    items.forEach(item => {
      fragment.appendChild(createPressCard(item));
    });
    container.innerHTML = '';
    container.appendChild(fragment);
    container.setAttribute('aria-busy', 'false');

    const total = items.length;
    let current = 0;
    let autoPlayTimer = null;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Create pagination dots
    if (dotsContainer && total > 1) {
      for (let i = 0; i < total; i++) {
        const dot = document.createElement('button');
        dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
        dot.setAttribute('aria-label', `Article ${i + 1} of ${total}`);
        dot.addEventListener('click', () => goToSlide(i));
        dotsContainer.appendChild(dot);
      }
    }

    const dots = dotsContainer ? dotsContainer.querySelectorAll('.carousel-dot') : [];

    function goToSlide(index) {
      if (index < 0 || index >= total) return;
      current = index;
      container.style.transform = `translateX(-${current * 100}%)`;

      // Update dots
      dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === current);
        dot.setAttribute('aria-selected', i === current ? 'true' : 'false');
      });

      // Update button states
      if (prevBtn) prevBtn.disabled = current === 0;
      if (nextBtn) nextBtn.disabled = current === total - 1;
    }

    // Nav buttons
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        goToSlide(current - 1);
        resetAutoPlay();
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        goToSlide(current + 1);
        resetAutoPlay();
      });
    }

    // Keyboard navigation
    wrapper.setAttribute('tabindex', '0');
    wrapper.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToSlide(current - 1);
        resetAutoPlay();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToSlide(current + 1);
        resetAutoPlay();
      }
    });

    // Touch swipe
    let touchStartX = 0;
    let touchEndX = 0;

    wrapper.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    wrapper.addEventListener('touchmove', (e) => {
      touchEndX = e.changedTouches[0].screenX;
    }, { passive: true });

    wrapper.addEventListener('touchend', () => {
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 50) {
        if (diff > 0 && current < total - 1) {
          goToSlide(current + 1);
        } else if (diff < 0 && current > 0) {
          goToSlide(current - 1);
        }
        resetAutoPlay();
      }
    }, { passive: true });

    // Auto-play
    function startAutoPlay() {
      if (prefersReducedMotion || total <= 1) return;
      stopAutoPlay();
      autoPlayTimer = setInterval(() => {
        const next = (current + 1) % total;
        goToSlide(next);
      }, 6000);
    }

    function stopAutoPlay() {
      if (autoPlayTimer) {
        clearInterval(autoPlayTimer);
        autoPlayTimer = null;
      }
    }

    function resetAutoPlay() {
      stopAutoPlay();
      startAutoPlay();
    }

    // Pause on hover and focus
    wrapper.addEventListener('mouseenter', stopAutoPlay);
    wrapper.addEventListener('mouseleave', startAutoPlay);
    wrapper.addEventListener('focusin', stopAutoPlay);
    wrapper.addEventListener('focusout', startAutoPlay);

    // Pause on page visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stopAutoPlay();
      } else {
        startAutoPlay();
      }
    });

    // Initialize first slide state and start auto-play
    goToSlide(0);
    startAutoPlay();
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
      initCarousel(data, container);
    } catch (error) {
      console.error('Error loading press data:', error);
      container.setAttribute('aria-busy', 'false');
      container.innerHTML = `
        <div class="press-card" style="min-width:100%;flex:0 0 100%">
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
