create table public.profiles (
  id uuid primary key references auth.users(id),
  display_name text not null default 'Family member' check(length(display_name) between 1 and 100)
);
create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null check(length(trim(name)) between 1 and 80),
  owner_id uuid not null references public.profiles(id),
  currency text not null default 'IDR' check(currency='IDR'),
  timezone text not null default 'Asia/Jakarta' check(timezone='Asia/Jakarta'),
  created_at timestamptz not null default now()
);
create table public.household_members (
  household_id uuid not null references public.households(id),
  user_id uuid not null unique references public.profiles(id),
  role text not null check(role in ('owner','member')),
  joined_at timestamptz not null default now(),
  primary key(household_id,user_id)
);
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id),
  email text not null check(length(email) between 3 and 254),
  token_hash text not null unique check(token_hash ~ '^[a-f0-9]{64}$'),
  expires_at timestamptz not null default (now()+interval '7 days'),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  accepted_at timestamptz, revoked_at timestamptz
);
create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id),
  name text not null check(length(trim(name)) between 1 and 80),
  type text not null check(type in ('cash','bank','ewallet','savings')),
  opening_balance bigint not null default 0 check(opening_balance between 0 and 9007199254740991),
  archived_at timestamptz,
  created_by uuid not null default auth.uid() references public.profiles(id),
  unique(household_id,id)
);
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id),
  name text not null check(length(trim(name)) between 1 and 80),
  kind text not null check(kind in ('income','expense')),
  archived_at timestamptz,
  unique(household_id,id)
);
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id),
  account_id uuid not null,
  category_id uuid not null,
  kind text not null check(kind in ('income','expense')),
  amount bigint not null check(amount between 1 and 9007199254740991),
  date date not null check(date >= '1900-01-01'),
  note text not null default '' check(length(note)<=500),
  created_by uuid not null default auth.uid() references public.profiles(id),
  updated_by uuid not null default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key(household_id,account_id) references public.accounts(household_id,id),
  foreign key(household_id,category_id) references public.categories(household_id,id)
);
create table public.transfers (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id),
  source_account_id uuid not null, destination_account_id uuid not null,
  amount bigint not null check(amount between 1 and 9007199254740991),
  date date not null check(date >= '1900-01-01'),
  note text not null default '' check(length(note)<=500),
  created_by uuid not null default auth.uid() references public.profiles(id),
  updated_by uuid not null default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check(source_account_id<>destination_account_id),
  foreign key(household_id,source_account_id) references public.accounts(household_id,id),
  foreign key(household_id,destination_account_id) references public.accounts(household_id,id)
);
create table public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id),
  account_id uuid not null,
  name text not null check(length(trim(name)) between 1 and 80),
  target_amount bigint not null check(target_amount between 1 and 9007199254740991),
  target_date date check(target_date >= '1900-01-01'), archived_at timestamptz,
  foreign key(household_id,account_id) references public.accounts(household_id,id)
);
create unique index one_active_goal_per_account on public.savings_goals(account_id) where archived_at is null;
create index transaction_history on public.transactions(household_id,date desc,id);
create index transfer_history on public.transfers(household_id,date desc,id);
create index household_accounts on public.accounts(household_id);
create index household_categories on public.categories(household_id);

create function public.current_household() returns uuid language sql stable security definer set search_path='' as $$
 select household_id from public.household_members where user_id=auth.uid()
$$;
create function public.is_owner(p_household uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.household_members where user_id=auth.uid() and household_id=p_household and role='owner')
$$;
create function public.shares_household(p_user uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.household_members a join public.household_members b on a.household_id=b.household_id where a.user_id=auth.uid() and b.user_id=p_user)
 or exists(select 1 from public.transactions where household_id=public.current_household() and created_by=p_user)
 or exists(select 1 from public.transfers where household_id=public.current_household() and created_by=p_user)
$$;

alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.invitations enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.transfers enable row level security;
alter table public.savings_goals enable row level security;

create policy profiles_read on public.profiles for select to authenticated using(id=auth.uid() or public.shares_household(id));
create policy profiles_update on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
create policy households_read on public.households for select to authenticated using(id=public.current_household());
create policy members_read on public.household_members for select to authenticated using(household_id=public.current_household());
create policy invitations_read on public.invitations for select to authenticated using(public.is_owner(household_id));
create policy accounts_access on public.accounts for all to authenticated using(household_id=public.current_household()) with check(household_id=public.current_household());
create policy categories_access on public.categories for all to authenticated using(household_id=public.current_household()) with check(household_id=public.current_household());
create policy transactions_access on public.transactions for all to authenticated using(household_id=public.current_household()) with check(household_id=public.current_household());
create policy transfers_access on public.transfers for all to authenticated using(household_id=public.current_household()) with check(household_id=public.current_household());
create policy goals_access on public.savings_goals for all to authenticated using(household_id=public.current_household()) with check(household_id=public.current_household());
revoke all on all tables in schema public from anon, authenticated;
grant select on public.profiles,public.households,public.household_members,public.invitations to authenticated;
grant update(display_name) on public.profiles to authenticated;
grant select,insert,update on public.accounts,public.categories,public.savings_goals to authenticated;
grant select,insert,update,delete on public.transactions,public.transfers to authenticated;

