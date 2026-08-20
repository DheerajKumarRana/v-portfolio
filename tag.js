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
document.getElementById('tag-hero-backdrop').style.backgroundImage = `url(${service.gallery[0]})`;

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
// SHOWCASE WALL — real clips in a float-column layout. Positioning is plain
// CSS (see .tag-grid-item's nth-child rules in tag.css) — no JS math
// needed; that's the actual technique the reference site uses too.
//
// Each card is paused/muted at rest — it plays on hover and pauses again
// when you leave, with its own mute/unmute button independent of hover so
// you can choose to keep listening without needing to hold the cursor there.
// ==========================================
const grid = document.getElementById('tag-grid');
const canHoverGrid = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

const MUTE_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M4 9.5v5h3.5L12 18V6L7.5 9.5H4Z"/>
  <path class="mute-line" d="M17 8.5 21 15.5M21 8.5 17 15.5"/>
  <path class="wave-line" d="M16 9.2a4 4 0 0 1 0 5.6M18.5 7a7.5 7.5 0 0 1 0 10"/>
</svg>`;

service.videos.forEach((src, i) => {
  const item = document.createElement('div');
  item.className = 'tag-grid-item';
  const seconds = (12 + i * 17) % 60;
  const timecode = `00:${String(seconds).padStart(2, '0')}`;
  item.innerHTML = `
    <div class="tag-grid-tilt">
      <video data-src="${src}" poster="${service.gallery[i % service.gallery.length]}" muted loop playsinline preload="none"></video>
      <div class="tag-grid-overlay"></div>
      <div class="tag-grid-rec"><span class="tag-grid-dot"></span>REEL</div>
      <div class="tag-grid-timecode">${timecode}</div>
      <button class="tag-grid-mute is-muted" aria-label="Toggle sound">${MUTE_ICON}</button>
      <figcaption class="tag-grid-caption">
        <h3>${tagName} — ${String(i + 1).padStart(2, '0')}</h3>
        <small>${service.title}</small>
      </figcaption>
    </div>
  `;

  const video = item.querySelector('video');
  const muteBtn = item.querySelector('.tag-grid-mute');

  // No src attribute at all until the moment it's actually needed — with 20
  // clips in a single category, giving every <video> a src up front means
  // 20 simultaneous metadata fetches on page load. The poster (already a
  // separate lightweight image request) covers the resting-state look.
  function loadVideoSrc() {
    if (!video.src) video.src = video.dataset.src;
  }

  muteBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // don't let the click also register as a tilt/hover interaction
    video.muted = !video.muted;
    muteBtn.classList.toggle('is-muted', video.muted);
  });

  if (canHoverGrid) {
    item.addEventListener('mouseenter', () => {
      loadVideoSrc();
      video.currentTime = 0;
      video.play().catch(() => {});
    });
    item.addEventListener('mouseleave', () => {
      video.pause();
    });
  } else {
    // No hover on touch — fall back to autoplay-when-visible like before,
    // so the wall still feels alive instead of a grid of frozen posters.
    // Still lazy: only loads the src once it's actually about to be seen.
    const playObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          loadVideoSrc();
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    }, { threshold: 0.6 });
    playObserver.observe(item);
  }

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
