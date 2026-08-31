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

  // Position items around a genuine half-ring. The ring's radius shrinks
  // more on mobile (photo.css) than the label font does, so the same
  // angular spacing leaves adjacent titles crowding/overlapping — widen it
  // there to keep the same visual gap between labels. Tracks the breakpoint
  // live (matchMedia, not a one-time innerWidth check) so it stays correct
  // if the viewport is resized/rotated after load instead of only on the
  // width the page happened to first render at.
  const mobileDialQuery = window.matchMedia('(max-width: 900px)');
  let archAngleSpacing = mobileDialQuery.matches ? 50 : 34;

  // Whichever item already carries "active" in the markup is this page's
  // actual current page — it gets a permanent marker (currentPageIndex) that
  // never moves, separate from "active", which now means "focused at the
  // top of the ring" and follows whatever the user has scrolled to.
  // Angles are assigned relative to THIS item (not a fixed array-middle
  // index), so whichever page you're on always starts centered with its
  // neighbors spread evenly on both sides — otherwise a page whose item
  // sits early in the list (e.g. Home, first in the array) would load with
  // everything bunched to one side instead of looking balanced.
  let currentPageIndex = Math.floor(numMenuItems / 2);
  mainMenuItems.forEach((item, i) => {
    if (item.classList.contains('active')) currentPageIndex = i;
  });

  mainMenuItems.forEach((item, i) => {
    const baseAngle = (i - currentPageIndex) * archAngleSpacing;
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

    // A soft sine "chime" instead of the harsh triangle-wave click — gentle
    // attack, smooth decay, no sharp edges in the waveform or the envelope
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(660, audioCtx.currentTime + 0.09);

    gainNode.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.015);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.16);

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.17);
  }

  // Swaps the center icon to match whichever item is focused. Dips to a
  // low opacity (never fully gone) and back rather than a hard blink to
  // nothing, so the swap reads as a smooth crossfade instead of a "popup"
  let iconSwapTimeout;
  function setIcon(index) {
    if (!iconEl) return;
    const span = mainMenuItems[index].querySelector('span');
    const label = span ? span.textContent.trim().toLowerCase() : '';
    const svg = DIAL_ICONS[label];
    if (!svg) return;

    clearTimeout(iconSwapTimeout);
    iconEl.classList.add('is-swapping');
    iconSwapTimeout = setTimeout(() => {
      iconEl.innerHTML = svg;
      iconEl.classList.add('is-visible');
      iconEl.classList.remove('is-swapping');
    }, 90);
  }

  const initialBaseAngle = parseFloat(mainMenuItems[currentPageIndex].dataset.baseAngle);
  let archRotation = -initialBaseAngle;
  let targetArchRotation = -initialBaseAngle;
  let activeMenuIndex = currentPageIndex;
  setIcon(activeMenuIndex);

  // Re-derive every item's base angle from the (possibly just-changed)
  // archAngleSpacing, then snap the rotation state to match so crossing the
  // breakpoint doesn't leave the ring spun to angles computed for the other
  // layout.
  function recomputeBaseAngles() {
    mainMenuItems.forEach((item, i) => {
      item.dataset.baseAngle = (i - currentPageIndex) * archAngleSpacing;
    });
    const activeBaseAngle = parseFloat(mainMenuItems[activeMenuIndex].dataset.baseAngle);
    archRotation = -activeBaseAngle;
    targetArchRotation = -activeBaseAngle;
  }

  mobileDialQuery.addEventListener('change', (e) => {
    archAngleSpacing = e.matches ? 50 : 34;
    recomputeBaseAngles();
  });

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

  // Touch / thumb-swipe support — phones have no wheel input, so map a
  // vertical drag across the dial to the same one-notch-at-a-time stepping
  // the wheel handler uses above. Swiping up (finger travels toward the top
  // of the screen) advances forward, matching the direction a page scrolls.
  //
  // Bound on window and gated by the finger's Y position (not by hit-testing
  // whatever DOM element the touch happened to land on) — the dial is a
  // fixed, mostly-off-screen box whose visible ring is drawn by children
  // with pointer-events:none, which made target-based detection unreliable
  // on pages that also scroll (tag.html/services.html): a swipe over the
  // ring could still fall through to the scrollable page underneath. A
  // touch that starts within the dial's actual on-screen band always
  // controls the dial instead, regardless of which element is technically
  // hit — everywhere else keeps scrolling the page normally.
  let touchY = null;
  let touchAccum = 0;
  const SWIPE_STEP_PX = 40;
  const DIAL_TOUCH_ZONE_PX = 170;

  function isInDialZone(clientY) {
    return window.innerHeight - clientY < DIAL_TOUCH_ZONE_PX;
  }

  window.addEventListener('touchstart', (e) => {
    if (!isInDialZone(e.touches[0].clientY)) { touchY = null; return; }
    touchY = e.touches[0].clientY;
    touchAccum = 0;
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (touchY === null) return;
    e.preventDefault();
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    const y = e.touches[0].clientY;
    touchAccum += y - touchY;
    touchY = y;

    while (Math.abs(touchAccum) >= SWIPE_STEP_PX) {
      const direction = touchAccum > 0 ? -1 : 1;
      goToIndex(activeMenuIndex + direction);
      touchAccum -= Math.sign(touchAccum) * SWIPE_STEP_PX;
    }
  }, { passive: false });

  function endTouch() {
    touchY = null;
    touchAccum = 0;
  }
  window.addEventListener('touchend', endTouch, { passive: true });
  window.addEventListener('touchcancel', endTouch, { passive: true });

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

  // ==========================================
  // REVEAL ON HOVER — pages that wrap the dial in .photo-bottom-bar have
  // real scrollable content behind it, so the ring stays tucked below the
  // fold and only slides up when the cursor rests within ~150px of the
  // bottom edge. Scrolling immediately hides it again so it never blocks
  // the view. Pages without that wrapper (index.html) keep the dial
  // permanently visible, matching how it's always worked there.
  // The center icon is deliberately NOT part of this — it stays visible
  // regardless of hover/scroll state.
  // ==========================================
  const bottomBar = document.querySelector('.photo-bottom-bar');
  const canHoverDial = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function setDialActive(active) {
    menuContainer.classList.toggle('is-dial-active', active);
  }

  // Touch devices have no persistent hover/mousemove signal to reveal the
  // dial with, so it must just stay visible there — same as index.html
  if (bottomBar && canHoverDial) {
    const REVEAL_ZONE_PX = 150;
    let isActive = false;

    window.addEventListener('mousemove', (e) => {
      const shouldBeActive = window.innerHeight - e.clientY < REVEAL_ZONE_PX;
      if (shouldBeActive !== isActive) {
        isActive = shouldBeActive;
        setDialActive(isActive);
      }
    });

    window.addEventListener('scroll', () => {
      if (isActive) {
        isActive = false;
        setDialActive(false);
      }
    }, { passive: true });
  } else {
    setDialActive(true);
  }
}
