import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, isConfigured } from './booking.config.js';

// ==========================================
// PASSWORD RESET — the landing page for the recovery link Supabase emails.
//
// The link carries a one-time token in the URL, which supabase-js trades
// for a short-lived session automatically (detectSessionInUrl). Once that
// session exists we're allowed to call updateUser() with a new password;
// without it, the link is expired or already used.
// ==========================================

const el = (id) => document.getElementById(id);

const checking = el('reset-checking');
const form = el('reset-form');
const done = el('reset-done');
const invalid = el('reset-invalid');
const errorEl = el('reset-error');

function showForm() {
  checking.hidden = true;
  form.hidden = false;
}

function showInvalid(message) {
  checking.hidden = true;
  form.hidden = true;
  if (message) el('reset-invalid-msg').textContent = message;
  invalid.hidden = false;
}

if (!isConfigured()) {
  showInvalid('Supabase isn’t configured for this site yet.');
} else {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  let recoveryReady = false;
  function markReady() {
    if (recoveryReady) return;
    recoveryReady = true;
    showForm();
  }

  // Supabase reports a dead link by redirecting here with the reason in the
  // URL hash rather than by failing the token exchange.
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const urlError = hashParams.get('error_description') || hashParams.get('error');

  supabase.auth.onAuthStateChange((_event, session) => {
    if (session) markReady();
  });

  (async () => {
    if (urlError) {
      showInvalid(urlError.replace(/\+/g, ' '));
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      markReady();
      return;
    }

    // getSession() can win the race against the URL token exchange, so give
    // that a moment to land before declaring the link dead.
    setTimeout(async () => {
      if (recoveryReady) return;
      const { data: { session: late } } = await supabase.auth.getSession();
      if (late) markReady();
      else showInvalid();
    }, 1500);
  })();

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorEl.hidden = true;

    const password = el('reset-password').value;
    if (password !== el('reset-confirm').value) {
      errorEl.textContent = 'Those passwords don’t match.';
      errorEl.hidden = false;
      return;
    }

    const submit = el('reset-submit');
    submit.disabled = true;
    submit.textContent = 'Updating...';

    const { error } = await supabase.auth.updateUser({ password });

    submit.disabled = false;
    submit.textContent = 'Update password';

    if (error) {
      errorEl.textContent = error.message;
      errorEl.hidden = false;
      return;
    }

    // Drop the recovery session so the new password actually gets used at
    // the next sign-in, rather than silently riding this one-time session.
    await supabase.auth.signOut();
    form.hidden = true;
    done.hidden = false;
  });
}
