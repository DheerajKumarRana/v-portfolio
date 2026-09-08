import nodemailer from 'nodemailer';
import { enquiryReceivedEmail, bookingConfirmedEmail, ownerAlertEmail } from '../emailTemplates.js';

// ==========================================
// POST /api/send-email — the only thing allowed to send mail.
//
// Threat model first, because a naive version of this endpoint is an open
// spam relay:
//
//   * The caller NEVER supplies a recipient, subject or body. It sends a
//     booking id; every address and every word of content is read back out
//     of the database here. So the worst a stranger can do is re-trigger a
//     mail to a customer who genuinely booked.
//   * Even that is blocked: stage-1 mail is refused once
//     `enquiry_email_sent_at` is set, so replaying the request is a no-op.
//   * The confirmation mail is owner-only — it requires a Supabase access
//     token belonging to a user on the `admins` allowlist.
//   * Gmail credentials and the service-role key live in environment
//     variables on the server, never in the bundle the browser downloads.
//
// Required env vars (set these in the Vercel project settings):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GMAIL_USER, GMAIL_APP_PASSWORD
// ==========================================

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getEnv() {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GMAIL_USER, GMAIL_APP_PASSWORD } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !GMAIL_USER || !GMAIL_APP_PASSWORD) return null;
  // Everything is trimmed: pasting a value into a dashboard field very
  // easily carries a trailing newline or space, which travels into the
  // Authorization header and gets the request rejected outright — a failure
  // that looks nothing like "your key has a stray space on the end".
  // The URL also loses any trailing slash so the path can't double up.
  return {
    SUPABASE_URL: SUPABASE_URL.trim().replace(/\/+$/, ''),
    SUPABASE_SERVICE_ROLE_KEY: SUPABASE_SERVICE_ROLE_KEY.trim(),
    GMAIL_USER: GMAIL_USER.trim(),
    // Google prints app passwords in four groups of four; the spaces are for
    // reading, not part of the secret, and SMTP rejects them.
    GMAIL_APP_PASSWORD: GMAIL_APP_PASSWORD.replace(/\s+/g, ''),
  };
}

/** The publishable key is the browser's key: it has RLS applied, so with it
 *  every booking lookup here comes back empty and the endpoint looks like it
 *  simply can't find anything. Catching the mix-up by shape turns a silent,
 *  very confusing failure into a message that names the actual problem. */
function serviceKeyProblem(key) {
  if (key.startsWith('sb_publishable_') || key.startsWith('sb_anon_')) {
    return 'service_role_key_is_actually_the_publishable_key';
  }
  return null;
}

function makeTransport(env) {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: env.GMAIL_USER, pass: env.GMAIL_APP_PASSWORD },
  });
}

// Supabase is reached over plain HTTP rather than through supabase-js. The
// SDK boots a Realtime client that needs a WebSocket global, which Node 20
// doesn't have — and the serverless Node version isn't ours to guarantee.
// These four calls are all this endpoint needs, with no runtime assumptions
// and a smaller cold start.

function serviceHeaders(env, extra = {}) {
  return {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    ...extra,
  };
}

/** Returns { booking } or { error } — the two failure modes are kept apart
 *  because "the database refused me" and "no such row" need very different
 *  fixes, and collapsing both into 404 hides misconfiguration. */
async function fetchBooking(env, id) {
  const url = `${env.SUPABASE_URL}/rest/v1/bookings?id=eq.${encodeURIComponent(id)}&select=*`;

  let response;
  try {
    response = await fetch(url, { headers: serviceHeaders(env) });
  } catch (err) {
    console.error('Supabase unreachable', err);
    return { error: 'supabase_unreachable' };
  }

  if (!response.ok) {
    console.error('Booking lookup rejected', response.status, await response.text().catch(() => ''));
    // The status is worth returning: 401/403 means the service-role key is
    // wrong, 404 means SUPABASE_URL points somewhere unexpected. Neither
    // reveals anything secret, and guessing between them is painful.
    return { error: 'booking_lookup_rejected', status: response.status };
  }

  const [booking] = await response.json();
  return booking ? { booking } : { error: 'booking_not_found' };
}

