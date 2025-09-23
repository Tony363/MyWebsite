const { test, expect } = require('@playwright/test');

test.describe('Contact Form Screenshots', () => {
  const baseURL = 'http://localhost:8080/index.html#contact';

  test('Capture contact form at all viewport sizes', async ({ page }) => {
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');
    
    // Ensure we're at the contact section
    await page.locator('#contact').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500); // Wait for scroll
    
    // Desktop screenshot
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.screenshot({ 
      path: 'tests/screenshots/contact-form-desktop-1200px.png',
      clip: { x: 0, y: 0, width: 1200, height: 800 }
    });
    
    // Tablet screenshot  
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(200);
    await page.locator('#contact').scrollIntoViewIfNeeded();
    await page.screenshot({ 
      path: 'tests/screenshots/contact-form-tablet-768px.png',
      clip: { x: 0, y: 0, width: 768, height: 800 }
    });
    
    // Mobile screenshot
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(200);
    await page.locator('#contact').scrollIntoViewIfNeeded();
    await page.screenshot({ 
      path: 'tests/screenshots/contact-form-mobile-375px.png',
      clip: { x: 0, y: 0, width: 375, height: 667 }
    });
  });

  test('Contact form with filled fields', async ({ page }) => {
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');
    await page.locator('#contact').scrollIntoViewIfNeeded();
    await page.setViewportSize({ width: 1200, height: 800 });
    
    // Fill the form
    await page.locator('#name-input').fill('John Doe');
    await page.locator('#email-input').fill('john.doe@example.com');
    await page.locator('#phone-input').fill('+1 555-123-4567');
    await page.locator('#message-input').fill('This is a test message for the contact form validation and styling.');
    
    // Screenshot with filled form
    await page.screenshot({ 
      path: 'tests/screenshots/contact-form-filled.png',
      clip: { x: 0, y: 0, width: 1200, height: 800 }
    });
    
    // Test focus state
    await page.locator('#email-input').focus();
    await page.screenshot({ 
      path: 'tests/screenshots/contact-form-focus-state.png',
      clip: { x: 0, y: 0, width: 1200, height: 800 }
    });
  });
});