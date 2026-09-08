-- ============================================================
-- 004 — Track the stage-1 ("enquiry received") email too.
--
-- Run ONCE in the Supabase SQL Editor, after 003. Re-runnable.
-- ============================================================

-- /api/send-email is a public endpoint for this first mail — the visitor
-- who just booked has to be able to trigger it. This timestamp is what
-- stops that being abusable: the server refuses to send twice for the same
-- booking, so replaying the request is a no-op rather than a way to
-- repeatedly mail someone.
alter table bookings add column if not exists enquiry_email_sent_at timestamptz;
