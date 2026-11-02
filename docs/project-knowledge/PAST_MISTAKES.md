# Past Mistakes and Preventive Rules

## 2026-11-02 — A moderation queue is not a staffed monitoring service

The live `/communities` and `/moderation` surfaces now have database-backed posts, reports, triage events, reviewer decisions, and appeals. The `/app` and `/connect` demos still use fixtures. A worker endpoint without a scheduled caller and named moderators does not provide continuous monitoring or timely human response. Keep the limitation visible until the worker schedule and staffed escalation are operating.

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
