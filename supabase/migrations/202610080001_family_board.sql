create function public.valid_board_checklist(items jsonb) returns boolean language plpgsql immutable set search_path='' as $$
declare item jsonb; ids text[]:='{}';
begin
  if jsonb_typeof(items)<>'array' or jsonb_array_length(items)>50 then return false; end if;
  for item in select value from jsonb_array_elements(items) loop
    if jsonb_typeof(item)<>'object' or jsonb_typeof(item->'text')<>'string' or jsonb_typeof(item->'done')<>'boolean'
      or coalesce(item->>'id','') !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      or length(btrim(item->>'text')) not between 1 and 160 or item->>'id'=any(ids)
      or not (item ?& array['id','text','done']) or (item-array['id','text','done'])<>'{}'::jsonb then return false; end if;
    ids:=array_append(ids,item->>'id');
  end loop;
  return true;
end $$;

create table public.board_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id),
  kind text not null check(kind in ('note','todo','reminder')),
  title text not null check(length(btrim(title)) between 1 and 120),
  body text not null default '' check(length(body)<=4000),
  checklist jsonb not null default '[]' check(public.valid_board_checklist(checklist)),
  due_at timestamptz,
  completed_at timestamptz,
  created_by uuid not null default auth.uid() references public.profiles(id),
  updated_by uuid not null default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1,
  check((kind='todo' and jsonb_array_length(checklist)>0) or (kind<>'todo' and checklist='[]'::jsonb)),
  check((kind='reminder' and due_at is not null and isfinite(due_at)) or (kind<>'reminder' and due_at is null and completed_at is null))
);
create index board_household_updated on public.board_items(household_id,updated_at desc,id);
create index board_due on public.board_items(due_at) where kind='reminder' and completed_at is null;
alter table public.board_items enable row level security;
create policy board_access on public.board_items for all to authenticated
  using(household_id=public.current_household()) with check(household_id=public.current_household());
revoke all on public.board_items from public,anon,authenticated;
grant select,insert,update,delete on public.board_items to authenticated;

create function public.stamp_board_item() returns trigger language plpgsql set search_path='' as $$
begin
  if tg_op='UPDATE' then
    if new.id<>old.id or new.household_id<>old.household_id or new.kind<>old.kind then raise exception 'Record identity cannot change'; end if;
    new.created_by:=old.created_by;new.created_at:=old.created_at;new.version:=old.version+1;
  else new.created_by:=auth.uid();new.created_at:=now();new.version:=1;end if;
  new.updated_by:=auth.uid();new.updated_at:=now();return new;
end $$;
create trigger stamp_board before insert or update on public.board_items for each row execute function public.stamp_board_item();

create function public.set_board_task(p_board_id uuid,p_task_id uuid,p_done boolean) returns void language plpgsql security invoker set search_path='' as $$
declare item public.board_items; task_index integer;
begin
  if p_done is null then raise exception 'Choose a task state'; end if;
  select * into item from public.board_items where id=p_board_id and household_id=public.current_household() and kind='todo' for update;
  if not found then raise exception 'This item is not available'; end if;
  select ordinality-1 into task_index from jsonb_array_elements(item.checklist) with ordinality where value->>'id'=p_task_id::text;
  if task_index is null then raise exception 'This task is not available'; end if;
  update public.board_items set checklist=jsonb_set(checklist,array[task_index::text,'done'],to_jsonb(p_done)) where id=p_board_id;
end $$;
create function public.set_board_reminder(p_board_id uuid,p_done boolean) returns void language plpgsql security invoker set search_path='' as $$
begin
  if p_done is null then raise exception 'Choose a reminder state'; end if;
  update public.board_items set completed_at=case when p_done then coalesce(completed_at,now()) else null end
    where id=p_board_id and household_id=public.current_household() and kind='reminder';
  if not found then raise exception 'This item is not available'; end if;
end $$;
revoke all on function public.stamp_board_item(),public.set_board_task(uuid,uuid,boolean),public.set_board_reminder(uuid,boolean) from public,anon,authenticated;
grant execute on function public.set_board_task(uuid,uuid,boolean),public.set_board_reminder(uuid,boolean) to authenticated;

create or replace function public.shares_household(p_user uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.household_members a join public.household_members b on a.household_id=b.household_id where a.user_id=auth.uid() and b.user_id=p_user)
 or exists(select 1 from public.transactions where household_id=public.current_household() and created_by=p_user)
 or exists(select 1 from public.transfers where household_id=public.current_household() and created_by=p_user)
 or exists(select 1 from public.board_items where household_id=public.current_household() and (created_by=p_user or updated_by=p_user))
$$;
