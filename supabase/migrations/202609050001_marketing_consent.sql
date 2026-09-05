alter table public.profiles
  add column if not exists marketing_opt_in boolean not null default false,
  add column if not exists marketing_opt_in_at timestamptz;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  opted_in boolean := lower(coalesce(new.raw_user_meta_data->>'marketing_opt_in', 'false')) = 'true';
begin
  insert into public.profiles(
    id, email, display_name, marketing_opt_in, marketing_opt_in_at
  ) values (
    new.id,
    coalesce(new.email, ''),
    new.raw_user_meta_data->>'display_name',
    opted_in,
    case when opted_in then now() else null end
  );
  return new;
end;
$$;

