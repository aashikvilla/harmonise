# Past Mistakes and Preventive Rules

## 2026-11-05 — Structured output can still contain model scratch text

The provider returned schema-valid advice whose string fields included internal
formatting analysis. The UI displayed it because validation checked types and
lengths but not content. Validate user-facing text for provider protocol and
reasoning artifacts as well as schema shape; retry only through the established
model fallback, and return an unavailable state if the retry is also invalid.

## 2026-11-03 — Display aliases cannot establish an automated actor's identity

Facilitator setup searched a human-editable alias and otherwise created a profile with an ID absent from Auth. The first path could attribute AI output to a person, and the second violates the profile foreign key. Provision automated actors through a trusted identity mechanism with a unique immutable binding. Prove provisioning, concurrent calls and attribution before scheduling writes.
## 2026-11-04 — Verify current code and remote state before repeating the runbook

The demo runbook and architecture note still described `/connect` as a fictional
local-only flow, even though the checked-in code used Supabase email OTP and
persisted community APIs. The current production deployment also had the
relevant engagement migrations recorded remotely despite an earlier claim that
they were pending. Treat old docs and prior summaries as hypotheses: verify the
current route implementation, deployed commit, readiness result, and remote
migration ledger before describing product behavior. Refresh contradictory
operator docs as part of the same task.

## 2026-11-03 — Remote migration tools can assign versions different from local filenames

Applying checked-in SQL through the Supabase MCP created timestamped entries in
`supabase_migrations.schema_migrations`, while the repository named those files
`0003` and `0004`. SQL success alone did not prove migration history matched.
After applying remotely, compare the remote migration list with exact local file
versions; align checked-in filenames before merging so later `db push` does not
replay or misorder migrations.

The Supabase MCP may assign the migration version from its apply time even when
the submitted name contains the checked-in timestamp. Rename the local migration
prefix to the returned remote version immediately, then compare both lists again.

## 2026-11-03 — Vercel Hobby cron schedules must be daily

An every-five-minute worker schedule passed source review but caused Vercel
preview deployments to fail on Hobby. Check plan cadence limits when adding
cron entries; Hobby allows once-daily runs with up to 59 minutes of timing
variation, so a daily worker is not continuous coverage.

## 2026-11-03 — A requested integration branch can lag the accepted product baseline

`develop` did not yet contain community-lifecycle code already merged to `main`,
so feature worktrees created from `develop` lacked the proposal flow and helper
schema their work depended on. Before parallelizing, compare the requested base
with the accepted integration branch and fast-forward only the already-accepted
baseline; then recreate or rebase clean feature worktrees before editing.

## 2026-11-03 — Long browser journeys can exceed the default timeout under parallel viewport runs

The desktop version of a 70-plus-step product journey passed alone in 28 seconds
but exceeded Playwright's 30-second test timeout when desktop and mobile
projects ran alongside other specs. Give unusually long journeys explicit
headroom and rerun the full suite; a test timeout at its final action can hide
that the UI transition itself succeeded.

## 2026-11-03 — Isolate Playwright artifact output across overlapping runs

Reusing the shared `C:\tmp\hormonise-playwright-results` directory produced
missing trace-file errors during teardown even when the product journey passed.
Give concurrent or targeted QA runs a unique `--output` directory; disable
traces when isolating non-interaction failures.

## 2026-11-02 — A moderation queue is not a staffed monitoring service

The live `/communities` and `/moderation` surfaces now have database-backed posts, reports, triage events, reviewer decisions, and appeals. The `/app` and `/connect` demos still use fixtures. A once-daily worker and no named moderators do not provide continuous monitoring or timely human response. Keep the limitation visible until backlog recovery and staffed escalation are operating.

## 2026-11-02 — “Private in the browser” does not mean “not sent to a provider”

Once a user submits chat or voice for Meta processing, that input leaves the device even if Harmonise does not store it in a database. Disclose each transfer at the point of use, keep the provider key server-side, and avoid privacy/retention promises not backed by verified terms and implementation.

## Agent workflow rule — Parallel work must not share a writable checkout

Give concurrent agents isolated worktrees and bounded file ownership. Do not let parallel agents push directly to `main`; serialize integration through a reviewed, green merge gate.

## 2026-11-02 — Unlayered CSS resets silently beat Tailwind utilities

Global `a`/`button`/`input` element rules in `globals.css` were unlayered, so
they beat Tailwind v4's `@layer utilities` classes (`text-white`, `box-border`,
`selection:` variants) on every link, button, and field — 11 dark-pill labels
rendered invisible ink-on-ink while all DOM assertions still passed. Keep all
element-level resets and defaults inside `@layer base`, and prove text styling
with computed-style checks or screenshots, never `toBeVisible` alone.

## 2026-11-02 — Parallel E2E files must not share mutable backend state

Stateful Playwright journeys in separate files ran in parallel workers against
the same test users and community, leaving/rejoining over each other and
failing 1–2 tests per run while passing in isolation. Keep journeys that share
users or rows in ONE spec file (serial per file), isolate parallel projects
with per-project users/aliases, normalize membership at each journey's start,
and give live-backend files a longer `test.setTimeout`.

## 2026-11-02 — E2E runs leave worker-queue backlog; the worker is FIFO

Every suite run enqueues moderation events nobody drains, so a manual worker
call triages the oldest stale event instead of the fresh probe (113-deep
backlog observed). Clear synthetic backlog before worker verification, and
remember advisory post events (report_id null) sort alongside report events.

