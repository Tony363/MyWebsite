/* Interactive Project Showcase with Apple-style Effects */

class InteractiveProjects {
  constructor() {
    this.projects = [];
    this.currentFilter = '*';
    this.init();
  }

  init() {
    this.loadProjects();
    this.enhanceProjectCards();
    this.setupFilterAnimation();
    this.addKeyboardNavigation();
  }

  loadProjects() {
    // Sample project data - replace with actual projects
    const projectData = [
      {
        title: 'Multi-Modal AI Research',
        category: 'mult',
        description: 'Advanced generative AI system combining vision and language models',
        image: './assets/images/projects/googlecv.png',
        tags: ['PyTorch', 'Transformers', 'Computer Vision'],
        github: 'https://github.com/Tony363',
        demo: '#'
      },
      {
        title: 'Computer Vision Suite',
        category: 'cv',
        description: 'Comprehensive CV testing framework for Google Pixel devices',
        image: './assets/images/projects/hackharvard.png',
        tags: ['OpenCV', 'TensorFlow', 'Python'],
        github: 'https://github.com/Tony363',
        demo: '#'
      },
      {
        title: 'Portfolio Website',
        category: 'webapps',
        description: 'Modern portfolio with Apple-inspired design and interactions',
        image: './assets/images/projects/bootstrapportfolio.png',
        tags: ['JavaScript', 'CSS3', 'HTML5'],
        github: 'https://github.com/Tony363',
        demo: '#'
      }
    ];

    const container = document.querySelector('.work .box-container');
    if (!container) return;

    projectData.forEach((project, index) => {
      const card = this.createProjectCard(project, index);
      container.appendChild(card);
    });
  }

