create table if not exists public.provider_diagnostics (
  provider text primary key check (provider in ('TED', 'UK', 'SAM', 'NATO')),
  configured boolean not null default false,
  status text not null check (status in ('ok', 'failed')),
  upstream_status integer,
  raw_result_count integer not null default 0,
  normalized_result_count integer not null default 0,
  result_count integer not null default 0,
  duration_ms integer not null default 0,
  error_type text,
  safe_error_message text,
  upstream_url text not null,
  timeout boolean not null default false,
  checked_at timestamptz not null default now()
);

alter table public.provider_diagnostics enable row level security;

revoke all on public.provider_diagnostics from anon, authenticated;

