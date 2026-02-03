// Share functionality for Press page
(function() {
  'use strict';

  const ARTICLE_URL = 'https://www.ibtimes.com/tony-sius-longterm-path-how-research-projects-community-work-shape-his-approach-building-3796429';
  const SHARE_TEXT = 'Great read: Tony Siu\'s approach to building AI systems through research, community, and long-term thinking. Featured in @IBTimes';
  const SHARE_TITLE = 'Tony Siu Featured in International Business Times';

  /**
   * Share to Twitter/X
   */
  function shareTwitter() {
    const twitterUrl = new URL('https://twitter.com/intent/tweet');
    twitterUrl.searchParams.set('text', SHARE_TEXT);
    twitterUrl.searchParams.set('url', ARTICLE_URL);

    window.open(twitterUrl.toString(), '_blank', 'noopener,noreferrer,width=550,height=420');
  }

  /**
   * Share to LinkedIn
   */
  function shareLinkedIn() {
    const linkedInUrl = new URL('https://www.linkedin.com/sharing/share-offsite/');
    linkedInUrl.searchParams.set('url', ARTICLE_URL);

    window.open(linkedInUrl.toString(), '_blank', 'noopener,noreferrer,width=550,height=420');
  }

  /**
   * Copy link to clipboard with visual feedback
   */
  async function copyLink(button) {
    try {
      await navigator.clipboard.writeText(ARTICLE_URL);

      // Visual feedback
      const originalHTML = button.innerHTML;
      button.innerHTML = '<i class="fas fa-check" aria-hidden="true"></i><span>Copied!</span>';
      button.classList.add('copied');
      button.setAttribute('aria-label', 'Link copied to clipboard');

      // Reset after 2 seconds
      setTimeout(() => {
        button.innerHTML = originalHTML;
        button.classList.remove('copied');
        button.setAttribute('aria-label', 'Copy link to clipboard');
      }, 2000);

    } catch (err) {
      console.error('Failed to copy:', err);

      // Fallback for older browsers
      fallbackCopy(button);
    }
  }

  /**
   * Fallback copy method for browsers without Clipboard API
   */
  function fallbackCopy(button) {
    const textArea = document.createElement('textarea');
    textArea.value = ARTICLE_URL;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand('copy');

      // Visual feedback
      const originalHTML = button.innerHTML;
      button.innerHTML = '<i class="fas fa-check" aria-hidden="true"></i><span>Copied!</span>';
      button.classList.add('copied');

      setTimeout(() => {
        button.innerHTML = originalHTML;
        button.classList.remove('copied');
      }, 2000);

    } catch (err) {
      console.error('Fallback copy failed:', err);
      alert('Unable to copy. Please copy this URL manually: ' + ARTICLE_URL);
    }

    document.body.removeChild(textArea);
  }

  /**
   * Native share using Web Share API (mobile)
   */
  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: SHARE_TITLE,
          text: SHARE_TEXT,
          url: ARTICLE_URL
        });
      } catch (err) {
        // User cancelled or share failed - this is normal
        if (err.name !== 'AbortError') {
          console.error('Share failed:', err);
        }
      }
    }
  }

  /**
   * Check if native sharing is available
   */
  function canNativeShare() {
    return typeof navigator.share === 'function';
  }

  /**
   * Handle share button clicks
   */
  function handleShareClick(event) {
    const button = event.target.closest('[data-share]');
    if (!button) return;

    const shareType = button.dataset.share;

    switch (shareType) {
      case 'twitter':
        shareTwitter();
        break;
      case 'linkedin':
        shareLinkedIn();
        break;
      case 'copy':
        copyLink(button);
        break;
      case 'native':
        nativeShare();
        break;
    }
  }

  /**
   * Add native share button on mobile if supported
   */
  function addNativeShareButton() {
    if (!canNativeShare()) return;

    const shareContainer = document.querySelector('.article-screenshot__share');
    if (!shareContainer) return;

    // Only add on mobile
    if (window.matchMedia('(max-width: 768px)').matches) {
      const nativeBtn = document.createElement('button');
      nativeBtn.type = 'button';
      nativeBtn.className = 'share-btn share-btn--copy';
      nativeBtn.dataset.share = 'native';
      nativeBtn.setAttribute('aria-label', 'Share via system share sheet');
      nativeBtn.innerHTML = '<i class="fas fa-share-alt" aria-hidden="true"></i><span>Share</span>';

      // Insert at beginning
      shareContainer.insertBefore(nativeBtn, shareContainer.firstChild);
    }
  }

  /**
   * Initialize share functionality
   */
  function init() {
    // Event delegation for share buttons
    document.addEventListener('click', handleShareClick);

    // Add native share button on mobile
    addNativeShareButton();

    // Handle keyboard navigation
    document.addEventListener('keydown', function(event) {
      if (event.key === 'Enter' || event.key === ' ') {
        const button = event.target.closest('[data-share]');
        if (button) {
          event.preventDefault();
          handleShareClick(event);
        }
      }
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
