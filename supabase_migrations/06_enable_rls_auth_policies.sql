-- Enable RLS and add auth-aware policies for user-owned data
-- Safe to run multiple times

-- Resume data policies
alter table if exists public.resume_data enable row level security;
-- Remove permissive dev policy if it exists
drop policy if exists resume_all on public.resume_data;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='resume_data' and policyname='resume_auth_all'
  ) then
    create policy resume_auth_all on public.resume_data
      for all
      using (
        -- Authenticated users can access their own rows
        (user_id is not null and auth.uid() = user_id)
        -- Anonymous session fallback (respects app.session_id if set by API)
        or (user_id is null and session_id = current_setting('app.session_id', true))
      )
      with check (
        (user_id is not null and auth.uid() = user_id)
        or (user_id is null and session_id = current_setting('app.session_id', true))
      );
  end if;
end $$;

-- User profiles
alter table if exists public.user_profiles enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='user_profiles' and policyname='user_profiles_auth_all'
  ) then
    create policy user_profiles_auth_all on public.user_profiles
      for all
      using (
        (user_id is not null and auth.uid() = user_id)
        or (user_id is null and session_id = current_setting('app.session_id', true))
      )
      with check (
        (user_id is not null and auth.uid() = user_id)
        or (user_id is null and session_id = current_setting('app.session_id', true))
      );
  end if;
end $$;

-- Job match results
alter table if exists public.job_match_results enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='job_match_results' and policyname='match_results_auth_all'
  ) then
    create policy match_results_auth_all on public.job_match_results
      for all
      using (
        exists (
          select 1 from public.user_profiles p
          where p.id = job_match_results.user_profile_id
            and (
              (p.user_id is not null and p.user_id = auth.uid()) or
              (p.user_id is null and p.session_id = current_setting('app.session_id', true))
            )
        )
      )
      with check (
        exists (
          select 1 from public.user_profiles p
          where p.id = job_match_results.user_profile_id
            and (
              (p.user_id is not null and p.user_id = auth.uid()) or
              (p.user_id is null and p.session_id = current_setting('app.session_id', true))
            )
        )
      );
  end if;
end $$;

-- User job interactions
alter table if exists public.user_job_interactions enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='user_job_interactions' and policyname='interactions_auth_all'
  ) then
    create policy interactions_auth_all on public.user_job_interactions
      for all
      using (
        exists (
          select 1 from public.user_profiles p
          where p.id = user_job_interactions.user_profile_id
            and (
              (p.user_id is not null and p.user_id = auth.uid()) or
              (p.user_id is null and p.session_id = current_setting('app.session_id', true))
            )
        )
      )
      with check (
        exists (
          select 1 from public.user_profiles p
          where p.id = user_job_interactions.user_profile_id
            and (
              (p.user_id is not null and p.user_id = auth.uid()) or
              (p.user_id is null and p.session_id = current_setting('app.session_id', true))
            )
        )
      );
  end if;
end $$;

-- Optional: lock down public write on companies/jobs later with roles
