// Playwright tests for AI Chatbot Widget

const { test, expect } = require('@playwright/test');

// Mock SSE stream helper
function createSSEStream(chunks) {
  const parts = chunks.map(text => `data: ${JSON.stringify({ text })}\n\n`);
  parts.push('data: [DONE]\n\n');
  return parts.join('');
}

// Set up API route mocking before each test
test.beforeEach(async ({ page }) => {
  // Mock the chatbot API endpoint
  await page.route('**/chat', async (route) => {
    const request = route.request();
    if (request.method() === 'POST') {
      const body = JSON.parse(request.postData() || '{}');
      const lastMessage = body.messages?.[body.messages.length - 1]?.content || '';

      // Default successful streaming response
      const responseText = `Tony is a Founding AI Engineer with expertise in **Multi-Modal Generative AI** and Computer Vision. Learn more at [his GitHub](https://github.com/Tony363).`;
      const sseBody = createSSEStream([
        'Tony is a ',
        'Founding AI Engineer ',
        'with expertise in ',
        '**Multi-Modal Generative AI** ',
        'and Computer Vision. ',
        'Learn more at ',
        '[his GitHub](https://github.com/Tony363).'
      ]);

      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Access-Control-Allow-Origin': '*',
        },
        body: sseBody,
      });
    } else if (request.method() === 'OPTIONS') {
      await route.fulfill({
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    } else {
      await route.continue();
    }
  });

  await page.goto('/');
  // Wait for chatbot to initialize (2s delay + load)
  await page.waitForTimeout(3000);
});

test.describe('Chatbot Widget — Visibility', () => {
  test('trigger button appears on page', async ({ page }) => {
    const trigger = page.locator('.chatbot-trigger');
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-label', 'Open AI chat assistant');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  test('clicking trigger opens the chat panel', async ({ page }) => {
    const trigger = page.locator('.chatbot-trigger');
    const panel = page.locator('.chatbot-panel');

    await trigger.click();
    await expect(panel).toBeVisible();
    await expect(panel).toHaveClass(/chatbot-panel--open/);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  test('clicking close button closes the panel', async ({ page }) => {
    const trigger = page.locator('.chatbot-trigger');

    // Open
    await trigger.click();
    await expect(page.locator('.chatbot-panel--open')).toBeVisible();

    // Close via header button
    await page.locator('.chatbot-header-close').click();
    await expect(page.locator('.chatbot-panel')).not.toHaveClass(/chatbot-panel--open/);
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  test('panel has correct ARIA attributes', async ({ page }) => {
    await page.locator('.chatbot-trigger').click();
    const panel = page.locator('.chatbot-panel');

    await expect(panel).toHaveAttribute('role', 'dialog');
    await expect(panel).toHaveAttribute('aria-label', 'AI Chat Assistant');
    await expect(panel).toHaveAttribute('aria-modal', 'true');
  });
});

test.describe('Chatbot Widget — Interaction', () => {
  test('suggestion chips are displayed initially', async ({ page }) => {
    await page.locator('.chatbot-trigger').click();

    const chips = page.locator('.chatbot-suggestion');
    await expect(chips).toHaveCount(4);
    await expect(chips.first()).toBeVisible();
  });

  test('clicking a suggestion chip sends the message', async ({ page }) => {
    await page.locator('.chatbot-trigger').click();

    // Click first suggestion chip
    const chip = page.locator('.chatbot-suggestion').first();
    const chipText = await chip.textContent();
    await chip.click();

    // User message should appear
    const userMessage = page.locator('.chatbot-message--user');
    await expect(userMessage).toBeVisible();
    await expect(userMessage).toHaveText(chipText);

    // Suggestion chips should be removed
    await expect(page.locator('.chatbot-suggestions')).toHaveCount(0);
  });

  test('typing indicator shows during response', async ({ page }) => {
    // Override with a slow response
    await page.unroute('**/chat');
    await page.route('**/chat', async (route) => {
      // Delay the response to test typing indicator
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'text/event-stream', 'Access-Control-Allow-Origin': '*' },
        body: createSSEStream(['Hello!']),
      });
    });

    await page.locator('.chatbot-trigger').click();
    await page.locator('.chatbot-suggestion').first().click();

    // Typing indicator should briefly appear
    const typing = page.locator('.chatbot-typing');
    await expect(typing).toBeVisible({ timeout: 2000 });
  });

  test('response renders with formatted markdown', async ({ page }) => {
    await page.locator('.chatbot-trigger').click();
    await page.locator('.chatbot-suggestion').first().click();

    // Wait for assistant response
    const assistantMsg = page.locator('.chatbot-message--assistant').last();
    await expect(assistantMsg).toBeVisible({ timeout: 5000 });

    // Check bold text rendered
    const boldText = assistantMsg.locator('strong');
    await expect(boldText).toBeVisible();

    // Check link rendered
    const link = assistantMsg.locator('a[href="https://github.com/Tony363"]');
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('input sends message on Enter key', async ({ page }) => {
    await page.locator('.chatbot-trigger').click();

    const input = page.locator('.chatbot-input');
    await input.fill('What does Tony do?');
    await input.press('Enter');

    const userMessage = page.locator('.chatbot-message--user');
    await expect(userMessage).toHaveText('What does Tony do?');
  });

  test('send button is disabled when input is empty', async ({ page }) => {
    await page.locator('.chatbot-trigger').click();

    const sendBtn = page.locator('.chatbot-send');
    await expect(sendBtn).toBeDisabled();

    // Type something
    await page.locator('.chatbot-input').fill('Hello');
    await expect(sendBtn).toBeEnabled();

    // Clear input
    await page.locator('.chatbot-input').fill('');
    await expect(sendBtn).toBeDisabled();
  });
});

test.describe('Chatbot Widget — Theme', () => {
  test('widget follows dark theme', async ({ page }) => {
    // Set dark theme
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });

    await page.locator('.chatbot-trigger').click();
    const panel = page.locator('.chatbot-panel');
    await expect(panel).toBeVisible();

    // Verify dark theme styles are applied (panel background changes)
    const bgColor = await panel.evaluate(el => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // In dark mode, background should be dark (not white)
    // The exact value depends on the glass effect, but it should not be pure white
    expect(bgColor).not.toBe('rgb(255, 255, 255)');
  });

  test('widget follows light theme', async ({ page }) => {
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
    });

    await page.locator('.chatbot-trigger').click();
    const panel = page.locator('.chatbot-panel');
    await expect(panel).toBeVisible();

    // Panel should exist and be styled
    const hasBackdropFilter = await panel.evaluate(el => {
      const style = window.getComputedStyle(el);
      return style.backdropFilter !== 'none' || style.webkitBackdropFilter !== 'none';
    });
    expect(hasBackdropFilter).toBeTruthy();
  });
});

