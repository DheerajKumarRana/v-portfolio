// ==========================================
// SHARED NAVIGATION DIAL (Rainbow Arch / Glass Ring)
// Used by both index.html (main.js) and photo.html (photo.js)
// ==========================================

// Simple line icons, one per real page label (lowercased span text -> svg markup)
const DIAL_ICONS = {
  'home': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-9"/><path d="M9.5 20v-5.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V20"/></svg>',
  'about us': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.5"/><path d="M4.5 20c1-4 4-6 7.5-6s6.5 2 7.5 6"/></svg>',
  'portfolio': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="7.5" width="17" height="12" rx="1.5"/><path d="M8.5 7.5V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1.5"/><path d="M3.5 13h17"/></svg>',
  'services': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1-2h7l1 2h2A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5v-9Z"/><circle cx="12" cy="12.5" r="3.3"/></svg>',
  'subscription': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 17v-5a6 6 0 0 1 12 0v5l1.5 2h-15Z"/><path d="M10 20.5a2 2 0 0 0 4 0"/></svg>',
  'book': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5c2-1 5-1 8 0v13c-3-1-6-1-8 0Z"/><path d="M20 5.5c-2-1-5-1-8 0v13c3-1 6-1 8 0Z"/></svg>',
};

export function initDial() {
  const menuContainer = document.querySelector('.photo-page-menu');
  if (!menuContainer) return;

  const glassRing = document.querySelector('.photo-page-menu .glass-ring');
  const bangleRing = document.querySelector('.photo-page-menu .bangle');
  const bangleInnerRing = document.querySelector('.photo-page-menu .bangle-inner');
  const iconEl = document.getElementById('dial-icon');
  const mainMenuItems = document.querySelectorAll('#rainbow-menu .menu-item');
  const numMenuItems = mainMenuItems.length;
  if (!numMenuItems) return;

  // Position items around a genuine half-ring
  const archAngleSpacing = 34;
  const centerIndex = Math.floor(numMenuItems / 2);

  // Whichever item already carries "active" in the markup is this page's
  // actual current page — it gets a permanent marker (currentPageIndex) that
  // never moves, separate from "active", which now means "focused at the
  // top of the ring" and follows whatever the user has scrolled to.
  let currentPageIndex = centerIndex;
  mainMenuItems.forEach((item, i) => {
    if (item.classList.contains('active')) currentPageIndex = i;
  });

  mainMenuItems.forEach((item, i) => {
    const baseAngle = (i - centerIndex) * archAngleSpacing;
    item.dataset.baseAngle = baseAngle;
    item.classList.remove('active');
    item._hoverCurrent = 0;
    item._hoverTarget = 0;
    item.addEventListener('mouseenter', () => { item._hoverTarget = 1; });
    item.addEventListener('mouseleave', () => { item._hoverTarget = 0; });
  });
  mainMenuItems[currentPageIndex].classList.add('current-page');

  // Audio Context for Ticking Sound (synthesized)
  let audioCtx;
  function playTick() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.05);

    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
  }

  // Swaps the center icon to match whichever item is focused, with a quick
  // fade+scale crossfade rather than an abrupt swap
  let iconSwapTimeout;
  function setIcon(index) {
    if (!iconEl) return;
    const span = mainMenuItems[index].querySelector('span');
    const label = span ? span.textContent.trim().toLowerCase() : '';
    const svg = DIAL_ICONS[label];
    if (!svg) return;

    clearTimeout(iconSwapTimeout);
    iconEl.classList.remove('is-visible');
    iconSwapTimeout = setTimeout(() => {
      iconEl.innerHTML = svg;
      iconEl.classList.add('is-visible');
    }, 140);
  }

  const initialBaseAngle = parseFloat(mainMenuItems[currentPageIndex].dataset.baseAngle);
  let archRotation = -initialBaseAngle;
  let targetArchRotation = -initialBaseAngle;
  let activeMenuIndex = currentPageIndex;
  setIcon(activeMenuIndex);

  // Jump the ring straight to a given item — one deterministic step, not a
  // free-form drag. This is what makes each scroll notch land exactly on
  // the next/previous title instead of drifting to an arbitrary angle.
  function goToIndex(index) {
    const clamped = Math.max(0, Math.min(numMenuItems - 1, index));
    if (clamped === activeMenuIndex) return;
    activeMenuIndex = clamped;
    const baseAngle = parseFloat(mainMenuItems[clamped].dataset.baseAngle);
    targetArchRotation = -baseAngle;
    mainMenuItems.forEach(item => item.classList.remove('active'));
    mainMenuItems[clamped].classList.add('active');
    playTick();
    setIcon(clamped);
  }

  // Each wheel "notch" advances exactly one item, then locks briefly so a
  // single flick can't skip past several titles — holding the scroll
  // gesture keeps auto-advancing at a steady, predictable pace instead.
  let wheelLocked = false;
  const WHEEL_COOLDOWN_MS = 360;

  menuContainer.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (wheelLocked) return;

    // Normalize deltaY across input devices — a trackpad reports "line" or
    // "page" units on some browsers/OSes, which would otherwise make the
    // dial wildly more/less sensitive than a plain mouse wheel.
    let delta = e.deltaY;
    if (e.deltaMode === 1) delta *= 16; // DOM_DELTA_LINE
    else if (e.deltaMode === 2) delta *= window.innerHeight; // DOM_DELTA_PAGE
    if (Math.abs(delta) < 4) return; // ignore sub-pixel noise

    const direction = delta > 0 ? 1 : -1;
    goToIndex(activeMenuIndex + direction);

    wheelLocked = true;
    setTimeout(() => { wheelLocked = false; }, WHEEL_COOLDOWN_MS);
  }, { passive: false });

  // Click to jump straight to an item and navigate
  mainMenuItems.forEach((item, i) => {
    item.addEventListener('click', () => {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      goToIndex(i);
    });
  });

  // Animate the arch with a light spring instead of a flat ease — it glides
  // toward the target, drifts a touch past it, then settles, which is what
  // gives the titles that "slipping into place" feel rather than a rigid snap.
  let springVelocity = 0;
  const SPRING_STIFFNESS = 0.1;
  const SPRING_DAMPING = 0.8;

  function animateArch() {
    requestAnimationFrame(animateArch);

    const force = (targetArchRotation - archRotation) * SPRING_STIFFNESS;
    springVelocity = (springVelocity + force) * SPRING_DAMPING;
    archRotation += springVelocity;

    // Spring velocity drives a jelly/silicone pulse — uniform scale only,
    // so the ring stays perfectly circular (any skew/non-uniform scale would ovalize it)
    const clampedArchVel = Math.max(-12, Math.min(12, springVelocity));
    const pulse = 1 + Math.abs(clampedArchVel) * 0.01;
    if (glassRing) glassRing.style.transform = `scale(${pulse})`;
    if (bangleRing) bangleRing.style.transform = `translate(-50%, -50%) scale(${pulse})`;
    if (bangleInnerRing) bangleInnerRing.style.transform = `translate(-50%, -50%) scale(${pulse})`;

    mainMenuItems.forEach((item) => {
      const baseAngle = parseFloat(item.dataset.baseAngle);
      const currentAngle = baseAngle + archRotation;

      // Continuous scroll-linked scale/opacity so the title "grows" as it
      // rides the ring toward the top and fades as it swings away
      const falloff = Math.max(0, 1 - Math.abs(currentAngle) / (archAngleSpacing * 1.6));
      const baseScale = 0.82 + falloff * 0.38;
      const opacity = 0.8 + falloff * 0.2; // never fade enough to wash out against the glass

      // Smoothed hover zoom — eases in/out rather than snapping, and stacks
      // on top of whatever the scroll position already has the item at
      item._hoverCurrent += (item._hoverTarget - item._hoverCurrent) * 0.2;
      const scale = baseScale * (1 + item._hoverCurrent * 0.18);

      // A slight lean in the direction of travel gives each word a
      // "slipping along the track" quality while the spring is still moving
      const slip = Math.max(-6, Math.min(6, springVelocity * 1.4));

      // Rotation lives on the anchor (pivots around the ring center).
      // Scale/skew must live on the inner span instead — transforming the
      // anchor itself would also scale/shift its radial offset, dragging
      // the word off the ring line.
      item.style.opacity = opacity;
      item.style.transform = `rotate(${currentAngle}deg)`;
      const span = item.firstElementChild;
      if (span) span.style.transform = `translate(-50%, -50%) scale(${scale}) skewX(${slip}deg)`;
    });
  }

  // Set initial active
  mainMenuItems[activeMenuIndex].classList.add('active');
  animateArch();
}
