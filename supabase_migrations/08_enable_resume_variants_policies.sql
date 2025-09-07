-- Re-enable RLS and remove permissive dev policies for variants/suggestions

alter table if exists public.resume_variants enable row level security;
alter table if exists public.resume_suggestions enable row level security;

-- Remove broad allow-all policies if present
do $$ begin
  if exists (
    select 1 from pg_policies where schemaname='public' and tablename='resume_variants' and policyname='resume_variants_all'
  ) then
    drop policy resume_variants_all on public.resume_variants;
  end if;
end $$;

do $$ begin
  if exists (
    select 1 from pg_policies where schemaname='public' and tablename='resume_suggestions' and policyname='resume_suggestions_all'
  ) then
    drop policy resume_suggestions_all on public.resume_suggestions;
  end if;
end $$;

