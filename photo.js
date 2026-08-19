import { initDial } from './dial.js';

// ==========================================
// 1. IMAGE DATA
// ==========================================
const photos = [
  { src: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&q=80', name: 'Elle' },
  { src: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&q=80', name: 'Sophia' },
  { src: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&q=80', name: 'Arianna' },
  {
    src: 'https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?w=600&q=80',
    name: 'Video Services',
    isVideo: true,
    href: './video-services.html',
  },
  { src: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&q=80', name: 'Marcus' },
  { src: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&q=80', name: 'Mai' },
  { src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&q=80', name: 'Luna' },
  { src: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600&q=80', name: 'Jade' },
  { src: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&q=80', name: 'Rosa' },
  { src: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=600&q=80', name: 'Ava' },
  { src: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&q=80', name: 'Daniel' },
  { src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80', name: 'James' },
  { src: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600&q=80', name: 'Nina' },
  { src: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?w=600&q=80', name: 'Alex' },
  { src: 'https://images.unsplash.com/photo-1496345875659-11f7dd282d1d?w=600&q=80', name: 'Chris' },
];

// ==========================================
// 2. BUILD GALLERY (triple the images for seamless infinite loop)
// ==========================================
const track = document.getElementById('gallery-track');

// Create 3 copies for infinite scrolling
const allPhotos = [...photos, ...photos, ...photos];

allPhotos.forEach((photo) => {
  const card = document.createElement('div');
  card.className = photo.isVideo ? 'photo-card video-card' : 'photo-card';
  card.innerHTML = `
    <img src="${photo.src}" alt="${photo.name}" loading="eager" />
    <div class="photo-card-name">${photo.name}</div>
    ${photo.isVideo ? `
      <div class="video-card-overlay"></div>
      <div class="video-card-play" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" stroke="currentColor" stroke-width="1.3"/><path d="M10 8.5 16 12l-6 3.5v-7Z" fill="currentColor"/></svg>
      </div>
    ` : ''}
  `;
  if (photo.isVideo) {
    card.addEventListener('click', () => { window.location.href = photo.href; });
  }
  track.appendChild(card);
});

const cards = document.querySelectorAll('.photo-card');

// Mirrors the .photo-card / .photo-gallery-track breakpoints in photo.css —
// the JS position math needs to match whatever CSS is actually rendering,
// since it doesn't read the computed layout back (see the earlier bug where
// getBoundingClientRect() fed a transform-feedback loop).
function getCardMetrics() {
  const w = window.innerWidth;
  if (w <= 480) return { widthPercent: 0.74, gap: 16, trackPaddingLeft: 19.2 };
  if (w <= 900) return { widthPercent: 0.62, gap: 16, trackPaddingLeft: 19.2 };
  return { widthPercent: 0.22, gap: 24, trackPaddingLeft: 32 };
}

const { widthPercent, gap, trackPaddingLeft } = getCardMetrics();
const cardWidth = window.innerWidth * widthPercent;
const singleSetWidth = photos.length * (cardWidth + gap);

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

// Touch support
let touchStartX = 0;
window.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
});
window.addEventListener('touchmove', (e) => {
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
// 7. RESIZE HANDLER
// ==========================================
window.addEventListener('resize', () => {
  // Recalculate on resize if needed
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
