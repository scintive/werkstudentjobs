-- Relax resume_data RLS for development/testing to fix 406/500 on first page
alter table if exists public.resume_data disable row level security;

-- Optionally, create permissive policies (kept if RLS is re-enabled later)
do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'resume_data' and policyname = 'resume_all') then
    create policy resume_all on public.resume_data for all using (true) with check (true);
  end if;
end $$;

