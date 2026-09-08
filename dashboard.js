import { createClient } from '@supabase/supabase-js';
import { BOOKING_SERVICES, ENQUIRY_STATUSES } from './bookingData.js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, isConfigured } from './booking.config.js';
import { notifyBookingConfirmed } from './emailNotifications.js';

// ==========================================
// OWNER DASHBOARD
//
// Access control lives in the DATABASE, not here: RLS only returns booking
// rows to a logged-in user who is also listed in `admins` (see
// supabase/002-dashboard-and-auth.sql). Everything this file does to hide
// the UI is convenience — someone hitting the REST API directly with the
// publishable key still gets nothing back.
// ==========================================

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const PAGE_SIZE = 25;
const EXPORT_LIMIT = 1000;

const el = (id) => document.getElementById(id);

const bootMsg = el('dash-boot');
const gate = el('dash-gate');
const app = el('dash-app');

const DATE_FORMAT = new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const TIME_FORMAT = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit' });
const DATETIME_FORMAT = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });

// ==========================================
// AUTH
// ==========================================

const loginForm = el('dash-login-form');
const forgotForm = el('dash-forgot-form');
const loginError = el('dash-login-error');
const forgotNote = el('dash-forgot-note');

function showGate(message) {
  bootMsg.hidden = true;
  app.hidden = true;
  gate.hidden = false;
  loginForm.hidden = false;
  forgotForm.hidden = true;
  if (message) {
    loginError.textContent = message;
    loginError.hidden = false;
  }
}

el('dash-show-forgot').addEventListener('click', () => {
  loginForm.hidden = true;
  forgotForm.hidden = false;
  el('dash-forgot-email').value = el('dash-login-email').value;
});

el('dash-show-login').addEventListener('click', () => {
  forgotForm.hidden = true;
  loginForm.hidden = false;
});

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginError.hidden = true;
  const submit = el('dash-login-submit');
  submit.disabled = true;
  submit.textContent = 'Signing in...';

  const { data, error } = await supabase.auth.signInWithPassword({
    email: el('dash-login-email').value.trim(),
    password: el('dash-login-password').value,
  });

  submit.disabled = false;
  submit.textContent = 'Sign in';

  if (error) {
    loginError.textContent = error.message;
    loginError.hidden = false;
    return;
  }
  await enterDashboard(data.session);
});

forgotForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const submit = el('dash-forgot-submit');
  submit.disabled = true;
  submit.textContent = 'Sending...';

  await supabase.auth.resetPasswordForEmail(el('dash-forgot-email').value.trim(), {
    redirectTo: `${window.location.origin}/reset-password.html`,
  });

  submit.disabled = false;
  submit.textContent = 'Send reset link';

  // Deliberately the same message whether or not that address has an
  // account — otherwise this form doubles as a way to probe which emails
  // are registered.
  forgotNote.textContent = 'If that address has an account, a reset link is on its way.';
  forgotNote.hidden = false;
});

el('dash-logout').addEventListener('click', async () => {
  await supabase.auth.signOut();
  window.location.reload();
});

async function enterDashboard(session) {
  // Confirm the account is actually on the allowlist. RLS would hand back
  // an empty list anyway, but checking explicitly lets us say *why*
  // instead of showing a mysteriously empty dashboard.
  const { data, error } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (error || !data) {
    await supabase.auth.signOut();
    showGate('That account isn’t authorized for the enquiry dashboard.');
    return;
  }

  bootMsg.hidden = true;
  gate.hidden = true;
  app.hidden = false;
  el('dash-user-email').textContent = session.user.email;

  buildFilterControls();
  await Promise.all([loadStats(), loadEnquiries({ reset: true })]);
}

async function boot() {
  if (!isConfigured()) {
    bootMsg.textContent = 'Supabase isn’t configured — fill in booking.config.js first.';
    return;
  }
  const { data: { session } } = await supabase.auth.getSession();
  if (session) await enterDashboard(session);
  else showGate();
}

// ==========================================
// FILTER STATE
// ==========================================

const DATE_PRESETS = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'past', label: 'Past' },
  { value: 'all', label: 'All time' },
  { value: 'custom', label: 'Custom' },
];

// 'cancelled' is off by default — cancelled enquiries are noise in the
// day-to-day view, but the chip makes it one click to bring them back.
const DEFAULT_STATUSES = () => new Set(ENQUIRY_STATUSES.filter((s) => s.value !== 'cancelled').map((s) => s.value));