async function stampSent(env, id, column) {
  const url = `${env.SUPABASE_URL}/rest/v1/bookings?id=eq.${encodeURIComponent(id)}`;
  await fetch(url, {
    method: 'PATCH',
    headers: serviceHeaders(env, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ [column]: new Date().toISOString() }),
  });
}

/** Resolves the caller to an allowlisted admin, or null. Verifies the token
 *  with Supabase Auth, then checks it against the `admins` table. */
async function resolveAdmin(env, authHeader) {
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;

  const userResponse = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${token}` },
  });
  if (!userResponse.ok) return null;

  const user = await userResponse.json();
  if (!user?.id) return null;

  const adminResponse = await fetch(
    `${env.SUPABASE_URL}/rest/v1/admins?user_id=eq.${encodeURIComponent(user.id)}&select=user_id`,
    { headers: serviceHeaders(env) },
  );
  if (!adminResponse.ok) return null;

  const [adminRow] = await adminResponse.json();
  return adminRow ? user : null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ sent: false, reason: 'method_not_allowed' });
  }

  const env = getEnv();
  if (!env) return res.status(500).json({ sent: false, reason: 'email_not_configured' });

  const keyProblem = serviceKeyProblem(env.SUPABASE_SERVICE_ROLE_KEY);
  if (keyProblem) return res.status(500).json({ sent: false, reason: keyProblem });

  const { action, bookingId, resend } = req.body ?? {};
  if (!UUID_RE.test(bookingId ?? '')) {
    return res.status(400).json({ sent: false, reason: 'invalid_booking_id' });
  }

  // Reads run with the service-role key: this is the server, so it can see
  // the row that RLS deliberately hides from the browser.
  const lookup = await fetchBooking(env, bookingId);
  if (lookup.error) {
    return res
      .status(lookup.error === 'booking_not_found' ? 404 : 500)
      .json({ sent: false, reason: lookup.error, upstreamStatus: lookup.status });
  }
  const { booking } = lookup;

  try {
    const transport = makeTransport(env);
    const from = `"Vistaar Media" <${env.GMAIL_USER}>`;

    if (action === 'enquiry') {
      // Public action — exactly-once, so replaying it can't spam anyone.
      if (booking.enquiry_email_sent_at) {
        return res.status(200).json({ sent: false, reason: 'already_sent' });
      }

      const clientMail = enquiryReceivedEmail(booking);
      await transport.sendMail({
        from,
        to: booking.email,
        replyTo: env.GMAIL_USER,
        subject: clientMail.subject,
        text: clientMail.text,
        html: clientMail.html,
      });

      await stampSent(env, booking.id, 'enquiry_email_sent_at');

      // The studio's own heads-up. Sent after the client's mail and allowed
      // to fail on its own — the client's receipt is the one that matters.
      try {
        const alert = ownerAlertEmail(booking);
        await transport.sendMail({
          from,
          to: env.GMAIL_USER,
          replyTo: booking.email,
          subject: alert.subject,
          text: alert.text,
          html: alert.html,
        });
      } catch (alertErr) {
        console.error('Owner alert failed', alertErr);
      }

      return res.status(200).json({ sent: true });
    }

    if (action === 'confirmed') {
      const admin = await resolveAdmin(env, req.headers.authorization);
      if (!admin) return res.status(401).json({ sent: false, reason: 'not_authorized' });

      if (booking.confirmation_email_sent_at && !resend) {
        return res.status(200).json({ sent: false, reason: 'already_sent' });
      }

      const mail = bookingConfirmedEmail(booking);
      await transport.sendMail({
        from,
        to: booking.email,
        replyTo: env.GMAIL_USER,
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
      });

      await stampSent(env, booking.id, 'confirmation_email_sent_at');

      return res.status(200).json({ sent: true });
    }

    return res.status(400).json({ sent: false, reason: 'unknown_action' });
  } catch (err) {
    console.error('send-email failed', err);
    return res.status(500).json({ sent: false, reason: 'send_failed' });
  }
}
