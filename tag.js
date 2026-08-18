import { initDial } from './dial.js';
import { SERVICES, findService } from './servicesData.js';

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
document.getElementById('tag-hero-title').textContent = tagName;
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
// SHOWCASE FILMSTRIP — real looping clips, hover to unmute
// ==========================================
const grid = document.getElementById('tag-grid');
let activeVideo = null;

service.videos.forEach((src, i) => {
  const item = document.createElement('div');
  item.className = 'tag-grid-item';
  const seconds = (12 + i * 17) % 60;
  const timecode = `00:${String(seconds).padStart(2, '0')}`;
  item.innerHTML = `
    <video src="${src}" poster="${service.gallery[i % service.gallery.length]}" muted loop playsinline autoplay preload="metadata"></video>
    <div class="tag-grid-overlay"></div>
    <div class="tag-grid-rec"><span class="tag-grid-dot"></span>REEL</div>
    <div class="tag-grid-timecode">${timecode}</div>
    <div class="tag-grid-label">${tagName} — 0${i + 1}</div>
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