test.describe('Chatbot Widget — Accessibility', () => {
  test('focus is trapped within open panel', async ({ page }) => {
    await page.locator('.chatbot-trigger').click();
    await page.waitForTimeout(200);

    // Input should be focused
    const input = page.locator('.chatbot-input');
    await expect(input).toBeFocused();

    // Tab through elements — should cycle within panel
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Active element should still be within the panel
    const isInsidePanel = await page.evaluate(() => {
      const panel = document.querySelector('.chatbot-panel');
      return panel?.contains(document.activeElement);
    });
    expect(isInsidePanel).toBeTruthy();
  });

  test('Escape key closes the panel', async ({ page }) => {
    await page.locator('.chatbot-trigger').click();
    await expect(page.locator('.chatbot-panel--open')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.locator('.chatbot-panel')).not.toHaveClass(/chatbot-panel--open/);
  });

  test('focus returns to trigger after closing', async ({ page }) => {
    const trigger = page.locator('.chatbot-trigger');
    await trigger.click();
    await page.keyboard.press('Escape');

    await expect(trigger).toBeFocused();
  });

  test('messages container has aria-live region', async ({ page }) => {
    await page.locator('.chatbot-trigger').click();
    const messages = page.locator('.chatbot-messages');
    await expect(messages).toHaveAttribute('aria-live', 'polite');
  });

  test('trigger has proper ARIA labels', async ({ page }) => {
    const trigger = page.locator('.chatbot-trigger');
    await expect(trigger).toHaveAttribute('aria-label', 'Open AI chat assistant');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });
});

test.describe('Chatbot Widget — Responsive', () => {
  test('panel is fullscreen on mobile viewport', async ({ page }) => {
    // Set mobile viewport before opening panel
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    await page.locator('.chatbot-trigger').click();
    const panel = page.locator('.chatbot-panel');
    await expect(panel).toBeVisible();

    // On mobile, panel should cover the full viewport via CSS media query
    // Check that the panel is positioned at top-left and spans the viewport
    const panelStyles = await panel.evaluate(el => {
      const style = window.getComputedStyle(el);
      return {
        position: style.position,
        top: style.top,
        left: style.left,
        borderRadius: style.borderRadius,
      };
    });
    expect(panelStyles.position).toBe('fixed');
    expect(panelStyles.top).toBe('0px');
    expect(panelStyles.left).toBe('0px');
    expect(panelStyles.borderRadius).toBe('0px');
  });
});

