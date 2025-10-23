const THEME_STORAGE_KEY = 'portfolio-theme';
const colorSchemeQuery = typeof window !== 'undefined' && window.matchMedia
  ? window.matchMedia('(prefers-color-scheme: dark)')
  : null;
let themePreferenceSource = 'system';
let currentTheme = 'light';

function getStoredTheme() {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY);
  } catch (error) {
    console.warn('Unable to access theme preference storage.', error);
    return null;
  }
}

function syncThemeToggle() {
  const toggle = document.querySelector('.theme-toggle');
  if (!toggle) {
    return;
  }

  toggle.setAttribute('data-theme-mode', currentTheme);
  toggle.setAttribute('aria-pressed', currentTheme === 'dark' ? 'true' : 'false');
  toggle.setAttribute('aria-label', currentTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  toggle.classList.toggle('is-dark', currentTheme === 'dark');
}

function applyTheme(theme, options = {}) {
  const { persist = true, syncToggle = true } = options;
  currentTheme = theme === 'dark' ? 'dark' : 'light';
  const root = document.documentElement;

  root.setAttribute('data-theme', currentTheme);
  root.style.colorScheme = currentTheme;

  if (persist) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, currentTheme);
    } catch (error) {
      console.warn('Unable to persist theme preference.', error);
    }
  }

  if (syncToggle) {
    syncThemeToggle();
  }
}

function handleSystemThemeChange(event) {
  if (themePreferenceSource === 'user') {
    return;
  }
  const nextTheme = event.matches ? 'dark' : 'light';
  applyTheme(nextTheme, { persist: false });
}

function initializeThemeFromPreferences() {
  const storedTheme = getStoredTheme();

  if (storedTheme === 'dark' || storedTheme === 'light') {
    themePreferenceSource = 'user';
    applyTheme(storedTheme, { persist: false, syncToggle: false });
  } else {
    themePreferenceSource = 'system';
    const prefersDark = colorSchemeQuery ? colorSchemeQuery.matches : false;
    applyTheme(prefersDark ? 'dark' : 'light', { persist: false, syncToggle: false });
  }

  if (colorSchemeQuery) {
    try {
      colorSchemeQuery.addEventListener('change', handleSystemThemeChange);
    } catch (error) {
      if (typeof colorSchemeQuery.addListener === 'function') {
        colorSchemeQuery.addListener(handleSystemThemeChange);
      }
    }
  }
}

function bindThemeToggle() {
  const toggle = document.querySelector('.theme-toggle');
  if (!toggle) {
    return;
  }

  if (toggle.dataset.bound === 'true') {
    syncThemeToggle();
    return;
  }

  toggle.dataset.bound = 'true';
  toggle.addEventListener('click', () => {
    themePreferenceSource = 'user';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
  });

  syncThemeToggle();
}

function attachMenuHandler() {
  const menuButton = document.getElementById('menu');
  const navbar = document.querySelector('.navbar');

  if (!menuButton || !navbar || menuButton.dataset.bound === 'true') {
    return;
  }

  const closeNav = () => {
    navbar.classList.remove('nav-toggle');
    menuButton.classList.remove('fa-times');
    menuButton.setAttribute('aria-expanded', 'false');
  };

  menuButton.dataset.bound = 'true';
  closeNav();
  menuButton.addEventListener('click', () => {
    menuButton.classList.toggle('fa-times');
    const isOpen = navbar.classList.toggle('nav-toggle');
    menuButton.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  navbar.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeNav);
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      closeNav();
    }
  });
}

initializeThemeFromPreferences();

