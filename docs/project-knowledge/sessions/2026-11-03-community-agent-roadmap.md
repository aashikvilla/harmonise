# Session Journal — Community agent and scope-stewardship roadmap

**Date:** 2026-11-03  
**Branch:** `codex/community-flow-polish`  
**Goal:** Turn the community-scoped agent idea into an executable, staged product plan.

## Completed

- Clarified “self-healing” as helping communities review adjacent-topic expansion versus splitting a distinct topic into a new community.
- Added `docs/COMMUNITY_AGENT_ROADMAP.md` with a scoped agent model, setup copilot, private member guide, scope stewardship flow, Muse Wonder/Spark routing hypotheses, delivery phases, success measures, and open decisions.
- Distinguished new-community launch approval from existing-community scope changes. Recommended against auto-launching a new community after 30 minutes of silence because launch requires human review and confirmed human coverage in the current architecture.
- Proposed optional, narrowly delegated auto-application for pre-authorized low-risk scope changes, with versioning, member notice, audit history, pause, and rollback.
- Left implementation and architecture decisions for a later phase; existing dirty worktree changes were not modified.

## Verification and limits

- Re-read current architecture, past mistakes, and decisions. Confirmed the live worker is unscheduled and no named on-duty reviewer is configured.
- No code, database schema, deployment, or tests were changed or run.
