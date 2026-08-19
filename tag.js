import { initDial } from './dial.js';
import { SERVICES, findService } from './servicesData.js';

// Dynamically imported — see video-services.js for why (a ~340KB gzipped
// p5.js + vanta chunk shouldn't block this page's own content from rendering)
import('./vantaTopology.js').then(({ initVantaTopology }) => {
  initVantaTopology('#vanta-bg');
});

const params = new URLSearchParams(window.location.search);
const categoryName = params.get('category') || SERVICES[0].title;
const tagName = params.get('tag') || SERVICES[0].tags[0];
const service = findService(categoryName) || SERVICES[0];

// ==========================================
// BREADCRUMB
// ==========================================
document.getElementById('tag-breadcrumb-category').textContent = service.title;
document.getElementById('tag-breadcrumb-category').setAttribute('href', './video-services.html');
document.getElementById('tag-breadcrumb-current').textContent = tagName;
document.title = `${tagName} | ${service.title} | 213 MEECH`;

// ==========================================
// HERO REEL — autoplaying muted background video behind the title
// ==========================================
const heroVideo = document.getElementById('tag-hero-video');
heroVideo.src = service.heroVideo;
heroVideo.poster = service.gallery[0];

document.getElementById('tag-hero-eyebrow').textContent = `${service.title} — Video Showcase`;
const heroTitleEl = document.getElementById('tag-hero-title');
heroTitleEl.textContent = tagName;
heroTitleEl.setAttribute('data-text', tagName); // read by the ::before/::after glitch layers
document.getElementById('tag-hero-blurb').textContent =
  `A look at our ${tagName.toLowerCase()} work within ${service.title.toLowerCase()}. ${service.blurb}`;

const muteToggle = document.getElementById('tag-hero-mute');
let heroMuted = true;
muteToggle.addEventListener('click', () => {
  heroMuted = !heroMuted;
  heroVideo.muted = heroMuted;
  muteToggle.classList.toggle('is-muted', heroMuted);
});

// ==========================================
// SHOWCASE WALL — real looping clips in a float-column layout. Positioning
// is plain CSS (see .tag-grid-item's nth-child rules in tag.css) — no JS
// math needed; that's the actual technique the reference site uses too.
// ==========================================
const grid = document.getElementById('tag-grid');
let activeVideo = null;

service.videos.forEach((src, i) => {
  const item = document.createElement('div');
  item.className = 'tag-grid-item';
  const seconds = (12 + i * 17) % 60;
  const timecode = `00:${String(seconds).padStart(2, '0')}`;
  item.innerHTML = `
    <div class="tag-grid-tilt">
      <video src="${src}" poster="${service.gallery[i % service.gallery.length]}" muted loop playsinline autoplay preload="metadata"></video>
      <div class="tag-grid-overlay"></div>
      <div class="tag-grid-rec"><span class="tag-grid-dot"></span>REEL</div>
      <div class="tag-grid-timecode">${timecode}</div>
      <figcaption class="tag-grid-caption">
        <h3>${tagName} — ${String(i + 1).padStart(2, '0')}</h3>
        <small>${service.title}</small>
      </figcaption>
    </div>
  `;

  const video = item.querySelector('video');
  item.addEventListener('mouseenter', () => {
    if (activeVideo && activeVideo !== video) activeVideo.muted = true;
    video.muted = false;
    activeVideo = video;
  });
  item.addEventListener('mouseleave', () => {
    video.muted = true;
    if (activeVideo === video) activeVideo = null;
  });

  grid.appendChild(item);
});

// ==========================================
// MAGNETIC TILT — the card leans toward the cursor like it's being pulled,
// tracking mouse position relative to the card's own center
// ==========================================
function initMagneticTilt(wrapper, tiltEl) {
  const MAX_TILT = 12; // degrees

  wrapper.addEventListener('mousemove', (e) => {
    const rect = wrapper.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    // Flipped so the edge nearest the cursor lifts toward it (attract),
    // rather than tilting away from it (repel)
    const rotateY = (0.5 - px) * MAX_TILT * 2;
    const rotateX = (py - 0.5) * MAX_TILT * 2;

    tiltEl.style.transition = 'transform 0.05s linear';
    tiltEl.style.transform = `perspective(700px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.04, 1.04, 1.04)`;
  });

  wrapper.addEventListener('mouseleave', () => {
    tiltEl.style.transition = 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)';
    tiltEl.style.transform = 'perspective(700px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
  });
}

document.querySelectorAll('.tag-grid-item').forEach((item) => {
  initMagneticTilt(item, item.querySelector('.tag-grid-tilt'));
});

// ==========================================
// SCROLL REVEAL
// ==========================================
const items = document.querySelectorAll('.tag-grid-item');
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
items.forEach(item => observer.observe(item));

// ==========================================
// SHARED NAV DIAL
// ==========================================
initDial();
