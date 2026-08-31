import { initDial } from './dial.js';
import { SERVICES } from './servicesData.js';

// ==========================================
// 1. CARD DATA — the 7 real service categories only (no placeholder model
// photos). Each card opens that category's full reel on tag.html.
// ==========================================
// view=sphere — the Portfolio flow opens each category's reel as the
// Fibonacci-sphere 3D gallery; the Services flow (see services.js) opens
// the same category as a plain card grid instead. Same tag.html page,
// different presentation depending on where the visitor came from.
const photos = SERVICES.map((service) => ({
  src: service.img,
  name: service.title,
  href: `./tag.html?category=${encodeURIComponent(service.title)}&tag=All&view=sphere`,
}));

// ==========================================
// 2. BUILD GALLERY (triple the cards for seamless infinite loop)
// ==========================================
const track = document.getElementById('gallery-track');
const PLAY_ICON = `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" stroke="currentColor" stroke-width="1.3"/><path d="M10 8.5 16 12l-6 3.5v-7Z" fill="currentColor"/></svg>`;

// Create 3 copies for infinite scrolling
const allPhotos = [...photos, ...photos, ...photos];

allPhotos.forEach((photo) => {
  const card = document.createElement('div');
  card.className = 'photo-card video-card';
  card.innerHTML = `
    <img src="${photo.src}" alt="${photo.name}" loading="eager" />
    <div class="video-card-overlay"></div>
    <div class="video-card-rec"><span class="video-card-dot"></span>REEL</div>
    <div class="video-card-play" aria-hidden="true">${PLAY_ICON}</div>
    <div class="video-card-caption">${photo.name}</div>
  `;
  card.addEventListener('click', () => { window.location.href = photo.href; });
  track.appendChild(card);
});

const cards = document.querySelectorAll('.photo-card');

// Mirrors the .photo-card / .photo-gallery-track breakpoints in photo.css —
// the JS position math needs to match whatever CSS is actually rendering,
// since it doesn't read the computed layout back (see the earlier bug where
// getBoundingClientRect() fed a transform-feedback loop).
function getCardMetrics() {
  const w = window.innerWidth;
  if (w <= 480) return { widthPercent: 0.64, gap: 16, trackPaddingLeft: 19.2 };
  if (w <= 900) return { widthPercent: 0.60, gap: 16, trackPaddingLeft: 19.2 };
  return { widthPercent: 0.22, gap: 24, trackPaddingLeft: 32 };
}

let { gap, trackPaddingLeft } = getCardMetrics();
let cardWidth = window.innerWidth * getCardMetrics().widthPercent;
let singleSetWidth = photos.length * (cardWidth + gap);

// ==========================================
// 3. SCROLL STATE
// ==========================================
let scrollX = -singleSetWidth; // Start from middle set
let targetScrollX = scrollX;
let velocity = 0;
let prevScrollX = scrollX;

// ==========================================
// 4. WHEEL HANDLER
// ==========================================
window.addEventListener('wheel', (e) => {
  // Ignore scroll if hovering over the dial menu
  if (e.target.closest('.photo-page-menu')) return;
  ensureWindAudio();
  targetScrollX -= e.deltaY * 1.5; // Scroll sensitivity
}, { passive: true });

// Touch support — ignored over the dial so a thumb-swipe there rotates
// the dial (see dial.js) instead of also dragging the gallery underneath it
let touchStartX = 0;
window.addEventListener('touchstart', (e) => {
  if (e.target.closest('.photo-page-menu')) { touchStartX = null; return; }
  touchStartX = e.touches[0].clientX;
});
window.addEventListener('touchmove', (e) => {
  if (touchStartX === null) return;
  ensureWindAudio();
  const delta = touchStartX - e.touches[0].clientX;
  targetScrollX -= delta * 2;
  touchStartX = e.touches[0].clientX;
});

// ==========================================
// 4b. WIND WHOOSH — synthesized filtered-noise sound that swells with
// scroll speed and fades to silence at rest, rather than a repeated
// one-shot effect
// ==========================================
let windAudioCtx, windGain, windFilter;

