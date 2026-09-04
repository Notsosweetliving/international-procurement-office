alter table public.procurement_source_sync_state
  add column if not exists upstream_http_status integer;

