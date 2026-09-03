-- Narrow, idempotent hotfix for installations that still have the v1 strict
-- verifier function. This changes only the function definition; it does not
-- update any question, facet, group, blueprint, or generated test row.
begin;

do $patch$
declare
  v_function oid := 'public.apply_strict_mock_facet_verification(text,text,text,text,jsonb,jsonb)'::regprocedure::oid;
  v_definition text;
begin
  select pg_get_functiondef(v_function) into v_definition;

  v_definition := replace(
    v_definition,
    'ssc-chsl-tier1-strict-v1',
    'ssc-chsl-tier1-strict-v2'
  );
  v_definition := replace(
    v_definition,
    'f.section_key = ''english'' and c.bucket_key <> ''atomic_comprehension''',
    'f.section_key = ''english'''
  );

  if position('ssc-chsl-tier1-strict-v2' in v_definition) = 0
     or position(
       'f.section_key = ''english'' and c.bucket_key <> ''atomic_comprehension'''
       in v_definition
     ) > 0 then
    raise exception 'strict_mock_atomic_gate_v2_patch_failed';
  end if;

  execute v_definition;
end
$patch$;

revoke all on function public.apply_strict_mock_facet_verification(text,text,text,text,jsonb,jsonb)
  from public, anon, authenticated;
grant execute on function public.apply_strict_mock_facet_verification(text,text,text,text,jsonb,jsonb)
  to service_role;

commit;

-- Expected result: v2_accepted = true and old_atomic_exclusion_present = false.
select
  position(
    'ssc-chsl-tier1-strict-v2'
    in pg_get_functiondef(
      'public.apply_strict_mock_facet_verification(text,text,text,text,jsonb,jsonb)'::regprocedure
    )
  ) > 0 as v2_accepted,
  position(
    'f.section_key = ''english'' and c.bucket_key <> ''atomic_comprehension'''
    in pg_get_functiondef(
      'public.apply_strict_mock_facet_verification(text,text,text,text,jsonb,jsonb)'::regprocedure
    )
  ) > 0 as old_atomic_exclusion_present;
