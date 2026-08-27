import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';

// A 3D "video galaxy" — each clip in a category floats on a card arranged
// on a Fibonacci sphere (three concentric layers, golden-ratio spacing)
// around a wireframe core, over a starfield. Drag to orbit, scroll to
// zoom, click a card to open its video in a modal. This is the Portfolio
// flow's presentation for a category (see tag.js's view=sphere branch) —
// the Services flow gets a plain card grid instead.
//
// Two renderers share one camera and stack in the same container: WebGL
// underneath draws the stars/wireframe spheres, CSS3DRenderer on top draws
// the actual card DOM (a real <img>/<video>, not a texture) so hover, text
// rendering, and click all stay native. This project is vanilla Three.js
// (see main.js) rather than React.
//
// IMPORTANT unit note: CSS3DRenderer maps Three.js world units to CSS
// pixels 1:1 — there is no separate distance-based scale factor like
// drei's <Html distanceFactor> has in React. So "world units" here have to
// live in real CSS-pixel territory (hundreds, not tens) or a 200px-tall
// card sitting only ~20 units from camera renders many times its natural
// size — GPU-blurred and overlapping. WORLD_SCALE is what keeps every
// distance/radius below in that range.
const WORLD_SCALE = 22;
const PLAY_ICON = `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" stroke="currentColor" stroke-width="1.3"/><path d="M10 8.5 16 12l-6 3.5v-7Z" fill="currentColor"/></svg>`;
const MUTE_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M4 9.5v5h3.5L12 18V6L7.5 9.5H4Z"/>
  <path class="mute-line" d="M17 8.5 21 15.5M21 8.5 17 15.5"/>
  <path class="wave-line" d="M16 9.2a4 4 0 0 1 0 5.6M18.5 7a7.5 7.5 0 0 1 0 10"/>
