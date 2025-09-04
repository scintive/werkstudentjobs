-- AI Cache table for LLM responses
create table if not exists public.ai_cache (
  key text primary key,
  model text not null,
  messages_hash text not null,
  response_json jsonb not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists ai_cache_expires_idx on public.ai_cache (expires_at);

