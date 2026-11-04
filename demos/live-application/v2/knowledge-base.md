# Harmonise product knowledge · Demo V2

## One-sentence explanation

Harmonise helps a person pause, think through a difficult moment privately, find a manageable next step, and explore real peer support only if they choose.

The public homepage opens with “You don't need the right words to begin,” the Harmonise loop mark, and the animated window illustration. Its scenes explain the real product without presenting sample conversations or fabricated community activity.

## The problem

People navigating difficult decisions or life changes may not be ready to post publicly or ask a group for help. Explaining the situation, deciding what to do, and choosing whom to tell can feel like one overwhelming task. Harmonise separates those decisions so a person can begin privately.

## Who it is for

People facing personal decisions, family pressure, belonging, or life transitions who want low-pressure reflection and the option of peer support. The product is peer support and navigation. It is not therapy, diagnosis, legal advice, a therapist directory, or emergency care.

## What the product does

1. A member signs in and opens a private adviser conversation.
2. A server-side Meta model returns a reflection and practical options. The UI identifies the model that answered.
3. Related communities stay hidden until the member asks to see them.
4. The member browses real Supabase-backed community records and decides whether to join. Private adviser text is not copied into community posts.
5. If no community fits, the member may ask Meta to draft a proposed purpose and scope. The member can edit or discard that private draft; submitting a proposal is a separate action and human review is required before launch.
6. In private chat, the member may record audio for Meta Voice Transcribe. The returned text remains editable and unsent until the member chooses what to do.

## Where Meta is used

| Feature | Model path | Member control / boundary |
| --- | --- | --- |
| Adviser reflection | Muse Wonder first, Muse Spark fallback | User submits a prompt; response is advisory and the serving-model label is shown. |
| Community setup assistance | Muse Wonder first, Muse Spark fallback | User requests a draft; can edit or discard it; human launch review remains required. |
| Private chat, scoped community guide, moderation triage | Muse Spark | User-initiated and advisory; moderation decisions remain human. |
| Voice transcription | Muse Voice Transcribe | User records and submits audio for transcription; transcript is editable before sending in chat. |

Provider calls are server-side. Do not promise zero retention, clinical effectiveness, continuous moderation, or guaranteed peer responses.

## Data and technology

- **Next.js App Router / React:** public homepage and product routes.
- **Supabase Auth and Postgres:** accounts, community records, memberships, and persisted product data; routes enforce identity and permissions.
- **Meta model routes:** server-side adviser, setup, chat, scoped guidance, moderation triage, and speech transcription.
- **Vercel:** production hosting.

Production has three approved community records: one active community with current aggregate activity and two approved but empty communities. The active community contains personal member stories visible only to members. Demo V2 shows real public names/counts and does not reveal those posts or write synthetic activity. The adviser endpoint is stateless and does not save a conversation. These counts are a snapshot, not a product impact metric.

## Intended impact versus measured impact

The product aims to make a first step easier to see and peer connection easier to choose. No study or outcome dataset currently establishes that Harmonise reduces distress, improves safety, or increases successful support. Use language such as “we aim to” and “designed to,” not “we have improved.”

## Honest exclusions

There is no therapist search/booking product, public volunteer roster, direct volunteer messaging, autonomous community publication, or continuously staffed moderation guarantee. The production demo account has no reviewer role, so V2 does not stage a reviewer queue or synthetic decision. Do not add production seed records to make the film feel busy.
