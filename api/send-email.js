import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';
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
  return { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GMAIL_USER, GMAIL_APP_PASSWORD };
}

function makeTransport(env) {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: env.GMAIL_USER, pass: env.GMAIL_APP_PASSWORD },
  });
}

/** Resolves the caller to an allowlisted admin, or null. */
async function resolveAdmin(supabase, authHeader) {
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;

  const { data: adminRow } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', data.user.id)
    .maybeSingle();

  return adminRow ? data.user : null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ sent: false, reason: 'method_not_allowed' });
  }

  const env = getEnv();
  if (!env) return res.status(500).json({ sent: false, reason: 'email_not_configured' });

  const { action, bookingId, resend } = req.body ?? {};
  if (!UUID_RE.test(bookingId ?? '')) {
    return res.status(400).json({ sent: false, reason: 'invalid_booking_id' });
  }

  // Service-role client: this runs on the server, so it can read the row
  // that RLS deliberately hides from the browser.
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: booking, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .maybeSingle();

  if (error || !booking) return res.status(404).json({ sent: false, reason: 'booking_not_found' });

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

      await supabase
        .from('bookings')
        .update({ enquiry_email_sent_at: new Date().toISOString() })
        .eq('id', booking.id);

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
      const admin = await resolveAdmin(supabase, req.headers.authorization);
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

      await supabase
        .from('bookings')
        .update({ confirmation_email_sent_at: new Date().toISOString() })
        .eq('id', booking.id);

      return res.status(200).json({ sent: true });
    }

    return res.status(400).json({ sent: false, reason: 'unknown_action' });
  } catch (err) {
    console.error('send-email failed', err);
    return res.status(500).json({ sent: false, reason: 'send_failed' });
  }
}
