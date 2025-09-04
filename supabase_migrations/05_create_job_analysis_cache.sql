-- Create job analysis cache table
create table if not exists public.job_analysis_cache (
  id uuid primary key default gen_random_uuid(),
  job_id text not null,
  user_session_id text,
  user_email text,
  analysis_type text not null default 'student_strategy', -- 'student_strategy', 'regular_strategy', etc.
  strategy_data jsonb not null,
  profile_hash text, -- hash of the profile used for analysis
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days') -- Cache for 7 days
);

-- Create indexes for fast lookups
create index if not exists idx_job_analysis_job_user on public.job_analysis_cache(job_id, user_session_id);
create index if not exists idx_job_analysis_email on public.job_analysis_cache(job_id, user_email);
create index if not exists idx_job_analysis_expires on public.job_analysis_cache(expires_at);

-- Enable RLS
alter table public.job_analysis_cache enable row level security;

-- Create policies for access control
drop policy if exists job_analysis_all on public.job_analysis_cache;
create policy job_analysis_all on public.job_analysis_cache for all using (true) with check (true);

-- Update trigger
create or replace function public.update_job_analysis_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end; $$ language plpgsql;

drop trigger if exists trg_job_analysis_updated on public.job_analysis_cache;
create trigger trg_job_analysis_updated
  before update on public.job_analysis_cache
  for each row execute function public.update_job_analysis_updated_at();