let filters;
let offset = 0;
let rows = [];
let total = 0;

function resetFilterState() {
  filters = {
    dateField: 'starts_at',
    preset: 'upcoming',
    from: '',
    to: '',
    statuses: DEFAULT_STATUSES(),
    service: '',
    search: '',
    sort: 'date_asc',
  };
}
resetFilterState();

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Resolve the active preset into concrete instants for the query. */
function resolveRange() {
  const now = new Date();
  const todayStart = startOfDay(now);

  switch (filters.preset) {
    case 'today': {
      const tomorrow = new Date(todayStart);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return { from: todayStart.toISOString(), to: tomorrow.toISOString() };
    }
    case 'week': {
      // Sunday-start weeks, matching the booking page's calendar.
      const weekStart = new Date(todayStart);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      return { from: weekStart.toISOString(), to: weekEnd.toISOString() };
    }
    case 'month': {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return { from: monthStart.toISOString(), to: monthEnd.toISOString() };
    }
    case 'upcoming':
      return { from: now.toISOString(), to: '' };
    case 'past':
      return { from: '', to: now.toISOString() };
    case 'custom': {
      const from = filters.from ? startOfDay(new Date(filters.from)).toISOString() : '';
      let to = '';
      if (filters.to) {
        // The `to` input is inclusive to a human, so extend past its end.
        const end = startOfDay(new Date(filters.to));
        end.setDate(end.getDate() + 1);
        to = end.toISOString();
      }
      return { from, to };
    }
    default:
      return { from: '', to: '' };
  }
}

/** PostgREST's or() filter is comma/paren delimited, so strip anything that
 *  would break out of the expression rather than trusting raw input. */
function sanitizeSearch(term) {
  return term.replace(/[,()*%\\]/g, ' ').trim();
}

function buildQuery({ count = false } = {}) {
  let query = count
    ? supabase.from('bookings').select('id', { count: 'exact', head: true })
    : supabase.from('bookings').select('*', { count: 'exact' });

  const { from, to } = resolveRange();
  if (from) query = query.gte(filters.dateField, from);
  if (to) query = query.lt(filters.dateField, to);

  if (filters.statuses.size < ENQUIRY_STATUSES.length) {
    query = query.in('status', [...filters.statuses]);
  }
  if (filters.service) query = query.eq('service', filters.service);

  const term = sanitizeSearch(filters.search);
  if (term) {
    query = query.or(`client_name.ilike.*${term}*,email.ilike.*${term}*,phone.ilike.*${term}*`);
  }

  const [field, ascending] = {
    date_asc: ['starts_at', true],
    date_desc: ['starts_at', false],
    created_desc: ['created_at', false],
    created_asc: ['created_at', true],
  }[filters.sort];

  return query.order(field, { ascending });
}

// ==========================================
// FILTER UI
// ==========================================

function buildFilterControls() {
  const presetWrap = el('dash-presets');
  presetWrap.innerHTML = '';
  DATE_PRESETS.forEach((preset) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = `dash-chip${preset.value === filters.preset ? ' is-active' : ''}`;
    chip.textContent = preset.label;
    chip.dataset.preset = preset.value;
    chip.addEventListener('click', () => {
      filters.preset = preset.value;
      presetWrap.querySelectorAll('.dash-chip').forEach((c) => c.classList.toggle('is-active', c === chip));
      el('dash-custom-range').hidden = preset.value !== 'custom';
      refresh();
    });
    presetWrap.appendChild(chip);
  });

  const statusWrap = el('dash-status-chips');
  statusWrap.innerHTML = '';
  ENQUIRY_STATUSES.forEach((status) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = `dash-chip${filters.statuses.has(status.value) ? ' is-active' : ''}`;
    chip.textContent = status.label;
    chip.addEventListener('click', () => {
      if (filters.statuses.has(status.value)) filters.statuses.delete(status.value);
      else filters.statuses.add(status.value);
      chip.classList.toggle('is-active', filters.statuses.has(status.value));
      refresh();
    });
    statusWrap.appendChild(chip);
  });

  const serviceSelect = el('dash-service');
  serviceSelect.innerHTML = '<option value="">All services</option>';
  BOOKING_SERVICES.forEach((service) => {
    const option = document.createElement('option');
    option.value = service.title;
    option.textContent = service.title;
    serviceSelect.appendChild(option);
  });

  const statusSelect = el('dash-detail-status');
  statusSelect.innerHTML = '';
  ENQUIRY_STATUSES.forEach((status) => {
    const option = document.createElement('option');
    option.value = status.value;
    option.textContent = status.label;
    statusSelect.appendChild(option);
  });
}

