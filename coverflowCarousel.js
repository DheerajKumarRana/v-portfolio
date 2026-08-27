// Vanilla port of a "coverflow" 3D carousel (drag/swipe with momentum,
// keyboard nav, looping ring, exponential ease-out settle) — the React
// version this was handed drives the exact same math through React state;
// this drives it straight to the DOM each animation frame instead, which
// is what that component's own `paint()` already did internally anyway.
// Consistent with the rest of this vanilla Vite site (see frameGrid.js,
// stellarGallery.js) rather than pulling in React.
//
// This is the Services flow's presentation for a category (see tag.js's
// view=grid branch) — the Portfolio flow gets the Fibonacci-sphere 3D
// gallery instead.
//
// Extends the original (image-only) slide shape with an optional `video`
// field: a slide with one gets a hover-preview and opens a lightweight
// modal to play it (with sound) on click; without one, clicking just
// brings that card to center.
const PLAY_ICON = `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" stroke="currentColor" stroke-width="1.3"/><path d="M10 8.5 16 12l-6 3.5v-7Z" fill="currentColor"/></svg>`;
const MUTE_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M4 9.5v5h3.5L12 18V6L7.5 9.5H4Z"/>
  <path class="mute-line" d="M17 8.5 21 15.5M21 8.5 17 15.5"/>
  <path class="wave-line" d="M16 9.2a4 4 0 0 1 0 5.6M18.5 7a7.5 7.5 0 0 1 0 10"/>
