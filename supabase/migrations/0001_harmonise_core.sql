-- Harmonise core schema (Phase 2). Supabase Postgres with row-level security.
-- Server routes use the service-role key; these policies are defense in depth
-- and the contract for any future direct client access. Positive and negative
-- verification cases are listed in docs/DATA_PRIVACY_DESIGN.md section 7.

-- ---------------------------------------------------------------- profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------ private sessions
create table if not exists public.private_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null default 'Untitled conversation',
  status text not null default 'active' check (status in ('active', 'expired', 'deleted')),
  last_active_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '90 days'),
  created_at timestamptz not null default now()
);
create index if not exists private_sessions_user_idx on public.private_sessions (user_id, last_active_at desc);

create table if not exists public.session_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.private_sessions (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  text text not null check (char_length(text) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index if not exists session_messages_session_idx on public.session_messages (session_id, created_at);

-- Tentative model suggestions stay separate from user-confirmed understanding.
create table if not exists public.session_understanding (
  session_id uuid primary key references public.private_sessions (id) on delete cascade,
  suggested_themes text[] not null default '{}',
  confirmed_themes text[] not null default '{}',
  support_need text not null default 'not-sure',
  need_summary text not null default '',
  correction_count integer not null default 0,
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------ communities
create table if not exists public.communities (
  id text primary key check (id ~ '^[a-z0-9-]{3,48}$'),
  name text not null,
  description text not null default '',
  visibility text not null default 'member' check (visibility in ('public', 'member')),
  created_at timestamptz not null default now()
);

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  community_id text not null references public.communities (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  alias text not null check (char_length(alias) between 2 and 40),
  role text not null default 'member' check (role in ('member', 'moderator')),
  status text not null default 'active' check (status in ('active', 'left', 'blocked')),
  created_at timestamptz not null default now(),
  unique (community_id, user_id)
);
create index if not exists memberships_user_idx on public.memberships (user_id, status);
create index if not exists memberships_community_idx on public.memberships (community_id, status);

-- --------------------------------------------------------------- consent
create table if not exists public.consent_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  action text not null check (action in ('post', 'reply', 'question')),
  audience_community_id text not null references public.communities (id) on delete cascade,
  text_sha256 text not null check (text_sha256 ~ '^[0-9a-f]{64}$'),
  consent_version text not null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);
create index if not exists consent_records_user_idx on public.consent_records (user_id, created_at desc);

-- ------------------------------------------------------------------ posts
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  community_id text not null references public.communities (id) on delete cascade,
  author_membership_id uuid not null references public.memberships (id) on delete cascade,
  consent_id uuid references public.consent_records (id) on delete set null,
  body text not null check (char_length(body) between 1 and 4000),
  status text not null default 'visible' check (status in ('visible', 'held', 'removed')),
  created_at timestamptz not null default now()
);
create index if not exists posts_community_idx on public.posts (community_id, created_at desc);

create table if not exists public.post_replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_membership_id uuid not null references public.memberships (id) on delete cascade,
  consent_id uuid references public.consent_records (id) on delete set null,
  body text not null check (char_length(body) between 1 and 2000),
  status text not null default 'visible' check (status in ('visible', 'held', 'removed')),
  created_at timestamptz not null default now()
);
create index if not exists post_replies_post_idx on public.post_replies (post_id, created_at);

-- ---------------------------------------------------------------- reports
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  community_id text not null references public.communities (id) on delete cascade,
  target_post_id uuid references public.posts (id) on delete cascade,
  target_reply_id uuid references public.post_replies (id) on delete cascade,
  reporter_membership_id uuid not null references public.memberships (id) on delete cascade,
  reason text not null check (char_length(reason) between 1 and 1000),
  status text not null default 'open' check (status in ('open', 'decided', 'appealed', 'closed')),
  created_at timestamptz not null default now(),
  check (
    (target_post_id is not null and target_reply_id is null)
    or (target_post_id is null and target_reply_id is not null)
  )
);
create index if not exists reports_community_status_idx on public.reports (community_id, status, created_at desc);

