-- Member blocks (Phase 7). A member hides another member's posts and replies
-- from their own view. Blocks never affect what others see, and never
-- substitute for reporting genuinely unsafe content.

create table if not exists public.member_blocks (
  blocker_membership_id uuid not null references public.memberships (id) on delete cascade,
  blocked_membership_id uuid not null references public.memberships (id) on delete cascade,
  community_id text not null references public.communities (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_membership_id, blocked_membership_id),
  check (blocker_membership_id <> blocked_membership_id)
);
create index if not exists member_blocks_blocker_idx on public.member_blocks (blocker_membership_id);

alter table public.member_blocks enable row level security;

create policy "blocks_owner_read" on public.member_blocks for select using (exists (
  select 1 from public.memberships m
  where m.id = blocker_membership_id and m.user_id = auth.uid()
));
create policy "blocks_owner_insert" on public.member_blocks for insert with check (exists (
  select 1 from public.memberships m
  where m.id = blocker_membership_id and m.user_id = auth.uid() and m.status = 'active'
));
create policy "blocks_owner_delete" on public.member_blocks for delete using (exists (
  select 1 from public.memberships m
  where m.id = blocker_membership_id and m.user_id = auth.uid()
));
