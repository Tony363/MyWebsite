const { test, expect } = require('@playwright/test');

test.use({
  baseURL: 'http://localhost:8080',
  viewport: { width: 1280, height: 720 },
});

test.describe('Visual Verification - Hero Section Fix', () => {

  test('Capture hero section in both themes', async ({ page }) => {
    console.log('📸 Capturing hero section after fix...');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Capture light theme hero
    const heroSection = page.locator('.home');
    await heroSection.screenshot({
      path: 'tests/screenshots/hero-fixed-light.png',
    });
    console.log('✅ Light theme hero captured');

    // Check computed styles in light theme
    const lightThemeStyles = await heroSection.evaluate((el) => {
      const before = window.getComputedStyle(el, '::before');
      return {
        opacity: before.opacity,
        hasAnimation: before.animation !== 'none 0s ease 0s 1 normal none running',
        backgroundImage: el.style.backgroundImage || window.getComputedStyle(el).backgroundImage
      };
    });

    console.log('Light theme analysis:');
    console.log(`  - Pattern opacity: ${lightThemeStyles.opacity}`);
    console.log(`  - Animation active: ${lightThemeStyles.hasAnimation}`);
    console.log(`  - Has gradient: ${lightThemeStyles.backgroundImage.includes('radial-gradient')}`);

    // Switch to dark theme
    const themeToggle = page.locator('.theme-toggle');
    await themeToggle.click();
    await page.waitForTimeout(500);

    // Capture dark theme hero
    await heroSection.screenshot({
      path: 'tests/screenshots/hero-fixed-dark.png',
    });
    console.log('✅ Dark theme hero captured');

    // Check computed styles in dark theme
    const darkThemeStyles = await heroSection.evaluate((el) => {
      const before = window.getComputedStyle(el, '::before');
      return {
        opacity: before.opacity,
        hasAnimation: before.animation !== 'none 0s ease 0s 1 normal none running',
        backgroundImage: el.style.backgroundImage || window.getComputedStyle(el).backgroundImage
      };
    });

    console.log('Dark theme analysis:');
    console.log(`  - Pattern opacity: ${darkThemeStyles.opacity}`);
    console.log(`  - Animation active: ${darkThemeStyles.hasAnimation}`);
    console.log(`  - Has gradient: ${darkThemeStyles.backgroundImage.includes('radial-gradient')}`);

    // Verify the fix is working
    expect(parseFloat(lightThemeStyles.opacity)).toBe(0);
    expect(parseFloat(darkThemeStyles.opacity)).toBe(0);
    expect(lightThemeStyles.hasAnimation).toBe(false);
    expect(darkThemeStyles.hasAnimation).toBe(false);

    console.log('\n🎉 Hero section fix verified visually in both themes!');
  });

  test('Verify other sections retain chessboard patterns', async ({ page }) => {
    console.log('🔍 Verifying other sections still have patterns...');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const sections = ['about', 'education', 'contact'];

    for (const sectionName of sections) {
      const section = page.locator(`.${sectionName}`);

      if (await section.count() > 0) {
        await section.scrollIntoViewIfNeeded();

        const hasPattern = await section.evaluate((el) => {
          const styles = window.getComputedStyle(el);
          return styles.backgroundImage.includes('linear-gradient');
        });

        await section.screenshot({
          path: `tests/screenshots/section-${sectionName}-pattern.png`,
        });

        expect(hasPattern).toBe(true);
        console.log(`✅ ${sectionName.charAt(0).toUpperCase() + sectionName.slice(1)} section retains chessboard pattern`);
      }
    }

    console.log('\n✅ All other sections correctly retain their chessboard patterns!');
  });

});