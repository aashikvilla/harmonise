# Harmonise Pilot Runbook

**Scope:** controlled pilot of the live community surface (`/communities`, `/moderation`,
durable sessions). The prototype demos stay available and keep their fictional labels.

## 1. Ownership

| Area | Owner (fill before pilot) | Contact |
|---|---|---|
| Release / rollback | _TBD_ | _TBD_ |
| Moderation staffing + safety lead | _TBD_ | _TBD_ |
| User support + contact path | _TBD_ (support email or form) | _TBD_ |
| Incident response | _TBD_ | _TBD_ |
| Privacy / deletion requests | _TBD_ | _TBD_ |

## 2. Production secrets

Set as protected server runtime variables (never in Git, screenshots, or CI logs):

- `MODEL_API_KEY`, `META_TEXT_MODEL`
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (shared rate limits)
- `MODERATION_WORKER_SECRET`, `OPS_METRICS_SECRET`
- `HARMONISE_KILL_SWITCH` (`0` normally, `1` to fail model routes closed)
- `DAILY_MODEL_CALLS_PER_USER` (default `100`)

`.env.local` stays ignored and out of CI artifacts. Rotate any secret that appears in a log.

## 3. Dashboards and alerts

- `GET /api/health` — liveness plus configuration booleans.
- `GET /api/ready` — servability plus database reachability.
- `GET /api/ops/metrics` (header `x-ops-secret`) — request counts, errors, latency,
  token totals, kill-switch/quota drops, moderation queue depth. No private text.
- Alert thresholds (tune after one week of pilot traffic):
  - 5xx rate above 2% over 15 minutes.
  - `/api/chat` average provider latency above 20 seconds.
  - Moderation `queued + processing` above 50, or any `dead` events.
  - Daily token totals above 80% of the remaining credit budget.

## 4. Spend control

- Keep the 20% credit reserve for demo retries. Read token totals from
  `/api/ops/metrics` and the response headers (`x-meta-*-tokens`).
- Per-user daily quota (`DAILY_MODEL_CALLS_PER_USER`) plus IP rate limits cap
  individual spend. The worker secret caps queue processing to the schedule.
- Kill switch: set `HARMONISE_KILL_SWITCH=1` to stop all Meta calls instantly.
  The UI already shows honest retry states when the provider is unavailable.

## 5. Moderation staffing and abuse handling

- Reviews happen during published staffed hours only; the queue and policy
  (`docs/MODERATION_POLICY.md`) say when review resumes.
- Urgent items: first human look within 4 staffed hours. Review items: decision
  within 2 staffed days. Appeals: second look within 2 staffed days.
- Abuse: per-user report quotas, per-community open-report cap (200), account
  blocks via membership status, dead-letter review for failed triage events.
- Immediate risk: reviewers share local resources and helplines; they never
  claim automated monitoring or emergency response.

## 6. Staged rollout

1. Staff-only cohort (dogfood): accounts, sessions, one community, moderation.
2. Small consenting cohort (≤50): invite-only, documented consent, support path live.
3. Pause criteria: urgent queue unstaffed, 5xx above threshold, spend above plan,
   any privacy incident, or moderator burnout signals. Pausing means: enable the
   kill switch for model routes, freeze invites, keep read paths and support open.
4. Rollback: redeploy the previous release; database migrations in this pilot are
   additive, so rollback needs no data migration. Rehearse once before cohort 2.

## 7. Launch gate (production stays blocked until all hold)

- [ ] Named human moderator on duty with published staffed hours.
- [ ] Support path verified end-to-end (message received, answered, resolved).
- [ ] Privacy/security review, authorization review, and data-deletion drill complete
      (`docs/PILOT_REVIEW.md`).
- [ ] Deterministic E2E green on the release candidate; separately budgeted
      synthetic live-provider smoke run and recorded.
- [ ] Rollback rehearsed; kill switch tested; spend alerts firing to a human.
