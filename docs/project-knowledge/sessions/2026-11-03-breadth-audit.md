# Session journal — Product breadth audit

Date 3 November 2026. Baseline `7207d5b`.

The user requested parallel end-to-end review, critique from product/design/member/judge perspectives, fixes and a detailed execution backlog. Three agents investigated visitor UX, community integration and Meta models. They returned source findings before usage limits interrupted their browser work. Findings were checked in the primary session.

Created `docs/PRODUCT_TECHNICAL_AUDIT_2026-11-03.md` with evidence levels, critical defects, product/design friction, Spark/Wonder/Voice implementation inventory, experiment proposals, scenario coverage and a sequenced execution plan.

Fixed reaction read authorization and visible-post mutation restrictions, guarded archive/revive transitions, Ops failure handling and the facilitator's default-enabled scheduling risk. Facilitator needs a provisioned Auth-backed bot identity, consent and concurrency proof before enabling.

Supabase's production migration ledger already contained the engagement and reviewer-note changes (`20261102204240`, `20261102204243`). Live schema inspection confirmed reactions, promotions, archive status and reviewer note. It also found broad `anon`/`authenticated` grants and permissive engagement policies. Added and applied `20261103164619_lock_engagement_tables_to_server`; post-migration privilege checks deny both API roles while preserving `service_role`, and no user data was changed. JWT-level direct API denial remains to be tested in staging.

Ran six synthetic provider calls against production with no database writes: benign triage and generated-silence transcription succeeded. Chat and advice each returned HTTP 504 twice. The route preserves upstream 5xx status, so the errors came back from the Meta request path; the exact provider cause is unknown because the response body was not retained and Hobby runtime logs did not return provider diagnostics. Request IDs and timings are in the product audit. Do not claim current Spark chat/advice live success until rerun passes.

Latest production deployment for `7207d5b` was READY. Isolated production build (including TypeScript) and lint passed. Targeted browser run passed 10/10 serially after updating the audit empty-state expectation and waiting for proposal navigation. The isolated 102-case run passed 73, skipped 26 and failed three. Fixing the unstubbed live-circle directory dependency and keyboard setup race made all four affected desktop/mobile cases pass on rerun. PR #6 CI passed verification and deterministic E2E; its preview for `481f0c7` was READY. Dedicated account journeys and email verification remain open. Artifacts are in `C:/Projects/hormonise-audit/test-results` and `retest-results`.

Concurrent unrelated edits appeared in Auth, Connect and community components during this review. Verification moved into `C:/Projects/hormonise-audit` on `codex/breadth-audit`. A concurrently edited community-count hunk was restored to the accepted baseline in this branch. The broader run against the changing original checkout was interrupted and is excluded from verification evidence.
