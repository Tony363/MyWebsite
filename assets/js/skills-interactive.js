/* Interactive Skills Visualization */

class InteractiveSkills {
  constructor() {
    this.skills = [
      // AI & ML
      { name: 'PyTorch', level: 95, category: 'ai', icon: '🔥', color: '#ee4c2c' },
      { name: 'TensorFlow', level: 90, category: 'ai', icon: '🧠', color: '#ff6f00' },
      { name: 'Computer Vision', level: 92, category: 'ai', icon: '👁️', color: '#0071e3' },
      { name: 'NLP', level: 88, category: 'ai', icon: '💬', color: '#5e5ce6' },
      { name: 'Generative AI', level: 94, category: 'ai', icon: '🎨', color: '#32ade6' },
      
      // Languages
      { name: 'Python', level: 96, category: 'lang', icon: '🐍', color: '#3776ab' },
      { name: 'JavaScript', level: 85, category: 'lang', icon: '⚡', color: '#f7df1e' },
      { name: 'TypeScript', level: 82, category: 'lang', icon: '📘', color: '#3178c6' },
      { name: 'C++', level: 78, category: 'lang', icon: '⚙️', color: '#00599c' },
      
      // Tools & Frameworks
      { name: 'Docker', level: 87, category: 'tools', icon: '🐳', color: '#2496ed' },
      { name: 'AWS', level: 83, category: 'tools', icon: '☁️', color: '#ff9900' },
      { name: 'Git', level: 92, category: 'tools', icon: '📚', color: '#f05032' },
      { name: 'React', level: 80, category: 'tools', icon: '⚛️', color: '#61dafb' },
      
      // Data
      { name: 'SQL', level: 88, category: 'data', icon: '🗃️', color: '#336791' },
      { name: 'MongoDB', level: 85, category: 'data', icon: '🍃', color: '#47a248' },
      { name: 'Pandas', level: 94, category: 'data', icon: '🐼', color: '#150458' },
      { name: 'NumPy', level: 93, category: 'data', icon: '🔢', color: '#013243' }
    ];
    
    this.currentFilter = 'all';
    this.init();
  }
  
  init() {
    this.renderSkills();
    this.addInteractivity();
    this.createFilterButtons();
  }
  
