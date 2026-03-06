alter table public.sites
  add column if not exists log_non_ai_traffic boolean not null default true;
