-- Human-reviewed community scope changes proposed from moderator-selected text.
-- Submitted excerpts are not stored; only their length is kept for audit metadata.

alter table public.community_moderator_agents
  add column if not exists scope_version integer not null default 1
    check (scope_version > 0),
  add column if not exists scope_package jsonb not null default '{"includedTopics": [], "adjacentTopics": [], "outOfScopeTopics": [], "norms": [], "welcomeMessage": "", "starterPrompts": []}'::jsonb
    check (jsonb_typeof(scope_package) = 'object'),
  add column if not exists scope_updated_by uuid references public.profiles (id) on delete set null,
  add column if not exists scope_updated_at timestamptz not null default now(),
  add column if not exists scope_source text not null default 'legacy'
    check (scope_source in ('legacy', 'host-reviewed-proposal', 'moderator-approved-change', 'moderator-rollback'));

update public.community_moderator_agents a
  set scope_package = jsonb_build_object(
        'includedTopics', to_jsonb(coalesce(c.topics, '{}'::text[])),
        'adjacentTopics', '[]'::jsonb,
        'outOfScopeTopics', '[]'::jsonb,
        'norms', '[]'::jsonb,
        'welcomeMessage', '',
        'starterPrompts', '[]'::jsonb
      ),
      community_context = coalesce(a.community_context, '{}'::jsonb) || jsonb_build_object(
        'scope', jsonb_build_object(
          'includedTopics', to_jsonb(coalesce(c.topics, '{}'::text[])),
          'adjacentTopics', '[]'::jsonb,
          'outOfScopeTopics', '[]'::jsonb,
          'norms', '[]'::jsonb,
          'welcomeMessage', '',
          'starterPrompts', '[]'::jsonb
        )
      )
  from public.communities c
  where c.id = a.community_id;

-- Preserve the legacy creation RPC for older callers, while allowing the current
-- proposal form to atomically save a host-reviewed scope draft with the pending row.
create or replace function public.create_pending_community_with_scope(
  p_id text,
  p_name text,
  p_description text,
  p_topics text[],
  p_owner_id uuid,
  p_scope_package jsonb
) returns setof public.communities
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  created public.communities;
  normalized_scope jsonb;
  scope_item jsonb;
begin
  if p_scope_package is null or jsonb_typeof(p_scope_package) is distinct from 'object'
    or jsonb_typeof(p_scope_package->'includedTopics') is distinct from 'array'
    or jsonb_typeof(p_scope_package->'adjacentTopics') is distinct from 'array'
    or jsonb_typeof(p_scope_package->'outOfScopeTopics') is distinct from 'array'
    or jsonb_typeof(p_scope_package->'norms') is distinct from 'array'
    or jsonb_typeof(p_scope_package->'starterPrompts') is distinct from 'array'
    or jsonb_typeof(p_scope_package->'welcomeMessage') is distinct from 'string'
  then
    raise exception 'invalid scope package' using errcode = '22023';
  end if;

  select jsonb_build_object(
    'includedTopics', p_scope_package->'includedTopics',
    'adjacentTopics', p_scope_package->'adjacentTopics',
    'outOfScopeTopics', p_scope_package->'outOfScopeTopics',
    'norms', p_scope_package->'norms',
    'welcomeMessage', p_scope_package->'welcomeMessage',
    'starterPrompts', p_scope_package->'starterPrompts'
  ) into normalized_scope;

  if jsonb_array_length(normalized_scope->'includedTopics') > 8
    or jsonb_array_length(normalized_scope->'adjacentTopics') > 8
    or jsonb_array_length(normalized_scope->'outOfScopeTopics') > 8
    or jsonb_array_length(normalized_scope->'norms') > 8
    or jsonb_array_length(normalized_scope->'starterPrompts') > 5
    or char_length(normalized_scope->>'welcomeMessage') > 500
  then
    raise exception 'scope package exceeds limits' using errcode = '22023';
  end if;

  for scope_item in select value from jsonb_array_elements(
    (normalized_scope->'includedTopics') || (normalized_scope->'adjacentTopics') || (normalized_scope->'outOfScopeTopics') || (normalized_scope->'norms') || (normalized_scope->'starterPrompts')
  )
  loop
    if jsonb_typeof(scope_item) <> 'string' or char_length(scope_item #>> '{}') not between 2 and 180 then
      raise exception 'invalid scope package item' using errcode = '22023';
    end if;
  end loop;

  if char_length(normalized_scope->>'welcomeMessage') > 500 then
    raise exception 'welcome message too long' using errcode = '22023';
  end if;

  select * into created from public.create_pending_community(p_id, p_name, p_description, p_topics, p_owner_id);
  update public.community_moderator_agents
    set scope_package = normalized_scope,
        community_context = coalesce(community_context, '{}'::jsonb) || jsonb_build_object('scope', normalized_scope),
        scope_updated_by = p_owner_id,
        scope_updated_at = now(),
        scope_source = 'host-reviewed-proposal'
    where community_id = created.id;
  return next created;
end;
$$;

revoke all on function public.create_pending_community_with_scope(text, text, text, text[], uuid, jsonb) from public, anon, authenticated;
grant execute on function public.create_pending_community_with_scope(text, text, text, text[], uuid, jsonb) to service_role;

create table if not exists public.community_scope_changes (
  id uuid primary key default gen_random_uuid(),
  community_id text not null references public.communities (id) on delete cascade,
  proposed_by uuid references public.profiles (id) on delete set null,
  reviewed_by uuid references public.profiles (id) on delete set null,
  recommendation_kind text not null check (recommendation_kind in ('clarify', 'expand', 'split')),
  risk text not null check (risk in ('low', 'moderate', 'high')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'superseded')),
  base_scope_version integer not null check (base_scope_version > 0),
  prior_scope jsonb not null check (jsonb_typeof(prior_scope) = 'object'),
  source_excerpt_length integer not null check (source_excerpt_length between 40 and 1200),
  recommendation jsonb not null check (jsonb_typeof(recommendation) = 'object'),
  rationale text not null check (char_length(rationale) between 1 and 600),
  model text not null check (char_length(model) between 1 and 64),
  provider_latency_ms integer check (provider_latency_ms is null or provider_latency_ms >= 0),
  reviewer_rationale text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  applied_at timestamptz,
  rolled_back_by uuid references public.profiles (id) on delete set null,
  rolled_back_at timestamptz,
  rollback_rationale text
);