el('dash-date-field').addEventListener('click', (event) => {
  const btn = event.target.closest('.dash-segment-btn');
  if (!btn) return;
  filters.dateField = btn.dataset.field;
  el('dash-date-field').querySelectorAll('.dash-segment-btn').forEach((b) => b.classList.toggle('is-active', b === btn));
  refresh();
});

el('dash-from').addEventListener('change', (e) => { filters.from = e.target.value; refresh(); });
el('dash-to').addEventListener('change', (e) => { filters.to = e.target.value; refresh(); });
el('dash-service').addEventListener('change', (e) => { filters.service = e.target.value; refresh(); });
el('dash-sort').addEventListener('change', (e) => { filters.sort = e.target.value; refresh(); });

let searchTimer;
el('dash-search').addEventListener('input', (e) => {
  filters.search = e.target.value;
  clearTimeout(searchTimer);
  searchTimer = setTimeout(refresh, 300);
});

el('dash-reset-filters').addEventListener('click', () => {
  resetFilterState();
  el('dash-search').value = '';
  el('dash-service').value = '';
  el('dash-sort').value = 'date_asc';
  el('dash-from').value = '';
  el('dash-to').value = '';
  el('dash-custom-range').hidden = true;
  el('dash-date-field').querySelectorAll('.dash-segment-btn').forEach((b) => b.classList.toggle('is-active', b.dataset.field === 'starts_at'));
  buildFilterControls();
  refresh();
});

el('dash-refresh').addEventListener('click', refresh);
el('dash-load-more').addEventListener('click', () => loadEnquiries({ reset: false }));

function refresh() {
  loadStats();
  loadEnquiries({ reset: true });
}

// ==========================================
// DATA + RENDER
// ==========================================

async function loadStats() {
  const now = new Date();
  const in7 = new Date(now);
  in7.setDate(in7.getDate() + 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [fresh, upcoming, month] = await Promise.all([
    supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'new'),
    supabase.from('bookings').select('id', { count: 'exact', head: true })
      .gte('starts_at', now.toISOString()).lt('starts_at', in7.toISOString()).neq('status', 'cancelled'),
    supabase.from('bookings').select('id', { count: 'exact', head: true }).gte('created_at', monthStart.toISOString()),
  ]);

  el('dash-stat-new').textContent = fresh.count ?? '—';
  el('dash-stat-upcoming').textContent = upcoming.count ?? '—';
  el('dash-stat-month').textContent = month.count ?? '—';
}

async function loadEnquiries({ reset }) {
  const list = el('dash-list');
  if (reset) {
    offset = 0;
    rows = [];
    list.innerHTML = '<p class="dash-empty">Loading enquiries...</p>';
  }

  if (filters.statuses.size === 0) {
    rows = [];
    total = 0;
    renderList('No status selected — pick at least one status chip above.');
    return;
  }

  const { data, error, count } = await buildQuery().range(offset, offset + PAGE_SIZE - 1);

  if (error) {
    list.innerHTML = '<p class="dash-empty">Couldn’t load enquiries. Try refreshing.</p>';
    console.error(error);
    return;
  }

  rows = reset ? data : rows.concat(data);
  total = count ?? rows.length;
  offset = rows.length;
  renderList();
}

function statusLabel(value) {
  return ENQUIRY_STATUSES.find((s) => s.value === value)?.label ?? value;
}

function renderList(emptyMessage) {
  const list = el('dash-list');
  const countEl = el('dash-count');

  if (!rows.length) {
    list.innerHTML = `<p class="dash-empty">${emptyMessage ?? 'No enquiries match these filters.'}</p>`;
    countEl.textContent = '';
    el('dash-load-more').hidden = true;
    return;
  }

  countEl.textContent = `Showing ${rows.length} of ${total}`;

  // Group by the day of whichever date field is being filtered on, so
  // "which enquiries came in on which day" and "what's shooting on which
  // day" are both answerable from the same list.
  const groups = new Map();
  rows.forEach((row) => {
    const key = startOfDay(new Date(row[filters.dateField])).toISOString();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  });

  list.innerHTML = '';
  groups.forEach((groupRows, key) => {
    const group = document.createElement('div');
    group.className = 'dash-day-group';

    const head = document.createElement('div');
    head.className = 'dash-day-head';
    head.innerHTML = `
      <span class="dash-day-title">${DATE_FORMAT.format(new Date(key))}</span>
      <span class="dash-day-meta">${groupRows.length} ${groupRows.length === 1 ? 'enquiry' : 'enquiries'}</span>
    `;
    group.appendChild(head);

    groupRows.forEach((row) => group.appendChild(renderRow(row)));
    list.appendChild(group);
  });

  el('dash-load-more').hidden = rows.length >= total;
}

