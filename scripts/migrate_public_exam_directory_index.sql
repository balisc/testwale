-- Public exam directory ordering support.
-- Additive and idempotent; review in staging before applying to production.

begin;

create index if not exists idx_exam_profiles_public_display_order
  on public.exam_profiles (sort_order asc nulls last, code asc)
  where is_active is true;

commit;

-- Verification:
-- select indexname, indexdef
-- from pg_indexes
-- where schemaname = 'public'
--   and indexname = 'idx_exam_profiles_public_display_order';
