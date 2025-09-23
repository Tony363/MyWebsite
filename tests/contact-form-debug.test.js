const { test, expect } = require('@playwright/test');

test.describe('Contact Form Debug Analysis', () => {
  const baseURL = 'http://localhost:8080/index.html#contact';

  test.beforeEach(async ({ page }) => {
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');
    await page.locator('#contact').scrollIntoViewIfNeeded();
  });

  test('CSS Investigation - What styles are actually applied', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    
    // Take full page screenshot
    await page.screenshot({ 
      path: 'tests/screenshots/contact-debug-full-page.png',
      fullPage: true
    });

    // Check actual computed styles
    const content = page.locator('.contact .container .content');
    
    const computedStyles = await content.evaluate(el => {
      const styles = getComputedStyle(el);
      return {
        display: styles.display,
        gridTemplateColumns: styles.gridTemplateColumns,
        gap: styles.gap,
        alignItems: styles.alignItems,
        padding: styles.padding,
        width: styles.width,
        maxWidth: styles.maxWidth
      };
    });
    
    console.log('Content computed styles:', computedStyles);
    
    // Check container styles
    const container = page.locator('.contact .container');
    const containerStyles = await container.evaluate(el => {
      const styles = getComputedStyle(el);
      return {
        width: styles.width,
        maxWidth: styles.maxWidth,
        margin: styles.margin,
        padding: styles.padding,
        display: styles.display
      };
    });
    
    console.log('Container computed styles:', containerStyles);
    
    // Check form field styles
    const nameField = page.locator('#name-input');
    const fieldStyles = await nameField.evaluate(el => {
      const styles = getComputedStyle(el);
      return {
        width: styles.width,
        padding: styles.padding,
        borderColor: styles.borderColor,
        borderRadius: styles.borderRadius,
        fontSize: styles.fontSize
      };
    });
    
    console.log('Form field styles:', fieldStyles);
    
    // Check what CSS files are loaded
    const loadedCSS = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
      return links.map(link => link.href);
    });
    
    console.log('Loaded CSS files:', loadedCSS);
    
    // Check if form-enhancements.css styles are present
    const hasEnhancedStyles = await page.evaluate(() => {
      const testEl = document.createElement('div');
      testEl.className = 'form-field';
      document.body.appendChild(testEl);
      
      const styles = getComputedStyle(testEl);
      const hasEnhancedPosition = styles.position === 'relative';
      const hasEnhancedMargin = styles.marginBottom === '30px';
      
      document.body.removeChild(testEl);
      return { hasEnhancedPosition, hasEnhancedMargin };
    });
    
    console.log('Form enhancement styles check:', hasEnhancedStyles);
  });

  test('Mobile responsiveness actual behavior', async ({ page }) => {
    // Start at desktop
    await page.setViewportSize({ width: 1200, height: 800 });
    
    const content = page.locator('.contact .container .content');
    const desktopDisplay = await content.evaluate(el => getComputedStyle(el).display);
    console.log('Desktop display:', desktopDisplay);
    
    // Move to tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(100);
    
    const tabletDisplay = await content.evaluate(el => {
      const styles = getComputedStyle(el);
      return {
        display: styles.display,
        gridTemplateColumns: styles.gridTemplateColumns,
        gap: styles.gap
      };
    });
    console.log('Tablet styles:', tabletDisplay);
    
    // Move to mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(100);
    
    const mobileDisplay = await content.evaluate(el => {
      const styles = getComputedStyle(el);
      return {
        display: styles.display,
        gridTemplateColumns: styles.gridTemplateColumns,
        gap: styles.gap
      };
    });
    console.log('Mobile styles:', mobileDisplay);
    
    // Check image visibility at each breakpoint
    const imageBox = page.locator('.contact .content .image-box');
    const imageDisplay = await imageBox.evaluate(el => getComputedStyle(el).display);
    console.log('Image display on mobile:', imageDisplay);
    
    // Take screenshots at each size
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.screenshot({ path: 'tests/screenshots/debug-desktop.png' });
    
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.screenshot({ path: 'tests/screenshots/debug-tablet.png' });
    
    await page.setViewportSize({ width: 375, height: 667 });
    await page.screenshot({ path: 'tests/screenshots/debug-mobile.png' });
  });

  test('Form field focus and validation behavior', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    
    const nameField = page.locator('#name-input');
    const nameLabel = page.locator('label[for="name-input"]');
    
    // Check initial state
    const initialState = await nameLabel.evaluate(el => {
      const styles = getComputedStyle(el);
      return {
        top: styles.top,
        fontSize: styles.fontSize,
        color: styles.color,
        position: styles.position
      };
    });
    console.log('Initial label state:', initialState);
    
    // Focus and type
    await nameField.click();
    await nameField.fill('Test Name');
    
    // Check focused/filled state
    const filledState = await nameLabel.evaluate(el => {
      const styles = getComputedStyle(el);
      return {
        top: styles.top,
        fontSize: styles.fontSize,
        color: styles.color,
        position: styles.position
      };
    });
    console.log('Filled label state:', filledState);
    
    // Check field focus styles
    const fieldFocusStyles = await nameField.evaluate(el => {
      const styles = getComputedStyle(el);
      return {
        borderColor: styles.borderColor,
        boxShadow: styles.boxShadow,
        backgroundColor: styles.backgroundColor
      };
    });
    console.log('Field focus styles:', fieldFocusStyles);
    
    // Test email validation
    const emailField = page.locator('#email-input');
    await emailField.fill('invalid-email');
    
    const emailValidation = await emailField.evaluate(el => ({
      validity: el.validity.valid,
      value: el.value
    }));
    console.log('Email validation:', emailValidation);
  });
});