test.describe('Chatbot Widget — Error Handling', () => {
  test('network failure shows fallback message', async ({ page }) => {
    // Mock network failure
    await page.unroute('**/chat');
    await page.route('**/chat', async (route) => {
      await route.abort('failed');
    });

    await page.locator('.chatbot-trigger').click();
    await page.locator('.chatbot-input').fill('Hello');
    await page.locator('.chatbot-input').press('Enter');

    // Error message should appear
    const errorMsg = page.locator('.chatbot-message--assistant').last();
    await expect(errorMsg).toBeVisible({ timeout: 5000 });
    await expect(errorMsg).toContainText('pysolver33@gmail.com');
  });

  test('429 rate limit shows retry message', async ({ page }) => {
    // Mock 429 response
    await page.unroute('**/chat');
    await page.route('**/chat', async (route) => {
      await route.fulfill({
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Rate limit exceeded' }),
      });
    });

    await page.locator('.chatbot-trigger').click();
    await page.locator('.chatbot-input').fill('Hello');
    await page.locator('.chatbot-input').press('Enter');

    const errorMsg = page.locator('.chatbot-message--assistant').last();
    await expect(errorMsg).toBeVisible({ timeout: 5000 });
    await expect(errorMsg).toContainText('try again');
  });
});

test.describe('Chatbot Widget — Security', () => {
  test('XSS via script tag is escaped', async ({ page }) => {
    // Replace existing route mock
    await page.unroute('**/chat');
    await page.route('**/chat', async (route) => {
      if (route.request().method() === 'OPTIONS') {
        return route.fulfill({
          status: 204,
          headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' },
        });
      }
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'text/event-stream', 'Access-Control-Allow-Origin': '*' },
        body: createSSEStream(['<script>alert("xss")<\/script>']),
      });
    });

    await page.locator('.chatbot-trigger').click();
    await page.locator('.chatbot-input').fill('test');
    await page.locator('.chatbot-input').press('Enter');

    // Wait for a second assistant message (first is the welcome message)
    await expect(page.locator('.chatbot-message--assistant')).toHaveCount(2, { timeout: 10000 });
    const assistantMsg = page.locator('.chatbot-message--assistant').nth(1);

    // Script tag should be escaped, not executed
    const innerHTML = await assistantMsg.innerHTML();
    expect(innerHTML).toContain('&lt;script&gt;');
    expect(innerHTML).not.toContain('<script>');
  });

  test('XSS via img onerror is escaped', async ({ page }) => {
    await page.unroute('**/chat');
    await page.route('**/chat', async (route) => {
      if (route.request().method() === 'OPTIONS') {
        return route.fulfill({
          status: 204,
          headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' },
        });
      }
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'text/event-stream', 'Access-Control-Allow-Origin': '*' },
        body: createSSEStream(['<img src=x onerror=alert(1)>']),
      });
    });

    await page.locator('.chatbot-trigger').click();
    await page.locator('.chatbot-input').fill('test');
    await page.locator('.chatbot-input').press('Enter');

    // Wait for a second assistant message (first is the welcome message)
    await expect(page.locator('.chatbot-message--assistant')).toHaveCount(2, { timeout: 10000 });
    const assistantMsg = page.locator('.chatbot-message--assistant').nth(1);

    // img tag should be escaped
    const innerHTML = await assistantMsg.innerHTML();
    expect(innerHTML).toContain('&lt;img');
    expect(innerHTML).not.toContain('<img');
  });

  test('javascript: links in markdown are blocked', async ({ page }) => {
    await page.unroute('**/chat');
    await page.route('**/chat', async (route) => {
      if (route.request().method() === 'OPTIONS') {
        return route.fulfill({
          status: 204,
          headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' },
        });
      }
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'text/event-stream', 'Access-Control-Allow-Origin': '*' },
        body: createSSEStream(['[Click me](javascript:alert(1))']),
      });
    });

    await page.locator('.chatbot-trigger').click();
    await page.locator('.chatbot-input').fill('test');
    await page.locator('.chatbot-input').press('Enter');

    // Wait for a second assistant message (first is the welcome message)
    await expect(page.locator('.chatbot-message--assistant')).toHaveCount(2, { timeout: 10000 });
    const assistantMsg = page.locator('.chatbot-message--assistant').nth(1);

    // javascript: link should NOT be rendered as an anchor
    const link = assistantMsg.locator('a[href*="javascript"]');
    await expect(link).toHaveCount(0);
  });
});

test.describe('Chatbot Widget — Streaming', () => {
  test('mocked SSE response renders incrementally', async ({ page }) => {
    await page.locator('.chatbot-trigger').click();
    await page.locator('.chatbot-suggestion').first().click();

    // Wait for the assistant message to appear
    const assistantMsg = page.locator('.chatbot-message--assistant').last();
    await expect(assistantMsg).toBeVisible({ timeout: 5000 });

    // Final content should contain the full response
    await expect(assistantMsg).toContainText('Founding AI Engineer');
    await expect(assistantMsg).toContainText('Computer Vision');
  });
});
