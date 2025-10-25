const { test, expect } = require('@playwright/test');

test.use({
  baseURL: 'http://localhost:8080',
  viewport: { width: 1280, height: 720 },
});

test.describe('Hero Section Chessboard Fix Verification', () => {

  test('Hero section should NOT have visible chessboard pattern', async ({ page }) => {
    console.log('🔍 Verifying hero section chessboard fix...');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check the .home section
    const homeSection = page.locator('.home');
    await expect(homeSection).toBeVisible();

    // Get the ::before pseudo-element styles
    const pseudoElementOpacity = await homeSection.evaluate((el) => {
      const before = window.getComputedStyle(el, '::before');
      return {
        opacity: before.opacity,
        backgroundImage: before.backgroundImage,
        animation: before.animation,
        mixBlendMode: before.mixBlendMode
      };
    });

    console.log('Pseudo-element properties:', pseudoElementOpacity);

    // Verify opacity is 0 (pattern is hidden)
    expect(parseFloat(pseudoElementOpacity.opacity)).toBe(0);
    console.log('✅ Opacity is 0 - pattern is hidden');

    // Verify animation is removed
    expect(pseudoElementOpacity.animation).toMatch(/none|initial/);
    console.log('✅ Animation is disabled');

    // Verify mix-blend-mode is removed
    expect(pseudoElementOpacity.mixBlendMode).toBe('normal');
    console.log('✅ Mix-blend-mode is normal');

    // Check that the hero gradient background is still visible
    const heroBackground = await homeSection.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.backgroundImage;
    });

    expect(heroBackground).toContain('radial-gradient');
    console.log('✅ Hero gradient background is preserved');

    // Test dark theme
    const themeToggle = page.locator('.theme-toggle');
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      await page.waitForTimeout(500);

      const darkThemeOpacity = await homeSection.evaluate((el) => {
        const before = window.getComputedStyle(el, '::before');
        return before.opacity;
      });

      expect(parseFloat(darkThemeOpacity)).toBe(0);
      console.log('✅ Pattern remains hidden in dark theme');
    }

    // Check other sections still have chessboard patterns
    const aboutSection = page.locator('.about');
    if (await aboutSection.count() > 0) {
      const aboutBackground = await aboutSection.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return styles.backgroundImage;
      });

      expect(aboutBackground).toContain('linear-gradient');
      console.log('✅ About section retains its chessboard pattern');
    }

    console.log('\n🎉 Hero section chessboard fix verified successfully!');
  });

});