function renderRow(row) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'dash-row';
  btn.innerHTML = `
    <span class="dash-row-time">
      ${TIME_FORMAT.format(new Date(row.starts_at))}
      <span class="dash-row-sub">${row.duration_minutes} min</span>
    </span>
    <span>
      <span class="dash-row-name">${escapeHtml(row.client_name)}</span>
      <span class="dash-row-sub">${escapeHtml(row.email)}</span>
    </span>
    <span class="dash-row-service">${escapeHtml(row.service)}</span>
    <span class="dash-badge dash-badge-${row.status}">${statusLabel(row.status)}</span>
  `;
  btn.addEventListener('click', () => openDrawer(row));
  return btn;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]));
}

// ==========================================
// DETAIL DRAWER
// ==========================================

let activeRow = null;

function openDrawer(row) {
  el('dash-detail-error').hidden = true;
  el('dash-detail-saved').hidden = true;
  renderDetail(row);

  el('dash-drawer').hidden = false;
  el('dash-drawer-backdrop').hidden = false;
}

function renderDetail(row) {
  activeRow = row;
  el('dash-drawer-title').textContent = row.client_name;

  const starts = new Date(row.starts_at);
  const ends = new Date(row.ends_at);
  el('dash-detail').innerHTML = `
    <dt>Service</dt><dd>${escapeHtml(row.service)}</dd>
    <dt>Session</dt><dd>${DATE_FORMAT.format(starts)}<br>${TIME_FORMAT.format(starts)} – ${TIME_FORMAT.format(ends)}</dd>
    <dt>Duration</dt><dd>${row.duration_minutes} min</dd>
    <dt>Email</dt><dd><a href="mailto:${encodeURIComponent(row.email)}">${escapeHtml(row.email)}</a></dd>
    <dt>Phone</dt><dd>${row.phone ? `<a href="tel:${encodeURIComponent(row.phone)}">${escapeHtml(row.phone)}</a>` : '—'}</dd>
    <dt>Submitted</dt><dd>${DATETIME_FORMAT.format(new Date(row.created_at))}</dd>
    ${row.notes ? `<dt>Their notes</dt><dd class="dash-detail-quote">“${escapeHtml(row.notes)}”</dd>` : ''}
  `;

  el('dash-detail-status').value = row.status;
  el('dash-detail-notes').value = row.admin_notes ?? '';

  // Whether mail is actually deliverable is a server-side concern now, so
  // the drawer reports what the database recorded rather than guessing.
  const emailState = el('dash-detail-email-state');
  const resendBtn = el('dash-detail-resend');
  if (row.confirmation_email_sent_at) {
    emailState.textContent = `Confirmation email sent ${DATETIME_FORMAT.format(new Date(row.confirmation_email_sent_at))}.`;
    emailState.classList.add('is-sent');
    resendBtn.hidden = false;
  } else {
    emailState.textContent = 'No confirmation email sent yet — setting the status to Confirmed will send it.';
    emailState.classList.remove('is-sent');
    resendBtn.hidden = true;
  }
}

function closeDrawer() {
  activeRow = null;
  el('dash-drawer').hidden = true;
  el('dash-drawer-backdrop').hidden = true;
}

el('dash-drawer-close').addEventListener('click', closeDrawer);
el('dash-drawer-backdrop').addEventListener('click', closeDrawer);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !el('dash-drawer').hidden) closeDrawer();
});

/** Asks the server to send the client's confirmation. The send, the
 *  admin check and the exactly-once stamp all happen server-side in
 *  api/send-email.js — this just supplies proof of who's asking. */
async function requestConfirmationEmail(bookingId, { resend = false } = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;
  return notifyBookingConfirmed(bookingId, session.access_token, { resend });
}

/** Re-reads a row so the drawer shows whatever the server just stamped. */
async function reloadRow(id) {
  const { data } = await supabase.from('bookings').select('*').eq('id', id).maybeSingle();
  return data;
}

