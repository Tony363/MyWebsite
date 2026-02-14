// Share functionality for Press page
(function() {
  'use strict';

  /**
   * Get share data from the closest article container's data attributes
   */
  function getShareData(button) {
    const container = button.closest('[data-article-url]');
    return {
      url: container ? container.dataset.articleUrl : window.location.href,
      text: container ? container.dataset.shareText : '',
      title: container ? container.dataset.articleTitle : document.title
    };
  }

  /**
   * Share to Twitter/X
   */
  function shareTwitter(shareData) {
    const twitterUrl = new URL('https://twitter.com/intent/tweet');
    twitterUrl.searchParams.set('text', shareData.text);
    twitterUrl.searchParams.set('url', shareData.url);

    window.open(twitterUrl.toString(), '_blank', 'noopener,noreferrer,width=550,height=420');
  }

  /**
   * Share to LinkedIn
   */
  function shareLinkedIn(shareData) {
    const linkedInUrl = new URL('https://www.linkedin.com/sharing/share-offsite/');
    linkedInUrl.searchParams.set('url', shareData.url);

    window.open(linkedInUrl.toString(), '_blank', 'noopener,noreferrer,width=550,height=420');
  }

  /**
   * Copy link to clipboard with visual feedback
   */
  async function copyLink(button, shareData) {
    try {
      await navigator.clipboard.writeText(shareData.url);

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
      fallbackCopy(button, shareData);
    }
  }

  /**
   * Fallback copy method for browsers without Clipboard API
   */
  function fallbackCopy(button, shareData) {
    const textArea = document.createElement('textarea');
    textArea.value = shareData.url;
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
      alert('Unable to copy. Please copy this URL manually: ' + shareData.url);
    }

    document.body.removeChild(textArea);
  }

  /**
   * Native share using Web Share API (mobile)
   */
  async function nativeShare(shareData) {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareData.title,
          text: shareData.text,
          url: shareData.url
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

    const shareData = getShareData(button);
    const shareType = button.dataset.share;

    switch (shareType) {
      case 'twitter':
        shareTwitter(shareData);
        break;
      case 'linkedin':
        shareLinkedIn(shareData);
        break;
      case 'copy':
        copyLink(button, shareData);
        break;
      case 'native':
        nativeShare(shareData);
        break;
    }
  }

  /**
   * Add native share button on mobile if supported
   */
  function addNativeShareButton() {
    if (!canNativeShare()) return;

    // Only add on mobile
    if (!window.matchMedia('(max-width: 768px)').matches) return;

    const shareContainers = document.querySelectorAll('.article-screenshot__share');
    shareContainers.forEach(shareContainer => {
      const nativeBtn = document.createElement('button');
      nativeBtn.type = 'button';
      nativeBtn.className = 'share-btn share-btn--copy';
      nativeBtn.dataset.share = 'native';
      nativeBtn.setAttribute('aria-label', 'Share via system share sheet');
      nativeBtn.innerHTML = '<i class="fas fa-share-alt" aria-hidden="true"></i><span>Share</span>';

      // Insert at beginning
      shareContainer.insertBefore(nativeBtn, shareContainer.firstChild);
    });
  }

  /**
   * Initialize share functionality
   */
  function init() {
    // Event delegation for share buttons
    document.addEventListener('click', handleShareClick);

    // Add native share buttons on mobile
    addNativeShareButton();

    // Re-check for native share buttons when new articles are rendered
    const observer = new MutationObserver(() => {
      if (canNativeShare() && window.matchMedia('(max-width: 768px)').matches) {
        document.querySelectorAll('.article-screenshot__share').forEach(container => {
          if (!container.querySelector('[data-share="native"]')) {
            const nativeBtn = document.createElement('button');
            nativeBtn.type = 'button';
            nativeBtn.className = 'share-btn share-btn--copy';
            nativeBtn.dataset.share = 'native';
            nativeBtn.setAttribute('aria-label', 'Share via system share sheet');
            nativeBtn.innerHTML = '<i class="fas fa-share-alt" aria-hidden="true"></i><span>Share</span>';
            container.insertBefore(nativeBtn, container.firstChild);
          }
        });
      }
    });

    const articlesContainer = document.getElementById('press-articles-container');
    if (articlesContainer) {
      observer.observe(articlesContainer, { childList: true, subtree: true });
    }

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
