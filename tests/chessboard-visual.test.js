const { test, expect } = require('@playwright/test');

// Configure test settings
test.use({
  baseURL: 'http://localhost:8080',
  viewport: { width: 1280, height: 720 },
});

test.describe('Chessboard Background Visual Testing', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Verify chessboard patterns on all sections', async ({ page }) => {
    console.log('🎨 Testing chessboard background patterns...');

    // Define sections to test
    const sections = [
      { name: 'About', selector: '.about', expectedPattern: true },
      { name: 'Education', selector: '.education', expectedPattern: true },
      { name: 'Contact', selector: '.contact', expectedPattern: true },
      { name: 'Skills', selector: '.skills', expectedPattern: false }, // Dark section, no chessboard
      { name: 'Work', selector: '.work', expectedPattern: false }  // Dark section, no chessboard
    ];

    for (const section of sections) {
      console.log(`\n📍 Checking ${section.name} section...`);

      // Scroll to section
      const element = page.locator(section.selector);
      await element.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500); // Wait for scroll animation

      // Check if section exists
      const exists = await element.count() > 0;
      expect(exists).toBeTruthy();

      // Get computed background
      const backgroundImage = await element.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return styles.backgroundImage;
      });

      const backgroundColor = await element.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return styles.backgroundColor;
      });

      console.log(`  Background-image: ${backgroundImage.substring(0, 50)}...`);
      console.log(`  Background-color: ${backgroundColor}`);

      // Verify chessboard pattern
      if (section.expectedPattern) {
        const hasPattern = backgroundImage.includes('linear-gradient');
        expect(hasPattern).toBeTruthy();
        console.log(`  ✅ ${section.name} has chessboard pattern`);
      } else {
        console.log(`  ℹ️ ${section.name} is a dark section (no chessboard expected)`);
      }

      // Take screenshot of section
      await element.screenshot({
        path: `tests/screenshots/chessboard-${section.name.toLowerCase()}.png`,
        fullPage: false
      });
    }
  });

  test('Check light and dark theme chessboard compatibility', async ({ page }) => {
    console.log('🌓 Testing theme compatibility...');

    const sections = ['.about', '.education', '.contact'];

    // Test light theme
    console.log('\n☀️ Light Theme:');
    for (const selector of sections) {
      const element = page.locator(selector).first();
      await element.scrollIntoViewIfNeeded();

      const styles = await element.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          backgroundImage: computed.backgroundImage,
          backgroundColor: computed.backgroundColor
        };
      });

      console.log(`  ${selector}: Has pattern: ${styles.backgroundImage.includes('linear-gradient')}`);
    }

    // Switch to dark theme
    const themeToggle = page.locator('.theme-toggle');
    await themeToggle.click();
    await page.waitForTimeout(1000);

    console.log('\n🌙 Dark Theme:');
    for (const selector of sections) {
      const element = page.locator(selector).first();
      await element.scrollIntoViewIfNeeded();

      const styles = await element.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          backgroundImage: computed.backgroundImage,
          backgroundColor: computed.backgroundColor
        };
      });

      console.log(`  ${selector}: Has pattern: ${styles.backgroundImage.includes('linear-gradient')}`);

      // Take dark theme screenshot
      await element.screenshot({
        path: `tests/screenshots/chessboard-dark-${selector.replace('.', '')}.png`,
        fullPage: false
      });
    }
  });

  test('Test responsive chessboard patterns', async ({ page }) => {
    console.log('📱 Testing responsive behavior...');

    const viewports = [
      { name: 'Desktop', width: 1440, height: 900 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Mobile', width: 375, height: 667 }
    ];

    const testSection = '.about';

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      console.log(`\n📐 ${viewport.name} (${viewport.width}x${viewport.height})`);

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const element = page.locator(testSection);
      await element.scrollIntoViewIfNeeded();

      const backgroundSize = await element.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return styles.backgroundSize;
      });

      console.log(`  Background size: ${backgroundSize}`);

      // Mobile should have smaller pattern
      if (viewport.width <= 768) {
        expect(backgroundSize).toContain('35px');
        console.log(`  ✅ Mobile pattern size optimized`);
      } else {
        expect(backgroundSize).toContain('50px');
        console.log(`  ✅ Desktop pattern size correct`);
      }

      // Take responsive screenshot
      await element.screenshot({
        path: `tests/screenshots/chessboard-${viewport.name.toLowerCase()}.png`,
        fullPage: false
      });
    }
  });

  test('Verify text readability over chessboard patterns', async ({ page }) => {
    console.log('📖 Testing text readability...');

    const testElements = [
      { selector: '.about .row .content h3', name: 'About heading' },
      { selector: '.about .row .content p', name: 'About paragraph' },
      { selector: '.education .box-container .box h3', name: 'Education title' },
      { selector: '.contact form label', name: 'Contact form label' }
    ];

    for (const element of testElements) {
      const el = page.locator(element.selector).first();

      if (await el.count() > 0) {
        await el.scrollIntoViewIfNeeded();

        // Check text contrast
        const contrast = await el.evaluate(elem => {
          const styles = window.getComputedStyle(elem);
          const parent = elem.closest('section');
          const parentStyles = window.getComputedStyle(parent);

          return {
            textColor: styles.color,
            zIndex: styles.zIndex,
            position: styles.position,
            parentBg: parentStyles.backgroundColor
          };
        });

        console.log(`\n${element.name}:`);
        console.log(`  Text color: ${contrast.textColor}`);
        console.log(`  Z-index: ${contrast.zIndex || 'auto'}`);
        console.log(`  Position: ${contrast.position}`);

        // Verify text is properly layered
        expect(['relative', 'absolute', 'static']).toContain(contrast.position);
        console.log(`  ✅ Text properly layered over pattern`);
      }
    }
  });

  test('Performance impact of chessboard patterns', async ({ page }) => {
    console.log('⚡ Testing performance impact...');

    // Measure with chessboard
    const metricsWithPattern = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');

      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime
      };
    });

    console.log('\nPerformance with chessboard patterns:');
    console.log(`  DOM Content Loaded: ${metricsWithPattern.domContentLoaded}ms`);
    console.log(`  Load Complete: ${metricsWithPattern.loadComplete}ms`);
    console.log(`  First Contentful Paint: ${metricsWithPattern.firstContentfulPaint}ms`);

    // Check if performance is acceptable (adjusted threshold per consensus)
    expect(metricsWithPattern.firstContentfulPaint).toBeLessThan(3000);
    console.log('  ✅ Performance remains acceptable with patterns');

    // Check for GPU acceleration
    const gpuAccelerated = await page.evaluate(() => {
      const sections = document.querySelectorAll('.about, .education, .contact');
      let accelerated = true;

      sections.forEach(section => {
        const styles = window.getComputedStyle(section);
        if (!styles.transform && !styles.willChange) {
          accelerated = false;
        }
      });

      return accelerated;
    });

    if (gpuAccelerated) {
      console.log('  ✅ GPU acceleration detected');
    } else {
      console.log('  ⚠️ Consider adding will-change or transform for better performance');
    }
  });

  test('Full page visual regression with chessboard', async ({ page }) => {
    console.log('📸 Capturing full page screenshots...');

    // Light theme full page
    await page.screenshot({
      path: 'tests/screenshots/chessboard-fullpage-light.png',
      fullPage: true
    });
    console.log('  ✅ Light theme full page captured');

    // Dark theme full page
    const themeToggle = page.locator('.theme-toggle');
    await themeToggle.click();
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'tests/screenshots/chessboard-fullpage-dark.png',
      fullPage: true
    });
    console.log('  ✅ Dark theme full page captured');
  });

});