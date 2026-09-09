import { createClient } from '@supabase/supabase-js';
import { gsap } from 'gsap';
import { notifyEnquiryReceived } from './emailNotifications.js';
import { initDial } from './dial.js';
import { initStarfield } from './starfield.js';
import {
  BOOKING_SERVICES,
  DURATIONS,
  BUSINESS_HOURS,
  CLOSED_WEEKDAYS,
  SLOT_STEP_MINUTES,
  MIN_LEAD_HOURS,
  BOOKABLE_DAYS_AHEAD,
} from './bookingData.js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, isConfigured } from './booking.config.js';

const supabase = isConfigured() ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

document.getElementById('book-config-banner').hidden = isConfigured();

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ==========================================
// CURSOR-TILT — a lightweight "3D card" effect (perspective rotate + a
// radial sheen tracking the pointer) matching the real 3D interactions
// used elsewhere on the site (coverflowCarousel.js, stellarGallery.js).
// ==========================================

function attachTilt(el, maxDeg = 8) {
  if (prefersReducedMotion || !el) return;
  el.classList.add('book-tilt');
  el.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'touch') return;
    const rect = el.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    const rx = (0.5 - py) * maxDeg;
    const ry = (px - 0.5) * maxDeg;
    el.style.transform = `perspective(800px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
    el.style.setProperty('--mx', `${px * 100}%`);
    el.style.setProperty('--my', `${py * 100}%`);
  });
  el.addEventListener('pointerleave', () => {
    el.style.transform = '';
  });
}

attachTilt(document.getElementById('book-scheduler'), 4);
attachTilt(document.querySelector('.book-summary'), 4);

// ==========================================
// STEP NAVIGATION — 4 panels, one visible at a time. GSAP drives a real 3D
// exit/enter (rotateX on a perspective container) with a staggered entrance
// for each panel's own children, plus a sliding gold underline tracking the
// active step label.
// ==========================================

const STEP_IDS = ['book-step-service', 'book-step-datetime', 'book-step-details', 'book-step-confirm'];
const stepEls = STEP_IDS.map((id) => document.getElementById(id));
const stepLabels = document.querySelectorAll('.book-step-label');
const stepsNav = document.getElementById('book-steps');
const stepsIndicator = document.getElementById('book-steps-indicator');
let currentStep = 0;

function updateStepLabels() {
  stepLabels.forEach((label) => {
    const idx = Number(label.dataset.step);
    label.classList.toggle('is-active', idx === currentStep);
    label.classList.toggle('is-done', idx < currentStep);
  });
}

function moveStepIndicator() {
  const activeLabel = stepsNav.querySelector(`.book-step-label[data-step="${currentStep}"]`);
  if (!activeLabel) return;
  const navRect = stepsNav.getBoundingClientRect();
  const labelRect = activeLabel.getBoundingClientRect();
  stepsIndicator.style.width = `${labelRect.width}px`;
  stepsIndicator.style.transform = `translateX(${labelRect.left - navRect.left}px)`;
}

function animateStepEntrance(panel) {
  if (prefersReducedMotion) return;
  const children = panel.querySelectorAll(':scope > *');
  gsap.fromTo(
    children,
    { opacity: 0, y: 18 },
    { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', stagger: 0.06, delay: 0.08 }
  );
}

function goToStep(index) {
  const outgoing = stepEls[currentStep];
  const incoming = stepEls[index];
  currentStep = index;
  updateStepLabels();
  moveStepIndicator();

  if (prefersReducedMotion) {
    outgoing.hidden = true;
    incoming.hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  gsap.to(outgoing, {
    opacity: 0,
    y: -26,
    rotateX: -10,
    duration: 0.35,
    ease: 'power2.in',
    onComplete: () => {
      outgoing.hidden = true;
      gsap.set(outgoing, { clearProps: 'opacity,transform' });

      incoming.hidden = false;
      gsap.fromTo(
        incoming,
        { opacity: 0, y: 30, rotateX: 10 },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          duration: 0.55,
          ease: 'power3.out',
          onComplete: () => gsap.set(incoming, { clearProps: 'transform' }),
        }
      );
      animateStepEntrance(incoming);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
  });
}

updateStepLabels();
moveStepIndicator();
window.addEventListener('resize', moveStepIndicator);

// ==========================================
// STEP 1 — service + duration
// ==========================================

const serviceGrid = document.getElementById('book-service-grid');
const durationRow = document.getElementById('book-duration-row');
const toDatetimeBtn = document.getElementById('book-to-datetime');

let selectedServiceIndex = null;
let selectedDuration = null; // { label, minutes }

BOOKING_SERVICES.forEach((service, index) => {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'book-service-card';
  card.innerHTML = `
    <span class="book-service-title">${service.title}</span>
    <span class="book-service-blurb">${service.blurb}</span>
  `;
  card.addEventListener('click', () => {
    selectedServiceIndex = index;
    serviceGrid.querySelectorAll('.book-service-card').forEach((el, i) => el.classList.toggle('is-selected', i === index));
    checkStep1Ready();
  });
  attachTilt(card, 10);
  serviceGrid.appendChild(card);
});

DURATIONS.forEach((duration) => {
  const chip = document.createElement('button');
  chip.type = 'button';
  chip.className = 'book-chip';
  chip.textContent = duration.label;
  chip.addEventListener('click', () => {
    selectedDuration = duration;
    durationRow.querySelectorAll('.book-chip').forEach((el) => el.classList.toggle('is-selected', el === chip));
    checkStep1Ready();
  });
  durationRow.appendChild(chip);
});

function checkStep1Ready() {
  toDatetimeBtn.disabled = selectedServiceIndex === null || !selectedDuration;
}

toDatetimeBtn.addEventListener('click', () => {
  renderCalendar();
  goToStep(1);
});

// ==========================================
// STEP 2 — calendar + time slots
// ==========================================

const calendarMonthLabel = document.getElementById('book-calendar-month');
const calendarDaysEl = document.getElementById('book-calendar-days');
const calendarPrevBtn = document.getElementById('book-calendar-prev');
const calendarNextBtn = document.getElementById('book-calendar-next');
const slotsLabel = document.getElementById('book-slots-label');
const slotsGrid = document.getElementById('book-slots-grid');
const toDetailsBtn = document.getElementById('book-to-details');
const backToServiceBtn = document.getElementById('book-back-to-service');
const backToDatetimeBtn = document.getElementById('book-back-to-datetime');

const MONTH_FORMATTER = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });
const DAY_FORMATTER = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
const TIME_FORMATTER = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' });

const today = new Date();
today.setHours(0, 0, 0, 0);
const maxDate = new Date(today);
maxDate.setDate(maxDate.getDate() + BOOKABLE_DAYS_AHEAD);

let viewMonth = new Date(today.getFullYear(), today.getMonth(), 1);
let selectedDate = null; // Date at local midnight
let selectedSlot = null; // Date

function isDaySelectable(date) {
  if (date < today || date > maxDate) return false;
  if (CLOSED_WEEKDAYS.includes(date.getDay())) return false;

  // The lead time can eat an entire day (e.g. today, once its business
  // hours can no longer fit a slot starting MIN_LEAD_HOURS from now) —
  // grey those out too rather than let the user pick a day that will only
  // ever show "no slots available".
  const close = new Date(date);
  close.setHours(BUSINESS_HOURS.closeHour, 0, 0, 0);
  const latestPossibleStart = close.getTime() - selectedDuration.minutes * 60 * 1000;
  const minStart = Date.now() + MIN_LEAD_HOURS * 3600 * 1000;
  if (latestPossibleStart < minStart) return false;

  return true;
}

function renderCalendar() {
  calendarMonthLabel.textContent = MONTH_FORMATTER.format(viewMonth);
  calendarDaysEl.innerHTML = '';

  const firstWeekday = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1).getDay();
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();

  for (let i = 0; i < firstWeekday; i++) {
    const filler = document.createElement('button');
    filler.className = 'book-calendar-day is-empty';
    filler.disabled = true;
    calendarDaysEl.appendChild(filler);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'book-calendar-day';
    btn.textContent = String(day);
    btn.disabled = !isDaySelectable(date);
    if (selectedDate && date.getTime() === selectedDate.getTime()) btn.classList.add('is-selected');
    btn.addEventListener('click', () => selectDate(date));
    calendarDaysEl.appendChild(btn);
  }

  const prevMonthEnd = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 0);
  calendarPrevBtn.disabled = prevMonthEnd < today;
  const nextMonthStart = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1);
  calendarNextBtn.disabled = nextMonthStart > maxDate;
}

calendarPrevBtn.addEventListener('click', () => {
  viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1);
  renderCalendar();
});

calendarNextBtn.addEventListener('click', () => {
  viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1);
  renderCalendar();
});

async function fetchBusyRangesForDate(date) {
  if (!supabase) return [];
  const dayStart = new Date(date);
  const dayEnd = new Date(date);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const { data, error } = await supabase
    .from('public_busy_slots')
    .select('starts_at, ends_at')
    .lt('starts_at', dayEnd.toISOString())
    .gt('ends_at', dayStart.toISOString());

  if (error) {
    console.error('Failed to load availability', error);
    return [];
  }
  return data;
}

function computeSlots(date, durationMinutes, busyRanges) {
  const open = new Date(date);
  open.setHours(BUSINESS_HOURS.openHour, 0, 0, 0);
  const close = new Date(date);
  close.setHours(BUSINESS_HOURS.closeHour, 0, 0, 0);

  const minStart = new Date(Date.now() + MIN_LEAD_HOURS * 3600 * 1000);
  const stepMs = SLOT_STEP_MINUTES * 60 * 1000;
  const durationMs = durationMinutes * 60 * 1000;

  const slots = [];
  for (let t = open.getTime(); t + durationMs <= close.getTime(); t += stepMs) {
    if (t < minStart.getTime()) continue;
    const slotStart = new Date(t);
    const slotEnd = new Date(t + durationMs);
    const overlaps = busyRanges.some((range) => slotStart < new Date(range.ends_at) && slotEnd > new Date(range.starts_at));
    if (!overlaps) slots.push(slotStart);
  }
  return slots;
}

async function selectDate(date) {
  selectedDate = date;
  selectedSlot = null;
  toDetailsBtn.disabled = true;
  renderCalendar();

  slotsLabel.textContent = `Loading times for ${DAY_FORMATTER.format(date)}...`;
  slotsGrid.innerHTML = '';

  const busyRanges = await fetchBusyRangesForDate(date);
  const slots = computeSlots(date, selectedDuration.minutes, busyRanges);

  slotsLabel.textContent = `Open times for ${DAY_FORMATTER.format(date)}`;
  slotsGrid.innerHTML = '';

  if (!slots.length) {
    slotsGrid.innerHTML = '<span class="book-slots-empty">No slots long enough for this session on this day — try another date.</span>';
    return;
  }

  slots.forEach((slot) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'book-slot-btn';
    btn.textContent = TIME_FORMATTER.format(slot);
    btn.addEventListener('click', () => {
      selectedSlot = slot;
      slotsGrid.querySelectorAll('.book-slot-btn').forEach((el) => el.classList.toggle('is-selected', el === btn));
      toDetailsBtn.disabled = false;
    });
    slotsGrid.appendChild(btn);
  });
}

backToServiceBtn.addEventListener('click', () => goToStep(0));

toDetailsBtn.addEventListener('click', () => {
  fillSummary();
  goToStep(2);
});

// ==========================================
// STEP 3 — details form + summary
// ==========================================

const summaryService = document.getElementById('book-summary-service');
const summaryDuration = document.getElementById('book-summary-duration');
const summaryDate = document.getElementById('book-summary-date');
const summaryTime = document.getElementById('book-summary-time');
const bookForm = document.getElementById('book-form');
const submitBtn = document.getElementById('book-submit');
const formError = document.getElementById('book-form-error');

function fillSummary() {
  const service = BOOKING_SERVICES[selectedServiceIndex];
  summaryService.textContent = service.title;
  summaryDuration.textContent = selectedDuration.label;
  summaryDate.textContent = DAY_FORMATTER.format(selectedDate);
  summaryTime.textContent = TIME_FORMATTER.format(selectedSlot);
}

backToDatetimeBtn.addEventListener('click', () => goToStep(1));

function showFormError(message) {
  formError.textContent = message;
  formError.hidden = false;
}

// Stage 1 of the email flow. The enquiry is already saved by this point, so
// a mail failure must never block the client's confirmation screen — we just
// adjust what the screen claims.
async function sendEnquiryEmails(bookingId) {
  const sent = await notifyEnquiryReceived(bookingId);

  // Only claim we emailed them if we actually did.
  document.getElementById('book-confirm-body').textContent = sent
    ? 'We’ve emailed you a copy of your request and we’re holding this slot for you. Our team will review it and confirm your session shortly.'
    : 'We’re holding this slot for you. Our team will review your request and get in touch to confirm your session shortly.';
}

bookForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  formError.hidden = true;

  if (!supabase) {
    showFormError('Booking isn’t connected to a database yet — see the config banner at the top of the page.');
    return;
  }

  const startsAt = selectedSlot;
  const endsAt = new Date(startsAt.getTime() + selectedDuration.minutes * 60 * 1000);

  const booking = {
    // Minted here rather than read back from the insert: anon has INSERT but
    // deliberately no SELECT on bookings, so `.select()` after inserting
    // would be refused. Supplying the id means we can still tell the email
    // endpoint which booking to send for, without loosening that policy.
    id: crypto.randomUUID(),
    service: BOOKING_SERVICES[selectedServiceIndex].title,
    duration_minutes: selectedDuration.minutes,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    client_name: document.getElementById('book-name').value.trim(),
    email: document.getElementById('book-email').value.trim(),
    phone: document.getElementById('book-phone').value.trim() || null,
    notes: document.getElementById('book-notes').value.trim() || null,
  };

  submitBtn.disabled = true;
  submitBtn.textContent = 'Booking...';

  const { error } = await supabase.from('bookings').insert(booking);

  submitBtn.disabled = false;
  submitBtn.textContent = 'Confirm Booking';

  if (error) {
    console.error('Booking insert failed', error);

    // Postgres exclusion-constraint violation -> someone else took this
    // slot between it being shown and this submit.
    if (error.code === '23P01') {
      showFormError('That slot was just booked by someone else — please go back and pick another time.');
    } else if (!error.code && !error.status) {
      // supabase-js reports a blocked or dropped request with no Postgres
      // code and no HTTP status. A browser extension blocking the request
      // is the usual culprit, and "try again" sends people in circles when
      // that's what happened.
      showFormError('Couldn’t reach our booking server. Check your connection (or an ad/privacy blocker) and try again.');
    } else {
      // Naming the code turns an unreproducible "something went wrong" into
      // something a person can actually report back to us.
      const detail = error.code ? ` (code ${error.code})` : '';
      showFormError(`Something went wrong saving your booking${detail}. Please try again, or email us if it keeps happening.`);
    }
    return;
  }

  await sendEnquiryEmails(booking.id);
  goToStep(3);
});

// ==========================================
// SHARED NAV DIAL + BACKGROUND
// ==========================================
initDial();
initStarfield();
