# Meta Models and End-to-End Journey Audit

**Reviewed:** 2026-11-03  
**Scope:** Repository integrations and product-flow fit, compared with Meta's current Model API documentation.  
**Important limit:** Source code shows what is integrated, not whether a production deployment has made calls or how many. No provider usage dashboard or live call history was inspected.

## What Harmonise uses today

The model API key stays server-side. Text requests use Meta's OpenAI-compatible **Chat Completions** endpoint through `src/lib/meta-model.ts`; speech uses the dedicated **file transcription** endpoint. These are the two model lines currently integrated:

| Model / API | Current use | Product boundary |
|---|---|---|
| Muse Spark 1.3 Standard (`muse-spark-1.3`) | `/api/chat`: short private replies plus tentative structured themes and support preference. `/api/advice`: general adviser output in the separate `/connect` demo. `/api/moderation/triage`: user-triggered triage in the fictional moderation journey. `triageEventText()` in `src/lib/db/moderation.ts`: queued live-community reports/flags for human review. | Private chat/adviser remain distinct from live community records. Triage is advisory; humans decide. User-confirmed themes, not raw conversation, drive current community-list overlap. |
| Muse Voice Transcribe 1.0 (`muse-voice-transcribe-1.0`) | `/api/voice/transcribe` sends a reviewed WAV recording to `POST /v1/asr/transcribe`, returns editable text, and does not submit the text to chat until the user chooses Send. | Speech-to-text only. This is not speech generation or a live voice conversation. |

The most recent keyed evaluation recorded in `docs/META_INTEGRATION_PLAN.md` was a synthetic 17/17 run (dated 2026-11-02). That is evidence for those evaluated flows, not evidence of actual production traffic or account-level model availability.

## End-to-end map and opportunities

| Journey step | Today | Meta model/API opportunity | Recommendation |
|---|---|---|---|
| Land → private chat | Muse Spark answers submitted messages; deterministic crisis phrase screening runs before the model. | Stream the chat response or a safe staged status; compare Spark 1.3 prompt/config variants against the existing synthetic eval. | **Improve the existing Spark flow first.** Reduce the dead wait already noted in the journey backlog and measure latency/quality. Keep crisis routing deterministic and avoid implying messages are monitored. |
| Voice input | User records locally, reviews, then explicitly sends audio for transcription; transcript stays editable. | Muse Voice also offers a realtime WebSocket endpoint with endpointing, VAD, turn timing, and speaker labels. | **Keep file transcription as the default.** Realtime would transmit audio while recording and change the current review-before-transfer promise. Consider only as a separate, clearly disclosed opt-in after a device/language evaluation. |
| Confirm understanding → find a real community | User confirms suggested themes. `/communities?themes=` applies fixed metadata overlap; the Muse adviser matches only a fixed demo catalog. There is no model-driven ranking of live communities. | Muse Spark structured output can rank a server-supplied list of approved community metadata against confirmed theme IDs and return bounded reasons. | **Best new product fit, after evaluation.** Candidate generation should remain deterministic. On an explicit “Find a community” action, send only confirmed theme IDs and public community names/topics/descriptions; do not send chat history, transcripts, need summaries, or account identity. Show the provider notice at that action. Compare ranking with current overlap on synthetic cases before release; keep a deterministic fallback and let the user choose. |
| Join → participate | Live Supabase membership, posts, replies, and consented sharing exist. A helper is configured per community, but does not answer, welcome, or publish. | Muse Spark could draft a reply or offer an explicitly AI-labelled answer grounded in approved community guidance. | **Potentially high value, but a product and operations decision.** First define whether AI answers are allowed, how users opt in, what sources are approved, how uncertainty/escalation works, and whether a human reviews drafts. Do not silently turn the existing moderation helper into a peer or facilitator. |
| Report → moderator review | Muse Spark classifies some reports in a user-triggered route and the queued worker; the result is shown as an advisory signal. Worker schedule and named on-duty coverage are not configured. | Structured output, tool calling, and a stronger model could extend triage. | **Do not add model autonomy.** Close human coverage, scheduling, response-time, and evaluation gaps first. More reasoning or a different model does not make an unstaffed queue safe. |

## Other Meta model lines and API surfaces

Meta's current catalog also documents Muse Wonder, Muse Image, SAM 3.1, Muse Spark Open, and Muse Glimmer. It documents Responses, Messages, Files, Models, image-generation/edit, and realtime transcription surfaces. The repo currently uses none of those lines/surfaces. Muse Spark 1.2/1.1 are also not configured. `GET /v1/models` is available to check which API-hosted models are enabled for the project's team; it has not been called in this audit, so account-specific access is unverified.

| Capability | Harmonise fit today |
|---|---|
| Muse Wonder (`muse-wonder-1.0`) | Poor runtime fit for short, bounded support turns and classification; Meta positions it for complex, long-horizon work. Keep Muse Spark for app traffic unless evaluations show a specific quality gap. |
| Muse Image (`muse-image-1.0`) | No user need currently calls for generated/edited imagery. It would add an unrelated media surface and new review/storage questions. |
| SAM 3.1 (`sam-3.1`) | No image/video segmentation workflow exists in the product. |
| Muse Spark Open / Muse Glimmer | Self-hosted or third-party-hosted deployment, not a drop-in Meta Model API feature. No current infrastructure or privacy case justifies operating them. |
| Search grounding / Files API / tool calling / Responses API | Potentially useful only for a future approved, sourced-resource or multi-step workflow. Current chat and community matching do not need arbitrary web access, uploaded private files, or autonomous tools. |
| Muse Voice realtime | Could make dictation more responsive, but changes the timing of audio transfer and needs language/device testing and revised disclosure. |

Standard mode remains the appropriate choice for real narratives; do not switch to Contributor mode for them. Do not imply zero retention or confidentiality. See `docs/DATA_PRIVACY_DESIGN.md` and the existing model decisions for the current trust boundaries.

## Suggested order

1. Improve and re-evaluate the existing Muse Spark chat latency/quality before introducing another model line.
2. Prototype **live-community ranking** using synthetic user-confirmed themes and approved public metadata only. Keep the deterministic list and fallback; compare ranking quality, reason accuracy, latency, and token use.
3. Decide whether the product wants an AI community responder. This changes the helper's role and user expectations, so agree on source grounding, consent, human oversight, and operational ownership before building it.
4. Reconsider realtime voice only if people need it after the current recording flow is tested on target devices and languages.

Do not add Muse Image, SAM, web search grounding, or Muse Wonder merely to increase model count. Add a model/API only when it improves a specific user outcome and its data transfer and failure behavior are explicit.

## References

- [Meta Model API overview](https://dev.meta.ai/docs/overview)
- [Meta models and availability](https://dev.meta.ai/docs/models)
- [Meta API reference](https://dev.meta.ai/docs/api-reference)
- Current repository map: `docs/END_TO_END_JOURNEY_AND_GAPS.md`, `docs/META_INTEGRATION_PLAN.md`, `docs/project-knowledge/ARCHITECTURE.md`, `src/lib/meta-model.ts`, `src/app/api/chat/route.ts`, `src/app/api/advice/route.ts`, `src/app/api/voice/transcribe/route.ts`, `src/app/api/moderation/triage/route.ts`, `src/lib/db/moderation.ts`, `src/lib/community-topics.ts`.