  renderSkills() {
    const container = document.getElementById('skillsContainer');
    if (!container) return;
    
    // Clear existing content
    container.innerHTML = '';
    
    // Create skills grid
    const skillsGrid = document.createElement('div');
    skillsGrid.className = 'skills-grid';
    skillsGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 30px;
      padding: 40px 0;
    `;
    
    this.skills.forEach((skill, index) => {
      if (this.currentFilter !== 'all' && skill.category !== this.currentFilter) {
        return;
      }
      
      const skillCard = this.createSkillCard(skill, index);
      skillsGrid.appendChild(skillCard);
    });
    
    container.appendChild(skillsGrid);
  }
  
  createSkillCard(skill, index) {
    const card = document.createElement('div');
    card.className = `skill-card interactive-card fade-in stagger-${(index % 5) + 1}`;
    card.dataset.category = skill.category;
    card.style.cssText = `
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 25px;
      background: linear-gradient(135deg, #ffffff, #f5f5f7);
      border-radius: 20px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.08);
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      overflow: hidden;
    `;
    
    // Create circular progress indicator
    const progressContainer = document.createElement('div');
    progressContainer.className = 'progress-container';
    progressContainer.style.cssText = `
      position: relative;
      width: 100px;
      height: 100px;
      margin-bottom: 15px;
    `;
    
    // SVG circular progress
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100');
    svg.setAttribute('height', '100');
    svg.style.transform = 'rotate(-90deg)';
    
    // Background circle
    const bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    bgCircle.setAttribute('cx', '50');
    bgCircle.setAttribute('cy', '50');
    bgCircle.setAttribute('r', '45');
    bgCircle.setAttribute('fill', 'none');
    bgCircle.setAttribute('stroke', '#e8e8ed');
    bgCircle.setAttribute('stroke-width', '8');
    
    // Progress circle
    const progressCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    progressCircle.setAttribute('cx', '50');
    progressCircle.setAttribute('cy', '50');
    progressCircle.setAttribute('r', '45');
    progressCircle.setAttribute('fill', 'none');
    progressCircle.setAttribute('stroke', skill.color);
    progressCircle.setAttribute('stroke-width', '8');
    progressCircle.setAttribute('stroke-linecap', 'round');
    
    const circumference = 2 * Math.PI * 45;
    const offset = circumference - (skill.level / 100) * circumference;
    
    progressCircle.style.strokeDasharray = circumference;
    progressCircle.style.strokeDashoffset = circumference;
    progressCircle.style.transition = 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)';
    
    svg.appendChild(bgCircle);
    svg.appendChild(progressCircle);
    progressContainer.appendChild(svg);
    
    // Icon in center
    const iconContainer = document.createElement('div');
    iconContainer.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 32px;
      transition: transform 0.3s ease;
    `;
    iconContainer.textContent = skill.icon;
    progressContainer.appendChild(iconContainer);
    
    // Skill name
    const skillName = document.createElement('h3');
    skillName.style.cssText = `
      font-size: 14px;
      font-weight: 600;
      color: #1d1d1f;
      margin-bottom: 5px;
      text-align: center;
    `;
    skillName.textContent = skill.name;
    
    // Skill level (hidden by default)
    const skillLevel = document.createElement('span');
    skillLevel.className = 'skill-level';
    skillLevel.style.cssText = `
      font-size: 24px;
      font-weight: 700;
      color: ${skill.color};
      opacity: 0;
      transform: translateY(10px);
      transition: all 0.3s ease;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    `;
    skillLevel.textContent = `${skill.level}%`;
    
    // Hover effects
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-5px) scale(1.05)';
      card.style.boxShadow = `0 10px 30px ${skill.color}30`;
      iconContainer.style.transform = 'translate(-50%, -50%) scale(1.2)';
      iconContainer.style.opacity = '0';
      skillLevel.style.opacity = '1';
      skillLevel.style.transform = 'translate(-50%, -50%)';
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0) scale(1)';
      card.style.boxShadow = '0 4px 15px rgba(0,0,0,0.08)';
      iconContainer.style.transform = 'translate(-50%, -50%) scale(1)';
      iconContainer.style.opacity = '1';
      skillLevel.style.opacity = '0';
      skillLevel.style.transform = 'translate(-50%, -40%)';
    });
    
    // Click effect
    card.addEventListener('click', () => {
      this.createRipple(card, skill.color);
    });
    
    card.appendChild(progressContainer);
    card.appendChild(skillName);
    progressContainer.appendChild(skillLevel);
    
    // Trigger animation on scroll
    setTimeout(() => {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              progressCircle.style.strokeDashoffset = offset;
            }, index * 50);
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });
      
      observer.observe(card);
    }, 100);
    
    return card;
  }
  
  createFilterButtons() {
    const skillsSection = document.querySelector('.skills .container');
    if (!skillsSection) return;
    
    const filterContainer = document.createElement('div');
    filterContainer.className = 'skill-filters';
    filterContainer.style.cssText = `
      display: flex;
      justify-content: center;
      gap: 15px;
      margin-bottom: 40px;
      flex-wrap: wrap;
    `;
    
    const filters = [
      { label: 'All', value: 'all', icon: '🎯' },
      { label: 'AI/ML', value: 'ai', icon: '🤖' },
      { label: 'Languages', value: 'lang', icon: '💻' },
      { label: 'Tools', value: 'tools', icon: '🛠️' },
      { label: 'Data', value: 'data', icon: '📊' }
    ];
    
    filters.forEach(filter => {
      const button = document.createElement('button');
      button.className = `filter-btn ${filter.value === 'all' ? 'active' : ''}`;
      button.dataset.filter = filter.value;
      button.style.cssText = `
        padding: 12px 24px;
        background: ${filter.value === 'all' ? 'var(--gradient-accent)' : '#f5f5f7'};
        color: ${filter.value === 'all' ? '#fff' : '#1d1d1f'};
        border: none;
        border-radius: 980px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 8px;
      `;
      
      button.innerHTML = `<span>${filter.icon}</span> ${filter.label}`;
      
      button.addEventListener('click', () => {
        this.filterSkills(filter.value);
        
        // Update active state
        document.querySelectorAll('.filter-btn').forEach(btn => {
          btn.classList.remove('active');
          btn.style.background = '#f5f5f7';
          btn.style.color = '#1d1d1f';
        });
        
        button.classList.add('active');
        button.style.background = 'var(--gradient-accent)';
        button.style.color = '#fff';
      });
      
      filterContainer.appendChild(button);
    });
    
    skillsSection.insertBefore(filterContainer, skillsSection.firstChild);
  }
  
  filterSkills(category) {
    this.currentFilter = category;
    this.renderSkills();
  }
  
  createRipple(element, color) {
    const ripple = document.createElement('span');
    ripple.style.cssText = `
      position: absolute;
      border-radius: 50%;
      background: ${color}40;
      transform: scale(0);
      animation: rippleEffect 0.6s ease-out;
      pointer-events: none;
    `;
    
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = '50%';
    ripple.style.top = '50%';
    ripple.style.transform = 'translate(-50%, -50%)';
    
    element.appendChild(ripple);
    
    setTimeout(() => ripple.remove(), 600);
  }
  
  addInteractivity() {
    // Add keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key >= '1' && e.key <= '5') {
        const filterButtons = document.querySelectorAll('.filter-btn');
        const index = parseInt(e.key) - 1;
        if (filterButtons[index]) {
          filterButtons[index].click();
        }
      }
    });
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new InteractiveSkills();
});

// Add ripple effect styles
const style = document.createElement('style');
style.textContent = `
  @keyframes rippleEffect {
    to {
      transform: translate(-50%, -50%) scale(4);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);