create index if not exists community_scope_changes_queue_idx
  on public.community_scope_changes (community_id, status, created_at desc);

alter table public.community_scope_changes enable row level security;
revoke all on table public.community_scope_changes from public, anon, authenticated;
grant all on table public.community_scope_changes to service_role;

-- This function is callable only by the server's service role. The route verifies
-- the caller's current moderator membership before invoking it. Keeping the
-- community mutation and proposal decision in one transaction avoids partial scope updates.
create or replace function public.review_community_scope_change(
  p_change_id uuid,
  p_community_id text,
  p_reviewer_id uuid,
  p_decision text,
  p_rationale text
) returns setof public.community_scope_changes
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  change_row public.community_scope_changes;
  agent_row public.community_moderator_agents;
  current_community public.communities;
  proposed_description text;
  proposed_topics text[];
  proposed_scope jsonb;
begin
  if p_decision not in ('approved', 'rejected')
    or char_length(trim(coalesce(p_rationale, ''))) not between 1 and 1000
  then
    raise exception 'invalid review input' using errcode = '22023';
  end if;

  select * into change_row
    from public.community_scope_changes
    where id = p_change_id and community_id = p_community_id
    for update;
  if not found then
    raise exception 'scope proposal not found' using errcode = 'P0002';
  end if;
  if change_row.status <> 'pending' then
    raise exception 'scope proposal already reviewed' using errcode = '23505';
  end if;

  if p_decision = 'approved' and change_row.recommendation_kind <> 'split' then
    select * into agent_row
      from public.community_moderator_agents
      where community_id = change_row.community_id
      for update;
    if not found or agent_row.scope_version <> change_row.base_scope_version then
      raise exception 'community scope changed since this proposal was created' using errcode = '40001';
    end if;

    select * into current_community
      from public.communities
      where id = change_row.community_id and launch_status = 'approved'
      for update;
    if not found then
      raise exception 'community is not approved' using errcode = '23514';
    end if;

    proposed_description := change_row.recommendation->>'proposedDescription';
    proposed_scope := change_row.recommendation->'proposedScopePackage';
    if proposed_scope is null or jsonb_typeof(proposed_scope) is distinct from 'object'
      or jsonb_typeof(proposed_scope->'includedTopics') is distinct from 'array'
      or jsonb_typeof(proposed_scope->'adjacentTopics') is distinct from 'array'
      or jsonb_typeof(proposed_scope->'outOfScopeTopics') is distinct from 'array'
      or jsonb_typeof(proposed_scope->'norms') is distinct from 'array'
      or jsonb_typeof(proposed_scope->'starterPrompts') is distinct from 'array'
      or jsonb_typeof(proposed_scope->'welcomeMessage') is distinct from 'string'
      or jsonb_array_length(proposed_scope->'includedTopics') > 8
      or jsonb_array_length(proposed_scope->'adjacentTopics') > 8
      or jsonb_array_length(proposed_scope->'outOfScopeTopics') > 8
      or jsonb_array_length(proposed_scope->'norms') > 8
      or jsonb_array_length(proposed_scope->'starterPrompts') > 5
      or char_length(proposed_scope->>'welcomeMessage') > 500
    then
      raise exception 'invalid proposed scope package' using errcode = '22023';
    end if;
    select coalesce(array_agg(value), '{}'::text[]) into proposed_topics
      from jsonb_array_elements_text(change_row.recommendation->'proposedTopics') as topic(value);
    if char_length(coalesce(proposed_description, '')) not between 20 and 500
      or cardinality(proposed_topics) > 8
    then
      raise exception 'invalid proposed scope' using errcode = '22023';
    end if;

    update public.communities
      set description = proposed_description,
          topics = proposed_topics
      where id = change_row.community_id;
    update public.community_moderator_agents
      set community_context = coalesce(community_context, '{}'::jsonb)
            || jsonb_build_object('name', current_community.name, 'description', proposed_description, 'topics', to_jsonb(proposed_topics), 'scope', proposed_scope),
          scope_package = proposed_scope,
          scope_version = scope_version + 1,
          scope_updated_by = p_reviewer_id,
          scope_updated_at = now(),
          scope_source = 'moderator-approved-change'
      where community_id = change_row.community_id;
  end if;

  update public.community_scope_changes
    set status = p_decision,
        reviewed_by = p_reviewer_id,
        reviewer_rationale = trim(p_rationale),
        reviewed_at = now(),
        applied_at = case when p_decision = 'approved' and recommendation_kind <> 'split' then now() else null end
    where id = p_change_id
    returning * into change_row;
  return next change_row;
