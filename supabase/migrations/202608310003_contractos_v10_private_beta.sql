-- ContractOS V1.0 private beta and production SaaS readiness
create table public.saved_searches (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160), query text not null default '',
  sources text[] not null default '{}', countries text[] not null default '{}', categories text[] not null default '{}',
  min_value numeric check (min_value is null or min_value >= 0), max_value numeric check (max_value is null or max_value >= 0),
  match_threshold integer not null default 0 check (match_threshold between 0 and 100), sorting text not null default 'relevance',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index saved_searches_user_created_idx on public.saved_searches(user_id, created_at desc);

create table public.saved_search_alerts (
  id uuid primary key default gen_random_uuid(), saved_search_id uuid not null unique references public.saved_searches(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, frequency text not null default 'off' check (frequency in ('off','daily','weekly')),
  last_generated_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.deadline_reminders (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  source_opportunity_id text not null, bid_workspace_id uuid references public.bid_workspaces(id) on delete cascade,
  days_before integer not null check (days_before in (1,3,7)), deadline_at timestamptz not null, generated_at timestamptz,
  created_at timestamptz not null default now(), unique(user_id, source_opportunity_id, days_before, deadline_at)
);
create index deadline_reminders_due_idx on public.deadline_reminders(deadline_at, generated_at);

create table public.beta_invites (
  id uuid primary key default gen_random_uuid(), email text, code text not null unique, max_uses integer not null default 1 check(max_uses > 0),
  uses integer not null default 0 check(uses >= 0), expires_at timestamptz, created_at timestamptz not null default now()
);
alter table public.beta_invites enable row level security;
revoke all on public.beta_invites from anon, authenticated;

create table public.subscription_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade, plan text not null default 'beta_free' check(plan in ('beta_free','pro','team')),
  status text not null default 'active', stripe_customer_id text unique, stripe_subscription_id text unique,
  current_period_start timestamptz not null default date_trunc('month',now()), current_period_end timestamptz not null default date_trunc('month',now()) + interval '1 month', updated_at timestamptz not null default now()
);
create table public.usage_events (
  id bigint generated always as identity primary key, user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check(event_type in ('ai_analysis','ai_question','opportunity_saved','workspace_created','supplier_created','saved_search_created')),
  quantity integer not null default 1 check(quantity > 0), created_at timestamptz not null default now()
);
create index usage_events_period_idx on public.usage_events(user_id,event_type,created_at desc);
create table public.notification_queue (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check(kind in ('saved_search_alert','deadline_reminder')), dedupe_key text not null unique,
  recipient text not null, payload jsonb not null default '{}', status text not null default 'queued' check(status in ('queued','sent','failed','suppressed')),
  scheduled_for timestamptz not null default now(), sent_at timestamptz, attempts integer not null default 0, last_error text, created_at timestamptz not null default now()
);
create index notification_queue_work_idx on public.notification_queue(status,scheduled_for);
create table public.activity_events (
  id bigint generated always as identity primary key, user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check(event_type in ('profile_saved','opportunity_saved','analysis_created','workspace_created','supplier_created','subscription_started','saved_search_created')),
  metadata jsonb not null default '{}', created_at timestamptz not null default now()
);
create index activity_events_user_idx on public.activity_events(user_id,created_at desc);

alter table public.saved_searches enable row level security;
alter table public.saved_search_alerts enable row level security;
alter table public.deadline_reminders enable row level security;
alter table public.subscription_accounts enable row level security;
alter table public.usage_events enable row level security;
alter table public.notification_queue enable row level security;
alter table public.activity_events enable row level security;
do $$ declare t text; begin foreach t in array array['saved_searches','saved_search_alerts','deadline_reminders','subscription_accounts','usage_events','notification_queue','activity_events'] loop
  execute format('create policy %I on public.%I for select using (auth.uid() = user_id)',t||'_select',t);
end loop; end $$;
create policy saved_searches_write on public.saved_searches for all using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy saved_search_alerts_write on public.saved_search_alerts for all using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy deadline_reminders_write on public.deadline_reminders for all using(auth.uid()=user_id) with check(auth.uid()=user_id);

-- Usage, subscription, notification and activity writes are service-role only.
revoke insert, update, delete on public.subscription_accounts,public.usage_events,public.notification_queue,public.activity_events from authenticated,anon;
