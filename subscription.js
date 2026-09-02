import { initDial } from './dial.js';
import { SERVICES } from './servicesData.js';
import { PLANS, CONTACT_EMAIL, COMPARISON_FEATURES } from './subscriptionData.js';

// ==========================================
// SCREEN 1 — service picker: a hover-stagger text list (each character
// swaps from a dim copy to a bright one, staggered by index) paired with a
// single image pane that crossfades to match whichever title is active.
// Reuses the same 7 categories/images as services.html.
// ==========================================

const listEl = document.getElementById('sub-select-list');
const mediaEl = document.getElementById('sub-select-media');

let activeIndex = 0;
let items = [];
let images = [];

function splitIntoChars(text) {
  return text.split('').map((ch) => ch === ' ' ? ' ' : ch);
}

function buildItem(service, index) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'sub-item';
  button.dataset.index = String(index);

  splitIntoChars(service.title).forEach((ch, charIndex) => {
    const wrap = document.createElement('span');
    wrap.className = 'sub-char';
    wrap.style.transitionDelay = `${charIndex * 25}ms`;

    const dim = document.createElement('span');
    dim.className = 'sub-char-dim';
    dim.textContent = ch;

    const bright = document.createElement('span');
    bright.className = 'sub-char-bright';
    bright.textContent = ch;

    wrap.append(dim, bright);
    button.appendChild(wrap);
  });

  button.addEventListener('mouseenter', () => setActive(index));
  button.addEventListener('focus', () => setActive(index));
  button.addEventListener('click', () => showPricing(index));

  return button;
}

function buildImage(service, index) {
  const img = document.createElement('img');
  img.src = service.img;
  img.alt = service.title;
  img.loading = index === 0 ? 'eager' : 'lazy';
  img.decoding = 'async';
  return img;
}

function setActive(index) {
  if (index === activeIndex) return;
  activeIndex = index;
  items.forEach((item, i) => item.classList.toggle('is-active', i === index));
  images.forEach((img, i) => img.classList.toggle('is-visible', i === index));
}

SERVICES.forEach((service, index) => {
  const item = buildItem(service, index);
  const img = buildImage(service, index);
  listEl.appendChild(item);
  mediaEl.appendChild(img);
  items.push(item);
  images.push(img);
});

// First service starts revealed, matching the hover component's default
// activeSlide of 0 — otherwise the picker opens with no image shown at all.
items[0].classList.add('is-active');
images[0].classList.add('is-visible');

// ==========================================
// SCREEN 2 — plans/pricing for whichever service was clicked above.
// ==========================================

const selectScreen = document.getElementById('sub-select');
const pricingScreen = document.getElementById('sub-pricing');
const pricingServiceLabel = document.getElementById('sub-pricing-service');
const pricingSub = document.getElementById('sub-pricing-sub');
const pricingGrid = document.getElementById('sub-pricing-grid');
const compareTable = document.getElementById('sub-compare-table');
const backButton = document.getElementById('sub-back');
const switchEl = document.getElementById('sub-switch');

let isYearly = false;

const CHECK_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
const CROSS_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>';
const rupeeFormatter = new Intl.NumberFormat('en-IN');

function formatPrice(amount) {
  return `₹${rupeeFormatter.format(amount)}`;
}

function renderPlanCard(plan) {
  const card = document.createElement('div');
  card.className = `sub-plan${plan.popular ? ' is-popular' : ''}`;

  const mailSubject = encodeURIComponent(`Subscription inquiry — ${plan.name} (${pricingServiceLabel.textContent})`);

  card.innerHTML = `
    ${plan.popular ? '<span class="sub-plan-badge">Most booked</span>' : ''}
    <div>
      <div class="sub-plan-price">
        <span class="sub-plan-price-value">${formatPrice(isYearly ? plan.yearly : plan.monthly)}</span>
        <span class="sub-plan-price-period">/${isYearly ? 'year' : 'month'}</span>
      </div>
      <h3 class="sub-plan-name">${plan.name}</h3>
      <p class="sub-plan-tagline">${plan.tagline}</p>
      <ul class="sub-plan-features">
        ${plan.features.map((f) => `<li><span class="sub-plan-check">${CHECK_ICON}</span><span>${f}</span></li>`).join('')}
      </ul>
    </div>
    <a class="sub-plan-cta" href="mailto:${CONTACT_EMAIL}?subject=${mailSubject}">Get started</a>
  `;
  return card;
}