end;
$$;

revoke all on function public.review_community_scope_change(uuid, text, uuid, text, text) from public, anon, authenticated;
grant execute on function public.review_community_scope_change(uuid, text, uuid, text, text) to service_role;

create or replace function public.rollback_community_scope_change(
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
  agent_row public.community_moderator_agents;
  prior_description text;
  prior_topics text[];
  prior_scope_package jsonb;
begin
  if char_length(trim(coalesce(p_rationale, ''))) not between 3 and 1000 then
    raise exception 'rollback rationale required' using errcode = '22023';
  end if;
  select * into change_row
    from public.community_scope_changes
    where id = p_change_id and community_id = p_community_id
    for update;
  if not found then
    raise exception 'scope proposal not found' using errcode = 'P0002';
  end if;
  if change_row.status <> 'approved' or change_row.applied_at is null or change_row.rolled_back_at is not null then
    raise exception 'scope proposal cannot be rolled back' using errcode = '23505';
  end if;

  select * into agent_row
    from public.community_moderator_agents
    where community_id = p_community_id
    for update;
  if not found or agent_row.scope_version <> change_row.base_scope_version + 1 then
    raise exception 'a later scope change is already active' using errcode = '40001';
  end if;

  prior_description := change_row.prior_scope->>'description';
  prior_scope_package := change_row.prior_scope->'scopePackage';
  select coalesce(array_agg(value), '{}'::text[]) into prior_topics
    from jsonb_array_elements_text(change_row.prior_scope->'topics') as topic(value);
  if char_length(coalesce(prior_description, '')) not between 20 and 500
    or cardinality(prior_topics) > 8
    or prior_scope_package is null
    or jsonb_typeof(prior_scope_package) <> 'object'
  then
    raise exception 'stored prior scope is invalid' using errcode = '22023';
  end if;

  update public.communities
    set description = prior_description,
        topics = prior_topics
    where id = p_community_id and launch_status = 'approved';
  if not found then
    raise exception 'community is not approved' using errcode = '23514';
  end if;
  update public.community_moderator_agents
    set community_context = coalesce(community_context, '{}'::jsonb)
          || jsonb_build_object('name', change_row.prior_scope->>'name', 'description', prior_description, 'topics', to_jsonb(prior_topics), 'scope', prior_scope_package),
        scope_package = prior_scope_package,
        scope_version = scope_version + 1,
        scope_updated_by = p_reviewer_id,
        scope_updated_at = now(),
        scope_source = 'moderator-rollback'
    where community_id = p_community_id;
  update public.community_scope_changes
    set rolled_back_by = p_reviewer_id,
        rolled_back_at = now(),
        rollback_rationale = trim(p_rationale)
    where id = p_change_id
    returning * into change_row;
  return next change_row;
end;
$$;

revoke all on function public.rollback_community_scope_change(uuid, text, uuid, text) from public, anon, authenticated;
grant execute on function public.rollback_community_scope_change(uuid, text, uuid, text) to service_role;
