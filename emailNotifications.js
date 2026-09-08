// ==========================================
// EMAIL NOTIFICATIONS (browser side)
//
// Deliberately thin: the browser never sees an email address, a template or
// a credential. It just tells the server "this booking happened" and the
// serverless function at api/send-email.js decides what to send, to whom,
// and whether it's allowed — see the threat model in that file.
//
// Every function here resolves to a boolean and never throws: a booking is
// already saved by the time we get here, so a mail problem must never break
// the page the customer or owner is looking at.
// ==========================================

const ENDPOINT = '/api/send-email';

async function post(body, accessToken) {
  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(body),
    });

    // A plain `vite dev` has no /api routes (that needs `vercel dev`), so
    // this 404s in local development. Treated as "not sent" rather than an
    // error, which is what the calling UI already handles gracefully.
    if (!response.ok && response.status === 404) return false;

    const result = await response.json().catch(() => ({}));
    return result.sent === true;
  } catch (err) {
    console.error('Email request failed', err);
    return false;
  }
}

/** Stage 1: the client's "enquiry received" note, plus the studio alert.
 *  Public — the server enforces exactly-once. */
export const notifyEnquiryReceived = (bookingId) => post({ action: 'enquiry', bookingId });

/** Stage 2: the client's confirmation, sent when the owner confirms.
 *  Requires an admin's Supabase access token. */
export const notifyBookingConfirmed = (bookingId, accessToken, { resend = false } = {}) =>
  post({ action: 'confirmed', bookingId, resend }, accessToken);
