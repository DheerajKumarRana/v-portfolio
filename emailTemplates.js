// ==========================================
// EMAIL TEMPLATES — server-side only (imported by api/send-email.js).
//
// Plain tables and inline styles on purpose: email clients strip <style>
// blocks, ignore flexbox/grid, and Gmail clips anything clever. Every mail
// also ships a text/plain alternative, which is a real deliverability
// factor, not just politeness.
// ==========================================

const STUDIO_NAME = 'Vistaar Media';
const ACCENT = '#c89a4a';

// Booking instants are stored as timestamptz and the server runs in UTC, so
// every date/time in an email must be rendered in the studio's own zone —
// otherwise a 10:00 IST shoot goes out as "04:30".
const STUDIO_TIME_ZONE = 'Asia/Kolkata';

const DAY_FORMAT = new Intl.DateTimeFormat('en-IN', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: STUDIO_TIME_ZONE,
});
const TIME_FORMAT = new Intl.DateTimeFormat('en-IN', {
  hour: 'numeric', minute: '2-digit', timeZone: STUDIO_TIME_ZONE,
});

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]));
}

function formatSlot(booking) {
  const starts = new Date(booking.starts_at);
  const ends = new Date(booking.ends_at);
  return {
    date: DAY_FORMAT.format(starts),
    time: `${TIME_FORMAT.format(starts)} – ${TIME_FORMAT.format(ends)}`,
  };
}

function detailRows(booking) {
  const { date, time } = formatSlot(booking);
  return [
    ['Service', booking.service],
    ['Date', date],
    ['Time', time],
    ['Duration', `${booking.duration_minutes} minutes`],
  ];
}

function layout({ heading, lead, rows, outro }) {
  const rowsHtml = rows.map(([label, value]) => `
    <tr>
      <td style="padding:6px 16px 6px 0;color:#6b665f;font-size:14px;white-space:nowrap;">${escapeHtml(label)}</td>
      <td style="padding:6px 0;color:#1f1d17;font-size:14px;font-weight:600;">${escapeHtml(value)}</td>
    </tr>`).join('');

  return `<!doctype html>
<html>
<body style="margin:0;padding:24px;background:#f4f2ec;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;">
    <tr><td style="height:4px;background:${ACCENT};"></td></tr>
    <tr>
      <td style="padding:32px;">
        <h1 style="margin:0 0 12px;font-size:22px;color:#1f1d17;">${escapeHtml(heading)}</h1>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4a463c;">${lead}</p>
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-top:1px solid #e8e4d9;border-bottom:1px solid #e8e4d9;padding:8px 0;">
          ${rowsHtml}
        </table>
        <p style="margin:24px 0 0;font-size:15px;line-height:1.6;color:#4a463c;">${outro}</p>
        <p style="margin:28px 0 0;font-size:13px;color:#8a8578;">${STUDIO_NAME}</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function toText({ heading, lead, rows, outro }) {
  const body = rows.map(([label, value]) => `  ${label}: ${value}`).join('\n');
  return `${heading}\n\n${lead.replace(/<[^>]+>/g, '')}\n\n${body}\n\n${outro.replace(/<[^>]+>/g, '')}\n\n${STUDIO_NAME}`;
}

/** Stage 1 — to the client the moment they submit. Deliberately does NOT
 *  say "booked": nothing is confirmed until the owner says so. */
export function enquiryReceivedEmail(booking) {
  const content = {
    heading: `Thanks, ${booking.client_name.split(' ')[0]} — we've got your enquiry`,
    lead: 'Your request is with our team and currently under review. We\'re holding this slot for you in the meantime.',
    rows: detailRows(booking),
    outro: 'We\'ll email you again as soon as your session is confirmed. Just reply to this message if anything needs changing.',
  };
  return {
    subject: `We've received your enquiry — ${STUDIO_NAME}`,
    html: layout(content),
    text: toText(content),
  };
}

/** Stage 2 — to the client, once the owner marks the enquiry confirmed. */
export function bookingConfirmedEmail(booking) {
  const { date, time } = formatSlot(booking);
  const content = {
    heading: 'Your session is confirmed',
    lead: `Good news — we've confirmed your ${escapeHtml(booking.service)} session.`,
    rows: detailRows(booking),
    outro: 'We\'ll be in touch before the shoot if we need anything else. To reschedule or cancel, simply reply to this email.',
  };
  return {
    subject: `Confirmed: your ${booking.service} session on ${date}, ${time.split(' – ')[0]}`,
    html: layout(content),
    text: toText(content),
  };
}

/** Internal heads-up to the studio, with the details needed to act on it. */
export function ownerAlertEmail(booking) {
  const content = {
    heading: 'New enquiry received',
    lead: `<strong>${escapeHtml(booking.client_name)}</strong> just submitted a booking request.`,
    rows: [
      ...detailRows(booking),
      ['Client', booking.client_name],
      ['Email', booking.email],
      ['Phone', booking.phone || '—'],
      ['Their notes', booking.notes || '—'],
    ],
    outro: 'Open the dashboard and mark it <strong>Confirmed</strong> to send the client their confirmation email.',
  };
  return {
    subject: `New enquiry: ${booking.service} — ${formatSlot(booking).date}`,
    html: layout(content),
    text: toText(content),
  };
}
