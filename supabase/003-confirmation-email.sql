-- ============================================================
-- 003 — Track when the client's confirmation email went out.
--
-- Run ONCE in the Supabase SQL Editor, after 002. Re-runnable.
-- ============================================================

-- The two-stage email flow: the client gets an "under review" note the
-- moment they submit, and a real confirmation only once the owner marks the
-- enquiry 'confirmed' on the dashboard.
--
-- This timestamp is what makes the second email exactly-once. Without it,
-- re-saving an already-confirmed enquiry (or opening it on another device)
-- would fire a duplicate confirmation at the client.
alter table bookings add column if not exists confirmation_email_sent_at timestamptz;