// Email Configuration Validation
function validateEmailConfiguration() {
    const EXPECTED_EMAIL = 'pysolver33@gmail.com';
    
    // Check all static email displays
    const emailDisplays = document.querySelectorAll('p:not(#contact-form p), .box p');
    let staticEmailsValid = true;
    
    emailDisplays.forEach(element => {
        if (element.textContent.includes('@') && !element.textContent.includes(EXPECTED_EMAIL)) {
            console.warn('⚠️ Inconsistent email found:', element.textContent);
            staticEmailsValid = false;
        }
    });
    
    // Check all mailto links
    const mailtoLinks = document.querySelectorAll('a[href^="mailto:"]');
    let mailtoLinksValid = true;
    
    mailtoLinks.forEach(link => {
        const email = link.href.replace('mailto:', '').split('?')[0];
        if (email !== EXPECTED_EMAIL) {
            console.warn('⚠️ Incorrect mailto link:', link.href);
            mailtoLinksValid = false;
        }
    });
    
    // Validation report
    console.log('📧 Email Configuration Validation Report:');
    console.log(`✅ Static email displays: ${staticEmailsValid ? 'All correct' : 'Issues found'}`);
    console.log(`✅ Mailto links: ${mailtoLinksValid ? 'All correct' : 'Issues found'}`);
    console.log(`⚠️  EmailJS recipient: Configured in dashboard (expected: ${EXPECTED_EMAIL})`);
    console.log('📝 Note: Actual EmailJS recipient must be verified in EmailJS dashboard');
    
    // Add visual indicator if there are issues
    if (!staticEmailsValid || !mailtoLinksValid) {
        console.error('❌ Email configuration issues detected. Please review the warnings above.');
    }
    
    // Store validation status
    window.emailConfigValidation = {
        staticEmails: staticEmailsValid,
        mailtoLinks: mailtoLinksValid,
        expectedRecipient: EXPECTED_EMAIL,
        validated: true
    };
}

document.addEventListener('DOMContentLoaded', function() {
    // Validate EmailJS configuration on page load
    validateEmailConfiguration();
    
    fetch('/partials/header.html')
        .then(res => res.text())
        .then(html => {
            const headerPlaceholder = document.getElementById('header-placeholder');
            if (headerPlaceholder) {
                headerPlaceholder.innerHTML = html;
                bindThemeToggle();
                attachMenuHandler();
            }
        })
        .catch(error => {
            console.error('Failed to load header partial.', error);
        });
    fetch('/partials/footer.html')
        .then(res => res.text())
        .then(html => {
            const footerPlaceholder = document.getElementById('footer-placeholder');
            if (footerPlaceholder) {
                footerPlaceholder.innerHTML = html;
            }
        })
        .catch(error => {
            console.error('Failed to load footer partial.', error);
        });

    // Dynamic experience timeline
    fetch('/assets/data/experience.json')
        .then(res => res.json())
        .then(data => {
            const container = document.getElementById('experience-timeline');
            let html = '';
            data.forEach(item => {
                html += `
                <div class="container ${item.side}">
                  <div class="content">
                    <div class="tag">
                      <h2>
                        <img src="${item.companyIcon}" alt="${item.alt}" class="company-icon">
                        ${item.company}
                      </h2>
                    </div>
                    <div class="desc">
                      <h3>${item.title}</h3>
                      <p>${item.period}</p>
                    </div>
                  </div>
                </div>`;
            });
            container.innerHTML = html;
        });

    // Initialize VanillaTilt for static elements
    VanillaTilt.init(document.querySelectorAll(".tilt"), { max: 15 });
});