## 2026-11-02 — Client forms can submit before hydration

An immediate Playwright click after navigating from the homepage iframe could
submit a client-only form as a native GET before React attached its handler.
Keep submit controls disabled until the client handler is ready, and have E2E
flows wait for the enabled state before submitting.

## 2026-11-03 — CSV quoting does not stop spreadsheet formulas

Doubling quotes and wrapping fields prevents CSV column breaks, but spreadsheet
apps can still execute cells that begin with `=`, `+`, `-`, or `@`. Prefix
untrusted export cells with an apostrophe when the first non-whitespace
character is a formula marker, and cover that boundary with unit tests.

## 2026-11-03 — Check local server health before treating an E2E timeout as a bug

A long Playwright run hit page navigation and teardown timeouts while the local
Next server stopped answering readiness requests. The affected homepage and
product flows passed when rerun serially after the server recovered. Capture
`/api/ready` and server logs, then rerun affected journeys before changing app
behavior based on a timeout.

## 2026-11-03 — Review table grants and cross-table bindings alongside RLS

The engagement tables inherited broad `anon`/`authenticated` grants. Their
RLS policies limited rows but did not bind a reaction's membership to its
post's community, and the public-circle read policy did not exclude hidden
posts. An internal moderation queue also had broad grants without policies.
Check actual ACLs and `has_table_privilege` for each API role after every
public-schema migration; test policies against the full foreign-key relationship
and row lifecycle. If the application only uses server routes, revoke direct
API grants rather than keeping unused policies that could be accidentally
re-granted later.
## 2026-11-03 — Test-user seeders must never inherit the app's database target

A committed local seeder read `.env.local`, created fresh Supabase users and
moderator memberships on every run, and had no cleanup path. Use dedicated
test-project credentials plus an explicit project confirmation; never inherit
the app's default Supabase target for destructive or persistent test setup.

## 2026-11-04 — A prepared prototype clip is not evidence of a live product journey

Review the capture manifest and on-screen labels before treating an older demo as proof of current functionality. A polished local walkthrough may accurately communicate the concept while proving nothing about current authentication, model calls, persisted data, or community activity. Plan the live flow against the deployed route and use an isolated, explicitly synthetic dataset; never make production look populated by inventing member activity.

## 2026-11-04 — Confirm the target artifact before reviewing demo history

Numbered archive iterations can look newer than the product demo versions a user means. Check the runnable/current paths and their README or manifest before selecting review targets; keep archived MP4 capture history separate from active demos.

## 2026-11-05 — A working branch is not the deployed application

The branch contained the live chat and voice controls, while production still served the older fictional story. Source review alone therefore gave the wrong answer to “where is voice?” Always compare the production commit and deployed route with the checked-out branch, then verify the rendered authenticated state in the browser. A feature hidden behind auth is not demonstrable until the user can reach the signed-in UI and the configured backend succeeds.

## 2026-11-05 — Demo content must respect real community privacy

Production had enough actual activity for a populated directory, but its member-only posts were personal. Do not seed or record synthetic content in production to make a demo feel active, and do not capture real members' stories without consent. Prefer a dedicated staging database; when unavailable, show aggregate real activity counts and the access boundary, and state what can't be demonstrated.

## 2026-11-05 — Do not publish hidden staffing aggregates by accident

The community directory returned a `moderatorCount` that the UI did not use and the public contract did not intend to expose. API output shape is part of the privacy boundary: remove unused aggregates at the query/type boundary, then rerun the isolated community flow and the full desktop/mobile suite.

## 2026-11-05 — Browser fake microphone WAVs loop by default

Chromium's file-backed fake microphone repeats the WAV when recording lasts
longer than the clip. That produced a plausible but duplicated transcript.
Append silence after the spoken phrase, keep the capture window within the
WAV's duration, and assert the expected transcript content and absence of a
repeated phrase before accepting a voice demo take.

## 2026-11-05 — A video audio track may still fail the reviewer's playback path

V1's MP4 had a valid AAC narration track and decoded successfully, but the
user's playback experience had no audible audio. Inspect the container and
decode the track, then provide a standalone audio file and visible captions as
independent ways to follow the narration. Do not infer that audio is available
to the viewer just because it is present in the MP4.

## 2026-11-05 — Adviser reflection and saved chat use different routes

`/api/advice` returns a live reflection without creating a saved session;
`/api/chat` persists through `/api/sessions`. Trace the route used by the
visible screen before claiming a demo writes data or adding cleanup logic.

## 2026-11-05 — A hidden-state wait can pass when the locator matches nothing

Playwright's `waitFor({ state: "hidden" })` succeeds for a missing element. That
let a community loading screen pass a weak check. Assert the loaded result
positively (for example, a named rendered community card), then hold the screen
long enough to read it. After a new capture, rerun the finalizer; an older MP4
can otherwise be mistaken for the latest take.

## 2026-11-05 — A demo-specific homepage rewrite can erase the approved product story

The full Motion Revival landing page already existed in Git with eight sections,
scroll and pointer motion, keyboard interactions, and responsive illustrations.
Recreating a smaller homepage for the live recording cut those scenes and made
the site look simplified. Before changing a product surface for a demo, compare
it with the accepted source in Git and preserve its complete journey; adapt the
capture to the product instead of replacing the approved product experience.
