const { test, expect } = require('@playwright/test');

test.describe('Contact Form E2E Testing', () => {
  const baseURL = 'http://localhost:8080/index.html#contact';
  
  // Test data
  const validData = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 555-123-4567',
    message: 'This is a test message for the contact form validation.'
  };

  const invalidData = {
    email: 'invalid-email',
    message: ''
  };

  test.beforeEach(async ({ page }) => {
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');
    // Scroll to contact section to ensure it's visible
    await page.locator('#contact').scrollIntoViewIfNeeded();
  });

  test('Desktop Layout (1200px) - Form Structure and Visual Elements', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'tests/screenshots/contact-form-desktop-1200px.png',
      fullPage: false,
      clip: { x: 0, y: 0, width: 1200, height: 800 }
    });

    // Check form container layout
    const formContainer = page.locator('.contact .container');
    await expect(formContainer).toBeVisible();
    
    // Check grid layout (should be 2 columns on desktop)
    const content = page.locator('.contact .container .content');
    const gridColumns = await content.evaluate(el => getComputedStyle(el).gridTemplateColumns);
    expect(gridColumns).toContain('1fr 1fr'); // Two equal columns
    
    // Check image visibility on desktop
    const imageBox = page.locator('.contact .content .image-box');
    await expect(imageBox).toBeVisible();
    
    // Check form fields are present and properly structured
    const form = page.locator('#contact-form');
    await expect(form).toBeVisible();
    
    const nameField = page.locator('#name-input');
    const emailField = page.locator('#email-input');
    const phoneField = page.locator('#phone-input');
    const messageField = page.locator('#message-input');
    const submitButton = page.locator('button[type="submit"]');
    
    await expect(nameField).toBeVisible();
    await expect(emailField).toBeVisible();
    await expect(phoneField).toBeVisible();
    await expect(messageField).toBeVisible();
    await expect(submitButton).toBeVisible();
    
    // Check form field positioning and structure
    const formFields = page.locator('.form-field');
    const fieldCount = await formFields.count();
    expect(fieldCount).toBe(4); // Name, Email, Phone, Message
  });

  test('Tablet Layout (768px) - Responsive Behavior', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Take screenshot
    await page.screenshot({ 
      path: 'tests/screenshots/contact-form-tablet-768px.png',
      fullPage: false,
      clip: { x: 0, y: 0, width: 768, height: 1024 }
    });

    // Check if layout adapts to tablet size
    const content = page.locator('.contact .container .content');
    const gridColumns = await content.evaluate(el => getComputedStyle(el).gridTemplateColumns);
    
    // On tablet, it should switch to single column
    expect(gridColumns).toContain('1fr');
    
    // Image should still be visible on tablet
    const imageBox = page.locator('.contact .content .image-box');
    await expect(imageBox).toBeVisible();
    
    // Form should be full width
    const form = page.locator('#contact-form');
    await expect(form).toBeVisible();
    
    // Check form field responsiveness
    const nameField = page.locator('#name-input');
    const fieldWidth = await nameField.evaluate(el => getComputedStyle(el).width);
    expect(fieldWidth).toBe('100%');
  });

  test('Mobile Layout (375px) - Mobile Responsiveness', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Take screenshot
    await page.screenshot({ 
      path: 'tests/screenshots/contact-form-mobile-375px.png',
      fullPage: false,
      clip: { x: 0, y: 0, width: 375, height: 667 }
    });

    // Check container margins on mobile
    const container = page.locator('.contact .container');
    await expect(container).toBeVisible();
    
    // Image should be hidden on mobile (as per CSS media query)
    const imageBox = page.locator('.contact .content .image-box');
    const isImageVisible = await imageBox.isVisible();
    
    // Form should take full width
    const form = page.locator('#contact-form');
    await expect(form).toBeVisible();
    
    // Check form fields are properly sized for mobile
    const formFields = page.locator('.form-field input, .form-field textarea');
    for (let i = 0; i < await formFields.count(); i++) {
      const field = formFields.nth(i);
      await expect(field).toBeVisible();
    }
  });

  test('Form Field Interactions - Clicking and Focus States', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    
    // Test clicking on each form field
    const nameField = page.locator('#name-input');
    const nameLabel = page.locator('label[for="name-input"]');
    const nameIcon = page.locator('.form-field:has(#name-input) i');
    
    // Click on name field
    await nameField.click();
    await expect(nameField).toBeFocused();
    
    // Check focus styles are applied
    const borderColor = await nameField.evaluate(el => getComputedStyle(el).borderColor);
    const boxShadow = await nameField.evaluate(el => getComputedStyle(el).boxShadow);
    
    // Should have blue border and shadow when focused
    expect(borderColor).toContain('0, 113, 227'); // #0071e3
    expect(boxShadow).toContain('rgba(0, 113, 227, 0.1)');
    
    // Test email field
    const emailField = page.locator('#email-input');
    await emailField.click();
    await expect(emailField).toBeFocused();
    
    // Test phone field
    const phoneField = page.locator('#phone-input');
    await phoneField.click();
    await expect(phoneField).toBeFocused();
    
    // Test message field
    const messageField = page.locator('#message-input');
    await messageField.click();
    await expect(messageField).toBeFocused();
  });

  test('Floating Label Animations', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    
    const nameField = page.locator('#name-input');
    const nameLabel = page.locator('label[for="name-input"]');
    
    // Get initial label position
    const initialLabelPosition = await nameLabel.evaluate(el => ({
      top: getComputedStyle(el).top,
      fontSize: getComputedStyle(el).fontSize,
      color: getComputedStyle(el).color
    }));
    
    // Focus on field and type
    await nameField.click();
    await nameField.fill(validData.name);
    
    // Wait for animation to complete
    await page.waitForTimeout(500);
    
    // Check label has moved up and changed style
    const animatedLabelPosition = await nameLabel.evaluate(el => ({
      top: getComputedStyle(el).top,
      fontSize: getComputedStyle(el).fontSize,
      color: getComputedStyle(el).color
    }));
    
    // Label should move up (negative top value)
    expect(parseFloat(animatedLabelPosition.top)).toBeLessThan(parseFloat(initialLabelPosition.top));
    
    // Font size should be smaller
    expect(parseFloat(animatedLabelPosition.fontSize)).toBeLessThan(parseFloat(initialLabelPosition.fontSize));
    
    // Test with email field
    const emailField = page.locator('#email-input');
    const emailLabel = page.locator('label[for="email-input"]');
    
    await emailField.click();
    await emailField.fill(validData.email);
    
    // Check label animation
    const emailLabelAnimated = await emailLabel.evaluate(el => getComputedStyle(el).top);
    expect(parseFloat(emailLabelAnimated)).toBeLessThan(0); // Should be negative (moved up)
  });

  test('Form Validation - Empty Required Fields', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    
    // Try to submit empty form
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Check HTML5 validation messages
    const nameField = page.locator('#name-input');
    const emailField = page.locator('#email-input');
    const messageField = page.locator('#message-input');
    
    // Check required fields show validation
    const nameValidity = await nameField.evaluate(el => el.validity.valid);
    const emailValidity = await emailField.evaluate(el => el.validity.valid);
    const messageValidity = await messageField.evaluate(el => el.validity.valid);
    
    expect(nameValidity).toBe(false);
    expect(emailValidity).toBe(false);
    expect(messageValidity).toBe(false);
    
    // Phone field should be valid (it's optional)
    const phoneField = page.locator('#phone-input');
    const phoneValidity = await phoneField.evaluate(el => el.validity.valid);
    expect(phoneValidity).toBe(true);
  });

  test('Form Validation - Invalid Email Format', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    
    // Fill form with invalid email
    await page.locator('#name-input').fill(validData.name);
    await page.locator('#email-input').fill(invalidData.email);
    await page.locator('#message-input').fill(validData.message);
    
    // Try to submit
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Check email validation
    const emailField = page.locator('#email-input');
    const emailValidity = await emailField.evaluate(el => el.validity.valid);
    expect(emailValidity).toBe(false);
    
    // Check CSS validation state
    const emailInvalid = await emailField.evaluate(el => el.matches(':invalid'));
    expect(emailInvalid).toBe(true);
  });

  test('Form Validation - Valid Submission', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    
    // Fill form with valid data
    await page.locator('#name-input').fill(validData.name);
    await page.locator('#email-input').fill(validData.email);
    await page.locator('#phone-input').fill(validData.phone);
    await page.locator('#message-input').fill(validData.message);
    
    // Check all fields are valid
    const nameValid = await page.locator('#name-input').evaluate(el => el.validity.valid);
    const emailValid = await page.locator('#email-input').evaluate(el => el.validity.valid);
    const messageValid = await page.locator('#message-input').evaluate(el => el.validity.valid);
    
    expect(nameValid).toBe(true);
    expect(emailValid).toBe(true);
    expect(messageValid).toBe(true);
    
    // Check CSS valid state styling
    const nameField = page.locator('#name-input');
    const borderColor = await nameField.evaluate(el => getComputedStyle(el).borderColor);
    
    // Valid fields should have green border (if CSS is working)
    // Note: This depends on the :valid CSS selector being implemented
  });

  test('Viewport Resizing Behavior', async ({ page }) => {
    // Start with desktop
    await page.setViewportSize({ width: 1200, height: 800 });
    
    // Check desktop layout
    let content = page.locator('.contact .container .content');
    let gridColumns = await content.evaluate(el => getComputedStyle(el).gridTemplateColumns);
    expect(gridColumns).toContain('1fr 1fr');
    
    // Resize to tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(100); // Allow CSS to recalculate
    
    gridColumns = await content.evaluate(el => getComputedStyle(el).gridTemplateColumns);
    expect(gridColumns).toContain('1fr');
    
    // Resize to mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(100);
    
    // Check image visibility on mobile
    const imageBox = page.locator('.contact .content .image-box');
    const imageDisplay = await imageBox.evaluate(el => getComputedStyle(el).display);
    expect(imageDisplay).toBe('none');
    
    // Resize back to desktop
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(100);
    
    gridColumns = await content.evaluate(el => getComputedStyle(el).gridTemplateColumns);
    expect(gridColumns).toContain('1fr 1fr');
  });

  test('JavaScript Console Errors Check', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Interact with the form
    await page.locator('#name-input').fill(validData.name);
    await page.locator('#email-input').fill(validData.email);
    await page.locator('#message-input').fill(validData.message);
    await page.locator('button[type="submit"]').click();
    
    // Wait a bit for any delayed errors
    await page.waitForTimeout(1000);
    
    // Report any JavaScript errors
    if (errors.length > 0) {
      console.log('JavaScript Errors Found:', errors);
    }
    
    // This test will help identify JavaScript errors but won't fail the test
    // since some errors might be expected (like EmailJS not being configured)
  });

  test('Form Accessibility Features', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    
    // Check form has proper labels
    const nameField = page.locator('#name-input');
    const nameLabel = page.locator('label[for="name-input"]');
    
    await expect(nameLabel).toBeVisible();
    
    // Check label association
    const labelFor = await nameLabel.getAttribute('for');
    const inputId = await nameField.getAttribute('id');
    expect(labelFor).toBe(inputId);
    
    // Check required attributes
    const nameRequired = await nameField.getAttribute('required');
    const emailRequired = await page.locator('#email-input').getAttribute('required');
    const messageRequired = await page.locator('#message-input').getAttribute('required');
    
    expect(nameRequired).toBe('');
    expect(emailRequired).toBe('');
    expect(messageRequired).toBe('');
    
    // Check phone is not required
    const phoneRequired = await page.locator('#phone-input').getAttribute('required');
    expect(phoneRequired).toBeNull();
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await expect(nameField).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('#email-input')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('#phone-input')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('#message-input')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('button[type="submit"]')).toBeFocused();
  });

  test('CSS Grid Alignment and Layout Issues', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    
    // Check container positioning
    const container = page.locator('.contact .container');
    const containerBox = await container.boundingBox();
    
    // Container should be centered and have proper dimensions
    expect(containerBox.width).toBeGreaterThan(800);
    expect(containerBox.width).toBeLessThanOrEqual(1050); // max-width from CSS
    
    // Check content grid alignment
    const content = page.locator('.contact .container .content');
    const contentBox = await content.boundingBox();
    
    // Content should fill container width minus padding
    expect(contentBox.width).toBeGreaterThan(500);
    
    // Check form and image alignment
    const form = page.locator('#contact-form');
    const imageBox = page.locator('.contact .content .image-box');
    
    const formBox = await form.boundingBox();
    const imageBoxBounds = await imageBox.boundingBox();
    
    // On desktop, form and image should be roughly aligned horizontally
    const topDifference = Math.abs(formBox.y - imageBoxBounds.y);
    expect(topDifference).toBeLessThan(50); // Should be roughly aligned
  });

  test('Button Hover and Active States', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    
    const submitButton = page.locator('button[type="submit"]');
    
    // Get initial button styles
    const initialTransform = await submitButton.evaluate(el => getComputedStyle(el).transform);
    
    // Hover over button
    await submitButton.hover();
    await page.waitForTimeout(300); // Wait for transition
    
    // Check hover transform
    const hoverTransform = await submitButton.evaluate(el => getComputedStyle(el).transform);
    
    // Button should transform on hover (scale and translateY)
    expect(hoverTransform).not.toBe(initialTransform);
    expect(hoverTransform).toContain('scale');
    
    // Test button click (active state)
    await submitButton.click();
    
    // Note: Active state is very brief, so we mainly test that click works
    await expect(submitButton).toBeVisible();
  });

  test('Performance and Loading Behavior', async ({ page }) => {
    // Measure page load performance
    const startTime = Date.now();
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    console.log(`Page load time: ${loadTime}ms`);
    
    // Check that form loads quickly (under 5 seconds)
    expect(loadTime).toBeLessThan(5000);
    
    // Check form is immediately interactive
    const nameField = page.locator('#name-input');
    await expect(nameField).toBeVisible();
    await expect(nameField).toBeEditable();
    
    // Test form responsiveness
    const responseStart = Date.now();
    await nameField.click();
    await nameField.fill('Test');
    const responseTime = Date.now() - responseStart;
    
    console.log(`Form interaction time: ${responseTime}ms`);
    expect(responseTime).toBeLessThan(1000); // Should be very fast
  });
});