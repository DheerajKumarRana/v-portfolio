import { initDial } from './dial.js';
import { SERVICES } from './servicesData.js';

// Dynamically imported — vantaTopology.js pulls in p5.js + vanta, a ~340KB
// gzipped chunk. Loading it lazily instead of as a static import means the
// browser doesn't have to fetch/parse/execute all of that before this
// script's actual content (the category list below) can render.
import('./vantaTopology.js').then(({ initVantaTopology }) => {
  // Light palette — this page is editorial/light, unlike tag.html's dark reel
  initVantaTopology('#vanta-bg', { backgroundColor: 0xf4f4f4, color: 0xb9c9dd });
});

// ==========================================
// RENDER
// ==========================================
const list = document.getElementById('vs-list');

SERVICES.forEach((service, i) => {
  const section = document.createElement('section');
  section.className = 'vs-section';
  section.innerHTML = `
    <div class="vs-index">${String(i + 1).padStart(2, '0')}</div>
    <div class="vs-media">
      <img src="${service.img}" alt="${service.title}" loading="lazy" />
      <div class="vs-media-caption">${service.title}</div>
    </div>
    <div class="vs-content">
      <h2 class="vs-title">${service.title}</h2>
      <p class="vs-blurb">${service.blurb}</p>
      <div class="vs-tags">
        ${service.tags.map(tag => `
          <a href="./tag.html?category=${encodeURIComponent(service.title)}&tag=${encodeURIComponent(tag)}" class="vs-tag">
            <span class="vs-tag-fill"></span>
            <span class="vs-tag-label">${tag}</span>
          </a>
        `).join('')}
      </div>
    </div>
  `;
  list.appendChild(section);
});

// ==========================================
// HOVER-TO-FILL TAGS
// Hold the hover until the fill completes to open that tag's showcase.
// Moving away early reverses the fill and cancels navigation.
// Touch devices have no hover state to fill, so they fall back to a normal tap.
// ==========================================
const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

document.querySelectorAll('.vs-tag').forEach((tag) => {
  const fill = tag.querySelector('.vs-tag-fill');
  if (canHover) tag.addEventListener('click', (e) => e.preventDefault());
  fill.addEventListener('transitionend', (e) => {
    if (e.propertyName === 'transform' && tag.matches(':hover')) {
      window.location.href = tag.getAttribute('href');
    }
  });
});

// ==========================================
// SCROLL REVEAL
// ==========================================
const sections = document.querySelectorAll('.vs-section');
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

sections.forEach(section => observer.observe(section));

// ==========================================
// SHARED NAV DIAL
// ==========================================
initDial();
