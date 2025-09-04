-- Create helper to store session_id in backend session
create or replace function public.set_session_context(session_id text)
returns void
language sql
as $$
  select set_config('app.session_id', session_id, true);
$$;

-- Create resume_data table
create table if not exists public.resume_data (
  id uuid primary key default gen_random_uuid(),
  session_id text,
  user_id uuid,
  personal_info jsonb not null default '{}'::jsonb,
  professional_title text not null default '',
  professional_summary text not null default '',
  enable_professional_summary boolean not null default false,
  skills jsonb not null default '{}'::jsonb,
  experience jsonb not null default '[]'::jsonb,
  education jsonb not null default '[]'::jsonb,
  projects jsonb,
  certifications jsonb,
  custom_sections jsonb,
  last_template_used text not null default 'swiss',
  is_active boolean not null default true,
  profile_completeness numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_accessed_at timestamptz not null default now()
);

-- Update trigger
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end; $$ language plpgsql;

drop trigger if exists trg_resume_data_updated on public.resume_data;
create trigger trg_resume_data_updated
before update on public.resume_data
for each row execute function public.update_updated_at_column();

-- Enable RLS and policies based on app.session_id
alter table public.resume_data enable row level security;

drop policy if exists resume_insert on public.resume_data;
drop policy if exists resume_select on public.resume_data;
drop policy if exists resume_update on public.resume_data;
drop policy if exists resume_delete on public.resume_data;

create policy resume_insert on public.resume_data
  for insert with check (session_id = current_setting('app.session_id', true));

create policy resume_select on public.resume_data
  for select using (session_id = current_setting('app.session_id', true));

create policy resume_update on public.resume_data
  for update using (session_id = current_setting('app.session_id', true));

create policy resume_delete on public.resume_data
  for delete using (session_id = current_setting('app.session_id', true));
