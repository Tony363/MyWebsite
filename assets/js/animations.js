/* Apple-Inspired Interactive Animations - Enhanced */

// Interactive Gradient Orb for Hero Section with Enhanced Physics
class GradientOrb {
  constructor() {
    this.orbs = [];
    this.mouseX = window.innerWidth / 2;
    this.mouseY = window.innerHeight / 2;
    this.currentX = window.innerWidth / 2;
    this.currentY = window.innerHeight / 2;
    this.init();
  }

  init() {
    this.createOrbs();
    this.bindEvents();
    this.animate();
  }

  createOrbs() {
    const hero = document.querySelector('.home');
    if (!hero) return;

    // Create multiple orbs for depth effect
    const orbConfigs = [
      { size: 700, blur: 80, opacity: 0.4, speed: 0.02, color: 'var(--gradient-accent)' },
      { size: 500, blur: 60, opacity: 0.3, speed: 0.03, color: 'var(--gradient-mesh)' },
      { size: 400, blur: 40, opacity: 0.2, speed: 0.04, color: 'var(--gradient-glow)' }
    ];

    orbConfigs.forEach((config, index) => {
      const orb = document.createElement('div');
      orb.className = `gradient-orb gradient-orb-${index}`;
      orb.style.cssText = `
        position: absolute;
        width: ${config.size}px;
        height: ${config.size}px;
        background: ${config.color};
        border-radius: 50%;
        filter: blur(${config.blur}px);
        opacity: 0;
        pointer-events: none;
        will-change: transform, opacity;
        z-index: ${index};
        transition: opacity 2s ease;
        mix-blend-mode: screen;
      `;
      hero.appendChild(orb);
      
      // Fade in with delay
      setTimeout(() => {
        orb.style.opacity = config.opacity;
      }, 100 + (index * 200));
      
      this.orbs.push({ element: orb, config });
    });
  }

  bindEvents() {
    // Track mouse movement with touch support
    const handleMove = (e) => {
      if (e.touches) {
        this.mouseX = e.touches[0].clientX;
        this.mouseY = e.touches[0].clientY;
      } else {
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;
      }
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('touchmove', handleMove, { passive: true });
  }

  animate() {
    // Smooth lerp animation with easing
    this.currentX += (this.mouseX - this.currentX) * 0.08;
    this.currentY += (this.mouseY - this.currentY) * 0.08;

    this.orbs.forEach((orb, index) => {
      if (orb.element) {
        const parallaxOffset = (index + 1) * 0.2;
        const rotationOffset = Date.now() * 0.0001 * (index + 1);
        const x = this.currentX * orb.config.speed * 10;
        const y = this.currentY * orb.config.speed * 10;
        const floatY = Math.sin(rotationOffset) * 20;
        
        orb.element.style.transform = `
          translate(${x}px, ${y + floatY}px) 
          scale(${1 + Math.sin(rotationOffset) * 0.05})
        `;
      }
    });

    requestAnimationFrame(() => this.animate());
  }
}

// Enhanced 3D Card Effect with Dynamic Shadows
class Card3DEnhanced {
  constructor() {
    this.init();
  }

  init() {
    const cards = document.querySelectorAll('.skills .bar, .work .box, .education .box');
    
    cards.forEach(card => {
      // Add necessary styles
      card.style.transformStyle = 'preserve-3d';
      card.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease';
      
      card.addEventListener('mousemove', (e) => this.handleMouseMove(e, card));
      card.addEventListener('mouseleave', (e) => this.handleMouseLeave(e, card));
      card.addEventListener('mouseenter', (e) => this.handleMouseEnter(e, card));
    });
  }

  handleMouseMove(e, card) {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * 10;
    const rotateY = ((centerX - x) / centerX) * 10;
    
    // Dynamic shadow based on tilt
    const shadowX = rotateY * 2;
    const shadowY = rotateX * 2;
    
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
    card.style.boxShadow = `${shadowX}px ${shadowY}px 30px rgba(0, 0, 0, 0.15)`;
  }

  handleMouseEnter(e, card) {
    card.style.transition = 'transform 0.1s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.1s ease';
  }

  handleMouseLeave(e, card) {
    card.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.5s ease';
    card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
    card.style.boxShadow = 'var(--shadow-sm)';
  }
}

// Magnetic Button Effect
class MagneticButtons {
  constructor() {
    this.init();
  }

  init() {
    // Apply to all buttons and CTAs
    const buttons = document.querySelectorAll('.btn, button, .social-icons a');
    
    buttons.forEach(btn => {
      btn.addEventListener('mousemove', (e) => this.handleMouseMove(e, btn));
      btn.addEventListener('mouseleave', (e) => this.handleMouseLeave(e, btn));
      
      // Add magnetic class for specific transition
      btn.classList.add('magnetic');
    });
  }