</svg>`;

export function initStellarGallery(container, cards) {
  if (!cards.length) return null;

  // Falls back to a 16:9 guess if this runs before the stylesheet has laid
  // out the container's real height (module scripts can execute before
  // linked CSS finishes applying) — resize() below corrects it for real as
  // soon as the browser reports actual dimensions.
  const dims = () => {
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || Math.round(w * 9 / 16) || 1;
    return { w, h };
  };

  const glScene = new THREE.Scene();
  const cssScene = new THREE.Scene();
  const initialDims = dims();
  const camera = new THREE.PerspectiveCamera(60, initialDims.w / initialDims.h, 1, 40000);
  // Starts closer in than a neutral fit so the galaxy reads as full and
  // immersive the instant the page loads, rather than a small cluster
  // adrift in empty space. This is below controls.minDistance (set
  // further down) on purpose — OrbitControls clamps the camera back out
  // to minDistance on its first update() in the render loop, so this just
  // resolves to "start at minDistance" without hand-duplicating that math.
  camera.position.set(0, 0, 34 * WORLD_SCALE);

  // ---------- Starfield ----------
  const starsGeometry = new THREE.BufferGeometry();
  const starsCount = 2200;
  const starSpread = 900 * WORLD_SCALE;
  const starPositions = new Float32Array(starsCount * 3);
  for (let i = 0; i < starsCount; i++) {
    starPositions[i * 3] = (Math.random() - 0.5) * starSpread;
    starPositions[i * 3 + 1] = (Math.random() - 0.5) * starSpread;
    starPositions[i * 3 + 2] = (Math.random() - 0.5) * starSpread;
  }
  starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const stars = new THREE.Points(
    starsGeometry,
    new THREE.PointsMaterial({ color: 0xffffff, size: 2, sizeAttenuation: true })
  );
  glScene.add(stars);

  // Three concentric layers cards are distributed across — LAYER_RADII[0]
  // is the innermost shell. The camera's minDistance (below) is kept well
  // outside LAYER_RADII[2] so it can never end up close enough to a single
  // card to blow it up (see the unit note above — that's what caused it).
  const LAYER_RADII = [18, 23, 28].map(r => r * WORLD_SCALE);

  // ---------- Wireframe core spheres (decorative depth cues) ----------
  // Only the outermost two layers get a wireframe shell — the innermost
  // core sphere and the sphere at LAYER_RADII[0] cluttered the view right
  // where cards sit closest to the camera, so they're skipped.
  [
    { radius: LAYER_RADII[1], color: 0x31b8c6, opacity: 0.045 },
    { radius: LAYER_RADII[2], color: 0x31b8c6, opacity: 0.03 },
  ].forEach(({ radius, color, opacity }) => {
    glScene.add(new THREE.Mesh(
      new THREE.SphereGeometry(radius, 24, 24),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity, wireframe: true })
    ));
  });

  // ---------- Cards, Fibonacci-sphere distribution ----------
  const cardObjects = [];
  const golden = (1 + Math.sqrt(5)) / 2;
  const n = cards.length;
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  cards.forEach((card, i) => {
    const el = document.createElement('div');
    el.className = 'stellar-card';
    el.innerHTML = `
      <video poster="${card.poster}" data-src="${card.video}" muted loop playsinline preload="none"></video>
      <div class="stellar-card-overlay"></div>
      <div class="stellar-card-rec"><span class="stellar-card-dot"></span>REEL</div>
      <div class="stellar-card-play" aria-hidden="true">${PLAY_ICON}</div>
      <div class="stellar-card-spinner" aria-hidden="true"></div>
      <button class="stellar-card-mute is-muted" aria-label="Toggle sound">${MUTE_ICON}</button>
      <p class="stellar-card-title">${card.title}</p>
    `;
    el.addEventListener('click', () => openModal(card));

    // Hover-preview, same lazy-load pattern used elsewhere on the site: no
    // src at all until the moment it's needed, so a 20-card category
    // doesn't fire 20 simultaneous video fetches on load. Some clips take
    // a moment to actually start playing after that fetch begins — the
    // is-buffering class swaps the play icon for a spinner for that
    // window, so hovering doesn't look like nothing is happening.
    const previewVideo = el.querySelector('video');
    const muteBtn = el.querySelector('.stellar-card-mute');
    previewVideo.addEventListener('playing', () => el.classList.remove('is-buffering'));
    previewVideo.addEventListener('waiting', () => el.classList.add('is-buffering'));
    function loadPreviewSrc() {
      if (!previewVideo.src) previewVideo.src = previewVideo.dataset.src;
    }
    // Starts muted (browsers block unmuted autoplay on hover, since hover
    // isn't treated as a user-activation gesture) — this button's own
    // click IS a real gesture, so it can unmute the already-playing
    // preview.
    //
    // OrbitControls listens for pointerdown on the whole gallery container
    // (bubbling up from any child) to start its own drag/capture tracking
    // — without cutting it off right here, that capture wins before the
    // button's click ever gets a clean chance to fire, so the toggle
    // silently never happens.
    muteBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
    muteBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // don't also open the modal
      previewVideo.muted = !previewVideo.muted;
      muteBtn.classList.toggle('is-muted', previewVideo.muted);
    });
    if (canHover) {
      el.addEventListener('mouseenter', () => {
        // Only actually "buffering" if it doesn't already have enough data
        // to play through — a card hovered a second time shouldn't flash
        // the spinner again.
        if (previewVideo.readyState < 3) el.classList.add('is-buffering');
        loadPreviewSrc();
        previewVideo.play().catch(() => {});
      });
      el.addEventListener('mouseleave', () => {
        previewVideo.pause(); // mute state is left alone — the button controls that independently of hover
        el.classList.remove('is-buffering');
      });
    } else {
      // No hover on touch — and the card is also constantly being panned
      // around by orbit dragging, so autoplay-when-visible would be
      // fighting the camera; simplest honest behavior is poster-until-tap,
      // same as the modal opening on click already does.
      previewVideo.preload = 'none';
    }

    const object = new CSS3DObject(el);
    const y = n === 1 ? 0 : 1 - (i / (n - 1)) * 2;
    const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = (2 * Math.PI * i) / golden;
    const layerRadius = LAYER_RADII[i % LAYER_RADII.length];

    object.position.set(
      Math.cos(theta) * radiusAtY * layerRadius,
      y * layerRadius,
      Math.sin(theta) * radiusAtY * layerRadius
    );
    cssScene.add(object);
    cardObjects.push(object);
  });

  // ---------- Renderers ----------
  const glRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  glRenderer.setClearColor(0x000000, 0);
  Object.assign(glRenderer.domElement.style, { position: 'absolute', top: '0', left: '0', pointerEvents: 'none' });
  container.appendChild(glRenderer.domElement);

  const cssRenderer = new CSS3DRenderer();
  Object.assign(cssRenderer.domElement.style, { position: 'absolute', top: '0', left: '0' });
  container.appendChild(cssRenderer.domElement);

  function resize() {
    const { w, h } = dims();
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    glRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    glRenderer.setSize(w, h);
    cssRenderer.setSize(w, h);
  }
  resize();
  requestAnimationFrame(resize); // corrects for the fallback aspect ratio once real layout is in
  window.addEventListener('resize', resize);

  // ---------- Controls ----------
  const controls = new OrbitControls(camera, cssRenderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  // Kept outside the outermost card layer (see LAYER_RADII above) so the
  // camera can never end up uncomfortably close to a single card.
  controls.minDistance = LAYER_RADII[LAYER_RADII.length - 1] + 8 * WORLD_SCALE;
  controls.maxDistance = 100 * WORLD_SCALE;
  controls.enablePan = false; // panning could drag the orbit target near a card, same issue as zooming too close
  controls.rotateSpeed = 0.5;
  controls.zoomSpeed = 1;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.35;
  controls.addEventListener('start', () => { controls.autoRotate = false; });

  let rafId;
  function animate() {
    rafId = requestAnimationFrame(animate);
    stars.rotation.y += 0.0004;
    controls.update();
    // Cards always face the camera, like billboards
    cardObjects.forEach((object) => object.lookAt(camera.position));
    glRenderer.render(glScene, camera);
    cssRenderer.render(cssScene, camera);
  }
  animate();

  // ---------- Modal ----------
  const modal = document.createElement('div');
  modal.className = 'stellar-modal';
  modal.innerHTML = `
    <div class="stellar-modal-card">
      <button class="stellar-modal-close" aria-label="Close">&times;</button>
      <div class="stellar-modal-video-wrap">
        <video class="stellar-modal-video" muted loop playsinline controls></video>
      </div>
      <h3 class="stellar-modal-title"></h3>
    </div>
  `;
  document.body.appendChild(modal);
  const modalVideo = modal.querySelector('.stellar-modal-video');
  const modalTitle = modal.querySelector('.stellar-modal-title');

  function openModal(card) {
    modalVideo.poster = card.poster;
    modalVideo.src = card.video;
    modalTitle.textContent = card.title;
    modal.classList.add('is-open');
    modalVideo.muted = false;
    modalVideo.currentTime = 0;
    modalVideo.play().catch(() => {});
  }
  function closeModal() {
    modal.classList.remove('is-open');
    modalVideo.pause();
    modalVideo.removeAttribute('src');
    modalVideo.load();
  }
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  modal.querySelector('.stellar-modal-close').addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  return {
    destroy() {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      controls.dispose();
      container.removeChild(glRenderer.domElement);
      container.removeChild(cssRenderer.domElement);
      modal.remove();
    },
  };
}
