create extension if not exists pgcrypto;

create table if not exists public.sites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text,
  domain text not null unique,
  verification_token text not null unique default encode(gen_random_bytes(18), 'hex'),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.crawler_events (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites (id) on delete cascade,
  occurred_at timestamptz not null default timezone('utc', now()),
  user_agent text not null,
  bot_name text not null default 'Unknown',
  platform text not null default 'Unknown',
  bot_type text not null default 'unknown',
  page_url text not null,
  page_path text not null,
  ip_hash text,
  source text not null default 'script',
  raw_payload jsonb not null default '{}'::jsonb
);

create index if not exists crawler_events_site_occurred_at_idx
  on public.crawler_events (site_id, occurred_at desc);

create index if not exists crawler_events_platform_idx
  on public.crawler_events (platform);

create index if not exists crawler_events_page_path_idx
  on public.crawler_events (page_path);

alter table public.sites enable row level security;
alter table public.crawler_events enable row level security;

create policy "Users can view their sites"
  on public.sites
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their sites"
  on public.sites
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their sites"
  on public.sites
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can view events for their sites"
  on public.crawler_events
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.sites
      where public.sites.id = crawler_events.site_id
        and public.sites.user_id = auth.uid()
    )
  );