  handleMouseMove(e, btn) {
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    // Magnetic pull effect
    const pull = 0.25;
    btn.style.transform = `translate(${x * pull}px, ${y * pull}px) scale(1.02)`;
  }

  handleMouseLeave(e, btn) {
    btn.style.transform = 'translate(0, 0) scale(1)';
  }
}

// Scroll-triggered Timeline Animation
class TimelineAnimation {
  constructor() {
    this.init();
  }

  init() {
    this.createConnectingLine();
    this.observeTimeline();
  }

  createConnectingLine() {
    const timeline = document.querySelector('.timeline');
    if (!timeline) return;

    // Create SVG path for connecting line
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.cssText = `
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 4px;
      height: 100%;
      z-index: -1;
    `;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('stroke', 'var(--color-accent)');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-dasharray', '1000');
    path.setAttribute('stroke-dashoffset', '1000');
    path.classList.add('timeline-path');

    svg.appendChild(path);
    timeline.appendChild(svg);
  }

  observeTimeline() {
    const options = {
      threshold: 0.2,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          // Staggered animation for timeline items
          setTimeout(() => {
            entry.target.classList.add('timeline-visible');
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }, index * 150);

          // Animate connecting line
          const path = document.querySelector('.timeline-path');
          if (path) {
            path.style.transition = 'stroke-dashoffset 2s ease';
            path.style.strokeDashoffset = '0';
          }
        }
      });
    }, options);

    document.querySelectorAll('.timeline-item').forEach(item => {
      item.style.opacity = '0';
      item.style.transform = 'translateY(30px)';
      item.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
      observer.observe(item);
    });
  }
}

// Enhanced Scroll Animations
class ScrollAnimations {
  constructor() {
    this.init();
  }

  init() {
    const options = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          
          // Add stagger effect for children
          const children = entry.target.querySelectorAll('.stagger-child');
          children.forEach((child, index) => {
            setTimeout(() => {
              child.classList.add('visible');
            }, index * 100);
          });
        }
      });
    }, options);

    // Observe all elements with animation classes
    document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right, .scale-in').forEach(el => {
      observer.observe(el);
    });
  }
}

// Parallax Effect for Images
class ParallaxEffect {
  constructor() {
    this.elements = document.querySelectorAll('.parallax, .home .image img, .about .image img');
    this.init();
  }

  init() {
    if (this.elements.length === 0) return;
    
    this.updateParallax();

    window.addEventListener('scroll', () => {
      requestAnimationFrame(() => this.updateParallax());
    });

    window.addEventListener('resize', () => {
      requestAnimationFrame(() => this.updateParallax());
    });
  }

  updateParallax() {
    const viewportCenter = window.innerHeight / 2;
    
    this.elements.forEach(element => {
      const rect = element.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;

      const speedAttr = element.getAttribute('data-speed');
      const speed = speedAttr ? parseFloat(speedAttr) : 0.35;
      const elementCenter = rect.top + rect.height / 2;
      const offset = (viewportCenter - elementCenter) * speed;
      const clampedOffset = Math.max(-90, Math.min(90, offset));

      element.style.transform = `translate3d(0, ${clampedOffset}px, 0)`;
    });
  }
}

// Enhanced Navbar with Hide/Show on Scroll
class NavbarScroll {
  constructor() {
    this.navbar = document.querySelector('header');
    if (!this.navbar) return;
    
    this.lastScroll = 0;
    this.init();
  }

  init() {
    window.addEventListener('scroll', () => {
      const currentScroll = window.pageYOffset;
      
      // Add background blur on scroll
      if (currentScroll > 50) {
        this.navbar.classList.add('scrolled');
        this.navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        this.navbar.style.backdropFilter = 'saturate(180%) blur(20px)';
        this.navbar.style.webkitBackdropFilter = 'saturate(180%) blur(20px)';
      } else {
        this.navbar.classList.remove('scrolled');
        this.navbar.style.background = 'rgba(255, 255, 255, 0.72)';
      }
      
      // Hide/show based on scroll direction
      if (currentScroll > this.lastScroll && currentScroll > 100) {
        this.navbar.style.transform = 'translateY(-100%)';
      } else {
        this.navbar.style.transform = 'translateY(0)';
      }
      
      this.lastScroll = currentScroll;
    });
  }
}

// Progressive Image Loading with Blur Effect
class LazyImageLoader {
  constructor() {
    this.init();
  }

  init() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const src = img.getAttribute('data-src');
          
          // Add blur effect initially
          img.style.filter = 'blur(20px)';
          img.style.transition = 'filter 0.5s ease';
          
