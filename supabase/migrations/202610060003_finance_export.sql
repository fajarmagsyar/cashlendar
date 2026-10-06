create function public.export_finances(p_start date,p_end_exclusive date,p_account_id uuid default null,p_category_id uuid default null,p_kind text default '',p_search text default '')
returns jsonb language sql stable security invoker set search_path='' as $$
  with entries as (
    select e.*,coalesce(t.created_by,tr.created_by) recorded_by
    from public.filtered_entries(p_start,p_end_exclusive,p_account_id,p_category_id,p_kind,p_search) e
    left join public.transactions t on t.id=e.id and e.kind<>'transfer'
    left join public.transfers tr on tr.id=e.id and e.kind='transfer'
  ), plans as (
    select p.id,'expense'::text kind,p.date,p.amount,p.note,p.account_id,p.category_id,
      a.name account_name,null::uuid destination_account_id,null::text destination_name,c.name category_name,
      coalesce(u.display_name,p.created_by::text) author,p.created_by recorded_by
    from public.planned_expenses p
    join public.accounts a on a.id=p.account_id
    join public.categories c on c.id=p.category_id
    left join public.profiles u on u.id=p.created_by
    where p.household_id=public.current_household() and p.date>=p_start and p.date<p_end_exclusive
      and (p_account_id is null or p.account_id=p_account_id)
      and (p_category_id is null or p.category_id=p_category_id)
      and (coalesce(p_kind,'')='' or p_kind='expense')
      and (coalesce(p_search,'')='' or position(lower(p_search) in lower(p.note||' '||a.name||' '||c.name))>0)
  ) select jsonb_build_object(
    'transactions',coalesce((select jsonb_agg(to_jsonb(e)||jsonb_build_object('amount',e.amount::text) order by e.date desc,e.id desc) from entries e),'[]'::jsonb),
    'planned',coalesce((select jsonb_agg(to_jsonb(p)||jsonb_build_object('amount',p.amount::text) order by p.date,p.id) from plans p),'[]'::jsonb)
  )
$$;
revoke all on function public.export_finances(date,date,uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.export_finances(date,date,uuid,uuid,text,text) to authenticated;
