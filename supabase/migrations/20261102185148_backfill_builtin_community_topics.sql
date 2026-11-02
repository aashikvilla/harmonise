-- Fill in the support topics for the three built-in circles added before the
-- topics column existed. The helper-provisioning trigger refreshes their
-- community-scoped context. User-created communities are intentionally untouched.

update public.communities
set topics = case id
  when 'rebuilding' then array['separation', 'co-parenting', 'identity change', 'starting over']::text[]
  when 'legal-clarity' then array['separation', 'legal questions', 'practical planning']::text[]
  when 'steady-ground' then array['uncertainty', 'grief', 'loneliness', 'family pressure']::text[]
end
where id in ('rebuilding', 'legal-clarity', 'steady-ground')
  and launch_status = 'approved'
  and coalesce(cardinality(topics), 0) = 0;
