-- Creates a local test site for the most recently created auth user.
-- Run this after creating a user in Supabase Studio -> Authentication.

with latest_user as (
  select id
  from auth.users
  order by created_at desc
  limit 1
),
upserted_site as (
  insert into public.sites (user_id, domain, name, verified_at)
  select
    latest_user.id,
    'example.com',
    'Example Local Site',
    timezone('utc', now())
  from latest_user
  on conflict (domain)
  do update
    set user_id = excluded.user_id,
        name = excluded.name,
        verified_at = excluded.verified_at
  returning id, domain, tracking_token, verification_token, created_at, verified_at
)
select *
from upserted_site;
