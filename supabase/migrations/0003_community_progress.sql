-- Community activity recognition is derived from visible content rows.
-- Verified role labels are separate and require an explicit moderator review.

create table if not exists public.community_member_verifications (
  membership_id uuid primary key references public.memberships (id) on delete cascade,
  community_id text not null references public.communities (id) on delete cascade,
  role_label text not null check (char_length(role_label) between 2 and 64),
  reviewed_by uuid not null references public.profiles (id) on delete restrict,
  reviewed_at timestamptz not null default now()
);

alter table public.community_member_verifications enable row level security;
-- No client policies: verification writes and reads use the server-only service role.
revoke all on public.community_member_verifications from anon, authenticated;
grant select, insert, update, delete on public.community_member_verifications to service_role;

create or replace function public.community_member_contribution_summary(
  p_community_id text,
  p_user_id uuid
)
returns table (contributions bigint, active_days bigint)
language sql
stable
set search_path = public
as $$
  with active_member as (
    select m.id
    from public.memberships m
    where m.community_id = p_community_id
      and m.user_id = p_user_id
      and m.status = 'active'
    limit 1
  ), eligible as (
    select p.body, p.created_at
    from public.posts p
    join public.memberships author on author.id = p.author_membership_id
    where p.community_id = p_community_id
      and p.status = 'visible'
      and char_length(regexp_replace(p.body, '^[[:space:]]+|[[:space:]]+$', '', 'g')) >= 20
      and author.user_id = p_user_id
      and author.community_id = p_community_id
      and author.status = 'active'
    union all
    select r.body, r.created_at
    from public.post_replies r
    join public.posts p on p.id = r.post_id
    join public.memberships author on author.id = r.author_membership_id
    where p.community_id = p_community_id
      and p.status = 'visible'
      and r.status = 'visible'
      and char_length(regexp_replace(r.body, '^[[:space:]]+|[[:space:]]+$', '', 'g')) >= 20
      and author.user_id = p_user_id
      and author.community_id = p_community_id
      and author.status = 'active'
  ), normalized as (
    select btrim(regexp_replace(lower(body), '[[:space:]]+', ' ', 'g')) as body_key, created_at
    from eligible
  ), unique_contributions as (
    -- Identical normalized text counts once across both posts and replies.
    -- The first visible occurrence determines its active day.
    select body_key, min(created_at) as created_at
    from normalized
    group by body_key
  )
  select count(*)::bigint,
         count(distinct (unique_contributions.created_at at time zone 'UTC')::date)::bigint
  from unique_contributions
  where exists (select 1 from active_member);
$$;

revoke all on function public.community_member_contribution_summary(text, uuid) from public, anon, authenticated;
grant execute on function public.community_member_contribution_summary(text, uuid) to service_role;
