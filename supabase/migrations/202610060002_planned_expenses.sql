create table public.planned_expenses (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id),
  account_id uuid not null,
  category_id uuid not null,
  amount bigint not null check(amount between 1 and 9007199254740991),
  date date not null check(date between '1900-01-01' and '9999-12-31'),
  note text not null default '' check(length(note)<=500),
  created_by uuid not null default auth.uid() references public.profiles(id),
  updated_by uuid not null default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key(household_id,account_id) references public.accounts(household_id,id),
  foreign key(household_id,category_id) references public.categories(household_id,id)
);
create index planned_expense_calendar on public.planned_expenses(household_id,date,id);
alter table public.planned_expenses enable row level security;
create policy planned_expenses_access on public.planned_expenses for all to authenticated
  using(household_id=public.current_household()) with check(household_id=public.current_household());
revoke all on public.planned_expenses from public,anon,authenticated;
grant select,insert,update,delete on public.planned_expenses to authenticated;

create function public.check_planned_expense() returns trigger language plpgsql set search_path='' as $$
begin
  if tg_op='UPDATE' then
    if new.id<>old.id or new.household_id<>old.household_id then raise exception 'Record identity cannot change'; end if;
    new.created_by:=old.created_by; new.created_at:=old.created_at;
  else new.created_by:=auth.uid(); new.created_at:=now(); end if;
  new.updated_by:=auth.uid(); new.updated_at:=now();
  perform 1 from public.accounts where id=new.account_id and household_id=new.household_id and archived_at is null for share;
  if not found then raise exception 'Account is missing or archived'; end if;
  perform 1 from public.categories where id=new.category_id and household_id=new.household_id and archived_at is null and kind='expense' for share;
  if not found then raise exception 'Choose an active expense category'; end if;
  return new;
end $$;
create trigger a_lock_planned_expense before insert or update or delete on public.planned_expenses
  for each row execute function public.lock_household_finance();
create trigger validate_planned_expense before insert or update on public.planned_expenses
  for each row execute function public.check_planned_expense();

create or replace function public.check_category_update() returns trigger language plpgsql set search_path='' as $$
begin
  if new.id<>old.id or new.household_id<>old.household_id then raise exception 'Record identity cannot change'; end if;
  if new.kind<>old.kind and (exists(select 1 from public.transactions where category_id=old.id)
    or exists(select 1 from public.planned_expenses where category_id=old.id)) then
    raise exception 'A used category cannot change type';
  end if;
  return new;
end $$;

create function public.list_planned_expenses(p_start date,p_end_exclusive date,p_account_id uuid default null,p_category_id uuid default null)
returns jsonb
language sql stable security invoker set search_path='' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'date',p.date,'amount',p.amount::text,'note',p.note,
    'account_id',p.account_id,'category_id',p.category_id,'account_name',a.name,'category_name',c.name)
    order by p.date,p.created_at,p.id),'[]'::jsonb)
  from public.planned_expenses p join public.accounts a on a.id=p.account_id join public.categories c on c.id=p.category_id
  where p.household_id=public.current_household() and p.date>=p_start and p.date<p_end_exclusive
    and (p_account_id is null or p.account_id=p_account_id) and (p_category_id is null or p.category_id=p_category_id)
$$;

create function public.pay_planned_expense(p_id uuid,p_date date) returns uuid
language plpgsql security definer set search_path='' as $$
declare hid uuid:=public.current_household(); plan public.planned_expenses; transaction_id uuid;
begin
  if hid is null then raise exception 'Household access denied'; end if;
  -- Use the same lock order as finance writes, then consume the plan exactly once.
  perform 1 from public.households where id=hid for update;
  select * into plan from public.planned_expenses where id=p_id and household_id=hid for update;
  if not found then raise exception 'This plan is no longer available'; end if;
  if p_date is null or p_date<'1900-01-01' or p_date>(now() at time zone 'Asia/Jakarta')::date then
    raise exception 'Choose a payment date on or before today';
  end if;
  insert into public.transactions(household_id,account_id,category_id,kind,amount,date,note)
    values(hid,plan.account_id,plan.category_id,'expense',plan.amount,p_date,plan.note) returning id into transaction_id;
  delete from public.planned_expenses where id=p_id and household_id=hid;
  return transaction_id;
end $$;
revoke all on function public.check_planned_expense(),public.list_planned_expenses(date,date,uuid,uuid),public.pay_planned_expense(uuid,date) from public,anon,authenticated;
grant execute on function public.list_planned_expenses(date,date,uuid,uuid),public.pay_planned_expense(uuid,date) to authenticated;