$(document).ready(function () {

    bindThemeToggle();
    attachMenuHandler();

    $(window).on('scroll load', function () {
        $('#menu').removeClass('fa-times');
        $('.navbar').removeClass('nav-toggle');
        const menuButton = document.getElementById('menu');
        if (menuButton) {
            menuButton.setAttribute('aria-expanded', 'false');
        }

        if (window.scrollY > 60) {
            document.querySelector('#scroll-top').classList.add('active');
        } else {
            document.querySelector('#scroll-top').classList.remove('active');
        }

        // scroll spy
        $('section').each(function () {
            let height = $(this).height();
            let offset = $(this).offset().top - 200;
            let top = $(window).scrollTop();
            let id = $(this).attr('id');

            if (top > offset && top < offset + height) {
                $('.navbar ul li a').removeClass('active');
                $('.navbar').find(`[href="#${id}"]`).addClass('active');
            }
        });
    });

    // Smooth scrolling is now handled by smooth-scroll.js module
    // Legacy jQuery smooth scrolling removed to prevent conflicts

    // Contact form handler with enhanced verification and logging
    $("#contact-form").submit(function (event) {
        event.preventDefault();
        
        // Configuration for email verification
        const EMAIL_CONFIG = {
            expectedRecipient: 'pysolver33@gmail.com',
            serviceId: 'contact_service',
            templateId: 'template_contact',
            userId: 'user_TTDmetQLYgWCLzHTDgqxm'
        };
        
        // Log configuration for verification (development only)
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('📧 Email Configuration:', {
                service: EMAIL_CONFIG.serviceId,
                template: EMAIL_CONFIG.templateId,
                expectedRecipient: EMAIL_CONFIG.expectedRecipient,
                note: 'Actual recipient is configured in EmailJS dashboard'
            });
        }
        
        try {
            // Initialize EmailJS
            emailjs.init(EMAIL_CONFIG.userId);
            
            // Get form data for logging
            const formData = {
                name: this.name.value,
                email: this.email.value,
                phone: this.phone.value,
                message: this.message.value
            };
            
            // Show loading state
            const submitBtn = $(this).find('button[type="submit"]');
            const originalText = submitBtn.html();
            submitBtn.html('<i class="fas fa-spinner fa-spin"></i> Sending...');
            submitBtn.prop('disabled', true);
            
            // Add verification note to form data
            const enrichedData = {
                ...formData,
                _verification_note: `Expected recipient: ${EMAIL_CONFIG.expectedRecipient}`,
                _timestamp: new Date().toISOString()
            };
            
            // Send email with enhanced error handling
            emailjs.send(EMAIL_CONFIG.serviceId, EMAIL_CONFIG.templateId, enrichedData)
                .then(function (response) {
                    // Log success for monitoring
                    console.log('✅ Email sent successfully:', {
                        status: response.status,
                        text: response.text,
                        recipient: EMAIL_CONFIG.expectedRecipient,
                        timestamp: new Date().toISOString()
                    });
                    
                    // Reset form
                    document.getElementById("contact-form").reset();
                    
                    // Success feedback with recipient confirmation
                    submitBtn.html(`<i class="fas fa-check"></i> Sent to ${EMAIL_CONFIG.expectedRecipient.split('@')[0]}!`);
                    setTimeout(() => {
                        submitBtn.html(originalText);
                        submitBtn.prop('disabled', false);
                    }, 4000);
                    
                }, function (error) {
                    // Detailed error logging
                    console.error('❌ Email sending failed:', {
                        error: error,
                        service: EMAIL_CONFIG.serviceId,
                        template: EMAIL_CONFIG.templateId,
                        expectedRecipient: EMAIL_CONFIG.expectedRecipient,
                        timestamp: new Date().toISOString()
                    });
                    
                    // User-friendly error message
                    let errorMsg = 'Failed to Send';
                    if (error.text) {
                        if (error.text.includes('template')) {
                            errorMsg = 'Template Configuration Error';
                        } else if (error.text.includes('service')) {
                            errorMsg = 'Service Configuration Error';
                        } else if (error.text.includes('limit')) {
                            errorMsg = 'Rate Limit Exceeded';
                        }
                    }
                    
                    submitBtn.html(`<i class="fas fa-exclamation-triangle"></i> ${errorMsg}`);
                    setTimeout(() => {
                        submitBtn.html(originalText);
                        submitBtn.prop('disabled', false);
                    }, 4000);
                    
                    // Show fallback mailto option  
                    if (confirm('Email sending failed. Would you like to send directly to ' + EMAIL_CONFIG.expectedRecipient + '?')) {
                        window.location.href = 'mailto:' + EMAIL_CONFIG.expectedRecipient + '?subject=Portfolio Contact&body=' + encodeURIComponent(formData.message);
                    }
                });
                
        } catch (error) {
            // Critical error handling
            console.error('🚨 Critical form error:', error);
            
            const submitBtn = $(this).find('button[type="submit"]');
            submitBtn.html('<i class="fas fa-exclamation-triangle"></i> System Error');
            submitBtn.prop('disabled', false);
            
            // Provide fallback option
            if (confirm('System error occurred. Send email directly to ' + EMAIL_CONFIG.expectedRecipient + '?')) {
                window.location.href = 'mailto:' + EMAIL_CONFIG.expectedRecipient;
            }
        }
    });

});

document.addEventListener('visibilitychange',
    function () {
        if (document.visibilityState === "visible") {
            document.title = "Portfolio | Tony Siu";
            $("#favicon").attr("href", "assets/images/favicon.png");
        }
        else {
            document.title = "Come Back To Portfolio";
            $("#favicon").attr("href", "assets/images/favhand.png");
        }
    });


// <!-- typed js effect starts -->
var typed = new Typed(".typing-text", {
    strings: ["Multi-Modal Generative AI", "Computer Vision", "Natural Language Processing", "Data Engineering", "Statistical Optimization"],
    loop: true,
    typeSpeed: 50,
    backSpeed: 25,
    backDelay: 500,
});
// <!-- typed js effect ends -->

