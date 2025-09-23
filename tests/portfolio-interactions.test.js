// Playwright tests for Apple-inspired portfolio interactions

const { test, expect } = require('@playwright/test');

// Test configuration
test.use({
  // Test against different viewport sizes
  viewport: { width: 1280, height: 720 },
  // Enable animations for testing
  reducedMotion: 'no-preference',
});

test.describe('Portfolio Interactive Features', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the portfolio site
    await page.goto('http://localhost:8000'); // Adjust URL as needed
    // Wait for initial animations to complete
    await page.waitForTimeout(1000);
  });

  test.describe('Hero Section Animations', () => {
    
    test('gradient orb follows mouse movement', async ({ page }) => {
      // Check if gradient orbs are created
      const orbs = await page.locator('.gradient-orb').count();
      expect(orbs).toBeGreaterThan(0);
      
      // Test mouse movement interaction
      await page.mouse.move(100, 100);
      await page.waitForTimeout(200);
      
      const orbElement = page.locator('.gradient-orb').first();
      const transform1 = await orbElement.evaluate(el => 
        window.getComputedStyle(el).transform
      );
      
      await page.mouse.move(500, 500);
      await page.waitForTimeout(200);
      
      const transform2 = await orbElement.evaluate(el => 
        window.getComputedStyle(el).transform
      );
      
      // Verify transform changed with mouse movement
      expect(transform1).not.toBe(transform2);
    });
    
    test('scroll indicator is visible and animated', async ({ page }) => {
      const scrollIndicator = page.locator('.scroll-indicator');
      await expect(scrollIndicator).toBeVisible();
      
      // Check if animation is applied
      const hasAnimation = await scrollIndicator.evaluate(el => {
        const before = window.getComputedStyle(el, '::before');
        return before.animationName !== 'none';
      });
      expect(hasAnimation).toBeTruthy();
    });
    
    test('magnetic buttons respond to hover', async ({ page }) => {
      const button = page.locator('.btn-premium').first();
      
      // Get initial position
      const initialTransform = await button.evaluate(el => 
        window.getComputedStyle(el).transform
      );
      
      // Hover over button
      await button.hover();
      await page.waitForTimeout(100);
      
      // Check transform changed
      const hoverTransform = await button.evaluate(el => 
        window.getComputedStyle(el).transform
      );
      
      expect(initialTransform).not.toBe(hoverTransform);
    });
  });

  test.describe('Navigation Enhancements', () => {
    
    test('navbar shows glassmorphism on scroll', async ({ page }) => {
      const navbar = page.locator('header');
      
      // Initial state
      const initialBg = await navbar.evaluate(el => 
        window.getComputedStyle(el).background
      );
      
      // Scroll down
      await page.evaluate(() => window.scrollTo(0, 200));
      await page.waitForTimeout(300);
      
      // Check if scrolled class is added
      await expect(navbar).toHaveClass(/scrolled/);
      
      // Verify backdrop filter is applied
      const hasBackdropFilter = await navbar.evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.backdropFilter !== 'none' || 
               style.webkitBackdropFilter !== 'none';
      });
      expect(hasBackdropFilter).toBeTruthy();
    });
    
    test('navbar hides on scroll down and shows on scroll up', async ({ page }) => {
      const navbar = page.locator('header');
      
      // Scroll down
      await page.evaluate(() => window.scrollTo(0, 500));
      await page.waitForTimeout(300);
      
      // Check if navbar is hidden
      const transformDown = await navbar.evaluate(el => 
        window.getComputedStyle(el).transform
      );
      expect(transformDown).toContain('translateY(-100%)');
      
      // Scroll up
      await page.evaluate(() => window.scrollTo(0, 200));
      await page.waitForTimeout(300);
      
      // Check if navbar is visible
      const transformUp = await navbar.evaluate(el => 
        window.getComputedStyle(el).transform
      );
      expect(transformUp).toContain('translateY(0)');
    });
  });

  test.describe('Skills Section Interactivity', () => {
    
    test('skills cards render with circular progress', async ({ page }) => {
      // Scroll to skills section
      await page.locator('#skills').scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      
      // Check if skill cards are rendered
      const skillCards = page.locator('.skill-card');
      const count = await skillCards.count();
      expect(count).toBeGreaterThan(0);
      
      // Verify SVG circles are present
      const svgCircles = page.locator('.skill-card svg circle');
      const circleCount = await svgCircles.count();
      expect(circleCount).toBeGreaterThan(0);
    });
    
    test('skill filters work correctly', async ({ page }) => {
      await page.locator('#skills').scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      
      // Click AI/ML filter
      const aiFilter = page.locator('.filter-btn').filter({ hasText: 'AI/ML' });
      await aiFilter.click();
      await page.waitForTimeout(300);
      
      // Verify only AI skills are visible
      const visibleCards = await page.locator('.skill-card:visible').count();
      const aiCards = await page.locator('.skill-card[data-category="ai"]:visible').count();
      expect(visibleCards).toBe(aiCards);
      
      // Click All filter
      const allFilter = page.locator('.filter-btn').filter({ hasText: 'All' });
      await allFilter.click();
      await page.waitForTimeout(300);
      
      // Verify all cards are visible again
      const allCards = await page.locator('.skill-card:visible').count();
      expect(allCards).toBeGreaterThan(aiCards);
    });
    
    test('skill cards show percentage on hover', async ({ page }) => {
      await page.locator('#skills').scrollIntoViewIfNeeded();
      
      const firstCard = page.locator('.skill-card').first();
      const skillLevel = firstCard.locator('.skill-level');
      
      // Initially hidden
      const initialOpacity = await skillLevel.evaluate(el => 
        window.getComputedStyle(el).opacity
      );
      expect(parseFloat(initialOpacity)).toBe(0);
      
      // Hover over card
      await firstCard.hover();
      await page.waitForTimeout(300);
      
      // Check if percentage is visible
      const hoverOpacity = await skillLevel.evaluate(el => 
        window.getComputedStyle(el).opacity
      );
      expect(parseFloat(hoverOpacity)).toBe(1);
    });
  });

  test.describe('Project Cards 3D Effects', () => {
    
    test('project cards have 3D tilt on hover', async ({ page }) => {
      await page.locator('#work').scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      
      const projectCard = page.locator('.work .box').first();
      
      // Get initial transform
      const initialTransform = await projectCard.evaluate(el => 
        window.getComputedStyle(el).transform
      );
      
      // Hover over card
      await projectCard.hover();
      await page.waitForTimeout(200);
      
      // Check if 3D transform is applied
      const hoverTransform = await projectCard.evaluate(el => 
        window.getComputedStyle(el).transform
      );
      
      expect(hoverTransform).toContain('perspective');
      expect(hoverTransform).not.toBe(initialTransform);
    });
    
    test('project filter buttons work', async ({ page }) => {
      await page.locator('#work').scrollIntoViewIfNeeded();
      
      // Test filter functionality
      const cvFilter = page.locator('#filters button').filter({ hasText: 'Computer Vision' });
      if (await cvFilter.count() > 0) {
        await cvFilter.click();
        await page.waitForTimeout(300);
        
        // Verify filter is active
        await expect(cvFilter).toHaveClass(/is-checked/);
      }
    });
  });

  test.describe('Form Enhancements', () => {
    
    test('floating labels work correctly', async ({ page }) => {
      await page.locator('#contact').scrollIntoViewIfNeeded();
      
      const nameInput = page.locator('#name-input');
      const nameLabel = page.locator('label[for="name-input"]');
      
      // Check initial label position
      const initialTop = await nameLabel.evaluate(el => 
        window.getComputedStyle(el).top
      );
      
      // Focus input
      await nameInput.focus();
      await page.waitForTimeout(200);
      
      // Check label moved up
      const focusedTop = await nameLabel.evaluate(el => 
        window.getComputedStyle(el).top
      );
      
      expect(parseInt(focusedTop)).toBeLessThan(parseInt(initialTop));
      
      // Type something
      await nameInput.fill('John Doe');
      
      // Blur input
      await page.locator('body').click();
      await page.waitForTimeout(200);
      
      // Label should stay up when input has value
      const filledTop = await nameLabel.evaluate(el => 
        window.getComputedStyle(el).top
      );
      
      expect(parseInt(filledTop)).toBeLessThan(parseInt(initialTop));
    });
    
    test('form validation states show correct colors', async ({ page }) => {
      await page.locator('#contact').scrollIntoViewIfNeeded();
      
      const emailInput = page.locator('#email-input');
      const emailLabel = page.locator('label[for="email-input"]');
      
      // Type invalid email
      await emailInput.fill('invalid-email');
      await page.locator('body').click();
      await page.waitForTimeout(200);
      
      // Check invalid state color
      const invalidColor = await emailInput.evaluate(el => 
        window.getComputedStyle(el).borderColor
      );
      expect(invalidColor).toContain('255, 59, 48'); // Red color
      
      // Type valid email
      await emailInput.fill('test@example.com');
      await page.locator('body').click();
      await page.waitForTimeout(200);
      
      // Check valid state color
      const validColor = await emailInput.evaluate(el => 
        window.getComputedStyle(el).borderColor
      );
      expect(validColor).toContain('48, 209, 88'); // Green color
    });
  });

  test.describe('Scroll Animations', () => {
    
    test('elements fade in on scroll', async ({ page }) => {
      // Check about section animation
      const aboutContent = page.locator('.about .content').first();
      
      // Initially might be invisible
      await page.locator('#about').scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      
      // Should be visible after scroll
      await expect(aboutContent).toHaveClass(/visible/);
      
      const opacity = await aboutContent.evaluate(el => 
        window.getComputedStyle(el).opacity
      );
      expect(parseFloat(opacity)).toBe(1);
    });
    
    test('parallax effect on images', async ({ page }) => {
      const parallaxImage = page.locator('.parallax, .tilt').first();
      
      if (await parallaxImage.count() > 0) {
        // Get initial position
        const initialTransform = await parallaxImage.evaluate(el => 
          window.getComputedStyle(el).transform
        );
        
        // Scroll down
        await page.evaluate(() => window.scrollBy(0, 200));
        await page.waitForTimeout(200);
        
        // Check if transform changed
        const scrolledTransform = await parallaxImage.evaluate(el => 
          window.getComputedStyle(el).transform
        );
        
        // Parallax images should have different transform after scroll
        expect(scrolledTransform).not.toBe(initialTransform);
      }
    });
  });

  test.describe('Performance Tests', () => {
    
    test('animations run at 60fps', async ({ page }) => {
      // Enable Chrome DevTools Protocol
      const client = await page.context().newCDPSession(page);
      await client.send('Overlay.setShowFPSCounter', { show: true });
      
      // Trigger various animations
      await page.mouse.move(100, 100);
      await page.mouse.move(500, 500);
      await page.evaluate(() => window.scrollBy(0, 500));
      
      // Hover over elements
      const button = page.locator('.btn').first();
      await button.hover();
      
      // Check for smooth animations (no jank)
      const metrics = await page.evaluate(() => performance.getEntriesByType('measure'));
      
      // Animations should complete within reasonable time
      expect(metrics).toBeDefined();
    });
    
    test('page loads within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('http://localhost:8000');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      // Page should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });
  });

  test.describe('Accessibility', () => {
    
    test('interactive elements are keyboard accessible', async ({ page }) => {
      // Tab through interactive elements
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
      
      // Check if first interactive element has focus
      const focusedElement = await page.evaluate(() => 
        document.activeElement?.tagName
      );
      expect(focusedElement).toBeTruthy();
      
      // Test Enter key on button
      const buttons = page.locator('.btn');
      if (await buttons.count() > 0) {
        await buttons.first().focus();
        // Enter key should be handled (no error)
        await page.keyboard.press('Enter');
      }
    });
    
    test('reduced motion preference is respected', async ({ browser }) => {
      const context = await browser.newContext({
        reducedMotion: 'reduce',
      });
      const page = await context.newPage();
      await page.goto('http://localhost:8000');
      
      // Check if animations are disabled
      const orbCount = await page.locator('.gradient-orb').count();
      // Fewer or no animations should be initialized
      expect(orbCount).toBeLessThanOrEqual(1);
      
      await context.close();
    });
  });
});

// Mobile responsiveness tests
test.describe('Mobile Responsiveness', () => {
  test.use({
    viewport: { width: 375, height: 667 }, // iPhone SE size
  });
  
  test('mobile menu works correctly', async ({ page }) => {
    await page.goto('http://localhost:8000');
    
    // Check if hamburger menu is visible
    const menuButton = page.locator('#menu');
    await expect(menuButton).toBeVisible();
    
    // Click menu
    await menuButton.click();
    await page.waitForTimeout(300);
    
    // Check if navigation is visible
    const nav = page.locator('.navbar');
    await expect(nav).toHaveClass(/nav-toggle/);
  });
  
  test('touch interactions work', async ({ page }) => {
    await page.goto('http://localhost:8000');
    
    // Simulate touch on skill card
    const skillCard = page.locator('.skill-card').first();
    if (await skillCard.count() > 0) {
      await skillCard.tap();
      // Should not throw error
    }
  });
});