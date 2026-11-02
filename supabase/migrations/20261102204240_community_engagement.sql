-- Community engagement: post intent, reactions, featuring consent, archive state,
-- promotion requests. App code degrades gracefully until this is applied live
-- (run `supabase db push` with a linked project).

-- Post intent: share vs ask-a-question.
alter table public.posts
  add column if not exists kind text not null default 'share'
  check (kind in ('share', 'ask'));
create index if not exists posts_kind_idx on public.posts (community_id, kind, created_at desc);

-- Helpfulness reactions ("this helped me"). No downvotes by design.
create table if not exists public.post_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  membership_id uuid not null references public.memberships (id) on delete cascade,
  kind text not null default 'helpful' check (kind = 'helpful'),
  created_at timestamptz not null default now(),
  unique (post_id, membership_id)
);
create index if not exists post_reactions_post_idx on public.post_reactions (post_id);

alter table public.post_reactions enable row level security;
create policy "reactions_member_read" on public.post_reactions for select using (exists (
  select 1 from public.posts p
  join public.communities c on c.id = p.community_id
  where p.id = post_id and (
    c.visibility = 'public' or exists (
      select 1 from public.memberships m
      where m.community_id = c.id and m.user_id = auth.uid() and m.status = 'active'
    )
  )
));
create policy "reactions_member_insert" on public.post_reactions for insert with check (exists (
  select 1 from public.memberships m
  where m.id = membership_id and m.user_id = auth.uid() and m.status = 'active'
));
create policy "reactions_author_delete" on public.post_reactions for delete using (exists (
  select 1 from public.memberships m
  where m.id = membership_id and m.user_id = auth.uid()
));

-- Featuring consent: opt-in to surface a post as a shared journey.
alter table public.consent_records drop constraint if exists consent_records_action_check;
alter table public.consent_records
  add constraint consent_records_action_check check (action in ('post', 'reply', 'question', 'feature'));
alter table public.consent_records add column if not exists post_id uuid references public.posts (id) on delete cascade;
create index if not exists consent_records_feature_idx on public.consent_records (audience_community_id, action, post_id);

-- Archive state for dormant communities (read-only, never silently deleted).
alter table public.communities drop constraint if exists communities_launch_status_check;
alter table public.communities
  add constraint communities_launch_status_check check (launch_status in ('pending_review', 'approved', 'rejected', 'archived'));

-- Volunteer/role promotion requests: members request, moderators decide.
create table if not exists public.promotion_requests (
  id uuid primary key default gen_random_uuid(),
  community_id text not null references public.communities (id) on delete cascade,
  membership_id uuid not null references public.memberships (id) on delete cascade,
  requested_role text not null check (requested_role in ('volunteer', 'verified-supporter')),
  note text not null default '' check (char_length(note) <= 1000),
  status text not null default 'open' check (status in ('open', 'approved', 'declined')),
  reviewer_rationale text not null default '',
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  unique (community_id, membership_id)
);
create index if not exists promotion_requests_community_idx on public.promotion_requests (community_id, status, created_at);

alter table public.promotion_requests enable row level security;
create policy "promotions_owner_read" on public.promotion_requests for select using (exists (
  select 1 from public.memberships m
  where m.id = membership_id and m.user_id = auth.uid()
));
create policy "promotions_owner_insert" on public.promotion_requests for insert with check (exists (
  select 1 from public.memberships m
  where m.id = membership_id and m.user_id = auth.uid() and m.status = 'active'
));
create policy "promotions_moderator_all" on public.promotion_requests for all using (exists (
  select 1 from public.memberships m
  where m.community_id = promotion_requests.community_id and m.user_id = auth.uid()
    and m.role = 'moderator' and m.status = 'active'
));