function renderPlans() {
  pricingGrid.innerHTML = '';
  PLANS.forEach((plan) => pricingGrid.appendChild(renderPlanCard(plan)));
}

function renderCell(value) {
  if (value === true) return `<span class="sub-compare-check">${CHECK_ICON}</span>`;
  if (value === false) return `<span class="sub-compare-cross">${CROSS_ICON}</span>`;
  return value;
}

function renderComparisonTable() {
  const headCells = PLANS.map((plan) => `<th class="${plan.popular ? 'is-popular' : ''}">${plan.name}</th>`).join('');
  const bodyRows = COMPARISON_FEATURES.map((row) => `
    <tr>
      <td>${row.name}</td>
      ${row.values.map((value, i) => `<td class="${PLANS[i].popular ? 'is-popular' : ''}">${renderCell(value)}</td>`).join('')}
    </tr>
  `).join('');

  compareTable.innerHTML = `
    <thead><tr><th></th>${headCells}</tr></thead>
    <tbody>${bodyRows}</tbody>
  `;
}

function setPeriod(yearly) {
  isYearly = yearly;
  switchEl.classList.toggle('is-yearly', yearly);
  switchEl.querySelectorAll('.sub-switch-btn').forEach((btn) => {
    btn.classList.toggle('is-active', (btn.dataset.period === 'yearly') === yearly);
  });
  pricingGrid.querySelectorAll('.sub-plan-price-value').forEach((el, i) => {
    const plan = PLANS[i];
    el.style.opacity = '0';
    setTimeout(() => {
      el.textContent = formatPrice(yearly ? plan.yearly : plan.monthly);
      el.style.opacity = '1';
    }, 150);
  });
  pricingGrid.querySelectorAll('.sub-plan-price-period').forEach((el) => {
    el.textContent = `/${yearly ? 'year' : 'month'}`;
  });
}

switchEl.querySelectorAll('.sub-switch-btn').forEach((btn) => {
  btn.addEventListener('click', () => setPeriod(btn.dataset.period === 'yearly'));
});

const SCREEN_TRANSITION_MS = 320;

function showPricing(index) {
  const service = SERVICES[index];
  pricingServiceLabel.textContent = service.title;
  pricingSub.textContent = `Retainer plans for ongoing ${service.title.toLowerCase()} content — pick the cadence that fits.`;
  setPeriod(false);
  renderPlans();
  renderComparisonTable();

  selectScreen.classList.add('sub-fade-out');
  setTimeout(() => {
    selectScreen.hidden = true;
    selectScreen.classList.remove('sub-fade-out');

    pricingScreen.hidden = false;
    pricingScreen.classList.add('sub-fade-in-prep');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => pricingScreen.classList.remove('sub-fade-in-prep'));
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, SCREEN_TRANSITION_MS);
}

function showSelect() {
  pricingScreen.classList.add('sub-fade-out');
  setTimeout(() => {
    pricingScreen.hidden = true;
    pricingScreen.classList.remove('sub-fade-out');

    selectScreen.hidden = false;
    selectScreen.classList.add('sub-fade-in-prep');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => selectScreen.classList.remove('sub-fade-in-prep'));
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, SCREEN_TRANSITION_MS);
}

backButton.addEventListener('click', showSelect);

// ==========================================
// SHARED NAV DIAL
// ==========================================
initDial();
