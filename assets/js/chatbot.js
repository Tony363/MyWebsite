/**
 * ChatbotWidget — AI chat assistant for Tony Siu's portfolio.
 *
 * Lazy-builds the chat panel on first open.  Streams responses from a
 * Cloudflare Worker endpoint using Server-Sent Events.  Follows the
 * same class + DOMContentLoaded pattern used by InteractiveSkills and
 * the MutationObserver theme wiring from github-activity.js.
 */

class ChatbotWidget {
  constructor(config) {
    this.apiUrl = config.apiUrl;
    this.messages = [];
    this.isOpen = false;
    this.isStreaming = false;
    this.abortController = null;
    this.panelBuilt = false;
    this.sessionId = this.getOrCreateSessionId();

    // DOM references (set during build steps)
    this.trigger = null;
    this.panel = null;
    this.messagesContainer = null;
    this.input = null;
    this.sendButton = null;
    this.closeButton = null;

    // Focus-trap handler (bound once so it can be added/removed)
    this._trapFocus = this._trapFocus.bind(this);

    this.init();
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  init() {
    this.buildTrigger();
    this.observeTheme();
  }

  // ---------------------------------------------------------------------------
  // DOM — Trigger (FAB)
  // ---------------------------------------------------------------------------

  buildTrigger() {
    const root = document.getElementById('chatbot-root');
    if (!root) return;

    const btn = document.createElement('button');
    btn.className = 'chatbot-trigger';
    btn.setAttribute('aria-label', 'Open AI chat assistant');
    btn.setAttribute('aria-expanded', 'false');

    const icon = document.createElement('i');
    icon.className = 'fas fa-comment-dots';
    btn.appendChild(icon);

    btn.addEventListener('click', () => this.toggle());

    root.appendChild(btn);
    this.trigger = btn;
  }

  // ---------------------------------------------------------------------------
  // DOM — Panel (lazy, built once)
  // ---------------------------------------------------------------------------

  buildPanel() {
    const root = document.getElementById('chatbot-root');
    if (!root) return;

    // Panel wrapper
    const panel = document.createElement('div');
    panel.className = 'chatbot-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'AI Chat Assistant');
    panel.setAttribute('aria-modal', 'true');

    // ---- Header ----
    const header = document.createElement('div');
    header.className = 'chatbot-header';

    const headerInfo = document.createElement('div');
    headerInfo.className = 'chatbot-header-info';

    const avatar = document.createElement('div');
    avatar.className = 'chatbot-header-avatar';
    const avatarIcon = document.createElement('i');
    avatarIcon.className = 'fas fa-robot';
    avatar.appendChild(avatarIcon);

    const headerText = document.createElement('div');

    const title = document.createElement('div');
    title.className = 'chatbot-header-title';
    title.textContent = "Ask Tony's AI";

    const status = document.createElement('div');
    status.className = 'chatbot-header-status';
    status.textContent = 'Online';

    headerText.appendChild(title);
    headerText.appendChild(status);
    headerInfo.appendChild(avatar);
    headerInfo.appendChild(headerText);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'chatbot-header-close';
    closeBtn.setAttribute('aria-label', 'Close chat');
    const closeIcon = document.createElement('i');
    closeIcon.className = 'fas fa-times';
    closeBtn.appendChild(closeIcon);
    closeBtn.addEventListener('click', () => this.close());

    header.appendChild(headerInfo);
    header.appendChild(closeBtn);

    // ---- Messages area ----
    const messagesContainer = document.createElement('div');
    messagesContainer.className = 'chatbot-messages';
    messagesContainer.setAttribute('aria-live', 'polite');
    messagesContainer.setAttribute('aria-label', 'Chat messages');

    // ---- Input area ----
    const inputArea = document.createElement('div');
    inputArea.className = 'chatbot-input-area';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'chatbot-input';
    input.placeholder = "Ask about Tony's experience...";
    input.setAttribute('aria-label', 'Type your message');
    input.setAttribute('maxlength', '500');
    input.setAttribute('autocomplete', 'off');

    const sendBtn = document.createElement('button');
    sendBtn.className = 'chatbot-send';
    sendBtn.setAttribute('aria-label', 'Send message');
    sendBtn.disabled = true;
    const sendIcon = document.createElement('i');
    sendIcon.className = 'fas fa-paper-plane';
    sendBtn.appendChild(sendIcon);

    inputArea.appendChild(input);
    inputArea.appendChild(sendBtn);

    // Assemble panel
    panel.appendChild(header);
    panel.appendChild(messagesContainer);
    panel.appendChild(inputArea);

    root.appendChild(panel);

    // Store references
    this.panel = panel;
    this.messagesContainer = messagesContainer;
    this.input = input;
    this.sendButton = sendBtn;
    this.closeButton = closeBtn;

    // Wire input events
    input.addEventListener('input', () => this.updateSendButton());
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage(input.value);
      }
    });
    sendBtn.addEventListener('click', () => this.sendMessage(input.value));

    this.panelBuilt = true;

    // Render welcome content or restore session
    const restored = this.loadSession();
    if (!restored) {
      this.renderWelcome();
    }
  }

  // ---------------------------------------------------------------------------
  // Welcome message & suggestion chips
  // ---------------------------------------------------------------------------

  renderWelcome() {
    const welcomeBubble = this.createMessageBubble('assistant');
    welcomeBubble.textContent =
      "Hi! I'm Tony's AI assistant. Ask me anything about his experience, projects, skills, or education.";

    const chips = document.createElement('div');
    chips.className = 'chatbot-suggestions';

    const suggestions = [
      "What's Tony's AI experience?",
      'What projects has he built?',
      'Tell me about his education',
      'What tech stack does he use?'
    ];

    suggestions.forEach((text) => {
      const chip = document.createElement('button');
      chip.className = 'chatbot-suggestion';
      chip.textContent = text;
      chip.addEventListener('click', () => {
        this.sendMessage(text);
      });
      chips.appendChild(chip);
    });

    this.messagesContainer.appendChild(chips);
    this.scrollToBottom();
  }

  // ---------------------------------------------------------------------------
  // Open / Close / Toggle
  // ---------------------------------------------------------------------------

  open() {
    if (!this.panelBuilt) {
      this.buildPanel();
    }

    this.panel.classList.add('chatbot-panel--open');
    this.isOpen = true;
    this.trigger.setAttribute('aria-expanded', 'true');

    // Set up focus trap
    document.addEventListener('keydown', this._trapFocus);

    // Focus the input after transition
    setTimeout(() => {
      this.input?.focus();
    }, 100);
  }

  close() {
    if (!this.panel) return;

    this.panel.classList.remove('chatbot-panel--open');
    this.isOpen = false;
    this.trigger.setAttribute('aria-expanded', 'false');

    // Remove focus trap
    document.removeEventListener('keydown', this._trapFocus);

    // Cancel any in-flight stream
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
      this.isStreaming = false;
    }

    // Return focus to trigger
    this.trigger?.focus();
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  // ---------------------------------------------------------------------------
  // Focus trap (matches script.js pattern)
  // ---------------------------------------------------------------------------

  _trapFocus(e) {
    if (!this.panel) return;

    const selector =
      'a[href], button:not([disabled]), input:not([disabled]), ' +
      'textarea:not([disabled]), select:not([disabled]), ' +
      '[tabindex]:not([tabindex="-1"])';
    const focusable = this.panel.querySelectorAll(selector);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.key === 'Tab' || e.keyCode === 9) {
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }

    if (e.key === 'Escape' || e.keyCode === 27) {
      this.close();
    }
  }

  // ---------------------------------------------------------------------------
  // Sending messages
  // ---------------------------------------------------------------------------

  sendMessage(text) {
    const trimmed = (text || '').trim();
    if (!trimmed || this.isStreaming) return;
    if (trimmed.length > 500) return;

    // Clear suggestion chips if still visible
    const chips = this.messagesContainer?.querySelector('.chatbot-suggestions');
    if (chips) chips.remove();

    // Render user bubble
    this.messages.push({ role: 'user', content: trimmed });
    const userBubble = this.createMessageBubble('user');
    userBubble.textContent = trimmed;

    // Clear input
    this.input.value = '';
    this.updateSendButton();

    // Show typing indicator
    this.showTypingIndicator();

    // Cancel any previous in-flight request
    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();
    this.isStreaming = true;
    this.updateSendButton();

    this.fetchStream(trimmed);
  }

  // ---------------------------------------------------------------------------
  // Streaming fetch
  // ---------------------------------------------------------------------------

  async fetchStream(text) {
    const apiMessages = this.messages.slice(-6);

    try {
      const response = await fetch(this.apiUrl + '/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          sessionId: this.sessionId
        }),
        signal: this.abortController.signal
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('RATE_LIMIT');
        }
        throw new Error('NETWORK');
      }

      await this.handleStream(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  // ---------------------------------------------------------------------------
  // SSE stream handler
  // ---------------------------------------------------------------------------

  async handleStream(response) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let assistantText = '';
    let buffer = '';

    // Replace typing indicator with assistant bubble
    this.removeTypingIndicator();
    const bubble = this.createMessageBubble('assistant');

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') {
              this.isStreaming = false;
              this.messages.push({ role: 'assistant', content: assistantText });
              this.saveSession();
              this.updateSendButton();
              return;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                assistantText += parsed.text;
                bubble.innerHTML = this.renderMarkdown(assistantText);
                this.scrollToBottom();
              }
            } catch (_e) {
              // Skip malformed JSON chunks
            }
          }
        }
      }

      // If we exit the loop without a [DONE] signal, still persist
      if (assistantText) {
        this.isStreaming = false;
        this.messages.push({ role: 'assistant', content: assistantText });
        this.saveSession();
        this.updateSendButton();
      }
    } catch (error) {
      // Re-throw so the outer catch in fetchStream handles it
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // Markdown rendering (XSS-safe)
  // ---------------------------------------------------------------------------

  renderMarkdown(text) {
    // Escape HTML first to prevent XSS
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

    // Apply markdown formatting
    html = html
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(
        /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
      )
      .replace(/\n/g, '<br>');

    return html;
  }

  // ---------------------------------------------------------------------------
  // Error handling
  // ---------------------------------------------------------------------------

  handleError(error) {
    this.removeTypingIndicator();
    this.isStreaming = false;
    this.updateSendButton();

    if (error.name === 'AbortError') {
      // User or system cancelled — keep any partial text already rendered
      const lastBubble = this.messagesContainer?.querySelector(
        '.chatbot-message--assistant:last-child'
      );
      if (lastBubble && lastBubble.textContent) {
        lastBubble.innerHTML += '<br><em>(Response interrupted)</em>';
      }
      return;
    }

    let errorText;
    if (error.message === 'RATE_LIMIT') {
      errorText = 'Please try again in a moment.';
    } else {
      errorText = 'Having trouble connecting. Email Tony at pysolver33@gmail.com';
    }

    const bubble = this.createMessageBubble('assistant');
    bubble.classList.add('chatbot-message--error');
    bubble.textContent = errorText;
    this.scrollToBottom();
  }

  // ---------------------------------------------------------------------------
  // Theme observer (MutationObserver pattern from github-activity.js)
  // ---------------------------------------------------------------------------

  observeTheme() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          // CSS custom properties handle visual updates automatically.
          // This hook is available for any future imperative updates.
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
  }

  // ---------------------------------------------------------------------------
  // Accessibility
  // ---------------------------------------------------------------------------

  setupAccessibility() {
    // aria-live is already set on messagesContainer during buildPanel.
    // Focus trap is managed in _trapFocus.
    // Escape-to-close is handled inside _trapFocus.
    // This method exists as an explicit extension point.
  }

  // ---------------------------------------------------------------------------
  // Session management
  // ---------------------------------------------------------------------------

  getOrCreateSessionId() {
    try {
      let id = sessionStorage.getItem('chatbot-session');
      if (!id) {
        id = crypto.randomUUID();
        sessionStorage.setItem('chatbot-session', id);
      }
      return id;
    } catch (_e) {
      // Fallback when sessionStorage is unavailable
      return crypto.randomUUID();
    }
  }

  saveSession() {
    try {
      sessionStorage.setItem('chatbot-messages', JSON.stringify(this.messages));
    } catch (_e) {
      // Silently ignore storage errors
    }
  }

  /**
   * Restore messages from sessionStorage.
   * Returns true if messages were restored, false otherwise.
   */
  loadSession() {
    try {
      const stored = sessionStorage.getItem('chatbot-messages');
      if (!stored) return false;

      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed) || parsed.length === 0) return false;

      this.messages = parsed;

      // Re-render stored messages
      this.messages.forEach((msg) => {
        const bubble = this.createMessageBubble(msg.role);
        if (msg.role === 'assistant') {
          bubble.innerHTML = this.renderMarkdown(msg.content);
        } else {
          bubble.textContent = msg.content;
        }
      });

      this.scrollToBottom();
      return true;
    } catch (_e) {
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Helper — message bubbles
  // ---------------------------------------------------------------------------

  createMessageBubble(role) {
    const wrapper = document.createElement('div');
    wrapper.className = `chatbot-message chatbot-message--${role}`;

    this.messagesContainer.appendChild(wrapper);
    this.scrollToBottom();
    return wrapper;
  }

  // ---------------------------------------------------------------------------
  // Helper — typing indicator
  // ---------------------------------------------------------------------------

  showTypingIndicator() {
    if (this.messagesContainer?.querySelector('.chatbot-typing')) return;

    const indicator = document.createElement('div');
    indicator.className = 'chatbot-typing';
    indicator.setAttribute('aria-label', 'Assistant is typing');

    for (let i = 0; i < 3; i++) {
      const dot = document.createElement('span');
      dot.className = 'chatbot-typing-dot';
      indicator.appendChild(dot);
    }

    this.messagesContainer.appendChild(indicator);
    this.scrollToBottom();
  }

  removeTypingIndicator() {
    const indicator = this.messagesContainer?.querySelector('.chatbot-typing');
    if (indicator) indicator.remove();
  }

  // ---------------------------------------------------------------------------
  // Helper — scroll & send button
  // ---------------------------------------------------------------------------

  scrollToBottom() {
    if (!this.messagesContainer) return;
    this.messagesContainer.scrollTo({
      top: this.messagesContainer.scrollHeight,
      behavior: 'smooth'
    });
  }

  updateSendButton() {
    if (!this.sendButton || !this.input) return;
    const hasText = this.input.value.trim().length > 0;
    this.sendButton.disabled = !hasText || this.isStreaming;
  }
}

// =============================================================================
// Auto-initialize when DOM is ready
// =============================================================================
window.addEventListener('load', function () {
  setTimeout(function () {
    const root = document.getElementById('chatbot-root');
    if (root) {
      window.chatbotWidget = new ChatbotWidget({
        apiUrl: 'https://tonysiu-chatbot.tony363.workers.dev'
      });
    }
  }, 2000);
});
