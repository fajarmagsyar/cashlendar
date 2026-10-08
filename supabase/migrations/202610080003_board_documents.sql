begin;
create function public.valid_board_document(doc jsonb) returns boolean language plpgsql immutable set search_path='' as $$
declare block jsonb; row jsonb; stroke jsonb; point jsonb; ids text[]:='{}'; cols integer; points integer;
begin
  if doc is null then return true; end if;
  if jsonb_typeof(doc)<>'object' or doc->'version'<>'1'::jsonb or not(doc ?& array['version','blocks']) or (doc-array['version','blocks'])<>'{}'::jsonb
    or jsonb_typeof(doc->'blocks')<>'array' or jsonb_array_length(doc->'blocks')>50 or octet_length(doc::text)>1000000 then return false; end if;
  for block in select value from jsonb_array_elements(doc->'blocks') loop
    if jsonb_typeof(block)<>'object' or coalesce(block->>'id','') !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' or block->>'id'=any(ids) then return false; end if;
    ids:=array_append(ids,block->>'id');
    case block->>'type'
      when 'text' then
        if not(block ?& array['id','type','text','style','bold','italic']) or (block-array['id','type','text','style','bold','italic'])<>'{}'::jsonb
          or jsonb_typeof(block->'text')<>'string' or length(block->>'text')>8000 or jsonb_typeof(block->'style')<>'string' or block->>'style' not in ('paragraph','heading') or jsonb_typeof(block->'bold')<>'boolean' or jsonb_typeof(block->'italic')<>'boolean' then return false; end if;
      when 'checklist' then
        if not(block ?& array['id','type','tasks']) or (block-array['id','type','tasks'])<>'{}'::jsonb or not public.valid_board_checklist(block->'tasks') or jsonb_array_length(block->'tasks')<1 then return false; end if;
      when 'table' then
        if not(block ?& array['id','type','cells']) or (block-array['id','type','cells'])<>'{}'::jsonb or jsonb_typeof(block->'cells')<>'array' or jsonb_array_length(block->'cells') not between 1 and 30 then return false; end if;
        cols:=jsonb_array_length(block->'cells'->0);
        if cols not between 1 and 12 then return false; end if;
        for row in select value from jsonb_array_elements(block->'cells') loop
          if jsonb_typeof(row)<>'array' or jsonb_array_length(row)<>cols then return false; end if;
          if exists(select 1 from jsonb_array_elements(row) c where jsonb_typeof(c)<>'string' or length(c#>>'{}')>500) then return false; end if;
        end loop;
      when 'drawing' then
        if not(block ?& array['id','type','strokes']) or (block-array['id','type','strokes'])<>'{}'::jsonb or jsonb_typeof(block->'strokes')<>'array' or jsonb_array_length(block->'strokes')>200 then return false; end if;
        points:=0;
        for stroke in select value from jsonb_array_elements(block->'strokes') loop
          if not(stroke ?& array['id','color','width','points']) or (stroke-array['id','color','width','points'])<>'{}'::jsonb
            or coalesce(stroke->>'id','') !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
            or jsonb_typeof(stroke->'color')<>'string' or stroke->>'color' not in ('ink','green','red','blue') or jsonb_typeof(stroke->'width')<>'number' or (stroke->>'width')::numeric not between 1 and 12
            or jsonb_typeof(stroke->'points')<>'array' or jsonb_array_length(stroke->'points') not between 1 and 2000 then return false; end if;
          points:=points+jsonb_array_length(stroke->'points');
          if points>12000 then return false; end if;
          for point in select value from jsonb_array_elements(stroke->'points') loop
            if jsonb_typeof(point)<>'array' or jsonb_array_length(point)<>2 or jsonb_typeof(point->0)<>'number' or jsonb_typeof(point->1)<>'number'
              or (point->>0)::numeric not between 0 and 1000 or (point->>1)::numeric not between 0 and 1000 then return false; end if;
          end loop;
        end loop;
      else return false;
    end case;
  end loop;
  return true;
exception when others then return false;
end $$;
alter table public.board_items add column document jsonb check(public.valid_board_document(document));
-- Preserve record identity, attribution, versions, due dates, and legacy columns during conversion.
alter table public.board_items disable trigger stamp_board;
update public.board_items set document=jsonb_build_object('version',1,'blocks',
  (case when body<>'' then jsonb_build_array(jsonb_build_object('id',gen_random_uuid(),'type','text','text',body,'style','paragraph','bold',false,'italic',false)) else '[]'::jsonb end)
  || (case when jsonb_array_length(checklist)>0 then jsonb_build_array(jsonb_build_object('id',gen_random_uuid(),'type','checklist','tasks',checklist)) else '[]'::jsonb end));
alter table public.board_items enable trigger stamp_board;
alter table public.board_items drop constraint board_items_check1;
alter table public.board_items add constraint board_due_state check(
  (due_at is null and completed_at is null and (kind<>'reminder' or document is not null)) or
  (due_at is not null and isfinite(due_at) and (completed_at is null or isfinite(completed_at)))
);
drop index public.board_due;
create index board_due on public.board_items(due_at) where due_at is not null and completed_at is null;
create or replace function public.set_board_reminder(p_board_id uuid,p_done boolean) returns void language plpgsql security invoker set search_path='' as $$
begin
  if p_done is null then raise exception 'Choose a reminder state'; end if;
  update public.board_items set completed_at=case when p_done then coalesce(completed_at,now()) else null end
    where id=p_board_id and household_id=public.current_household() and due_at is not null;
  if not found then raise exception 'This item is not available'; end if;
end $$;
create function public.set_board_document_task(p_board_id uuid,p_block_id uuid,p_task_id uuid,p_done boolean) returns void language plpgsql security invoker set search_path='' as $$
declare item public.board_items; block_index integer; task_index integer;
begin
  if p_done is null then raise exception 'Choose a task state'; end if;
  select * into item from public.board_items where id=p_board_id and household_id=public.current_household() for update;
  if not found then raise exception 'This item is not available'; end if;
  select ordinality-1 into block_index from jsonb_array_elements(item.document->'blocks') with ordinality where value->>'id'=p_block_id::text and value->>'type'='checklist';
  if block_index is null then raise exception 'This task is not available'; end if;
  select ordinality-1 into task_index from jsonb_array_elements(item.document->'blocks'->block_index->'tasks') with ordinality where value->>'id'=p_task_id::text;
  if task_index is null then raise exception 'This task is not available'; end if;
  update public.board_items set document=jsonb_set(document,array['blocks',block_index::text,'tasks',task_index::text,'done'],to_jsonb(p_done)) where id=p_board_id;
end $$;
revoke all on function public.set_board_document_task(uuid,uuid,uuid,boolean) from public,anon,authenticated;
grant execute on function public.set_board_document_task(uuid,uuid,uuid,boolean) to authenticated;
create or replace function public.claim_board_notifications() returns jsonb language plpgsql security definer set search_path='' as $$
declare output jsonb;
begin
  -- A due date identifies one reminder occurrence; title edits must not send it again.
  insert into public.board_push_deliveries(board_id,due_at,subscription_id)
    select b.id,b.due_at,s.id from public.board_items b
    join public.household_members m on m.household_id=b.household_id
    join public.push_subscriptions s on s.user_id=m.user_id
    where b.due_at is not null and b.completed_at is null and b.due_at<=now() and b.due_at>now()-interval '24 hours' and s.created_at<=b.due_at and m.joined_at<=b.due_at
    on conflict do nothing;
  with candidates as (
    select d.id from public.board_push_deliveries d
    join public.board_items b on b.id=d.board_id and b.due_at=d.due_at and b.completed_at is null
    join public.push_subscriptions s on s.id=d.subscription_id
    join public.household_members m on m.user_id=s.user_id and m.household_id=b.household_id
    where d.sent_at is null and d.attempts<5 and (d.leased_until is null or d.leased_until<now()) and d.due_at>now()-interval '24 hours'
    order by d.due_at limit 20 for update of d skip locked
  ), claimed as (
    update public.board_push_deliveries d set lease_id=gen_random_uuid(),leased_until=now()+interval '5 minutes',attempts=attempts+1
    from candidates c where d.id=c.id returning d.*
  ) select coalesce(jsonb_agg(jsonb_build_object('id',d.id,'lease_id',d.lease_id,'board_id',d.board_id,'subscription_id',s.id,'endpoint',s.endpoint,'p256dh',s.p256dh,'auth',s.auth,'locale',s.locale)),'[]'::jsonb)
    into output from claimed d join public.push_subscriptions s on s.id=d.subscription_id;
  return output;
end $$;
commit;
