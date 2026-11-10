begin;
set local lock_timeout='5s';
set local statement_timeout='60s';
-- Only the Worker may call this transaction. It cannot promote any account.
create or replace function public.pvs_cm2_initial_codes(p_owner text,p_class uuid,p_count integer default 0)
returns table(code_public text,activated boolean)
language plpgsql security invoker set search_path=public,pg_temp
as $$
declare n integer; new_code text;
begin
  if p_count is null or p_count<0 or p_count>35 then
    raise exception 'Invalid number of initial codes';
  end if;
  if not exists(select 1 from public.pvs_identites i where i.code_public=p_owner and i.role in ('prof','admin')) then
    raise exception 'Teacher account required';
  end if;
  perform 1 from public.pvs_cm2_classes c where c.id=p_class and c.owner=p_owner for update;
  if not found then raise exception 'Class inaccessible'; end if;
  if (select count(*) from public.pvs_cm2_members m where m.class_id=p_class)+p_count>100 then
    raise exception 'Class capacity exceeded';
  end if;
  if p_count>0 then
    for n in 1..p_count loop
      new_code='CM2-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,16));
      insert into public.pvs_identites(code_public,role) values(new_code,'eleve');
      insert into public.pvs_cm2_members(class_id,student,approved,issued_here) values(p_class,new_code,false,true);
    end loop;
  end if;
  return query select i.code_public,i.code_secret is not null
    from public.pvs_cm2_members m join public.pvs_identites i on i.code_public=m.student
    where m.class_id=p_class and m.issued_here and i.code_public like 'CM2-%' order by i.code_public;
end $$;
revoke all on function public.pvs_cm2_initial_codes(text,uuid,integer) from public,anon,authenticated;
grant execute on function public.pvs_cm2_initial_codes(text,uuid,integer) to service_role;
notify pgrst,'reload schema';
commit;
