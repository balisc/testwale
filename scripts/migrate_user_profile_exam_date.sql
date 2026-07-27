-- Add exam_date to user_profiles (run once in Supabase SQL Editor)
alter table public.user_profiles
  add column if not exists exam_date date;

-- Optional: refresh RPC profile JSON (re-run get_user_profile_page section from migrate_user_profile.sql
-- and add 'exam_date', v_profile.exam_date to the profile jsonb_build_object)