</svg>`;

export function initCoverflow(container, slides, opts = {}) {
  if (!slides.length) return null;

  const {
    rotate = 44,
    depth = 0.6,
    perspective = 3,
    falloff = 0.56,
    fade = 0.1,
    cardWidth = 'clamp(160px, 26vw, 300px)',
    gap = 0.05,
    loop = true,
    showCaption = true,
    showNavigation = true,
  } = opts;

  const count = slides.length;

  container.classList.add('cf-root');
  container.style.setProperty('--cf-card', cardWidth);
  container.innerHTML = `
    <div class="cf-frame" tabindex="0" role="region" aria-roledescription="carousel" aria-label="Video carousel">
      <div class="cf-track"></div>
    </div>
    ${showNavigation ? `
      <button type="button" class="cf-nav cf-nav-prev" aria-label="Previous slide">&#8249;</button>
      <button type="button" class="cf-nav cf-nav-next" aria-label="Next slide">&#8250;</button>
    ` : ''}
    ${showCaption ? `<p class="cf-caption" id="cf-caption"></p>` : ''}
  `;

  const frame = container.querySelector('.cf-frame');
  frame.style.perspective = `calc(var(--cf-card) * ${perspective})`;
  const track = container.querySelector('.cf-track');
  const caption = container.querySelector('.cf-caption');

  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const cards = slides.map((slide, i) => {
    const card = document.createElement('div');
    card.className = 'cf-card';
    card.setAttribute('role', 'group');
    card.setAttribute('aria-label', `${i + 1} of ${count}`);
    card.innerHTML = slide.video ? `
      <img class="cf-card-poster" src="${slide.src}" alt="${slide.alt || ''}" draggable="false" loading="lazy" />
      <video data-src="${slide.video}" muted loop playsinline preload="none"></video>
      <div class="cf-card-scrim"></div>
      <div class="cf-card-rec"><span class="cf-card-dot"></span>REEL</div>
      <div class="cf-card-play" aria-hidden="true">${PLAY_ICON}</div>
      <div class="cf-card-spinner" aria-hidden="true"></div>
      <button class="cf-card-mute is-muted" aria-label="Toggle sound">${MUTE_ICON}</button>
    ` : `
      <img src="${slide.src}" alt="${slide.alt || ''}" draggable="false" loading="lazy" />
    `;
    card.addEventListener('click', () => {
      goTo(i);
      if (slide.video) openModal(slide);
    });

    // Hover preview — same lazy-load-on-first-hover pattern used elsewhere
    // on the site: no src at all until needed, so a 20-card category
    // doesn't fire 20 simultaneous video fetches. A <video poster> stops
    // showing its poster the instant a src is assigned, even before the
    // first frame decodes — keeping a real <img> poster underneath (faded
    // out only once the video has a frame ready) avoids that black flash.
    // This card also only ever scales DOWN under the coverflow's
    // perspective (translateZ recedes, never enlarges past its native
    // size), unlike the CSS3D sphere this sits alongside — so there's no
    // equivalent of that gallery's pixelation risk here.
    if (slide.video) {
      const previewVideo = card.querySelector('video');
      const muteBtn = card.querySelector('.cf-card-mute');
      previewVideo.addEventListener('loadeddata', () => card.classList.add('is-ready'), { once: true });
      // Some clips take a moment to actually start playing after src is
      // assigned — is-buffering swaps the play icon for a spinner for
      // that window, so hovering doesn't look like nothing is happening.
      previewVideo.addEventListener('playing', () => card.classList.remove('is-buffering'));
      previewVideo.addEventListener('waiting', () => card.classList.add('is-buffering'));

      // Starts muted (browsers block unmuted autoplay on hover, since
      // hover isn't a user-activation gesture) — this button's own click
      // IS a real gesture, so it can unmute the already-playing preview.
      //
      // .cf-frame listens for pointerdown on the whole carousel (bubbling
      // up from any child) to start its own drag tracking — without
      // cutting it off right here, that capture wins before the button's
      // click ever gets a clean chance to fire, so the toggle silently
      // never happens (the same issue the stellar gallery's OrbitControls
      // had with this same button).
      muteBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
      muteBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // don't also open the modal / re-center the card
        previewVideo.muted = !previewVideo.muted;
        muteBtn.classList.toggle('is-muted', previewVideo.muted);
      });

      if (canHover) {
        card.addEventListener('mouseenter', () => {
          if (previewVideo.readyState < 3) card.classList.add('is-buffering');
          if (!previewVideo.src) previewVideo.src = previewVideo.dataset.src;
          previewVideo.play().catch(() => {});
        });
        card.addEventListener('mouseleave', () => {
          previewVideo.pause(); // mute state is left alone — the button controls that independently of hover
          card.classList.remove('is-buffering');
        });
      }
    }

    track.appendChild(card);
    return card;
  });

  let width = 0;
  let pos = 0;
  let target = 0;
  let rafId = null;
  let selected = 0;

  const indexAt = (p) => ((Math.round(p) % count) + count) % count;

  function updateCaption() {
    if (caption) caption.textContent = slides[selected].title || '';
  }

  function paint() {
    if (!width) return;
    const pitch = width * (1 + gap);
    cards.forEach((card, i) => {
      let offset = i - pos;
      if (loop) {
        offset = ((offset % count) + count) % count;
        if (offset > count / 2) offset -= count;
      }
      const distance = Math.abs(offset);
      const ramp = Math.pow(distance, falloff);
      const tilt = Math.min(rotate * ramp, 82) * Math.sign(offset);

      card.style.transform =
        `translateX(calc(-50% + ${offset * pitch}px)) ` +
        `translateZ(${-depth * width * ramp}px) rotateY(${-tilt}deg)`;

      const edge = loop ? Math.min(1, Math.max(0, count / 2 - distance)) : 1;
      card.style.opacity = String(Math.max(0, 1 - fade * distance) * edge);
      card.style.zIndex = String(100 - Math.round(distance));
    });
  }

  function settle(t) {
    if (rafId !== null) cancelAnimationFrame(rafId);
    target = t;
    selected = indexAt(t);
    updateCaption();

    function step() {
      const remaining = target - pos;
      if (Math.abs(remaining) < 0.0004) {
        pos = target;
        paint();
        rafId = null;
        return;
      }
      pos += remaining * 0.16;
      paint();
      rafId = requestAnimationFrame(step);
    }
    rafId = requestAnimationFrame(step);
  }

  const clamp = (p) => (loop ? p : Math.max(0, Math.min(count - 1, p)));

  function goTo(index) {
    const t = loop ? index + Math.round((target - index) / count) * count : index;
    settle(clamp(t));
  }

  function nudge(by) {
    settle(clamp(Math.round(target) + by));
  }

  // ---------- Drag ----------
  let drag = null;
  frame.addEventListener('pointerdown', (e) => {
    if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
    frame.setPointerCapture(e.pointerId);
    target = pos;
    drag = { id: e.pointerId, x: e.clientX, pos, v: 0, t: performance.now() };
  });
  frame.addEventListener('pointermove', (e) => {
    if (!drag || drag.id !== e.pointerId) return;
    const pitch = width * (1 + gap);
    if (!pitch) return;
    const now = performance.now();
    const prev = pos;
    pos = clamp(drag.pos - (e.clientX - drag.x) / pitch);
    drag.v = ((pos - prev) / Math.max(now - drag.t, 1)) * 1000;
    drag.t = now;
    const idx = indexAt(pos);
    if (idx !== selected) { selected = idx; updateCaption(); }
    paint();
  });
  function endDrag(e) {
    if (!drag || drag.id !== e.pointerId) return;
    const carried = Math.max(-2, Math.min(2, drag.v * 0.18));
    drag = null;
    settle(clamp(Math.round(pos + carried)));
  }
  frame.addEventListener('pointerup', endDrag);
  frame.addEventListener('pointercancel', endDrag);

  frame.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); nudge(-1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); nudge(1); }
    else if (e.key === 'Enter') { const s = slides[selected]; if (s.video) openModal(s); }
  });

  if (showNavigation) {
    container.querySelector('.cf-nav-prev').addEventListener('click', () => nudge(-1));
    container.querySelector('.cf-nav-next').addEventListener('click', () => nudge(1));
  }

  // ---------- Sizing ----------
  function measure() {
    const card = cards[0];
    if (!card) return;
    width = card.offsetWidth;
    paint();
  }
  measure();
  const ro = new ResizeObserver(measure);
  ro.observe(frame);
  updateCaption();

  // ---------- Modal (only built if at least one slide is a video) ----------
  let modal, modalVideo, modalTitle;
  function openModal(slide) {
    if (!modal) {
      modal = document.createElement('div');
      modal.className = 'cf-modal';
      modal.innerHTML = `
        <div class="cf-modal-card">
          <button class="cf-modal-close" aria-label="Close">&times;</button>
          <div class="cf-modal-video-wrap">
            <video class="cf-modal-video" muted loop playsinline controls></video>
          </div>
          <h3 class="cf-modal-title"></h3>
        </div>
      `;
      document.body.appendChild(modal);
      modalVideo = modal.querySelector('.cf-modal-video');
      modalTitle = modal.querySelector('.cf-modal-title');
      modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
      modal.querySelector('.cf-modal-close').addEventListener('click', closeModal);
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
    }
    modalVideo.poster = slide.src;
    modalVideo.src = slide.video;
    modalTitle.textContent = slide.title || '';
    modal.classList.add('is-open');
    modalVideo.muted = false;
    modalVideo.currentTime = 0;
    modalVideo.play().catch(() => {});
  }
  function closeModal() {
    if (!modal) return;
    modal.classList.remove('is-open');
    modalVideo.pause();
    modalVideo.removeAttribute('src');
    modalVideo.load();
  }

  return {
    goTo,
    destroy() {
      if (rafId !== null) cancelAnimationFrame(rafId);
      ro.disconnect();
      if (modal) modal.remove();
    },
  };
}