create function public.handle_new_user() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.profiles(id,display_name) values(new.id,left(coalesce(nullif(new.raw_user_meta_data->>'full_name',''),'Family member'),100));
 return new;
end $$;
create trigger profile_on_signup after insert on auth.users for each row execute function public.handle_new_user();
insert into public.profiles(id,display_name) select id,left(coalesce(nullif(raw_user_meta_data->>'full_name',''),'Family member'),100) from auth.users on conflict do nothing;

create function public.create_household(p_name text) returns uuid language plpgsql security definer set search_path='' as $$
declare hid uuid; uid uuid:=auth.uid();
begin
 if uid is null then raise exception 'Sign in first'; end if;
 perform 1 from public.profiles where id=uid for update;
 if exists(select 1 from public.household_members where user_id=uid) then raise exception 'You already belong to a household'; end if;
 insert into public.households(name,owner_id) values(trim(p_name),uid) returning id into hid;
 insert into public.household_members(household_id,user_id,role) values(hid,uid,'owner');
 insert into public.categories(household_id,name,kind) values
 (hid,'Salary','income'),(hid,'Other income','income'),(hid,'Food & groceries','expense'),
 (hid,'Transport','expense'),(hid,'Home & bills','expense'),(hid,'Health','expense'),(hid,'Shopping','expense'),(hid,'Other expenses','expense');
 return hid;
end $$;
create function public.create_invitation(p_email text,p_token_hash text) returns uuid language plpgsql security definer set search_path='' as $$
declare iid uuid; hid uuid:=public.current_household();
begin
 if not public.is_owner(hid) then raise exception 'Only the owner can invite members'; end if;
 if trim(p_email) !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Enter a valid email'; end if;
 insert into public.invitations(household_id,email,token_hash,created_by) values(hid,lower(trim(p_email)),p_token_hash,auth.uid()) returning id into iid;
 return iid;
end $$;
create function public.accept_invitation(p_token_hash text) returns uuid language plpgsql security definer set search_path='' as $$
declare inv public.invitations; uid uuid:=auth.uid(); user_email text; verified timestamptz;
begin
 if uid is null then raise exception 'Sign in to accept the invitation'; end if;
 perform 1 from public.profiles where id=uid for update;
 if exists(select 1 from public.household_members where user_id=uid) then raise exception 'You already belong to a household'; end if;
 select * into inv from public.invitations where token_hash=p_token_hash for update;
 if inv.id is null then raise exception 'Invitation not found'; end if;
 if inv.revoked_at is not null then raise exception 'This invitation was revoked'; end if;
 if inv.accepted_at is not null then raise exception 'This invitation has already been used'; end if;
 if inv.expires_at<=now() then raise exception 'This invitation has expired'; end if;
 select lower(email),email_confirmed_at into user_email,verified from auth.users where id=uid;
 if verified is null or user_email is distinct from inv.email then raise exception 'Sign in with the verified email this invitation was sent to'; end if;
 insert into public.household_members(household_id,user_id,role) values(inv.household_id,uid,'member');
 update public.invitations set accepted_at=now() where id=inv.id;
 return inv.household_id;
