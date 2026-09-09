-- ============================================================
-- 005 — Let a signed-in visitor submit a booking too.
--
-- Run ONCE in the Supabase SQL Editor, after 004. Re-runnable.
-- ============================================================

-- The original policy was scoped `to anon`, which quietly broke booking for
-- exactly one person: the owner. booking.html and dashboard.html are served
-- from the same origin, so supabase-js finds the dashboard session in
-- storage and sends the insert as `authenticated` rather than `anon` — and
-- with no matching policy, Postgres refused it with 42501.
--
-- Submitting a booking is a public action, so both roles get it. This grants
-- no read access whatsoever: `authenticated` still cannot select a single
-- booking row unless it is also on the `admins` allowlist (see 002).
drop policy if exists "public can insert bookings" on bookings;
create policy "public can insert bookings"
  on bookings for insert
  to anon, authenticated
  with check (true);
