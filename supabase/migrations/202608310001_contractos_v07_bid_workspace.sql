create table public.tender_documents(
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  source text not null check(source in ('TED','UK','SAM','NATO','mock')), source_opportunity_id text not null,
  filename text not null check(char_length(filename) between 1 and 255), storage_path text not null unique,
  mime_type text not null, file_size bigint not null check(file_size between 1 and 20971520),
  processing_status text not null default 'uploaded' check(processing_status in ('uploaded','processing','ready','failed')),
  processing_error text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.tender_document_extractions(
  id uuid primary key default gen_random_uuid(), document_id uuid not null unique references public.tender_documents(id) on delete cascade,
  extraction_text text not null, extraction_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.tender_requirements(
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  source text not null, source_opportunity_id text not null,
  requirement_type text not null check(requirement_type in ('eligibility','technical','financial','commercial','certification','experience','submission','delivery','legal','other')),
  title text not null, description text not null, source_document_id uuid references public.tender_documents(id) on delete set null,
  source_reference text, confidence text not null check(confidence in ('high','medium','low')),
  mandatory_status text not null check(mandatory_status in ('mandatory','appears_mandatory','optional','unclear')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.bid_workspaces(
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  source text not null, source_opportunity_id text not null, decision text not null default 'undecided' check(decision in ('undecided','pursue','review','do_not_bid')),
  readiness_score integer not null default 0 check(readiness_score between 0 and 100), notes text not null default '',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(user_id,source,source_opportunity_id)
);
create table public.compliance_items(
  id uuid primary key default gen_random_uuid(), bid_workspace_id uuid not null references public.bid_workspaces(id) on delete cascade,
  requirement_id uuid not null references public.tender_requirements(id) on delete cascade,
  status text not null default 'needs_review' check(status in ('meets','likely_meets','needs_evidence','missing','needs_review','not_applicable')),
  suggested_status text check(suggested_status is null or suggested_status in ('meets','likely_meets','needs_evidence','missing','needs_review','not_applicable')),
  user_note text not null default '', evidence_document_id uuid references public.tender_documents(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(bid_workspace_id,requirement_id)
);
create table public.bid_submission_items(
  id uuid primary key default gen_random_uuid(), bid_workspace_id uuid not null references public.bid_workspaces(id) on delete cascade,
  label text not null, category text not null default 'submission', completed boolean not null default false,
  source_requirement_id uuid references public.tender_requirements(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create index tender_documents_owner_opportunity_idx on public.tender_documents(user_id,source,source_opportunity_id);
create index tender_requirements_owner_opportunity_idx on public.tender_requirements(user_id,source,source_opportunity_id);
create index bid_workspaces_owner_idx on public.bid_workspaces(user_id);
create index compliance_workspace_idx on public.compliance_items(bid_workspace_id);
create index submission_workspace_idx on public.bid_submission_items(bid_workspace_id);

create trigger tender_documents_updated before update on public.tender_documents for each row execute function public.set_updated_at();
create trigger tender_extractions_updated before update on public.tender_document_extractions for each row execute function public.set_updated_at();
create trigger tender_requirements_updated before update on public.tender_requirements for each row execute function public.set_updated_at();
create trigger bid_workspaces_updated before update on public.bid_workspaces for each row execute function public.set_updated_at();
create trigger compliance_items_updated before update on public.compliance_items for each row execute function public.set_updated_at();
create trigger bid_submission_items_updated before update on public.bid_submission_items for each row execute function public.set_updated_at();

alter table public.tender_documents enable row level security; alter table public.tender_document_extractions enable row level security;
alter table public.tender_requirements enable row level security; alter table public.bid_workspaces enable row level security;
alter table public.compliance_items enable row level security; alter table public.bid_submission_items enable row level security;
grant select,insert,update,delete on public.tender_documents,public.tender_document_extractions,public.tender_requirements,public.bid_workspaces,public.compliance_items,public.bid_submission_items to authenticated;

create policy tender_documents_owner on public.tender_documents for all to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create policy tender_requirements_owner on public.tender_requirements for all to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create policy bid_workspaces_owner on public.bid_workspaces for all to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create policy tender_extractions_owner on public.tender_document_extractions for all to authenticated
  using(exists(select 1 from public.tender_documents d where d.id=document_id and d.user_id=(select auth.uid())))
  with check(exists(select 1 from public.tender_documents d where d.id=document_id and d.user_id=(select auth.uid())));
create policy compliance_owner on public.compliance_items for all to authenticated
  using(exists(select 1 from public.bid_workspaces w where w.id=bid_workspace_id and w.user_id=(select auth.uid())))
  with check(exists(select 1 from public.bid_workspaces w where w.id=bid_workspace_id and w.user_id=(select auth.uid())));
create policy submission_owner on public.bid_submission_items for all to authenticated
  using(exists(select 1 from public.bid_workspaces w where w.id=bid_workspace_id and w.user_id=(select auth.uid())))
  with check(exists(select 1 from public.bid_workspaces w where w.id=bid_workspace_id and w.user_id=(select auth.uid())));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('tender-documents','tender-documents',false,20971520,array['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/plain'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy tender_storage_insert on storage.objects for insert to authenticated with check(bucket_id='tender-documents' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy tender_storage_select on storage.objects for select to authenticated using(bucket_id='tender-documents' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy tender_storage_delete on storage.objects for delete to authenticated using(bucket_id='tender-documents' and (storage.foldername(name))[1]=(select auth.uid())::text);
