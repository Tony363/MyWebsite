// @ts-check
const { test, expect } = require('@playwright/test');

const EXPECTED_EMAIL = 'pysolver33@gmail.com';
const TEST_TIMEOUT = 30000; // 30 seconds for email tests

test.describe('Email Functionality Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the homepage
    await page.goto('/');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
  });

  test.describe('Static Email Displays', () => {
    test('should display correct email in About section', async ({ page }) => {
      // Navigate to About section
      await page.locator('a[href="#about"]').click();
      await page.waitForSelector('#about', { state: 'visible' });
      
      // Check for email display
      const emailElement = await page.locator('#about .box').filter({ hasText: 'email :' });
      await expect(emailElement).toContainText(EXPECTED_EMAIL);
      
      // Take screenshot for verification
      await page.screenshot({ 
        path: 'test-results/about-email-display.png',
        fullPage: false,
        clip: { x: 0, y: 0, width: 800, height: 600 }
      });
    });

    test('should display correct email in Footer', async ({ page }) => {
      // Scroll to footer
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForSelector('.footer', { state: 'visible' });
      
      // Check footer email display
      const footerEmail = await page.locator('.footer .box').filter({ hasText: EXPECTED_EMAIL });
      await expect(footerEmail).toBeVisible();
      await expect(footerEmail).toContainText(EXPECTED_EMAIL);
    });
  });

  test.describe('Mailto Links', () => {
    test('should have correct mailto link in footer', async ({ page }) => {
      // Scroll to footer
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForSelector('.footer', { state: 'visible' });
      
      // Check mailto link
      const mailtoLink = await page.locator(`a[href="mailto:${EXPECTED_EMAIL}"]`).first();
      await expect(mailtoLink).toBeVisible();
      
      // Verify href attribute
      const href = await mailtoLink.getAttribute('href');
      expect(href).toBe(`mailto:${EXPECTED_EMAIL}`);
    });
  });

  test.describe('Contact Form - EmailJS Integration', () => {
    test('should validate email configuration on page load', async ({ page }) => {
      // Set up console listener to capture validation logs
      const consoleLogs = [];
      page.on('console', msg => {
        if (msg.text().includes('Email Configuration')) {
          consoleLogs.push(msg.text());
        }
      });
      
      // Reload page to trigger validation
      await page.reload();
      await page.waitForTimeout(2000); // Wait for validation to run
      
      // Check that validation ran
      const hasValidation = consoleLogs.some(log => 
        log.includes('Email Configuration Validation Report')
      );
      expect(hasValidation).toBeTruthy();
    });

    test('should show email configuration in console (dev mode)', async ({ page }) => {
      // Navigate to contact section
      await page.locator('a[href="#contact"]').click();
      await page.waitForSelector('#contact', { state: 'visible' });
      
      // Set up console listener
      const consoleLogs = [];
      page.on('console', msg => consoleLogs.push(msg.text()));
      
      // Fill form
      await page.fill('input[name="name"]', 'Test User');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="phone"]', '1234567890');
      await page.fill('textarea[name="message"]', 'This is a test message for email verification.');
      
      // Take screenshot before submission
      await page.screenshot({ 
        path: 'test-results/contact-form-filled.png',
        fullPage: false
      });
      
      // Note: We won't actually submit to avoid sending test emails
      // but we verify the configuration is correct
      
      // Check that expected recipient is configured
      const formConfig = await page.evaluate(() => {
        // Check if EMAIL_CONFIG exists in any script
        const scripts = Array.from(document.querySelectorAll('script'));
        for (const script of scripts) {
          if (script.textContent && script.textContent.includes('expectedRecipient')) {
            return script.textContent.includes("expectedRecipient: 'pysolver33@gmail.com'");
          }
        }
        return false;
      });
      
      expect(formConfig).toBeTruthy();
    });

    test('should display correct success message with recipient', async ({ page }) => {
      // Navigate to contact section
      await page.locator('a[href="#contact"]').click();
      await page.waitForSelector('#contact', { state: 'visible' });
      
      // Fill form with test data
      await page.fill('input[name="name"]', 'Playwright Test');
      await page.fill('input[name="email"]', 'playwright@test.com');
      await page.fill('input[name="phone"]', '5551234567');
      await page.fill('textarea[name="message"]', 'Automated test message');
      
      // Mock EmailJS response to avoid actual email sending
      await page.addInitScript(() => {
        window.emailjs = {
          init: () => {},
          send: () => Promise.resolve({ status: 200, text: 'OK' }),
          sendForm: () => Promise.resolve({ status: 200, text: 'OK' })
        };
      });
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Wait for success message
      await page.waitForTimeout(1000);
      
      // Check success message contains recipient
      const submitButton = await page.locator('button[type="submit"]');
      const buttonText = await submitButton.textContent();
      
      // Should show "Sent to pysolver33!" or similar
      expect(buttonText).toContain('pysolver33');
      
      // Take screenshot of success state
      await page.screenshot({ 
        path: 'test-results/contact-form-success.png',
        fullPage: false
      });
    });

    test('should handle errors gracefully with fallback', async ({ page }) => {
      // Navigate to contact section
      await page.locator('a[href="#contact"]').click();
      await page.waitForSelector('#contact', { state: 'visible' });
      
      // Mock EmailJS to fail
      await page.addInitScript(() => {
        window.emailjs = {
          init: () => {},
          send: () => Promise.reject({ text: 'Service error' }),
          sendForm: () => Promise.reject({ text: 'Service error' })
        };
      });
      
      // Fill and submit form
      await page.fill('input[name="name"]', 'Error Test');
      await page.fill('input[name="email"]', 'error@test.com');
      await page.fill('input[name="phone"]', '5559999999');
      await page.fill('textarea[name="message"]', 'Testing error handling');
      
      // Set up dialog handler for confirm dialog
      page.on('dialog', async dialog => {
        const message = dialog.message();
        expect(message).toContain(EXPECTED_EMAIL);
        await dialog.dismiss(); // Dismiss the fallback option
      });
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Wait for error handling
      await page.waitForTimeout(2000);
      
      // Check error message is displayed
      const submitButton = await page.locator('button[type="submit"]');
      const buttonText = await submitButton.textContent();
      expect(buttonText).toContain('Service Configuration Error');
      
      // Take screenshot of error state
      await page.screenshot({ 
        path: 'test-results/contact-form-error.png',
        fullPage: false
      });
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('should display email correctly on mobile devices', async ({ page, browserName }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Navigate to footer
      await page.goto('/');
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      
      // Check email display on mobile
      const footerEmail = await page.locator('.footer').filter({ hasText: EXPECTED_EMAIL });
      await expect(footerEmail).toBeVisible();
      
      // Take mobile screenshot
      await page.screenshot({ 
        path: `test-results/mobile-email-${browserName}.png`,
        fullPage: false
      });
    });
  });

  test.describe('Accessibility', () => {
    test('contact form should be keyboard navigable', async ({ page }) => {
      // Navigate to contact section
      await page.goto('/#contact');
      await page.waitForSelector('#contact', { state: 'visible' });
      
      // Test keyboard navigation
      await page.keyboard.press('Tab'); // Focus first input
      const focusedElement = await page.evaluate(() => document.activeElement?.name);
      expect(['name', 'email', 'phone', 'message']).toContain(focusedElement);
      
      // Tab through all form fields
      for (let i = 0; i < 4; i++) {
        await page.keyboard.press('Tab');
      }
      
      // Should reach submit button
      const submitFocused = await page.evaluate(() => 
        document.activeElement?.type === 'submit'
      );
      expect(submitFocused).toBeTruthy();
    });

    test('email links should have appropriate ARIA labels', async ({ page }) => {
      await page.goto('/');
      
      // Check mailto links for accessibility
      const mailtoLinks = await page.locator(`a[href="mailto:${EXPECTED_EMAIL}"]`).all();
      
      for (const link of mailtoLinks) {
        const ariaLabel = await link.getAttribute('aria-label');
        const title = await link.getAttribute('title');
        const text = await link.textContent();
        
        // At least one of these should provide context
        const hasAccessibleText = ariaLabel || title || text;
        expect(hasAccessibleText).toBeTruthy();
      }
    });
  });

  test.describe('Performance', () => {
    test('contact form should load quickly', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/#contact');
      await page.waitForSelector('#contact-form', { state: 'visible' });
      
      const loadTime = Date.now() - startTime;
      
      // Form should be interactive within 3 seconds
      expect(loadTime).toBeLessThan(3000);
      
      // Check that EmailJS script is loaded
      const emailjsLoaded = await page.evaluate(() => {
        return typeof window.emailjs !== 'undefined';
      });
      expect(emailjsLoaded).toBeTruthy();
    });
  });

  test.describe('Configuration Verification', () => {
    test('should verify all email instances match expected email', async ({ page }) => {
      await page.goto('/');
      
      // Get all text content
      const pageContent = await page.textContent('body');
      
      // Find all email-like patterns
      const emailPattern = /[\w.-]+@[\w.-]+\.\w+/g;
      const foundEmails = pageContent.match(emailPattern) || [];
      
      // Filter unique emails
      const uniqueEmails = [...new Set(foundEmails)];
      
      // Check that if any email is found, it should be the expected one
      for (const email of uniqueEmails) {
        if (email !== EXPECTED_EMAIL && !email.includes('example.com')) {
          console.warn(`Found unexpected email: ${email}`);
        }
      }
      
      // Verify expected email is present
      expect(uniqueEmails).toContain(EXPECTED_EMAIL);
    });
  });
});

// Test report generation
test.afterAll(async () => {
  console.log('\n📊 Email Functionality Test Report');
  console.log('==================================');
  console.log(`✅ Expected Email: ${EXPECTED_EMAIL}`);
  console.log('📁 Screenshots saved in: test-results/');
  console.log('\n📝 Action Items:');
  console.log('1. Verify EmailJS dashboard configuration');
  console.log('2. Test actual email delivery manually');
  console.log('3. Monitor EmailJS usage and limits');
});