end $$;
create function public.revoke_invitation(p_invitation_id uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.is_owner(public.current_household()) then raise exception 'Only the owner can revoke invitations'; end if;
 update public.invitations set revoked_at=now() where id=p_invitation_id and household_id=public.current_household() and accepted_at is null;
end $$;
create function public.remove_member(p_user_id uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.is_owner(public.current_household()) then raise exception 'Only the owner can remove members'; end if;
 if p_user_id=auth.uid() then raise exception 'The owner cannot remove themselves'; end if;
 delete from public.household_members where user_id=p_user_id and household_id=public.current_household() and role='member';
end $$;

create function public.check_financial_write() returns trigger language plpgsql set search_path='' as $$
declare aid uuid; account_row public.accounts; category_row public.categories;
begin
 if tg_op='UPDATE' then
  if new.household_id<>old.household_id or new.id<>old.id then raise exception 'Record identity cannot change'; end if;
 end if;
 if tg_table_name in ('transactions','transfers') then
  if new.date>(now() at time zone 'Asia/Jakarta')::date then raise exception 'Future transaction dates are not allowed'; end if;
  if tg_op='INSERT' then new.created_by:=auth.uid(); new.created_at:=now();
  else new.created_by:=old.created_by; new.created_at:=old.created_at; end if;
  new.updated_by:=auth.uid(); new.updated_at:=now();
 end if;
 if tg_table_name='transactions' then
  select * into account_row from public.accounts where id=new.account_id and household_id=new.household_id for share;
  if account_row.id is null or account_row.archived_at is not null then raise exception 'Account is missing or archived'; end if;
  select * into category_row from public.categories where id=new.category_id and household_id=new.household_id for share;
  if category_row.id is null or category_row.archived_at is not null or category_row.kind<>new.kind then raise exception 'Category is missing, archived, or has the wrong type'; end if;
 elsif tg_table_name='transfers' then
  for aid in select id from public.accounts where id in (new.source_account_id,new.destination_account_id) order by id loop
   select * into account_row from public.accounts where id=aid and household_id=new.household_id for share;
   if account_row.id is null or account_row.archived_at is not null then raise exception 'Account is missing or archived'; end if;
  end loop;
 elsif tg_table_name='savings_goals' and new.archived_at is null then
  select * into account_row from public.accounts where id=new.account_id and household_id=new.household_id for share;
  if account_row.id is null or account_row.archived_at is not null or account_row.type<>'savings' then raise exception 'Choose an active savings account'; end if;
 elsif tg_table_name='accounts' then
  if tg_op='UPDATE' then
   new.created_by:=old.created_by;
   if (new.archived_at is not null or new.type<>'savings') and exists(select 1 from public.savings_goals where account_id=new.id and archived_at is null) then raise exception 'Archive or reassign the active savings goal first'; end if;
  else new.created_by:=auth.uid(); end if;
 end if;
 return new;
end $$;
create trigger validate_transaction before insert or update on public.transactions for each row execute function public.check_financial_write();
create trigger validate_transfer before insert or update on public.transfers for each row execute function public.check_financial_write();
create trigger validate_goal before insert or update on public.savings_goals for each row execute function public.check_financial_write();
create trigger validate_account before insert or update on public.accounts for each row execute function public.check_financial_write();
create function public.check_category_update() returns trigger language plpgsql set search_path='' as $$
begin
 if new.id<>old.id or new.household_id<>old.household_id then raise exception 'Record identity cannot change'; end if;
 if new.kind<>old.kind and exists(select 1 from public.transactions where category_id=old.id) then raise exception 'A used category cannot change type'; end if;
 return new;
end $$;
create trigger validate_category before update on public.categories for each row execute function public.check_category_update();

create function public.account_balances() returns table(account_id uuid,balance text) language sql stable security invoker set search_path='' as $$
 select a.id,(a.opening_balance::numeric
 +coalesce((select sum(case t.kind when 'income' then t.amount::numeric else -t.amount::numeric end) from public.transactions t where t.account_id=a.id),0)
 +coalesce((select sum(t.amount::numeric) from public.transfers t where t.destination_account_id=a.id),0)
 -coalesce((select sum(t.amount::numeric) from public.transfers t where t.source_account_id=a.id),0))::text
 from public.accounts a where a.household_id=public.current_household()
$$;
create function public.filtered_entries(p_start date,p_end_exclusive date,p_account_id uuid,p_category_id uuid,p_kind text,p_search text)
returns table(id uuid,kind text,date date,amount bigint,note text,account_id uuid,category_id uuid,account_name text,destination_account_id uuid,destination_name text,category_name text,author text)
language sql stable security invoker set search_path='' as $$
 with entries as (
 select t.id,t.kind,t.date,t.amount,t.note,t.account_id,t.category_id,a.name account_name,null::uuid destination_account_id,null::text destination_name,c.name category_name,p.display_name author
 from public.transactions t join public.accounts a on a.id=t.account_id join public.categories c on c.id=t.category_id join public.profiles p on p.id=t.created_by
 where t.household_id=public.current_household()
 union all
 select t.id,'transfer',t.date,t.amount,t.note,t.source_account_id,null,a.name,t.destination_account_id,b.name,null,p.display_name
 from public.transfers t join public.accounts a on a.id=t.source_account_id join public.accounts b on b.id=t.destination_account_id join public.profiles p on p.id=t.created_by
 where t.household_id=public.current_household()
 ) select * from entries e where e.date>=p_start and e.date<p_end_exclusive
 and (p_account_id is null or e.account_id=p_account_id or e.destination_account_id=p_account_id)
 and (p_category_id is null or e.category_id=p_category_id)
 and (coalesce(p_kind,'')='' or e.kind=p_kind)
 and (coalesce(p_search,'')='' or position(lower(p_search) in lower(e.note||' '||e.account_name||' '||coalesce(e.destination_name,'')||' '||coalesce(e.category_name,'')))>0)
$$;
create function public.list_entries(p_start date,p_end_exclusive date,p_account_id uuid default null,p_category_id uuid default null,p_kind text default '',p_search text default '',p_limit integer default 50,p_offset integer default 0)
returns table(id uuid,kind text,date date,amount bigint,note text,account_id uuid,category_id uuid,account_name text,destination_account_id uuid,destination_name text,category_name text,author text)
language sql stable security invoker set search_path='' as $$
 select * from public.filtered_entries(p_start,p_end_exclusive,p_account_id,p_category_id,p_kind,p_search) order by date desc,id desc limit greatest(1,least(p_limit,50)) offset greatest(0,p_offset)
$$;
create function public.finance_summary(p_start date,p_end_exclusive date,p_account_id uuid default null,p_category_id uuid default null,p_kind text default '',p_search text default '')
returns jsonb language sql stable security invoker set search_path='' as $$
 with e as (select * from public.filtered_entries(p_start,p_end_exclusive,p_account_id,p_category_id,p_kind,p_search)),
 daily as (select date,coalesce(sum(amount) filter(where kind='income'),0)::text income,coalesce(sum(amount) filter(where kind='expense'),0)::text expenses from e group by date order by date),
 cats as (select category_name name,sum(amount)::text amount from e where kind='expense' group by category_name order by sum(amount) desc)
 select jsonb_build_object('income',coalesce(sum(amount) filter(where kind='income'),0)::text,'expenses',coalesce(sum(amount) filter(where kind='expense'),0)::text,
 'net',(coalesce(sum(amount) filter(where kind='income'),0)-coalesce(sum(amount) filter(where kind='expense'),0))::text,'count',count(*),
 'days',coalesce((select jsonb_agg(to_jsonb(daily)) from daily),'[]'::jsonb),'categories',coalesce((select jsonb_agg(to_jsonb(cats)) from cats),'[]'::jsonb)) from e
$$;

create function public.lock_household_finance() returns trigger language plpgsql security definer set search_path='' as $$
declare hid uuid;
begin
 if tg_op='DELETE' then hid:=old.household_id; else hid:=new.household_id; end if;
 if hid is distinct from public.current_household() then raise exception 'Household access denied'; end if;
 perform 1 from public.households where id=hid for update;
 if tg_op='DELETE' then return old; else return new; end if;
end $$;
create function public.check_finance_range() returns trigger language plpgsql security definer set search_path='' as $$
declare max_amount numeric:=9007199254740991; total numeric; hid uuid;
begin
 if tg_op='DELETE' then hid:=old.household_id; else hid:=new.household_id; end if;
 if exists(select 1 from public.account_balances() where abs(balance::numeric)>max_amount) then
  raise exception 'This change would exceed the supported rupiah range for an account';
 end if;
 select coalesce(sum(balance::numeric),0) into total from public.account_balances();
 if abs(total)>max_amount then raise exception 'This change would exceed the supported rupiah range for your household'; end if;
 if exists(select 1 from public.transactions where household_id=hid group by date_trunc('month',date),kind having sum(amount::numeric)>max_amount) then
  raise exception 'This change would exceed the supported rupiah range for monthly reports';
 end if;
 if tg_op='DELETE' then return old; else return new; end if;
end $$;
-- Serialize before row changes; range checks then reject the whole mutation atomically.
create trigger a_lock_account before insert or update on public.accounts for each row execute function public.lock_household_finance();
create trigger a_lock_transaction before insert or update or delete on public.transactions for each row execute function public.lock_household_finance();
create trigger a_lock_transfer before insert or update or delete on public.transfers for each row execute function public.lock_household_finance();
create trigger check_account_range after insert or update on public.accounts for each row execute function public.check_finance_range();
create trigger check_transaction_range after insert or update or delete on public.transactions for each row execute function public.check_finance_range();
create trigger check_transfer_range after insert or update or delete on public.transfers for each row execute function public.check_finance_range();

revoke all on all functions in schema public from public, anon, authenticated;
grant execute on function public.current_household(),public.is_owner(uuid),public.shares_household(uuid),public.create_household(text),public.create_invitation(text,text),public.accept_invitation(text),public.revoke_invitation(uuid),public.remove_member(uuid),public.account_balances(),public.filtered_entries(date,date,uuid,uuid,text,text),public.list_entries(date,date,uuid,uuid,text,text,integer,integer),public.finance_summary(date,date,uuid,uuid,text,text) to authenticated;
