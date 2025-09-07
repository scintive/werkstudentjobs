-- Fix RLS policies to allow INSERT with proper WITH CHECK conditions

-- resume_variants: drop old policies
drop policy if exists "Users can manage their own resume variants" on public.resume_variants;
drop policy if exists "Session users can manage their resume variants" on public.resume_variants;

-- recreate with USING and WITH CHECK (session or user scoped)
create policy "Users can manage their own resume variants" on public.resume_variants
  for all
  using (
    (user_id is not null and auth.uid() = user_id)
    or (session_id = current_setting('app.session_id', true))
  )
  with check (
    (user_id is not null and auth.uid() = user_id)
    or (session_id = current_setting('app.session_id', true))
  );

-- resume_suggestions: drop old policy
drop policy if exists "Users can manage suggestions for their variants" on public.resume_suggestions;

-- recreate with USING and WITH CHECK bound to the parent variant ownership/session
create policy "Users can manage suggestions for their variants" on public.resume_suggestions
  for all
  using (
    exists (
      select 1 from public.resume_variants rv
      where rv.id = resume_suggestions.variant_id
        and ( (rv.user_id is not null and rv.user_id = auth.uid())
              or (rv.session_id = current_setting('app.session_id', true)) )
    )
  )
  with check (
    exists (
      select 1 from public.resume_variants rv
      where rv.id = resume_suggestions.variant_id
        and ( (rv.user_id is not null and rv.user_id = auth.uid())
              or (rv.session_id = current_setting('app.session_id', true)) )
    )
  );

