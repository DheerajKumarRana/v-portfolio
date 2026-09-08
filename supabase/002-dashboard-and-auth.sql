-- ============================================================
-- 002 — Owner dashboard: auth-gated access, enquiry workflow,
-- internal notes.
--
-- Run this ONCE in the Supabase SQL Editor, AFTER schema.sql.
-- Every statement is written to be safely re-runnable.
-- ============================================================

-- 1. Enquiry workflow -------------------------------------------------
-- A submission now arrives as an *enquiry* ('new') and the owner walks it
-- through the funnel. Only 'cancelled' releases the time slot back to the
-- public calendar — every other status keeps holding it (the exclusion
-- constraint in schema.sql is scoped to `status <> 'cancelled'`).

alter table bookings alter column status set default 'new';

alter table bookings drop constraint if exists valid_status;
alter table bookings add constraint valid_status
  check (status in ('new', 'contacted', 'confirmed', 'completed', 'cancelled'));

-- The owner's private notes, deliberately separate from the client's own
-- `notes` so the UI can never confuse "what they told us" with "what we
-- said about them".
alter table bookings add column if not exists admin_notes text;
alter table bookings add column if not exists updated_at timestamptz not null default now();

create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists bookings_set_updated_at on bookings;
create trigger bookings_set_updated_at
  before update on bookings
  for each row execute function set_updated_at();

-- 2. Admin allowlist --------------------------------------------------
-- Being a logged-in Supabase user is NOT enough to see enquiries — the
-- account also has to be listed here. That way, even if a stray signup
-- ever happens, it lands with zero access.

create table if not exists admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

alter table admins enable row level security;

drop policy if exists "admins can read their own row" on admins;
create policy "admins can read their own row"
  on admins for select
  to authenticated
  using (user_id = auth.uid());

-- SECURITY DEFINER so the booking policies below can consult this table
-- without re-entering its own RLS (which would recurse infinitely).
create or replace function is_admin() returns boolean
language sql security definer stable
set search_path = public
as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;

-- 3. Dashboard access -------------------------------------------------
-- Anonymous visitors still cannot read a single booking row (schema.sql
-- gives `anon` insert only). These policies are what the dashboard runs on.

drop policy if exists "admins can read bookings" on bookings;
create policy "admins can read bookings"
  on bookings for select
  to authenticated
  using (is_admin());

drop policy if exists "admins can update bookings" on bookings;
create policy "admins can update bookings"
  on bookings for update
  to authenticated
  using (is_admin())
  with check (is_admin());

drop policy if exists "admins can delete bookings" on bookings;
create policy "admins can delete bookings"
  on bookings for delete
  to authenticated
  using (is_admin());

-- The public booking page reads busy slots through this view. `authenticated`
-- needs the grant too, otherwise the owner — logged into the dashboard in
-- the same browser — would load booking.html with a session attached, get
-- no busy slots back, and be shown times that are actually taken.
grant select on public_busy_slots to anon, authenticated;

-- 4. Wire up the owner account ---------------------------------------
-- First create the user: Authentication -> Users -> Add user (with a
-- password, "Auto Confirm User" on). Then run the statement below with
-- that same email to grant it dashboard access.
--
--   insert into admins (user_id, email)
--   select id, email from auth.users where email = 'owner@example.com'
--   on conflict (user_id) do nothing;
