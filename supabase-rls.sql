-- HaulKC — lock down the bookings table.
-- Run this in Supabase -> SQL Editor -> New query -> Run.
--
-- Effect: the public anon key (visible in the booking page source) can ONLY
-- insert new bookings. It can no longer read, update, or delete any rows.
-- The admin dashboard reads/updates through the server endpoint using the
-- secret service-role key, which bypasses RLS -- so the dashboard keeps working.

alter table public.bookings enable row level security;

-- Allow the public booking form (anon role) to create bookings -- insert only.
drop policy if exists "anon can insert bookings" on public.bookings;
create policy "anon can insert bookings"
  on public.bookings
  for insert
  to anon
  with check (true);

-- No select / update / delete policies for anon means those are denied by default.
-- (The service-role key used by /api/admin-bookings bypasses RLS entirely.)
