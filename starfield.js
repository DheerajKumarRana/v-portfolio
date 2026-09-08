// ==========================================
// STARFIELD — lightweight ambient background for dark pages (see
// starfield.css). Deliberately NOT the Three.js scene from
// stellarGallery.js: this runs on every dark page at once, so it stays to
// plain DOM dots animated via CSS opacity/transform (compositor-only, no
// canvas/WebGL) rather than a WebGL point cloud.
// ==========================================

export function initStarfield(target = document.body) {
  const el = document.createElement('div');
  el.className = 'starfield';
  el.setAttribute('aria-hidden', 'true');

  // Scale with viewport area (more stars on a big desktop monitor than a
  // phone) but clamp both ends so it never gets sparse or overly busy.
  const area = window.innerWidth * window.innerHeight;
  const count = Math.min(220, Math.max(90, Math.round(area / 9000)));

  for (let i = 0; i < count; i++) {
    const star = document.createElement('span');
    star.className = 'starfield-star';
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;

    const size = 0.6 + Math.random() * 1.8;
    star.style.width = `${size}px`;
    star.style.height = `${size}px`;

    star.style.setProperty('--starfield-min-opacity', (0.1 + Math.random() * 0.15).toFixed(2));
    star.style.setProperty('--starfield-max-opacity', (0.6 + Math.random() * 0.35).toFixed(2));
    star.style.animationDuration = `${2.5 + Math.random() * 4.5}s`;
    star.style.animationDelay = `${-Math.random() * 6}s`;

    el.appendChild(star);
  }

  // Prepend so it stays first in DOM order — harmless either way since
  // z-index:0 already pins it behind everything, but keeps source order
  // matching visual (paint) order for anyone reading the markup later.
  target.prepend(el);
  return el;
}
