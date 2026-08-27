import { initDial } from './dial.js';
import { initFrameGrid } from './frameGrid.js';
import { SERVICES } from './servicesData.js';

// ==========================================
// HOVER-EXPAND VIDEO MOSAIC — one tile per category, each playing its
// heroVideo on hover; click opens that category's full showcase on tag.html
// as a plain card grid (view=grid) — the Portfolio flow on photo.html
// opens the same category as the Fibonacci-sphere 3D gallery instead.
// ==========================================
initFrameGrid(document.getElementById('frame-grid'), SERVICES.map((service) => ({
  title: service.title,
  video: service.heroVideo,
  poster: service.img,
  href: `./tag.html?category=${encodeURIComponent(service.title)}&tag=All&view=grid`,
})));

// ==========================================
// SHARED NAV DIAL
// ==========================================
initDial();
