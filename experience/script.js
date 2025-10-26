$(document).ready(function(){

    $('#menu').click(function(){
        $(this).toggleClass('fa-times');
        $('.navbar').toggleClass('nav-toggle');
    });

    $(window).on('scroll load',function(){
        $('#menu').removeClass('fa-times');
        $('.navbar').removeClass('nav-toggle');

        if(window.scrollY>60){
            document.querySelector('#scroll-top').classList.add('active');
        }else{
            document.querySelector('#scroll-top').classList.remove('active');
        }
    });
});

/* ===== SCROLL REVEAL ANIMATION ===== */
const srtop = ScrollReveal({
    origin: 'top',
    distance: '80px',
    duration: 1000,
    reset: true
});

/* SCROLL EXPERIENCE */
srtop.reveal('.experience .timeline',{delay: 400});
srtop.reveal('.experience .timeline .timeline-item',{interval: 300}); 

// Build horizontal experience timeline from shared data
document.addEventListener('DOMContentLoaded', () => {
    const timelineContainer = document.getElementById('experience-timeline');
    if (!timelineContainer) return;

    fetch('../assets/data/experience.json')
        .then(response => response.json())
        .then(experiences => {
            timelineContainer.setAttribute('role', 'list');
            timelineContainer.setAttribute('aria-live', 'polite');

            const markup = experiences.map(item => {
                const positionClass = (item.side || '').toLowerCase() === 'right'
                    ? 'timeline-item--bottom'
                    : 'timeline-item--top';

                const iconSource = item.companyIcon && item.companyIcon.startsWith('./')
                    ? item.companyIcon.replace('./', '../')
                    : item.companyIcon;

                return `
                <article class="timeline-item ${positionClass}" role="listitem">
                    <div class="timeline-card">
                        <div class="tag">
                            <h2>
                                <img src="${iconSource}" alt="${item.alt}" class="company-icon">
                                ${item.company}
                            </h2>
                        </div>
                        <div class="desc">
                            <h3>${item.title}</h3>
                            <p>${item.period}</p>
                        </div>
                    </div>
                </article>`;
            }).join('');

            timelineContainer.innerHTML = markup;
            timelineContainer.dataset.timelineOrientation = 'horizontal';
        })
        .catch(error => console.error('Unable to load experience timeline:', error));
});


// Start of Tawk.to Live Chat
var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
(function(){
var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
s1.async=true;
s1.src='https://embed.tawk.to/60df10bf7f4b000ac03ab6a8/1f9jlirg6';
s1.charset='UTF-8';
s1.setAttribute('crossorigin','*');
s0.parentNode.insertBefore(s1,s0);
})();
// End of Tawk.to Live Chat



document.addEventListener('visibilitychange',
function(){
    if(document.visibilityState === "visible"){
        document.title = "Experience | Portfolio Tony Siu";
        $("#favicon").attr("href","/assets/images/favicon.png");
    }
    else {
        document.title = "Come Back To Portfolio";
        $("#favicon").attr("href","/assets/images/favhand.png");
    }
});
