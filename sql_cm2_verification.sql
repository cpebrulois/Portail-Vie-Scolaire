-- Read-only. All six rows must show installed=true and private=true.
with expected(table_name) as (
  values ('pvs_cm2_classes'),('pvs_cm2_members'),('pvs_cm2_assignments'),
         ('pvs_cm2_runs'),('pvs_cm2_answers'),('pvs_cm2_reviews')
), checks as (
  select e.table_name, c.oid, c.relrowsecurity,
    (select count(*) from pg_policies p
     where p.schemaname='public' and p.tablename=e.table_name) as policies,
    case when c.oid is null then false else
      has_table_privilege('anon',c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
      or has_table_privilege('authenticated',c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
    end as client_access,
    case when c.oid is null then false else
      has_table_privilege('service_role',c.oid,'SELECT')
      and has_table_privilege('service_role',c.oid,'INSERT')
      and has_table_privilege('service_role',c.oid,'UPDATE')
      and has_table_privilege('service_role',c.oid,'DELETE')
    end as server_access
  from expected e
  left join pg_namespace n on n.nspname='public'
  left join pg_class c on c.relnamespace=n.oid and c.relname=e.table_name and c.relkind='r'
)
select table_name, oid is not null as installed,
  coalesce(relrowsecurity and policies=0 and not client_access and server_access,false) as private,
  coalesce(relrowsecurity,false) as row_security,
  policies, client_access, server_access
from checks order by table_name;