function ensureWindAudio() {
  if (windAudioCtx) {
    if (windAudioCtx.state === 'suspended') windAudioCtx.resume();
    return;
  }
  windAudioCtx = new (window.AudioContext || window.webkitAudioContext)();

  const bufferSeconds = 2;
  const bufferSize = windAudioCtx.sampleRate * bufferSeconds;
  const buffer = windAudioCtx.createBuffer(1, bufferSize, windAudioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const noiseSource = windAudioCtx.createBufferSource();
  noiseSource.buffer = buffer;
  noiseSource.loop = true;

  windFilter = windAudioCtx.createBiquadFilter();
  windFilter.type = 'bandpass';
  windFilter.frequency.value = 350;
  windFilter.Q.value = 0.6;

  windGain = windAudioCtx.createGain();
  windGain.gain.value = 0;

  noiseSource.connect(windFilter);
  windFilter.connect(windGain);
  windGain.connect(windAudioCtx.destination);
  noiseSource.start();
}

// ==========================================
// 5. ANIMATION LOOP
// ==========================================
function animate() {
  requestAnimationFrame(animate);

  // Smooth interpolation
  scrollX += (targetScrollX - scrollX) * 0.07;

  // Calculate velocity for jelly effect
  velocity = scrollX - prevScrollX;
  prevScrollX = scrollX;

  // Wind swells with scroll speed and eases back to silence at rest
  if (windGain) {
    const speed = Math.min(Math.abs(velocity), 60);
    // sqrt curve instead of linear — boosts quiet/slow scrolling so it's
    // still audible, without pushing fast scrolling too loud
    const targetGain = speed > 0.3 ? Math.sqrt(speed / 60) * 0.14 : 0;
    windGain.gain.value += (targetGain - windGain.gain.value) * 0.08;
    windFilter.frequency.value = 300 + speed * 9;
  }

  // Infinite loop: wrap around when we've scrolled past one full set
  if (scrollX > 0) {
    scrollX -= singleSetWidth;
    targetScrollX -= singleSetWidth;
  } else if (scrollX < -singleSetWidth * 2) {
    scrollX += singleSetWidth;
    targetScrollX += singleSetWidth;
  }

  // Apply transform to track
  track.style.transform = `translateX(${scrollX}px)`;

  // ==========================================
  // 6. PER-CARD EFFECTS: 3D Perspective Escalator
  // ==========================================
  const viewportWidth = window.innerWidth;
  const viewportCenter = viewportWidth / 2;

  // A fixed perspective distance looks fine on a wide screen but sits
  // relatively "close" on a narrow window, exaggerating rotation far more
  // steeply — scaling it with viewport width keeps the tilt looking the
  // same regardless of window size
  const perspectivePx = Math.max(1400, viewportWidth * 2.2);

  // Clamp velocity for jelly effect
  const clampedVelocity = Math.max(-30, Math.min(30, velocity));

  cards.forEach((card, i) => {
    // Computed analytically from scroll state, NOT read back from the DOM.
    // getBoundingClientRect() would return the box *after* last frame's
    // rotateY/scale/skew was applied, feeding that distortion into this
    // frame's calculation — a feedback loop that compounds over many
    // frames until cards spin edge-on ("turn their face").
    const cardCenterX = trackPaddingLeft + i * (cardWidth + gap) + cardWidth / 2 + scrollX;

    // Normalize: -1 (far left) to +1 (far right)
    const normalizedPos = (cardCenterX - viewportCenter) / viewportCenter;
    const clampedPos = Math.max(-1.5, Math.min(1.5, normalizedPos));
    
    // --- 3D PERSPECTIVE TILT (rotateY) ---
    // Capped at 14/deg-per-unit (~21deg max) — any steeper and a narrow
    // portrait card reads as edge-on rather than gently receding
    const rotateY = Math.max(0, clampedPos) * 14;

    // --- SLIGHT Z ROTATION ---
    // Cards on the right also have a slight clockwise tilt
    const rotateZ = Math.max(0, clampedPos) * 3;

    // --- SCALE ---
    // Left = bigger, Right = smaller.
    const scale = 1.0 - Math.max(0, clampedPos) * 0.1;

    // --- VERTICAL OFFSET ---
    // Right cards sit slightly lower (descending stairs)
    const verticalOffset = Math.max(0, clampedPos) * 24;

    // --- JELLY BEND on fast scroll ---
    const skewAmount = clampedVelocity * 0.15;
    const distFromCenter = 1 - Math.abs(clampedPos) * 0.3;
    const cardSkew = skewAmount * distFromCenter;

    // Apply combined 3D transform
    card.style.transform = `
      perspective(${perspectivePx}px)
      scale(${scale})
      rotateY(${rotateY}deg)
      rotateZ(${rotateZ}deg)
      translateY(${verticalOffset}px)
      skewY(${cardSkew}deg)
    `;
  });
}

animate();

// ==========================================
// 7. RESIZE HANDLER — re-derive metrics when a breakpoint is actually
// crossed (not on every pixel of a drag-resize/rotate), rescaling scrollX
// by the same ratio so the currently-centered card stays centered instead
// of jumping to whatever raw pixel offset the old metrics left it at
// ==========================================
let lastMetricsBucket = window.innerWidth <= 480 ? 'small' : window.innerWidth <= 900 ? 'mid' : 'wide';
window.addEventListener('resize', () => {
  const bucket = window.innerWidth <= 480 ? 'small' : window.innerWidth <= 900 ? 'mid' : 'wide';
  if (bucket === lastMetricsBucket) return;
  lastMetricsBucket = bucket;

  const metrics = getCardMetrics();
  const newCardWidth = window.innerWidth * metrics.widthPercent;
  const newSingleSetWidth = photos.length * (newCardWidth + metrics.gap);
  const ratio = newSingleSetWidth / singleSetWidth;

  scrollX *= ratio;
  targetScrollX *= ratio;
  cardWidth = newCardWidth;
  gap = metrics.gap;
  trackPaddingLeft = metrics.trackPaddingLeft;
  singleSetWidth = newSingleSetWidth;
});

// ==========================================
// 8. MENU INTERACTION (Rainbow Arch) — shared dial module
// ==========================================
initDial();

// Sub-menu interaction remains flat text
const submenuItems = document.querySelectorAll('.submenu-item');
submenuItems.forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    submenuItems.forEach(si => si.classList.remove('active'));
    e.target.classList.add('active');
  });
});
