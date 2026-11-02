-- Approving a split creates one private, pending launch proposal. It never adds
-- memberships, publishes the community, or bypasses the separate launch review.

alter table public.community_scope_changes
  add column if not exists split_community_id text references public.communities (id);

create unique index if not exists community_scope_changes_split_community_uidx
  on public.community_scope_changes (split_community_id)
  where split_community_id is not null;

alter table public.communities
  add column if not exists source_scope_change_id uuid references public.community_scope_changes (id);

create unique index if not exists communities_source_scope_change_uidx
  on public.communities (source_scope_change_id)
  where source_scope_change_id is not null;

create or replace function public.approve_community_scope_split(
  p_change_id uuid,
  p_community_id text,
  p_reviewer_id uuid,
  p_rationale text
) returns setof public.community_scope_changes
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  change_row public.community_scope_changes;
  source_community public.communities;
  source_agent public.community_moderator_agents;
  created_community public.communities;
  recommendation jsonb;
  proposed_scope_package jsonb;
  topic_item jsonb;
  topic_values text[];
  proposed_name text;
  proposed_description text;
  slug_base text;
  new_community_id text;
begin
  if char_length(trim(coalesce(p_rationale, ''))) not between 3 and 1000 then
    raise exception 'review rationale required' using errcode = '22023';
  end if;

  select * into change_row
    from public.community_scope_changes
    where id = p_change_id and community_id = p_community_id
    for update;
  if not found then
    raise exception 'scope proposal not found' using errcode = 'P0002';
  end if;
  if change_row.recommendation_kind <> 'split' then
    raise exception 'proposal is not a split' using errcode = '22023';
  end if;

  -- A committed retry returns the original proposal. The unique source id also
  -- protects against duplicate creation if a caller retries after a timeout.
  if change_row.status = 'approved' and change_row.split_community_id is not null then
    return next change_row;
    return;
  end if;
  if change_row.status <> 'pending' then
    raise exception 'scope proposal already reviewed' using errcode = '23505';
  end if;

  select * into source_agent
    from public.community_moderator_agents
    where community_id = p_community_id
    for update;
  if not found or source_agent.scope_version <> change_row.base_scope_version then
    raise exception 'community scope changed since this proposal was created' using errcode = '40001';
  end if;
  select * into source_community
    from public.communities
    where id = p_community_id and launch_status = 'approved'
    for update;
  if not found then
    raise exception 'community is not approved' using errcode = '23514';
  end if;

  recommendation := change_row.recommendation;
  proposed_name := trim(coalesce(recommendation->>'newCommunityName', ''));
  proposed_description := trim(coalesce(recommendation->>'newCommunityDescription', ''));
  proposed_scope_package := recommendation->'newCommunityScopePackage';
  if char_length(proposed_name) not between 3 and 80
    or char_length(proposed_description) not between 20 and 500
    or jsonb_typeof(recommendation->'newCommunityTopics') is distinct from 'array'
    or jsonb_array_length(recommendation->'newCommunityTopics') not between 1 and 8
    or proposed_scope_package is null
    or jsonb_typeof(proposed_scope_package) is distinct from 'object'
    or jsonb_typeof(proposed_scope_package->'includedTopics') is distinct from 'array'
    or jsonb_typeof(proposed_scope_package->'adjacentTopics') is distinct from 'array'
    or jsonb_typeof(proposed_scope_package->'outOfScopeTopics') is distinct from 'array'
    or jsonb_typeof(proposed_scope_package->'norms') is distinct from 'array'
    or jsonb_typeof(proposed_scope_package->'starterPrompts') is distinct from 'array'
    or jsonb_typeof(proposed_scope_package->'welcomeMessage') is distinct from 'string'
    or jsonb_array_length(proposed_scope_package->'includedTopics') not between 1 and 8
    or jsonb_array_length(proposed_scope_package->'adjacentTopics') > 8
    or jsonb_array_length(proposed_scope_package->'outOfScopeTopics') > 8
    or jsonb_array_length(proposed_scope_package->'norms') > 8
    or jsonb_array_length(proposed_scope_package->'starterPrompts') > 5
    or char_length(proposed_scope_package->>'welcomeMessage') > 500
  then
    raise exception 'invalid split proposal draft' using errcode = '22023';
  end if;

  for topic_item in
    select value from jsonb_array_elements(recommendation->'newCommunityTopics')
    union all select value from jsonb_array_elements(proposed_scope_package->'includedTopics')
    union all select value from jsonb_array_elements(proposed_scope_package->'adjacentTopics')
    union all select value from jsonb_array_elements(proposed_scope_package->'outOfScopeTopics')
    union all select value from jsonb_array_elements(proposed_scope_package->'norms')
    union all select value from jsonb_array_elements(proposed_scope_package->'starterPrompts')
  loop
    if jsonb_typeof(topic_item) is distinct from 'string' then
      raise exception 'invalid split proposal item' using errcode = '22023';
    end if;
    if char_length(trim(topic_item #>> '{}')) not between 2 and 180 then
      raise exception 'invalid split proposal item' using errcode = '22023';
    end if;
  end loop;

  select array_agg(value #>> '{}') into topic_values
    from jsonb_array_elements(recommendation->'newCommunityTopics') as items(value);
  if exists (
    select 1 from jsonb_array_elements_text(recommendation->'newCommunityTopics') as item(value)
    group by lower(trim(value)) having count(*) > 1
  ) then
    raise exception 'duplicate split topics' using errcode = '22023';
  end if;
  if exists (
    select 1 from jsonb_array_elements_text(recommendation->'newCommunityTopics') as item(value)
    where char_length(trim(value)) > 36
  ) then
    raise exception 'split topic too long' using errcode = '22023';
  end if;

  slug_base := trim(both '-' from left(regexp_replace(lower(proposed_name), '[^a-z0-9]+', '-', 'g'), 34));
  if slug_base = '' then slug_base := 'community'; end if;
  new_community_id := slug_base || '-' || substr(replace(p_change_id::text, '-', ''), 1, 12);

  insert into public.communities (
    id, name, description, topics, visibility, launch_status, created_by, source_scope_change_id
  ) values (
    new_community_id, proposed_name, proposed_description, topic_values,
    'member', 'pending_review', p_reviewer_id, p_change_id
  ) returning * into created_community;

  -- The community trigger provisioned its helper in the same transaction.
  update public.community_moderator_agents
    set scope_package = proposed_scope_package,
        community_context = coalesce(community_context, '{}'::jsonb) || jsonb_build_object(
          'name', proposed_name,
          'description', proposed_description,
          'topics', to_jsonb(topic_values),
          'scope', proposed_scope_package
        ),
        scope_updated_by = p_reviewer_id,
        scope_updated_at = now(),
        scope_source = 'moderator-approved-change'
    where community_id = created_community.id;
  if not found then
    raise exception 'community helper was not provisioned' using errcode = '23514';
  end if;

  update public.community_scope_changes
    set status = 'approved',
        reviewed_by = p_reviewer_id,
        reviewer_rationale = trim(p_rationale),
        reviewed_at = now(),
        applied_at = null,
        split_community_id = created_community.id
    where id = p_change_id
    returning * into change_row;
  return next change_row;
end;
$$;

revoke all on function public.approve_community_scope_split(uuid, text, uuid, text) from public, anon, authenticated;
grant execute on function public.approve_community_scope_split(uuid, text, uuid, text) to service_role;