-- ----------------------------------------------------- moderation pipeline
create table if not exists public.moderation_events (
  id uuid primary key default gen_random_uuid(),
  community_id text not null references public.communities (id) on delete cascade,
  report_id uuid references public.reports (id) on delete set null,
  event_type text not null check (event_type in ('report', 'live-flag')),
  payload jsonb not null default '{}'::jsonb,
  idempotency_key text not null unique,
  status text not null default 'queued' check (status in ('queued', 'processing', 'triaged', 'dead')),
  attempts integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists moderation_events_status_idx on public.moderation_events (status, created_at);

create table if not exists public.moderation_decisions (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports (id) on delete cascade,
  reviewer_user_id uuid not null references public.profiles (id) on delete cascade,
  model_concern text,
  model_severity text,
  model_rationale text,
  decision text not null check (decision in ('no-action', 'request-revision', 'remove', 'escalate')),
  rationale text not null default '',
  policy_version text not null,
  created_at timestamptz not null default now()
);
create index if not exists moderation_decisions_report_idx on public.moderation_decisions (report_id, created_at desc);

create table if not exists public.appeals (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid not null references public.moderation_decisions (id) on delete cascade,
  appellant_membership_id uuid not null references public.memberships (id) on delete cascade,
  reason text not null check (char_length(reason) between 1 and 1000),
  status text not null default 'open' check (status in ('open', 'upheld', 'overturned')),
  created_at timestamptz not null default now()
);

-- ================================================================== RLS
alter table public.profiles enable row level security;
alter table public.private_sessions enable row level security;
alter table public.session_messages enable row level security;
alter table public.session_understanding enable row level security;
alter table public.communities enable row level security;
alter table public.memberships enable row level security;
alter table public.consent_records enable row level security;
alter table public.posts enable row level security;
alter table public.post_replies enable row level security;
alter table public.reports enable row level security;
alter table public.moderation_events enable row level security;
alter table public.moderation_decisions enable row level security;
alter table public.appeals enable row level security;

-- Profiles: owners only.
create policy "profiles_owner_read" on public.profiles for select using (auth.uid() = id);
create policy "profiles_owner_insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_owner_update" on public.profiles for update using (auth.uid() = id);

-- Private sessions and their children: owning account only.
create policy "sessions_owner_all" on public.private_sessions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "messages_owner_read" on public.session_messages for select
  using (exists (select 1 from public.private_sessions s where s.id = session_id and s.user_id = auth.uid()));
create policy "messages_owner_insert" on public.session_messages for insert
  with check (exists (select 1 from public.private_sessions s where s.id = session_id and s.user_id = auth.uid()));
create policy "messages_owner_delete" on public.session_messages for delete
  using (exists (select 1 from public.private_sessions s where s.id = session_id and s.user_id = auth.uid()));
create policy "understanding_owner_all" on public.session_understanding for all
  using (exists (select 1 from public.private_sessions s where s.id = session_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.private_sessions s where s.id = session_id and s.user_id = auth.uid()));

-- Communities: public rows readable by anyone; member-only rows by members.
create policy "communities_public_read" on public.communities for select
  using (visibility = 'public' or exists (
    select 1 from public.memberships m
    where m.community_id = id and m.user_id = auth.uid() and m.status = 'active'
  ));

-- Memberships: users manage their own row; moderators read their community.
create policy "memberships_owner_read" on public.memberships for select
  using (user_id = auth.uid() or exists (
    select 1 from public.memberships m
    where m.community_id = memberships.community_id and m.user_id = auth.uid()
      and m.role = 'moderator' and m.status = 'active'
  ));
create policy "memberships_owner_insert" on public.memberships for insert
  with check (user_id = auth.uid());
create policy "memberships_owner_update" on public.memberships for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Consent records: owners only.
create policy "consent_owner_read" on public.consent_records for select using (auth.uid() = user_id);
create policy "consent_owner_insert" on public.consent_records for insert with check (auth.uid() = user_id);
create policy "consent_owner_update" on public.consent_records for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Posts and replies: readable per visibility; writable through own active membership.
create policy "posts_member_read" on public.posts for select using (exists (
  select 1 from public.communities c where c.id = community_id and (
    c.visibility = 'public' or exists (
      select 1 from public.memberships m
      where m.community_id = c.id and m.user_id = auth.uid() and m.status = 'active'
    )
  )
));
create policy "posts_member_insert" on public.posts for insert with check (exists (
  select 1 from public.memberships m
  where m.id = author_membership_id and m.user_id = auth.uid() and m.status = 'active'
));
create policy "posts_author_delete" on public.posts for delete using (exists (
  select 1 from public.memberships m
  where m.id = author_membership_id and m.user_id = auth.uid()
));
create policy "replies_member_read" on public.post_replies for select using (exists (
  select 1 from public.posts p
  join public.communities c on c.id = p.community_id
  where p.id = post_id and (
    c.visibility = 'public' or exists (
      select 1 from public.memberships m
      where m.community_id = c.id and m.user_id = auth.uid() and m.status = 'active'
    )
  )
));
create policy "replies_member_insert" on public.post_replies for insert with check (exists (
  select 1 from public.memberships m
  where m.id = author_membership_id and m.user_id = auth.uid() and m.status = 'active'
));
create policy "replies_author_delete" on public.post_replies for delete using (exists (
  select 1 from public.memberships m
  where m.id = author_membership_id and m.user_id = auth.uid()
));

-- Reports: members file; reporters read their own; moderators read their community.
create policy "reports_member_insert" on public.reports for insert with check (exists (
  select 1 from public.memberships m
  where m.id = reporter_membership_id and m.user_id = auth.uid() and m.status = 'active'
));
create policy "reports_reporter_read" on public.reports for select using (exists (
  select 1 from public.memberships m
  where m.id = reporter_membership_id and m.user_id = auth.uid()
));
create policy "reports_moderator_read" on public.reports for select using (exists (
  select 1 from public.memberships m
  where m.community_id = reports.community_id and m.user_id = auth.uid()
    and m.role = 'moderator' and m.status = 'active'
));

-- Moderation events: server only (no client policy by design).

-- Decisions: moderators manage; involved users read outcomes.
create policy "decisions_moderator_all" on public.moderation_decisions for all
  using (exists (
    select 1 from public.reports r
    join public.memberships m on m.community_id = r.community_id
    where r.id = report_id and m.user_id = auth.uid()
      and m.role = 'moderator' and m.status = 'active'
  ))
  with check (exists (
    select 1 from public.reports r
    join public.memberships m on m.community_id = r.community_id
    where r.id = report_id and m.user_id = auth.uid()
      and m.role = 'moderator' and m.status = 'active'
  ));
create policy "decisions_involved_read" on public.moderation_decisions for select using (exists (
  select 1 from public.reports r
  join public.memberships m on m.id = r.reporter_membership_id
  where r.id = report_id and m.user_id = auth.uid()
));

-- Appeals: appellants file and read their own; moderators read and decide.
create policy "appeals_appellant_insert" on public.appeals for insert with check (exists (
  select 1 from public.memberships m
  where m.id = appellant_membership_id and m.user_id = auth.uid() and m.status = 'active'
));
create policy "appeals_appellant_read" on public.appeals for select using (exists (
  select 1 from public.memberships m
  where m.id = appellant_membership_id and m.user_id = auth.uid()
));
create policy "appeals_moderator_all" on public.appeals for all
  using (exists (
    select 1 from public.moderation_decisions d
    join public.reports r on r.id = d.report_id
    join public.memberships m on m.community_id = r.community_id
    where d.id = decision_id and m.user_id = auth.uid()
      and m.role = 'moderator' and m.status = 'active'
  ))
  with check (exists (
    select 1 from public.moderation_decisions d
    join public.reports r on r.id = d.report_id
    join public.memberships m on m.community_id = r.community_id
    where d.id = decision_id and m.user_id = auth.uid()
      and m.role = 'moderator' and m.status = 'active'
  ));
