const { test, expect } = require('@playwright/test');

// Configure test settings
test.use({
  baseURL: 'http://localhost:8080',
  viewport: { width: 1280, height: 720 },
});

test.describe('Portfolio Website UX Comprehensive Testing', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    // Wait for initial content to load
    await page.waitForLoadState('networkidle');
  });

  test('Core Web Vitals and Performance', async ({ page }) => {
    console.log('🔍 Testing Core Web Vitals...');

    // Measure performance metrics
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');

      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime,
        largestContentfulPaint: 0 // Will be updated by PerformanceObserver
      };
    });

    // Check LCP
    const lcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.startTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // Fallback after 5 seconds
        setTimeout(() => resolve(0), 5000);
      });
    });

    console.log('Performance Metrics:', { ...metrics, largestContentfulPaint: lcp });

    // Check if hero image loads properly (no lazy loading)
    const heroImage = page.locator('.home .image img');
    await expect(heroImage).toBeVisible();
    const heroImageLazy = await heroImage.getAttribute('loading');
    expect(heroImageLazy).toBeNull(); // Should not have lazy loading
  });

  test('Navigation and Header Elements', async ({ page }) => {
    console.log('🔍 Testing Navigation...');

    // Check if header is visible
    await expect(page.locator('header')).toBeVisible();

    // Check Schedule Call CTA
    const scheduleCTA = page.locator('.schedule-cta');
    await expect(scheduleCTA).toBeVisible();

    // Test Schedule Call CTA click
    await scheduleCTA.click();
    // Wait to see if Calendly loads
    await page.waitForTimeout(2000);

    // Check theme toggle
    const themeToggle = page.locator('.theme-toggle');
    await expect(themeToggle).toBeVisible();

    // Test theme switching
    const initialTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    await themeToggle.click();
    await page.waitForTimeout(500);
    const newTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(newTheme).not.toBe(initialTheme);
  });

  test('Mobile Menu Functionality', async ({ page }) => {
    console.log('🔍 Testing Mobile Menu...');

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    const menuButton = page.locator('#menu');
    await expect(menuButton).toBeVisible();

    // Open menu
    await menuButton.click();
    await page.waitForTimeout(300);

    // Check if navbar is visible
    const navbar = page.locator('.navbar');
    await expect(navbar).toHaveClass(/nav-toggle/);

    // Check body scroll lock
    const bodyOverflow = await page.evaluate(() => {
      return window.getComputedStyle(document.body).overflow;
    });
    expect(bodyOverflow).toBe('hidden');

    // Test Escape key closes menu
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    const menuExpanded = await menuButton.getAttribute('aria-expanded');
    expect(menuExpanded).toBe('false');
  });

  test('Project Cards on Touch Devices', async ({ page }) => {
    console.log('🔍 Testing Project Cards...');

    // Simulate touch device
    await page.setViewportSize({ width: 768, height: 1024 });

    // Check if project section exists
    const projectSection = page.locator('.work');
    await projectSection.scrollIntoViewIfNeeded();

    // Get all project boxes
    const projectBoxes = page.locator('.work .box');
    const count = await projectBoxes.count();

    if (count > 0) {
      // Test first project card
      const firstCard = projectBoxes.first();
      await firstCard.scrollIntoViewIfNeeded();

      // Check if content is visible or accessible on mobile
      const content = firstCard.locator('.content');
      const isVisible = await content.isVisible();

      // On mobile, content should be visible or easily accessible
      expect(isVisible).toBeTruthy();

      // Check for proper touch interaction
      const tagElement = firstCard.locator('.tag');
      if (await tagElement.count() > 0) {
        await tagElement.click();
        await page.waitForTimeout(300);

        // Check if expanded class is applied
        const hasExpanded = await firstCard.evaluate(el => el.classList.contains('expanded'));
        console.log('Card expanded on click:', hasExpanded);
      }
    }
  });

  test('Contact Form and Email Link', async ({ page }) => {
    console.log('🔍 Testing Contact Elements...');

    // Scroll to about section
    await page.locator('#about').scrollIntoViewIfNeeded();

    // Check if email is clickable
    const emailLink = page.locator('a[href^="mailto:"]');
    await expect(emailLink).toBeVisible();
    const emailHref = await emailLink.getAttribute('href');
    expect(emailHref).toBe('mailto:pysolver33@gmail.com');

    // Scroll to contact form
    await page.locator('#contact').scrollIntoViewIfNeeded();

    // Check form elements
    const nameInput = page.locator('#name-input');
    const emailInput = page.locator('#email-input');
    const messageInput = page.locator('#message-input');

    await expect(nameInput).toBeVisible();
    await expect(emailInput).toBeVisible();
    await expect(messageInput).toBeVisible();

    // Test form labels
    const nameLabel = page.locator('label[for="name-input"]');
    await expect(nameLabel).toBeVisible();
  });

  test('Animations and Performance Optimizations', async ({ page }) => {
    console.log('🔍 Testing Animations and CSS...');

    // Check if universal transitions are removed
    const hasUniversalTransition = await page.evaluate(() => {
      const styles = window.getComputedStyle(document.body);
      const allElements = document.querySelectorAll('*');
      let universalTransition = false;

      // Check a sample of elements for transition
      for (let i = 0; i < Math.min(10, allElements.length); i++) {
        const el = allElements[i];
        const transition = window.getComputedStyle(el).transition;
        // Check if non-interactive elements have transitions
        if (transition && transition !== 'none' && transition !== 'initial' &&
            !el.matches('a, button, .btn, input, textarea, select')) {
          universalTransition = true;
          break;
        }
      }

      return universalTransition;
    });

    expect(hasUniversalTransition).toBeFalsy();

    // Check if particles.js is deferred
    const particlesScript = page.locator('script[src*="particles"]');
    if (await particlesScript.count() > 0) {
      const hasDefer = await particlesScript.getAttribute('defer');
      expect(hasDefer).not.toBeNull();
    }

    // Check text-transform capitalize is not global
    const hasGlobalCapitalize = await page.evaluate(() => {
      const bodyStyle = window.getComputedStyle(document.body);
      const pStyle = document.querySelector('p') ? window.getComputedStyle(document.querySelector('p')) : null;

      return bodyStyle.textTransform === 'capitalize' ||
             (pStyle && pStyle.textTransform === 'capitalize');
    });

    expect(hasGlobalCapitalize).toBeFalsy();
  });

  test('Accessibility - Keyboard Navigation', async ({ page }) => {
    console.log('🔍 Testing Keyboard Navigation...');

    // Test Tab navigation through interactive elements
    await page.keyboard.press('Tab');
    let focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    console.log('First focused element:', focusedElement);

    // Tab through first 5 interactive elements
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        return {
          tag: el?.tagName,
          class: el?.className,
          text: el?.textContent?.substring(0, 20)
        };
      });
      console.log(`Tab ${i+1}:`, focusedElement);
    }

    // Check skip navigation link
    await page.reload();
    await page.keyboard.press('Tab');
    const skipNav = page.locator('.skip-nav');
    const isSkipNavFocused = await skipNav.evaluate(el => el === document.activeElement);

    if (isSkipNavFocused) {
      console.log('✅ Skip navigation link is accessible');
    }
  });

  test('Responsive Design Testing', async ({ page }) => {
    console.log('🔍 Testing Responsive Design...');

    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1440, height: 900 }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      console.log(`Testing ${viewport.name} (${viewport.width}x${viewport.height})`);

      // Check if content adjusts properly
      const hero = page.locator('.home');
      await expect(hero).toBeVisible();

      // Check if navigation adjusts
      const navbar = page.locator('.navbar');
      const menuButton = page.locator('#menu');

      if (viewport.width <= 768) {
        await expect(menuButton).toBeVisible();
        console.log(`  ✅ Mobile menu visible on ${viewport.name}`);
      } else {
        await expect(navbar).toBeVisible();
        console.log(`  ✅ Desktop nav visible on ${viewport.name}`);
      }

      // Check text readability
      const bodyFontSize = await page.evaluate(() => {
        return window.getComputedStyle(document.body).fontSize;
      });
      console.log(`  Font size on ${viewport.name}: ${bodyFontSize}`);
    }
  });

  test('Visual Regression Check', async ({ page }) => {
    console.log('🔍 Performing Visual Checks...');

    // Take screenshots of key sections
    const sections = ['home', 'about', 'skills', 'work', 'contact'];

    for (const section of sections) {
      const element = page.locator(`#${section}`);
      if (await element.count() > 0) {
        await element.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500); // Wait for animations

        // Check for visual issues
        const issues = await element.evaluate((el) => {
          const rect = el.getBoundingClientRect();
          const styles = window.getComputedStyle(el);
          const problems = [];

          // Check for overflow
          if (el.scrollWidth > el.clientWidth) {
            problems.push('Horizontal overflow detected');
          }

          // Check for text contrast (simplified)
          const bgColor = styles.backgroundColor;
          const color = styles.color;
          if (bgColor === color) {
            problems.push('Potential contrast issue');
          }

          // Check z-index issues
          const zIndex = styles.zIndex;
          if (zIndex && parseInt(zIndex) < 0) {
            problems.push('Negative z-index detected');
          }

          return problems;
        });

        if (issues.length > 0) {
          console.log(`  ⚠️ Issues in ${section}:`, issues);
        } else {
          console.log(`  ✅ ${section} section looks good`);
        }
      }
    }
  });

  test('Loading Time and Resource Check', async ({ page }) => {
    console.log('🔍 Checking Loading Performance...');

    // Reload page and measure
    const startTime = Date.now();
    await page.goto('/', { waitUntil: 'networkidle' });
    const loadTime = Date.now() - startTime;

    console.log(`Page load time: ${loadTime}ms`);

    // Check for failed resources
    const failedResources = [];
    page.on('response', response => {
      if (response.status() >= 400) {
        failedResources.push({
          url: response.url(),
          status: response.status()
        });
      }
    });

    // Navigate and check
    await page.reload();
    await page.waitForTimeout(3000);

    if (failedResources.length > 0) {
      console.log('⚠️ Failed resources:', failedResources);
    } else {
      console.log('✅ All resources loaded successfully');
    }

    // Check console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.reload();
    await page.waitForTimeout(2000);

    if (consoleErrors.length > 0) {
      console.log('⚠️ Console errors:', consoleErrors);
    } else {
      console.log('✅ No console errors');
    }
  });
});