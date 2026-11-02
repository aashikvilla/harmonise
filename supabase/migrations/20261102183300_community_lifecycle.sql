-- Community creation and the disclosed, advisory AI helper for each community.
-- Existing seeded communities stay joinable; new communities require staffed review.

alter table public.communities
  add column if not exists topics text[] not null default '{}',
  add column if not exists launch_status text not null default 'approved',
  add column if not exists created_by uuid references public.profiles (id) on delete set null,
  add column if not exists reviewed_by uuid references public.profiles (id) on delete set null,
  add column if not exists reviewed_at timestamptz,
  add column if not exists coverage_confirmed_at timestamptz;

alter table public.communities
  drop constraint if exists communities_launch_status_check;
alter table public.communities
  add constraint communities_launch_status_check
    check (launch_status in ('pending_review', 'approved', 'rejected'));
alter table public.communities alter column launch_status set default 'pending_review';
create index if not exists communities_launch_status_idx on public.communities (launch_status, name);
create index if not exists communities_created_by_idx on public.communities (created_by, launch_status);

drop policy if exists "communities_public_read" on public.communities;
create policy "communities_public_read" on public.communities for select
  using (
    (launch_status = 'approved' and visibility = 'public')
    or exists (
      select 1 from public.memberships m
      where m.community_id = communities.id and m.user_id = auth.uid() and m.status = 'active'
        and (communities.launch_status = 'approved' or communities.created_by = auth.uid())
    )
  );

create table if not exists public.community_moderator_agents (
  id uuid primary key default gen_random_uuid(),
  community_id text not null unique references public.communities (id) on delete cascade,
  display_name text not null default 'harmonize. community helper (AI)',
  status text not null default 'active' check (status in ('active', 'inactive')),
  community_context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.community_moderator_agents enable row level security;
-- Agent configuration and identifiers are only read by server-side service-role code.
revoke all on table public.community_moderator_agents from public, anon, authenticated;
grant all on table public.community_moderator_agents to service_role;

create or replace function public.provision_community_moderator_agent()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.community_moderator_agents (community_id, display_name, community_context)
  values (
    new.id,
    'harmonize. ' || left(new.name, 60) || ' AI community helper',
    jsonb_build_object('name', new.name, 'description', new.description, 'topics', new.topics)
  )
  on conflict (community_id) do update
    set display_name = excluded.display_name, community_context = excluded.community_context;
  return new;
end;
$$;

drop trigger if exists communities_provision_moderator_agent on public.communities;
create trigger communities_provision_moderator_agent
  after insert or update of name, description, topics on public.communities
  for each row execute function public.provision_community_moderator_agent();

-- Backfill one helper for every existing community without changing its launch status.
insert into public.community_moderator_agents (community_id, display_name, community_context)
select c.id, 'harmonize. ' || left(c.name, 60) || ' AI community helper',
  jsonb_build_object('name', c.name, 'description', c.description, 'topics', c.topics)
from public.communities c
on conflict (community_id) do nothing;

-- Called only by trusted server routes using the Supabase service-role key.
-- Provisioning and the owner row are committed with the community as one transaction.
create or replace function public.create_pending_community(
  p_id text,
  p_name text,
  p_description text,
  p_topics text[],
  p_owner_id uuid
) returns setof public.communities
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  created public.communities;
begin
  if p_id !~ '^[a-z0-9-]{3,48}$'
    or char_length(p_name) not between 3 and 80
    or char_length(p_description) not between 20 and 500
    or coalesce(cardinality(p_topics), 0) > 8
  then
    raise exception 'invalid community input' using errcode = '22023';
  end if;

  insert into public.communities (id, name, description, topics, visibility, launch_status, created_by)
  values (p_id, p_name, p_description, coalesce(p_topics, '{}'), 'member', 'pending_review', p_owner_id)
  returning * into created;

  insert into public.memberships (community_id, user_id, alias, role, status)
  values (created.id, p_owner_id, 'Community host', 'member', 'active');

  return next created;
  return;
end;
$$;

create or replace function public.review_community_launch(
  p_community_id text,
  p_reviewer_id uuid,
  p_coverage_confirmed boolean
) returns setof public.communities
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  reviewed public.communities;
begin
  if not coalesce(p_coverage_confirmed, false) then
    raise exception 'human coverage must be confirmed' using errcode = '22023';
  end if;

  update public.communities
  set launch_status = 'approved', reviewed_by = p_reviewer_id, reviewed_at = now(), coverage_confirmed_at = now()
  where id = p_community_id and launch_status = 'pending_review'
  returning * into reviewed;

  if not found then
    raise exception 'pending community not found' using errcode = 'P0002';
  end if;

  insert into public.memberships (community_id, user_id, alias, role, status)
  values (reviewed.id, p_reviewer_id, 'Community moderator', 'moderator', 'active')
  on conflict (community_id, user_id) do update
    set role = 'moderator', status = 'active';

  return next reviewed;
  return;
end;
$$;

revoke all on function public.provision_community_moderator_agent() from public, anon, authenticated;
revoke all on function public.create_pending_community(text, text, text, text[], uuid) from public, anon, authenticated;
revoke all on function public.review_community_launch(text, uuid, boolean) from public, anon, authenticated;
grant execute on function public.create_pending_community(text, text, text, text[], uuid) to service_role;
grant execute on function public.review_community_launch(text, uuid, boolean) to service_role;
