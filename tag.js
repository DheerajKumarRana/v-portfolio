import { initDial } from './dial.js';
import { SERVICES, findService } from './servicesData.js';

const params = new URLSearchParams(window.location.search);
const categoryName = params.get('category') || SERVICES[0].title;
const rawTag = params.get('tag') || SERVICES[0].tags[0];
const service = findService(categoryName) || SERVICES[0];

// "All" is a real option (not one of the category's own tags) — it's what
// the category cards on photo.html/services.html link to when the
// whole reel should open rather than one specific tag. Both presentations
// below always show every clip in the category either way (tags are
// display-only); this only changes the title text so an "All" visit
// doesn't masquerade as a single tag.
const isAll = rawTag === 'All';
const tagName = isAll ? 'All Work' : rawTag;

// Two presentations for the same category reel: the Portfolio flow
// (photo.html's cards) links here with view=sphere for the Fibonacci-sphere
// 3D gallery; the Services flow (services.html's mosaic) links with
// view=grid for a 3D drag carousel. Defaults to grid for any other/missing
// value (e.g. a bookmarked or hand-typed URL).
const view = params.get('view') === 'sphere' ? 'sphere' : 'grid';

// ==========================================
// BREADCRUMB + TITLE
// ==========================================
// The root crumb reflects which flow actually brought the visitor here —
// Portfolio (photo.html) for the sphere view, Services (services.html)
// for the grid view — rather than always pointing back to Services.
const rootHref = view === 'sphere' ? './photo.html' : './services.html';
const rootLabel = view === 'sphere' ? 'Portfolio' : 'Services';
const rootEl = document.getElementById('tag-breadcrumb-root');
rootEl.textContent = rootLabel;
rootEl.setAttribute('href', rootHref);
document.getElementById('tag-breadcrumb-category').textContent = service.title;
document.getElementById('tag-breadcrumb-category').setAttribute('href', rootHref);
document.getElementById('tag-breadcrumb-current').textContent = tagName;
document.title = `${tagName} | ${service.title} | 213 MEECH`;
document.getElementById('tag-title').textContent = isAll
  ? `${service.title} — Video Showcase`
  : `${service.title} — ${tagName}`;
document.getElementById('tag-hint').textContent = view === 'sphere'
  ? 'Drag to look around · Scroll to zoom · Click a card to play'
  : 'Drag to explore · Click a card to play';
// The nav dial should reflect which flow actually brought the visitor
// here, not always default to Services (set before initDial() below reads
// the DOM to lay out the dial).
document.getElementById(view === 'sphere' ? 'tag-menu-portfolio' : 'tag-menu-services')
  .classList.add('active');

const cards = service.videos.map((src, i) => ({
  id: i,
  video: src,
  poster: service.gallery[i % service.gallery.length],
  title: `${service.title} — ${String(i + 1).padStart(2, '0')}`,
}));

if (view === 'sphere') {
  document.getElementById('stellar-gallery-section').hidden = false;
  // Dynamically imported — pulls in Three.js's OrbitControls +
  // CSS3DRenderer, which shouldn't block the rest of this page from
  // rendering first.
  import('./stellarGallery.js').then(({ initStellarGallery }) => {
    initStellarGallery(document.getElementById('stellar-gallery'), cards);
  });
} else {
  document.getElementById('coverflow-section').hidden = false;
  import('./coverflowCarousel.js').then(({ initCoverflow }) => {
    const slides = cards.map((card) => ({
      src: card.poster,
      alt: card.title,
      video: card.video,
      title: card.title,
    }));
    initCoverflow(document.getElementById('coverflow'), slides);
  });
}

// ==========================================
// SHARED NAV DIAL
// ==========================================
initDial();
