/**
 * Smooth Scroll Module
 * Provides Apple-like smooth scrolling with dynamic duration and natural easing
 */

class SmoothScroll {
    constructor(options = {}) {
        this.options = {
            duration: 1000,
            easing: 'easeOutCubic',
            offset: 0,
            updateURL: true,
            callback: null,
            ...options
        };

        this.easingFunctions = {
            linear: t => t,
            easeOutCubic: t => 1 - Math.pow(1 - t, 3),
            easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
            easeOutQuart: t => 1 - Math.pow(1 - t, 4),
            easeOutExpo: t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
            easeOutCirc: t => Math.sqrt(1 - Math.pow(t - 1, 2)),
            easeSpring: t => {
                const c4 = (2 * Math.PI) / 3;
                return t === 0 ? 0 : t === 1 ? 1 : 
                    Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
            }
        };

        this.isScrolling = false;
        this.init();
    }

    init() {
        // Initialize smooth scroll for all anchor links
        this.initAnchorLinks();
        
        // Initialize scroll to top button
        this.initScrollToTop();
        
        // Add momentum scrolling for touch devices
        this.initMomentumScroll();
        
        // Performance optimization with passive listeners
        this.optimizeScrollPerformance();
    }

    initAnchorLinks() {
        document.querySelectorAll('a[href*="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                const href = anchor.getAttribute('href');
                
                // Skip if it's just '#' or external link
                if (href === '#' || !href.startsWith('#')) return;
                
                const targetId = href.substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    e.preventDefault();
                    this.scrollToElement(targetElement, {
                        updateURL: true,
                        callback: () => {
                            // Update active nav state
                            this.updateActiveNavigation(targetId);
                        }
                    });
                }
            });
        });
    }

    initScrollToTop() {
        const scrollTopBtn = document.querySelector('#scroll-top');
        if (scrollTopBtn) {
            scrollTopBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.scrollToTop();
            });
        }
    }

    initMomentumScroll() {
        // Add iOS-style momentum scrolling
        if ('ontouchstart' in window) {
            document.documentElement.style.webkitOverflowScrolling = 'touch';
            
            let startY = 0;
            let startTime = 0;
            
            document.addEventListener('touchstart', (e) => {
                startY = e.touches[0].pageY;
                startTime = Date.now();
            }, { passive: true });
            
            document.addEventListener('touchend', (e) => {
                const endY = e.changedTouches[0].pageY;
                const endTime = Date.now();
                const distance = endY - startY;
                const time = endTime - startTime;
                const velocity = distance / time;
                
                // Add momentum if swipe was fast enough
                if (Math.abs(velocity) > 0.5) {
                    this.addMomentum(velocity);
                }
            }, { passive: true });
        }
    }

    optimizeScrollPerformance() {
        // Use passive listeners for better scroll performance
        let ticking = false;
        
        const updateScrollPosition = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    this.updateScrollIndicators();
                    ticking = false;
                });
                ticking = true;
            }
        };
        
        window.addEventListener('scroll', updateScrollPosition, { passive: true });
        window.addEventListener('resize', updateScrollPosition, { passive: true });
    }

    scrollToElement(element, options = {}) {
        if (this.isScrolling) return;
        
        const opts = { ...this.options, ...options };
        const start = window.pageYOffset;
        const elementTop = element.getBoundingClientRect().top + start;
        
        // Calculate dynamic duration based on distance
        const distance = Math.abs(elementTop - start - opts.offset);
        const duration = this.calculateDuration(distance);
        
        const startTime = performance.now();
        this.isScrolling = true;
        
        const scroll = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Apply easing function
            const easingFunc = this.easingFunctions[opts.easing] || this.easingFunctions.easeOutCubic;
            const easeProgress = easingFunc(progress);
            
            const currentPosition = start + (elementTop - start - opts.offset) * easeProgress;
            window.scrollTo(0, currentPosition);
            
            if (progress < 1) {
                requestAnimationFrame(scroll);
            } else {
                this.isScrolling = false;
                
                // Update URL if needed
                if (opts.updateURL && element.id) {
                    history.pushState(null, null, `#${element.id}`);
                }
                
                // Execute callback
                if (opts.callback) {
                    opts.callback();
                }
            }
        };
        
        requestAnimationFrame(scroll);
    }

    scrollToTop() {
        this.scrollToPosition(0, {
            duration: 800,
            easing: 'easeOutCubic'
        });
    }

    scrollToPosition(position, options = {}) {
        if (this.isScrolling) return;
        
        const opts = { ...this.options, ...options };
        const start = window.pageYOffset;
        const distance = Math.abs(position - start);
        const duration = opts.duration || this.calculateDuration(distance);
        
        const startTime = performance.now();
        this.isScrolling = true;
        
        const scroll = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const easingFunc = this.easingFunctions[opts.easing] || this.easingFunctions.easeOutCubic;
            const easeProgress = easingFunc(progress);
            
            const currentPosition = start + (position - start) * easeProgress;
            window.scrollTo(0, currentPosition);
            
            if (progress < 1) {
                requestAnimationFrame(scroll);
            } else {
                this.isScrolling = false;
                if (opts.callback) {
                    opts.callback();
                }
            }
        };
        
        requestAnimationFrame(scroll);
    }

    calculateDuration(distance) {
        // Dynamic duration: faster for short distances, slower for long ones
        const minDuration = 400;
        const maxDuration = 1200;
        const baseDuration = Math.sqrt(distance) * 20;
        
        return Math.max(minDuration, Math.min(maxDuration, baseDuration));
    }

    addMomentum(velocity) {
        const distance = velocity * 300; // Momentum distance
        const currentScroll = window.pageYOffset;
        const targetScroll = currentScroll - distance;
        
        this.scrollToPosition(targetScroll, {
            duration: 600,
            easing: 'easeOutCubic'
        });
    }

    updateScrollIndicators() {
        const scrollTop = window.pageYOffset;
        const scrollTopBtn = document.querySelector('#scroll-top');
        
        // Show/hide scroll to top button
        if (scrollTopBtn) {
            if (scrollTop > 60) {
                scrollTopBtn.classList.add('active');
            } else {
                scrollTopBtn.classList.remove('active');
            }
        }
        
        // Update navigation active states
        this.updateNavigationStates();
    }

    updateNavigationStates() {
        const sections = document.querySelectorAll('section[id]');
        const scrollPosition = window.pageYOffset + 200;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                this.updateActiveNavigation(sectionId);
            }
        });
    }

    updateActiveNavigation(sectionId) {
        // Remove all active classes
        document.querySelectorAll('.navbar ul li a').forEach(link => {
            link.classList.remove('active');
        });
        
        // Add active class to current section link
        const activeLink = document.querySelector(`.navbar ul li a[href="#${sectionId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    // Utility method for external use
    static getInstance(options) {
        if (!window.smoothScrollInstance) {
            window.smoothScrollInstance = new SmoothScroll(options);
        }
        return window.smoothScrollInstance;
    }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        SmoothScroll.getInstance({
            offset: 65, // Account for fixed header height
            easing: 'easeOutCubic'
        });
    });
} else {
    SmoothScroll.getInstance({
        offset: 65,
        easing: 'easeOutCubic'
    });
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SmoothScroll;
}