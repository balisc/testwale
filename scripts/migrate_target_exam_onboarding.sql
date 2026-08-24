-- QuestionWale: durable target-exam onboarding rollout.
-- Run after public.users, public.user_profiles, and public.exams exist.
-- Safe to rerun: only rows present during the first run are marked legacy/exempt.

begin;

alter table public.user_profiles
  add column if not exists target_exam_id uuid,
  add column if not exists exam_onboarding_required boolean,
  add column if not exists exam_onboarding_completed_at timestamptz;

-- The first run happens before the new default is installed. This creates rows
-- for every pre-rollout account, including old accounts that never opened profile.
insert into public.user_profiles (user_id)
select u.id
from public.users u
on conflict (user_id) do nothing;

-- Only first-run rows have NULL here. On later runs, genuinely new profiles have
-- the TRUE default and are never converted into legacy users.
update public.user_profiles
set exam_onboarding_required = false
where exam_onboarding_required is null;

alter table public.user_profiles
  alter column exam_onboarding_required set default true,
  alter column exam_onboarding_required set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_profiles_target_exam_id_fkey'
      and conrelid = 'public.user_profiles'::regclass
  ) then
    alter table public.user_profiles
      add constraint user_profiles_target_exam_id_fkey
      foreign key (target_exam_id)
      references public.exams(id)
      on delete restrict;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_profiles_exam_onboarding_complete_check'
      and conrelid = 'public.user_profiles'::regclass
  ) then
    alter table public.user_profiles
      add constraint user_profiles_exam_onboarding_complete_check
      check (
        exam_onboarding_completed_at is null
        or (target_exam_id is not null and exam_date is not null)
      );
  end if;
end;
$$;

create index if not exists idx_user_profiles_target_exam_id
  on public.user_profiles (target_exam_id)
  where target_exam_id is not null;

create or replace function public.ensure_exam_onboarding_profile()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.user_profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists users_create_exam_onboarding_profile on public.users;
create trigger users_create_exam_onboarding_profile
after insert on public.users
for each row execute function public.ensure_exam_onboarding_profile();

create or replace function public.complete_exam_onboarding(
  p_user_id uuid,
  p_exam_id uuid,
  p_exam_date date
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_exam_title text;
begin
  if p_user_id is null then
    raise exception 'unauthenticated' using errcode = '42501';
  end if;

  if p_exam_date is null
     or p_exam_date < (now() at time zone 'Asia/Kolkata')::date then
    raise exception 'invalid_exam_date' using errcode = '22007';
  end if;

  select coalesce(nullif(e.title->>'en', ''), nullif(e.title->>'hi', ''), e.code)
  into v_exam_title
  from public.exams e
  where e.id = p_exam_id
    and e.is_active is true;

  if not found then
    raise exception 'invalid_or_inactive_exam' using errcode = '22023';
  end if;

  insert into public.user_profiles (
    user_id,
    target_exam_id,
    target_exam,
    exam_date,
    exam_onboarding_completed_at,
    updated_at
  ) values (
    p_user_id,
    p_exam_id,
    v_exam_title,
    p_exam_date,
    now(),
    now()
  )
  on conflict (user_id) do update
  set target_exam_id = excluded.target_exam_id,
      target_exam = excluded.target_exam,
      exam_date = excluded.exam_date,
      exam_onboarding_completed_at = excluded.exam_onboarding_completed_at,
      updated_at = excluded.updated_at;
end;
$$;

revoke all on function public.ensure_exam_onboarding_profile() from public;
revoke all on function public.complete_exam_onboarding(uuid, uuid, date) from public;
grant execute on function public.complete_exam_onboarding(uuid, uuid, date) to service_role;

commit;
