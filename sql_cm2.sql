-- Apply once in the existing Supabase SQL editor. Additive, no legacy data changed.
begin;
set local search_path = public, pg_temp;
set local lock_timeout = '5s';
set local statement_timeout = '60s';
do $$
begin
  if to_regclass('public.pvs_identites') is null or to_regclass('public.pvs_sessions') is null then
    raise exception 'Wrong database: existing portal identities and sessions are required. Nothing was changed.';
  end if;
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename in (
      'pvs_cm2_classes','pvs_cm2_members','pvs_cm2_assignments',
      'pvs_cm2_runs','pvs_cm2_answers','pvs_cm2_reviews'
    )
  ) then
    raise exception 'Existing CM2 policies need review before applying this private schema. Nothing was changed.';
  end if;
end $$;
create table if not exists pvs_cm2_classes (
  id uuid primary key, owner text not null, name text not null,
  school_year text not null, join_hash text not null unique,
  created_at timestamptz not null default now()
);
create table if not exists pvs_cm2_members (
  class_id uuid not null references pvs_cm2_classes(id), student text not null,
  approved boolean not null default false, created_at timestamptz not null default now(),
  primary key(class_id, student)
);
create table if not exists pvs_cm2_assignments (
  id uuid primary key, class_id uuid not null references pvs_cm2_classes(id),
  title text not null, activities jsonb not null, students jsonb not null,
  level integer not null check(level between 1 and 3), due date,
  active boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists pvs_cm2_runs (
  id uuid primary key, student text not null,
  assignment_id uuid references pvs_cm2_assignments(id),
  class_id uuid references pvs_cm2_classes(id), activity text not null,
  level integer not null check(level between 1 and 3), seed bigint not null,
  catalog_version text not null, completed boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists pvs_cm2_answers (
  run_id uuid not null references pvs_cm2_runs(id),
  question_index integer not null check(question_index between 0 and 5),
  answer text not null check(length(answer) <= 2000), correct boolean,
  assisted boolean not null default false, created_at timestamptz not null default now(),
  primary key(run_id,question_index)
);
create table if not exists pvs_cm2_reviews (
  run_id uuid primary key references pvs_cm2_runs(id), teacher text not null,
  comment text not null check(length(comment)<=1000),
  status text not null check(status in ('a_reprendre','relu')),
  updated_at timestamptz not null default now()
);
create index if not exists pvs_cm2_class_owner_idx on pvs_cm2_classes(owner);
create index if not exists pvs_cm2_member_student_idx on pvs_cm2_members(student);
create index if not exists pvs_cm2_assignment_class_idx on pvs_cm2_assignments(class_id);
create index if not exists pvs_cm2_run_student_idx on pvs_cm2_runs(student,created_at desc);
create index if not exists pvs_cm2_run_class_idx on pvs_cm2_runs(class_id,created_at desc);
alter table pvs_cm2_classes enable row level security;
alter table pvs_cm2_members enable row level security;
alter table pvs_cm2_assignments enable row level security;
alter table pvs_cm2_runs enable row level security;
alter table pvs_cm2_answers enable row level security;
alter table pvs_cm2_reviews enable row level security;
revoke all on pvs_cm2_classes,pvs_cm2_members,pvs_cm2_assignments,pvs_cm2_runs,pvs_cm2_answers,pvs_cm2_reviews from anon,authenticated,public;
grant select,insert,update,delete on pvs_cm2_classes,pvs_cm2_members,pvs_cm2_assignments,pvs_cm2_runs,pvs_cm2_answers,pvs_cm2_reviews to service_role;
-- Abort the whole transaction if an older table has an incompatible layout.
do $$
declare
  required record;
begin
  for required in
    select * from (values
      ('pvs_cm2_classes','id','uuid'),('pvs_cm2_classes','owner','text'),
      ('pvs_cm2_classes','name','text'),('pvs_cm2_classes','school_year','text'),
      ('pvs_cm2_classes','join_hash','text'),('pvs_cm2_classes','created_at','timestamptz'),
      ('pvs_cm2_members','class_id','uuid'),('pvs_cm2_members','student','text'),
      ('pvs_cm2_members','approved','bool'),('pvs_cm2_members','created_at','timestamptz'),
      ('pvs_cm2_assignments','id','uuid'),('pvs_cm2_assignments','class_id','uuid'),
      ('pvs_cm2_assignments','title','text'),('pvs_cm2_assignments','activities','jsonb'),
      ('pvs_cm2_assignments','students','jsonb'),('pvs_cm2_assignments','level','int4'),
      ('pvs_cm2_assignments','due','date'),('pvs_cm2_assignments','active','bool'),
      ('pvs_cm2_assignments','created_at','timestamptz'),
      ('pvs_cm2_runs','id','uuid'),('pvs_cm2_runs','student','text'),
      ('pvs_cm2_runs','assignment_id','uuid'),('pvs_cm2_runs','class_id','uuid'),
      ('pvs_cm2_runs','activity','text'),('pvs_cm2_runs','level','int4'),
      ('pvs_cm2_runs','seed','int8'),('pvs_cm2_runs','catalog_version','text'),
      ('pvs_cm2_runs','completed','bool'),('pvs_cm2_runs','created_at','timestamptz'),
      ('pvs_cm2_answers','run_id','uuid'),('pvs_cm2_answers','question_index','int4'),
      ('pvs_cm2_answers','answer','text'),('pvs_cm2_answers','correct','bool'),
      ('pvs_cm2_answers','assisted','bool'),('pvs_cm2_answers','created_at','timestamptz'),
      ('pvs_cm2_reviews','run_id','uuid'),('pvs_cm2_reviews','teacher','text'),
      ('pvs_cm2_reviews','comment','text'),('pvs_cm2_reviews','status','text'),
      ('pvs_cm2_reviews','updated_at','timestamptz')
    ) as expected(table_name,column_name,data_type)
  loop
    if not exists (
      select 1 from information_schema.columns c
      where c.table_schema = 'public' and c.table_name = required.table_name
        and c.column_name = required.column_name and c.udt_name = required.data_type
    ) then
      raise exception 'Incompatible CM2 schema: %.%. Nothing was changed.', required.table_name, required.column_name;
    end if;
  end loop;
end $$;
notify pgrst,'reload schema';
commit;