async function fetchData(type = "skills") {
    let response
    type === "skills" ?
        response = await fetch("skills.json")
        :
        response = await fetch("./projects/projects.json")
    const data = await response.json();
    return data;
}

function showSkills(skills) {
    let skillsContainer = document.getElementById("skillsContainer");
    let skillHTML = "";
    skills.forEach(skill => {
        skillHTML += `
        <div class="bar">
              <div class="info">
                <img src=${skill.icon} alt="skill" />
                <span>${skill.name}</span>
              </div>
            </div>`
    });
    skillsContainer.innerHTML = skillHTML;
}

function showProjects(projects) {
    let projectsContainer = document.querySelector("#work .box-container");
    let projectHTML = "";
    projects.slice(0, 10).filter(project => project.category != "android").forEach(project => {
        projectHTML += `
        <div class="box tilt">
      <img draggable="false" src="./assets/images/projects/${project.image}.png" alt="project" />
      <div class="content">
        <div class="tag">
        <h3>${project.name}</h3>
        </div>
        <div class="desc">
          <p>${project.desc}</p>
          <div class="btns">
            <a href="${project.links.view}" class="btn" target="_blank"><i class="fas fa-eye"></i> View</a>
            <a href="${project.links.code}" class="btn" target="_blank">Code <i class="fas fa-code"></i></a>
          </div>
        </div>
      </div>
    </div>`
    });
    projectsContainer.innerHTML = projectHTML;

    // Initialize VanillaTilt for dynamic projects
    VanillaTilt.init(document.querySelectorAll(".tilt"), { max: 15 });

    // Reveal dynamic project boxes using existing ScrollReveal instance
    srtop.reveal('.work .box', { interval: 200 });
}

fetchData().then(data => {
    showSkills(data);
});

fetchData("projects").then(data => {
    showProjects(data);
});

// Start of Tawk.to Live Chat
var Tawk_API = Tawk_API || {}, Tawk_LoadStart = new Date();
(function () {
    var s1 = document.createElement("script"), s0 = document.getElementsByTagName("script")[0];
    s1.async = true;
    s1.src = 'https://embed.tawk.to/60df10bf7f4b000ac03ab6a8/1f9jlirg6';
    s1.charset = 'UTF-8';
    s1.setAttribute('crossorigin', '*');
    s0.parentNode.insertBefore(s1, s0);
})();
// End of Tawk.to Live Chat


/* ===== SCROLL REVEAL ANIMATION ===== */
const srtop = ScrollReveal({
    origin: 'top',
    distance: '60px',
    duration: 800,
    reset: false, // Prevent repeated animations for better performance
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)', // Natural easing curve
    mobile: true,
    useDelay: 'onload',
    viewFactor: 0.2
});

/* SCROLL HOME */
srtop.reveal('.home .content h3', { delay: 200 });
srtop.reveal('.home .content p', { delay: 200 });
srtop.reveal('.home .content .btn', { delay: 200 });

srtop.reveal('.home .image', { delay: 400 });
srtop.reveal('.home .linkedin', { interval: 600 });
srtop.reveal('.home .github', { interval: 800 });
srtop.reveal('.home .twitter', { interval: 1000 });
srtop.reveal('.home .telegram', { interval: 600 });
srtop.reveal('.home .instagram', { interval: 600 });
srtop.reveal('.home .dev', { interval: 600 });

/* SCROLL ABOUT */
srtop.reveal('.about .content h3', { delay: 200 });
srtop.reveal('.about .content .tag', { delay: 200 });
srtop.reveal('.about .content p', { delay: 200 });
srtop.reveal('.about .content .box-container', { delay: 200 });
srtop.reveal('.about .content .resumebtn', { delay: 200 });

/* SCROLL SKILLS */
srtop.reveal('.skills .container', { interval: 200 });
srtop.reveal('.skills .container .bar', { delay: 400 });

/* SCROLL EDUCATION */
srtop.reveal('.education .box', { interval: 200 });

/* SCROLL EXPERIENCE */
srtop.reveal('.experience .timeline', { delay: 400 });
srtop.reveal('.experience .timeline .container', { interval: 400 });

/* SCROLL CONTACT */
srtop.reveal('.contact .container', { delay: 400 });
srtop.reveal('.contact .container .form-group', { delay: 400 });
