-- Run this once in your Supabase project's SQL Editor (Dashboard -> SQL
-- Editor -> New query -> paste -> Run) to set up the booking table.

create extension if not exists pgcrypto;

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  service text not null,
  duration_minutes integer not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  client_name text not null,
  email text not null,
  phone text,
  notes text,
  status text not null default 'confirmed',
  created_at timestamptz not null default now(),
  constraint valid_status check (status in ('confirmed', 'cancelled')),
  constraint valid_range check (ends_at > starts_at),
  -- Hard stop at the database level: two bookings can never overlap in
  -- time, even under concurrent requests racing for the same slot.
  exclude using gist (tstzrange(starts_at, ends_at, '[)') with &&) where (status <> 'cancelled')
);

alter table bookings enable row level security;

-- Visitors can create bookings...
drop policy if exists "public can insert bookings" on bookings;
create policy "public can insert bookings"
  on bookings for insert
  to anon
  with check (true);

-- ...but cannot read, edit, or delete any row directly (bookings hold PII:
-- name/email/phone). No select/update/delete policy for anon = fully
-- blocked by RLS. Check bookings in Table Editor with your own account.

-- The frontend still needs to know which times are already taken so it can
-- grey them out — expose only the time ranges, never the customer details,
-- through this view (views execute with the owner's privileges, so it can
-- read the locked-down table underneath).
create or replace view public_busy_slots as
  select starts_at, ends_at
  from bookings
  where status <> 'cancelled';

grant select on public_busy_slots to anon;