          // Create temp image to preload
          const tempImg = new Image();
          tempImg.onload = () => {
            img.src = src;
            img.style.filter = 'blur(0)';
            img.removeAttribute('data-src');
          };
          tempImg.src = src;
          
          imageObserver.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px'
    });

    images.forEach(img => imageObserver.observe(img));
  }
}

// Staggered Content Reveal
class StaggerReveal {
  constructor() {
    this.init();
  }

  init() {
    const containers = document.querySelectorAll('.work .box-container, .skills .container .row');
    
    containers.forEach(container => {
      const children = container.children;
      
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            Array.from(children).forEach((child, index) => {
              setTimeout(() => {
                child.style.opacity = '1';
                child.style.transform = 'translateY(0)';
              }, index * 100);
            });
            observer.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.2
      });
      
      // Set initial state
      Array.from(children).forEach(child => {
        child.style.opacity = '0';
        child.style.transform = 'translateY(20px)';
        child.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
      });
      
      observer.observe(container);
    });
  }
}

// Initialize all animations when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  if (!prefersReducedMotion) {
    // Core animations
    new GradientOrb();
    new Card3DEnhanced();
    new MagneticButtons();
    new ScrollAnimations();
    new ParallaxEffect();
    new NavbarScroll();
    new LazyImageLoader();
    new TimelineAnimation();
    new StaggerReveal();
    
    // Optional smooth scroll (performance intensive - enable selectively)
    if (window.innerWidth > 1024 && !('ontouchstart' in window)) {
      new SmoothScroll();
    }
    
    // Add interactive hints
    addInteractiveHints();
  } else {
    // Minimal animations for reduced motion
    new LazyImageLoader();
    new NavbarScroll();
  }
  
  // Performance optimization
  document.querySelectorAll('[data-will-change]').forEach(el => {
    el.style.willChange = el.getAttribute('data-will-change');
  });
});

// Add interactive hints for better UX
function addInteractiveHints() {
  // Add hover hint to interactive elements
  const interactiveElements = document.querySelectorAll('.btn, .box, .bar, .social-icons a');
  
  interactiveElements.forEach(element => {
    element.setAttribute('data-interactive', 'true');
    
    // Add ripple effect on click
    element.addEventListener('click', function(e) {
      const ripple = document.createElement('span');
      ripple.className = 'ripple-effect';
      
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: radial-gradient(circle, rgba(255,255,255,0.5) 0%, transparent 70%);
        border-radius: 50%;
        transform: scale(0);
        animation: rippleAnimation 0.6s ease-out;
        pointer-events: none;
      `;
      
      this.style.position = 'relative';
      this.style.overflow = 'hidden';
      this.appendChild(ripple);
      
      setTimeout(() => ripple.remove(), 600);
    });
  });
}

// Add necessary CSS for animations
(function() {
const style = document.createElement('style');
style.textContent = `
  /* Magnetic button styles */
  .magnetic {
    transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1) !important;
  }
  
  /* Interactive element indicator */
  [data-interactive="true"] {
    cursor: pointer;
    position: relative;
  }
  
  /* Ripple effect animation */
  @keyframes rippleAnimation {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
  
  /* Enhanced scroll animations */
  .fade-in, .slide-in-left, .slide-in-right, .scale-in {
    opacity: 0;
    transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .fade-in {
    transform: translateY(30px);
  }
  
  .fade-in.visible {
    opacity: 1;
    transform: translateY(0);
  }
  
  .slide-in-left {
    transform: translateX(-50px);
  }
  
  .slide-in-left.visible {
    opacity: 1;
    transform: translateX(0);
  }
  
  .slide-in-right {
    transform: translateX(50px);
  }
  
  .slide-in-right.visible {
    opacity: 1;
    transform: translateX(0);
  }
  
  .scale-in {
    transform: scale(0.9);
  }
  
  .scale-in.visible {
    opacity: 1;
    transform: scale(1);
  }
  
  /* Premium navbar with glassmorphism */
  header {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  header.scrolled {
    background: rgba(255, 255, 255, 0.95) !important;
    backdrop-filter: saturate(180%) blur(20px);
    -webkit-backdrop-filter: saturate(180%) blur(20px);
    box-shadow: 0 1px 0 rgba(0,0,0,0.1);
  }
  
  /* Enhanced skill bars */
  .skills .bar {
    position: relative;
    overflow: hidden;
  }
  
  .skills .bar::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
    animation: shimmer 2s infinite;
  }
  
  @keyframes shimmer {
    to {
      left: 100%;
    }
  }
  
  /* Project card enhancements */
  .work .box {
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .work .box:hover {
    transform: translateY(-10px) scale(1.02);
    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  }
  
  /* Typography enhancements */
  .typing-text {
    background: var(--gradient-accent);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
`;
document.head.appendChild(style);
})();