el('dash-detail-save').addEventListener('click', async () => {
  if (!activeRow) return;
  const save = el('dash-detail-save');
  const errorEl = el('dash-detail-error');
  const savedEl = el('dash-detail-saved');
  errorEl.hidden = true;
  savedEl.hidden = true;
  save.disabled = true;
  save.textContent = 'Saving...';

  const previousStatus = activeRow.status;
  const nextStatus = el('dash-detail-status').value;

  const { data: updated, error } = await supabase
    .from('bookings')
    .update({
      status: nextStatus,
      admin_notes: el('dash-detail-notes').value.trim() || null,
    })
    .eq('id', activeRow.id)
    .select()
    .single();

  if (error) {
    save.disabled = false;
    save.textContent = 'Save changes';
    errorEl.textContent = 'Couldn’t save those changes. Please try again.';
    errorEl.hidden = false;
    console.error(error);
    return;
  }

  let row = updated;
  let message = 'Saved.';

  // Stage 2 of the email flow. Gated three ways so the client never gets a
  // duplicate: the status has to actually be *changing* into confirmed, and
  // no confirmation can already be on record.
  const justConfirmed = nextStatus === 'confirmed' && previousStatus !== 'confirmed';
  if (justConfirmed && !row.confirmation_email_sent_at) {
    save.textContent = 'Emailing client...';
    if (await requestConfirmationEmail(row.id)) {
      row = (await reloadRow(row.id)) ?? row;
      message = 'Saved — confirmation email sent to the client.';
    } else {
      message = 'Saved, but the confirmation email didn’t go out. Try “Resend confirmation”.';
    }
  }

  save.disabled = false;
  save.textContent = 'Save changes';
  savedEl.textContent = message;
  savedEl.hidden = false;
  renderDetail(row);
  refresh();
});

el('dash-detail-resend').addEventListener('click', async () => {
  if (!activeRow) return;
  const button = el('dash-detail-resend');
  const errorEl = el('dash-detail-error');
  const savedEl = el('dash-detail-saved');
  errorEl.hidden = true;
  savedEl.hidden = true;

  if (!window.confirm(`Send the confirmation email to ${activeRow.email} again?`)) return;

  button.disabled = true;
  button.textContent = 'Sending...';

  const sent = await requestConfirmationEmail(activeRow.id, { resend: true });
  let row = activeRow;
  if (sent) row = (await reloadRow(activeRow.id)) ?? activeRow;

  button.disabled = false;
  button.textContent = 'Resend confirmation';

  if (!sent) {
    errorEl.textContent = 'That email didn’t go out — check the server email settings.';
    errorEl.hidden = false;
    return;
  }
  savedEl.textContent = 'Confirmation email re-sent.';
  savedEl.hidden = false;
  renderDetail(row);
});

el('dash-detail-delete').addEventListener('click', async () => {
  if (!activeRow) return;
  if (!window.confirm(`Delete the enquiry from ${activeRow.client_name}? This can’t be undone.`)) return;

  const { error } = await supabase.from('bookings').delete().eq('id', activeRow.id);
  if (error) {
    el('dash-detail-error').textContent = 'Couldn’t delete that enquiry.';
    el('dash-detail-error').hidden = false;
    console.error(error);
    return;
  }
  closeDrawer();
  refresh();
});

// ==========================================
// CSV EXPORT — exports everything matching the current filters, not just
// the page that happens to be loaded.
// ==========================================

el('dash-export').addEventListener('click', async () => {
  const button = el('dash-export');
  button.disabled = true;
  button.textContent = 'Exporting...';

  const { data, error } = await buildQuery().range(0, EXPORT_LIMIT - 1);

  button.disabled = false;
  button.textContent = 'Export CSV';
  if (error || !data?.length) return;

  const columns = ['created_at', 'starts_at', 'ends_at', 'duration_minutes', 'service', 'status', 'client_name', 'email', 'phone', 'notes', 'admin_notes'];
  const csv = [
    columns.join(','),
    ...data.map((row) => columns.map((col) => csvCell(row[col])).join(',')),
  ].join('\r\n');

  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `vistaar-enquiries-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
});

function csvCell(value) {
  if (value === null || value === undefined) return '';
  // Prefix formula-triggering characters so a stray "=" in a note can't
  // execute when the export is opened in Excel/Sheets.
  let str = String(value);
  if (/^[=+\-@]/.test(str)) str = `'${str}`;
  return `"${str.replace(/"/g, '""')}"`;
}

boot();
