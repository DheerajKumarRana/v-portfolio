import { gsap } from 'gsap';
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
const cardWidth = window.innerWidth * 0.22; // 22vw
const gap = 32; // 2rem ≈ 32px
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
  targetScrollX -= e.deltaY * 1.5; // Scroll sensitivity
}, { passive: true });

// Touch support
let touchStartX = 0;
window.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
});
window.addEventListener('touchmove', (e) => {
  const delta = touchStartX - e.touches[0].clientX;
  targetScrollX -= delta * 2;
  touchStartX = e.touches[0].clientX;
});

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
  
  // Clamp velocity for jelly effect
  const clampedVelocity = Math.max(-30, Math.min(30, velocity));
  
  cards.forEach((card) => {
    const rect = card.getBoundingClientRect();
    const cardCenterX = rect.left + rect.width / 2;

    // Normalize: -1 (far left) to +1 (far right)
    const normalizedPos = (cardCenterX - viewportCenter) / viewportCenter;
    const clampedPos = Math.max(-1.5, Math.min(1.5, normalizedPos));
    
    // --- 3D PERSPECTIVE TILT (rotateY) ---
    // Reduced from 45 to 30 so the far right images don't get too thin/squished
    const rotateY = Math.max(0, clampedPos) * 32;
    
    // --- SLIGHT Z ROTATION ---
    // Cards on the right also have a slight clockwise tilt
    const rotateZ = Math.max(0, clampedPos) * 4;
    
    // --- SCALE ---
    // Left = bigger, Right = smaller. Made it scale down faster on the right side.
    const scale = 1.0 - Math.max(0, clampedPos) * 0.15;
    
    // --- VERTICAL OFFSET ---
    // Right cards sit slightly lower (descending stairs)
    const verticalOffset = Math.max(0, clampedPos) * 30;

    // --- JELLY BEND on fast scroll ---
    const skewAmount = clampedVelocity * 0.15;
    const distFromCenter = 1 - Math.abs(clampedPos) * 0.3;
    const cardSkew = skewAmount * distFromCenter;

    // Apply combined 3D transform
    card.style.transform = `
      perspective(1200px)
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
