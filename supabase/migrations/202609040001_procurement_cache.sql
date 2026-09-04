create table public.procurement_opportunities (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('TED', 'UK', 'SAM', 'NATO')),
  source_opportunity_id text not null,
  title text not null,
  description text,
  buyer_name text,
  buyer_country text,
  procurement_country text,
  category text,
  classification_codes jsonb,
  estimated_value_min numeric,
  estimated_value_max numeric,
  currency text,
  published_at timestamptz,
  deadline_at timestamptz,
  procedure_type text,
  source_url text,
  source_metadata jsonb,
  source_updated_at timestamptz,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(buyer_name, ''))
  ) stored,
  unique (source, source_opportunity_id)
);

create index procurement_opportunities_source_idx on public.procurement_opportunities (source);
create index procurement_opportunities_category_idx on public.procurement_opportunities (category);
create index procurement_opportunities_buyer_country_idx on public.procurement_opportunities (buyer_country);
create index procurement_opportunities_deadline_idx on public.procurement_opportunities (deadline_at);
create index procurement_opportunities_published_idx on public.procurement_opportunities (published_at desc);
create index procurement_opportunities_active_idx on public.procurement_opportunities (is_active);
create index procurement_opportunities_search_idx on public.procurement_opportunities using gin (search_vector);

create table public.procurement_source_sync_state (
  source text primary key check (source in ('TED', 'UK', 'SAM', 'NATO')),
  last_attempt_at timestamptz,
  last_success_at timestamptz,
  last_error_type text,
  last_safe_error text,
  records_fetched integer not null default 0,
  records_inserted integer not null default 0,
  records_updated integer not null default 0,
  is_stale boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.procurement_source_sync_state (source) values ('TED'), ('UK'), ('SAM'), ('NATO');

alter table public.procurement_opportunities enable row level security;
alter table public.procurement_source_sync_state enable row level security;

create policy "authenticated users read active procurement opportunities"
  on public.procurement_opportunities for select to authenticated
  using (is_active = true);
create policy "authenticated users read procurement sync freshness"
  on public.procurement_source_sync_state for select to authenticated
  using (true);

revoke insert, update, delete on public.procurement_opportunities from anon, authenticated;
revoke insert, update, delete on public.procurement_source_sync_state from anon, authenticated;
grant select on public.procurement_opportunities to authenticated;
grant select on public.procurement_source_sync_state to authenticated;

