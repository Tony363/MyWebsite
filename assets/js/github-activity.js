// GitHub Widget Theme Switcher
(function() {
  'use strict';

  /**
   * Updates GitHub widget images based on current theme.
   * Widgets use data-light-src and data-dark-src attributes
   * to store theme-specific URLs.
   */
  function updateWidgetTheme() {
    const isDark = document.documentElement.dataset.theme === 'dark';
    const widgets = document.querySelectorAll('.github-widget img[data-light-src]');

    widgets.forEach(img => {
      const lightSrc = img.dataset.lightSrc;
      const darkSrc = img.dataset.darkSrc;

      if (lightSrc && darkSrc) {
        img.src = isDark ? darkSrc : lightSrc;
      }
    });
  }

  /**
   * Initialize theme observer and set initial theme.
   */
  function init() {
    const activityContainer = document.getElementById('github-activity');
    if (!activityContainer) return;

    // Set initial theme
    updateWidgetTheme();

    // Watch for theme changes on document element
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          updateWidgetTheme();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });

    // Handle image loading errors with fallback
    const widgets = activityContainer.querySelectorAll('.github-widget img');
    widgets.forEach(img => {
      img.addEventListener('error', () => {
        // If image fails to load, show fallback text
        const widget = img.closest('.github-widget');
        if (widget && !widget.querySelector('.github-widget__fallback')) {
          const fallback = document.createElement('div');
          fallback.className = 'github-widget__fallback';
          fallback.innerHTML = '<a href="https://github.com/Tony363" target="_blank" rel="noopener noreferrer">View on GitHub</a>';
          fallback.style.cssText = 'text-align: center; padding: 2rem; color: var(--github-green-accent); font-size: 1.4rem;';
          img.style.display = 'none';
          widget.appendChild(fallback);
        }
      });
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export for potential external use
  window.GitHubActivity = {
    updateTheme: updateWidgetTheme
  };
})();
