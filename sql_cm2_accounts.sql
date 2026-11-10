begin;
set local lock_timeout='5s';
set local statement_timeout='60s';
alter table public.pvs_cm2_members add column if not exists issued_here boolean not null default false;
create table if not exists public.pvs_cm2_teacher_invites(
  code_public text primary key references public.pvs_identites(code_public),
  token_hash text not null unique,
  created_by text not null,
  expires_at timestamptz not null default now()+interval '7 days',
  activated_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.pvs_cm2_teacher_invites enable row level security;
revoke all on public.pvs_cm2_teacher_invites from public,anon,authenticated;
grant select,insert,update,delete on public.pvs_cm2_teacher_invites to service_role;

create or replace function public.pvs_cm2_teacher_codes(p_admin text,p_hashes jsonb)
returns table(code_public text,slot integer)
language plpgsql security invoker set search_path=public,pg_temp as $$
declare n integer; seq integer; generated text;
begin
  if not exists(select 1 from public.pvs_identites i where i.code_public=p_admin and i.role='admin') then raise exception 'Administrator required'; end if;
  if jsonb_typeof(p_hashes)<>'array' or jsonb_array_length(p_hashes) not between 1 and 10 then raise exception 'Invalid invitation count'; end if;
  perform pg_advisory_xact_lock(734291,1);
  select coalesce(max(right(i.code_public,4)::integer),0) into seq from public.pvs_identites i where i.code_public ~ '^RANCE-PRIM-[0-9]{4}$';
  if seq+jsonb_array_length(p_hashes)>9999 then raise exception 'Teacher code pool exhausted'; end if;
  for n in 0..jsonb_array_length(p_hashes)-1 loop
    if (p_hashes->>n) !~ '^[a-f0-9]{64}$' then raise exception 'Invalid invitation hash'; end if;
    generated='RANCE-PRIM-'||lpad((seq+n+1)::text,4,'0');
    insert into public.pvs_identites(code_public,role) values(generated,'prof');
    insert into public.pvs_cm2_teacher_invites(code_public,token_hash,created_by) values(generated,p_hashes->>n,p_admin);
    code_public=generated;slot=n;return next;
  end loop;
end $$;

create or replace function public.pvs_cm2_activate_teacher(p_code text,p_invite_hash text,p_secret text)
returns boolean language plpgsql security invoker set search_path=public,pg_temp as $$
begin
  perform 1 from public.pvs_cm2_teacher_invites t where t.code_public=p_code and t.token_hash=p_invite_hash and t.expires_at>now() and t.activated_at is null for update;
  if not found then raise exception 'Invitation invalid or expired' using errcode='42501'; end if;
  update public.pvs_identites set code_secret=p_secret,cree_at=now() where code_public=p_code and role='prof' and code_secret is null;
  if not found then raise exception 'Account already activated' using errcode='42501'; end if;
  update public.pvs_cm2_teacher_invites set activated_at=now() where code_public=p_code;
  return true;
end $$;

create or replace function public.pvs_cm2_reset_student(p_owner text,p_class uuid,p_student text)
returns boolean language plpgsql security invoker set search_path=public,pg_temp as $$
begin
  perform 1 from public.pvs_cm2_classes c join public.pvs_identites i on i.code_public=c.owner where c.id=p_class and c.owner=p_owner and i.role in ('prof','admin') for update of c;
  if not found then raise exception 'Class inaccessible' using errcode='42501'; end if;
  if p_student !~ '^CM2-[A-F0-9]{16}$' or not exists(select 1 from public.pvs_cm2_members m where m.class_id=p_class and m.student=p_student and m.issued_here) then raise exception 'Account not issued by this class' using errcode='42501'; end if;
  update public.pvs_identites set code_secret=null,cree_at=null where code_public=p_student and role='eleve';
  if not found then raise exception 'Pupil account missing' using errcode='42501'; end if;
  delete from public.pvs_sessions where code_public=p_student;
  update public.pvs_cm2_members set approved=false where class_id=p_class and student=p_student;
  return true;
end $$;

revoke all on function public.pvs_cm2_teacher_codes(text,jsonb),public.pvs_cm2_activate_teacher(text,text,text),public.pvs_cm2_reset_student(text,uuid,text) from public,anon,authenticated;
grant execute on function public.pvs_cm2_teacher_codes(text,jsonb),public.pvs_cm2_activate_teacher(text,text,text),public.pvs_cm2_reset_student(text,uuid,text) to service_role;
notify pgrst,'reload schema';
commit;