  createProjectCard(project, index) {
    const box = document.createElement('div');
    box.className = `box tilt interactive-card ${project.category}`;
    box.dataset.category = project.category;
    box.style.opacity = '0';
    box.style.transform = 'translateY(30px)';
    
    // Image container with overlay
    const imageContainer = document.createElement('div');
    imageContainer.className = 'image-container';
    imageContainer.style.cssText = `
      position: relative;
      overflow: hidden;
      height: 250px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    `;
    
    const img = document.createElement('img');
    img.src = project.image || './assets/images/projects/default.jpg';
    img.alt = project.title;
    img.loading = 'lazy';
    img.style.cssText = `
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    `;
    
    // Hover overlay
    const overlay = document.createElement('div');
    overlay.className = 'project-overlay';
    overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 113, 227, 0.9);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      opacity: 0;
      transition: opacity 0.3s ease;
      color: white;
      padding: 20px;
    `;
    
    // Tags in overlay
    const tagsContainer = document.createElement('div');
    tagsContainer.style.cssText = `
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      justify-content: center;
      margin-bottom: 20px;
    `;
    
    project.tags.forEach(tag => {
      const tagSpan = document.createElement('span');
      tagSpan.textContent = tag;
      tagSpan.style.cssText = `
        padding: 6px 12px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 20px;
        font-size: 12px;
        backdrop-filter: blur(10px);
      `;
      tagsContainer.appendChild(tagSpan);
    });
    
    overlay.appendChild(tagsContainer);
    
    // View details button
    const viewBtn = document.createElement('button');
    viewBtn.textContent = 'View Details';
    viewBtn.className = 'btn-premium';
    viewBtn.style.cssText = `
      padding: 10px 20px;
      background: white;
      color: #0071e3;
      border: none;
      border-radius: 20px;
      font-weight: 500;
      cursor: pointer;
      transition: transform 0.2s ease;
    `;
    
    viewBtn.addEventListener('mouseenter', () => {
      viewBtn.style.transform = 'scale(1.05)';
    });
    
    viewBtn.addEventListener('mouseleave', () => {
      viewBtn.style.transform = 'scale(1)';
    });
    
    overlay.appendChild(viewBtn);
    
    imageContainer.appendChild(img);
    imageContainer.appendChild(overlay);
    
    // Content section
    const content = document.createElement('div');
    content.className = 'content';
    content.style.cssText = `
      padding: 25px;
      background: white;
    `;
    
    const tag = document.createElement('div');
    tag.className = 'tag';
    tag.style.cssText = `
      margin-bottom: 15px;
    `;
    
    const title = document.createElement('h3');
    title.textContent = project.title;
    title.style.cssText = `
      font-size: 20px;
      font-weight: 600;
      color: #1d1d1f;
      margin-bottom: 10px;
    `;
    
    tag.appendChild(title);
    
    const desc = document.createElement('div');
    desc.className = 'desc';
    
    const description = document.createElement('p');
    description.textContent = project.description;
    description.style.cssText = `
      color: #86868b;
      font-size: 14px;
      line-height: 1.6;
      margin-bottom: 20px;
    `;
    
    const btns = document.createElement('div');
    btns.className = 'btns';
    btns.style.cssText = `
      display: flex;
      gap: 10px;
    `;
    
    const viewLink = document.createElement('a');
    viewLink.href = project.demo;
    viewLink.className = 'btn';
    viewLink.target = '_blank';
    viewLink.innerHTML = '<i class="fas fa-eye"></i> View';
    viewLink.style.cssText = `
      padding: 8px 16px;
      background: #0071e3;
      color: white;
      border-radius: 20px;
      text-decoration: none;
      font-size: 14px;
      transition: all 0.3s ease;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    `;
    
    const codeLink = document.createElement('a');
    codeLink.href = project.github;
    codeLink.className = 'btn';
    codeLink.target = '_blank';
    codeLink.innerHTML = 'Code <i class="fas fa-code"></i>';
    codeLink.style.cssText = `
      padding: 8px 16px;
      background: transparent;
      color: #0071e3;
      border: 1px solid #0071e3;
      border-radius: 20px;
      text-decoration: none;
      font-size: 14px;
      transition: all 0.3s ease;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    `;
    
    // Hover effects
    box.addEventListener('mouseenter', () => {
      img.style.transform = 'scale(1.1)';
      overlay.style.opacity = '1';
      box.style.transform = 'translateY(-10px) scale(1.02)';
      box.style.boxShadow = '0 20px 40px rgba(0,0,0,0.15)';
    });
    
    box.addEventListener('mouseleave', () => {
      img.style.transform = 'scale(1)';
      overlay.style.opacity = '0';
      box.style.transform = 'translateY(0) scale(1)';
      box.style.boxShadow = '0 4px 15px rgba(0,0,0,0.08)';
    });
    
    // Assemble card
    btns.appendChild(viewLink);
    btns.appendChild(codeLink);
    desc.appendChild(description);
    desc.appendChild(btns);
    content.appendChild(tag);
    content.appendChild(desc);
    box.appendChild(imageContainer);
    box.appendChild(content);
    
    // Animate in with delay
    setTimeout(() => {
      box.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
      box.style.opacity = '1';
      box.style.transform = 'translateY(0)';
    }, index * 100);
    
    return box;
  }

  enhanceProjectCards() {
    // Add tilt effect to existing cards
    const cards = document.querySelectorAll('.work .box');

    // Detect touch device
    const isTouchDevice = ('ontouchstart' in window) ||
                         (navigator.maxTouchPoints > 0) ||
                         (navigator.msMaxTouchPoints > 0);

    cards.forEach(card => {
      if (!isTouchDevice) {
        // Desktop: tilt effect on mouse move
        card.addEventListener('mousemove', (e) => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;

          const centerX = rect.width / 2;
          const centerY = rect.height / 2;

          const rotateX = ((y - centerY) / centerY) * 5;
          const rotateY = ((centerX - x) / centerX) * 5;

          card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
        });

        card.addEventListener('mouseleave', () => {
          card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
        });
      } else {
        // Touch devices: click/tap to toggle expanded state
        const contentElement = card.querySelector('.content');
        const tagElement = card.querySelector('.tag');

        if (tagElement) {
          tagElement.style.cursor = 'pointer';
          tagElement.addEventListener('click', (e) => {
            e.stopPropagation();
            card.classList.toggle('expanded');

            // Close other expanded cards
            cards.forEach(otherCard => {
              if (otherCard !== card) {
                otherCard.classList.remove('expanded');
              }
            });
          });
        }
      }
    });
  }

  setupFilterAnimation() {
    const filterButtons = document.querySelectorAll('#filters button');
    
    filterButtons.forEach(button => {
      button.addEventListener('click', () => {
        const filter = button.dataset.filter;
        this.currentFilter = filter;
        
        // Update active state
        filterButtons.forEach(btn => {
          btn.classList.remove('is-checked');
          btn.style.background = '#f5f5f7';
          btn.style.color = '#1d1d1f';
        });
        
        button.classList.add('is-checked');
        button.style.background = 'var(--gradient-accent)';
        button.style.color = 'white';
        
        // Animate filter transition
        this.filterProjects(filter);
      });
    });
  }

  filterProjects(filter) {
    const projects = document.querySelectorAll('.work .box');
    
    projects.forEach((project, index) => {
      const category = project.dataset.category;
      
      if (filter === '*' || project.classList.contains(filter.replace('.', ''))) {
        // Show project
        project.style.display = 'block';
        setTimeout(() => {
          project.style.opacity = '1';
          project.style.transform = 'scale(1) translateY(0)';
        }, index * 50);
      } else {
        // Hide project
        project.style.opacity = '0';
        project.style.transform = 'scale(0.9) translateY(20px)';
        setTimeout(() => {
          project.style.display = 'none';
        }, 300);
      }
    });
  }

  addKeyboardNavigation() {
    let focusedIndex = -1;
    const projects = document.querySelectorAll('.work .box');
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' && focusedIndex < projects.length - 1) {
        focusedIndex++;
        projects[focusedIndex].focus();
        projects[focusedIndex].style.outline = '2px solid #0071e3';
      } else if (e.key === 'ArrowLeft' && focusedIndex > 0) {
        focusedIndex--;
        projects[focusedIndex].focus();
        projects[focusedIndex].style.outline = '2px solid #0071e3';
      } else if (e.key === 'Enter' && focusedIndex >= 0) {
        const viewBtn = projects[focusedIndex].querySelector('.btns a');
        if (viewBtn) viewBtn.click();
      }
    });
    
    projects.forEach((project, index) => {
      project.setAttribute('tabindex', '0');
      project.addEventListener('focus', () => {
        focusedIndex = index;
      });
      project.addEventListener('blur', () => {
        project.style.outline = 'none';
      });
    });
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const projectsSection = document.querySelector('.work');
  if (projectsSection) {
    new InteractiveProjects();
  }
});