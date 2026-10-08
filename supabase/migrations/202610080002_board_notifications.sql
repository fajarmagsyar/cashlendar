create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique check(length(endpoint)<=2048 and endpoint ~ '^https://(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|[a-z0-9.-]+\.notify.windows.com|[a-z0-9.-]+\.push\.apple\.com)/'),
  p256dh text not null check(p256dh ~ '^[A-Za-z0-9_-]{87}=?$'),
  auth text not null check(auth ~ '^[A-Za-z0-9_-]{22}={0,2}$'),
  locale text not null default 'id' check(locale in ('id','en')),
  created_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
create policy subscriptions_own on public.push_subscriptions for select to authenticated using(user_id=auth.uid());
create policy subscriptions_delete on public.push_subscriptions for delete to authenticated using(user_id=auth.uid());
revoke all on public.push_subscriptions from public,anon,authenticated;
grant select,delete on public.push_subscriptions to authenticated;
create function public.subscribe_board_push(p_endpoint text,p_p256dh text,p_auth text,p_locale text) returns void language plpgsql security definer set search_path='' as $$
begin
  if public.current_household() is null then raise exception 'Household access denied'; end if;
  insert into public.push_subscriptions(user_id,endpoint,p256dh,auth,locale) values(auth.uid(),p_endpoint,p_p256dh,p_auth,p_locale)
    on conflict(endpoint) do update set user_id=auth.uid(),p256dh=excluded.p256dh,auth=excluded.auth,locale=excluded.locale,created_at=case when public.push_subscriptions.user_id=auth.uid() then public.push_subscriptions.created_at else now() end;
end $$;
revoke all on function public.subscribe_board_push(text,text,text,text) from public,anon,authenticated;
grant execute on function public.subscribe_board_push(text,text,text,text) to authenticated;

create table public.board_push_deliveries (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.board_items(id) on delete cascade,
  due_at timestamptz not null,
  subscription_id uuid not null references public.push_subscriptions(id) on delete cascade,
  attempts integer not null default 0,
  sent_at timestamptz,
  lease_id uuid,
  leased_until timestamptz,
  unique(board_id,due_at,subscription_id)
);
alter table public.board_push_deliveries enable row level security;
revoke all on public.board_push_deliveries from public,anon,authenticated;

create function public.claim_board_notifications() returns jsonb language plpgsql security definer set search_path='' as $$
declare output jsonb;
begin
  -- A due date identifies one reminder occurrence; title edits must not send it again.
  insert into public.board_push_deliveries(board_id,due_at,subscription_id)
    select b.id,b.due_at,s.id from public.board_items b
    join public.household_members m on m.household_id=b.household_id
    join public.push_subscriptions s on s.user_id=m.user_id
    where b.kind='reminder' and b.completed_at is null and b.due_at<=now() and b.due_at>now()-interval '24 hours' and s.created_at<=b.due_at and m.joined_at<=b.due_at
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
create function public.finish_board_notification(p_id uuid,p_lease_id uuid,p_sent boolean,p_expired boolean default false) returns void language plpgsql security definer set search_path='' as $$
declare subscription uuid;
begin
  update public.board_push_deliveries set sent_at=case when p_sent then now() else sent_at end
    where id=p_id and lease_id=p_lease_id returning subscription_id into subscription;
  if p_expired and subscription is not null then delete from public.push_subscriptions where id=subscription; end if;
end $$;
revoke all on function public.claim_board_notifications(),public.finish_board_notification(uuid,uuid,boolean,boolean) from public,anon,authenticated;
do $$begin
  if exists(select 1 from pg_roles where rolname='service_role') then
    grant execute on function public.claim_board_notifications(),public.finish_board_notification(uuid,uuid,boolean,boolean) to service_role;
  end if;
end $$;
