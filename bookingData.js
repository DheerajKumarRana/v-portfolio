// Shared config for booking.html/.js — separate from servicesData.js so the
// studio can tune session lengths/hours without touching the portfolio data.

import { SERVICES } from './servicesData.js';

// Where studio-facing mail goes: the "new enquiry" alert, and the reply-to
// on everything the client receives.
export const CONTACT_EMAIL = 'vistaarcontent@gmail.com';

// Every service currently offers the same session lengths — split this out
// per-service (e.g. an object keyed by title) later if some categories need
// different tiers.
export const DURATIONS = [
  { label: '1 Hour', minutes: 60 },
  { label: '2 Hours', minutes: 120 },
  { label: 'Half Day (4 Hours)', minutes: 240 },
  { label: 'Full Day (8 Hours)', minutes: 480 },
];

// Studio working hours the calendar builds candidate slots within.
export const BUSINESS_HOURS = { openHour: 10, closeHour: 18 };
export const CLOSED_WEEKDAYS = [0]; // 0 = Sunday
export const SLOT_STEP_MINUTES = 30;
export const MIN_LEAD_HOURS = 24; // can't book a slot starting sooner than this from now
export const BOOKABLE_DAYS_AHEAD = 60; // how far into the future the calendar opens

// Reuse the same 7 categories shown on services.html/subscription.html so
// the picker stays in sync with one source of truth.
export const BOOKING_SERVICES = SERVICES.map((s) => ({ title: s.title, img: s.img, blurb: s.blurb }));

// The enquiry funnel the owner moves each submission through on
// dashboard.html. Mirrors the `valid_status` constraint in
// supabase/002-dashboard-and-auth.sql — keep the two in sync.
//
// `releasesSlot` marks the one status that frees the time back up for the
// public calendar; everything else keeps the slot held.
export const ENQUIRY_STATUSES = [
  { value: 'new', label: 'New', releasesSlot: false },
  { value: 'contacted', label: 'Contacted', releasesSlot: false },
  { value: 'confirmed', label: 'Confirmed', releasesSlot: false },
  { value: 'completed', label: 'Completed', releasesSlot: false },
  { value: 'cancelled', label: 'Cancelled', releasesSlot: true },
];
