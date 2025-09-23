document.addEventListener('DOMContentLoaded', function() {
    fetch('/partials/header.html')
        .then(res => res.text())
        .then(html => document.getElementById('header-placeholder').innerHTML = html);
    fetch('/partials/footer.html')
        .then(res => res.text())
        .then(html => document.getElementById('footer-placeholder').innerHTML = html);

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

    $('#menu').click(function () {
        $(this).toggleClass('fa-times');
        $('.navbar').toggleClass('nav-toggle');
    });

    $(window).on('scroll load', function () {
        $('#menu').removeClass('fa-times');
        $('.navbar').removeClass('nav-toggle');

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

    // Contact form handler - improved security
    $("#contact-form").submit(function (event) {
        event.preventDefault();
        
        // Initialize EmailJS (consider moving to environment variables in production)
        // For production, use server-side form handling instead
        try {
            emailjs.init("user_TTDmetQLYgWCLzHTDgqxm");
            
            // Show loading state
            const submitBtn = $(this).find('button[type="submit"]');
            const originalText = submitBtn.html();
            submitBtn.html('<i class="fas fa-spinner fa-spin"></i> Sending...');
            submitBtn.prop('disabled', true);
            
            emailjs.sendForm('contact_service', 'template_contact', '#contact-form')
                .then(function (response) {
                    document.getElementById("contact-form").reset();
                    // Better user feedback
                    submitBtn.html('<i class="fas fa-check"></i> Sent Successfully!');
                    setTimeout(() => {
                        submitBtn.html(originalText);
                        submitBtn.prop('disabled', false);
                    }, 3000);
                }, function (error) {
                    // Better error handling
                    submitBtn.html('<i class="fas fa-exclamation-triangle"></i> Failed to Send');
                    setTimeout(() => {
                        submitBtn.html(originalText);
                        submitBtn.prop('disabled', false);
                    }, 3000);
                });
        } catch (error) {
            // Log error for debugging in development only
            if (process.env.NODE_ENV !== 'production' && typeof console !== 'undefined') {
                console.error('Form submission error:', error);
            }
            alert("Form submission failed. Please try again later.");
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