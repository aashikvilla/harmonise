import { NextResponse } from "next/server";
import { dbFailureStatus, getAuthUser, isDatabaseConfigured } from "@/lib/db/supabase";
import { listCommunities, publicCommunity } from "@/lib/db/community";
import { checkUserRateLimit } from "@/lib/meta-model";
import { bodyTooLarge, parseJsonBody } from "@/lib/api-guard";
import { ensureProfile } from "@/lib/db/sessions";
import { createPendingCommunity, getCommunityAgent } from "@/lib/db/community";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";

/** Public directory: existence and real counts only, never post contents. */
export async function GET(request: Request) {
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  try {
    const user = await getAuthUser(request);
    const communities = await listCommunities(user?.id);
    return NextResponse.json({ communities: communities.map(publicCommunity) });
  } catch (error) {
    return NextResponse.json({ error: "unavailable" }, { status: dbFailureStatus(error) });
  }
}

function sanitizeText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return value
    .normalize("NFKC")
    .replace(/<[^>]*>/g, " ")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function safeTopics(value: unknown): string[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 8) return null;
  const topics: string[] = [];
  for (const item of value) {
    const topic = sanitizeText(item);
    if (!topic || topic.length < 2 || topic.length > 36) return null;
    if (!topics.some((existing) => existing.toLowerCase() === topic.toLowerCase())) topics.push(topic);
  }
  return topics;
}

function communityId(name: string) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 35) || "community";
  return `${slug}-${randomUUID().replaceAll("-", "").slice(0, 8)}`;
}

/** Creates an owner-visible, pending community and its triggered AI helper. */
export async function POST(request: Request) {
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "signed-out" }, { status: 401 });
  if (await checkUserRateLimit(user.id, "community-create", 3)) {
    return NextResponse.json({ error: "rate-limited" }, { status: 429 });
  }
  if (bodyTooLarge(request, 8_000)) return NextResponse.json({ error: "invalid" }, { status: 413 });
  const parsed = await parseJsonBody(request);
  if (!parsed.ok || typeof parsed.value !== "object" || parsed.value === null || Array.isArray(parsed.value)) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const body = parsed.value as Record<string, unknown>;
  const name = sanitizeText(body.name);
  const description = sanitizeText(body.description);
  const topics = safeTopics(body.topics);
  if (!name || name.length < 3 || name.length > 80 || description === null || description.length < 20 || description.length > 500 || !topics) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  try {
    await ensureProfile(user.id);
    const community = await createPendingCommunity({
      id: communityId(name),
      name,
      description,
      topics,
      ownerId: user.id,
    });
    const agent = await getCommunityAgent(community.id);
    if (!agent) return NextResponse.json({ error: "unavailable" }, { status: 503 });
    return NextResponse.json({
      community: {
        id: community.id,
        name: community.name,
        description: community.description,
        launch_status: community.launch_status,
      },
      agent: {
        displayName: agent.display_name,
        status: agent.status,
        disclosure: "AI helper. It offers advisory safety triage to human moderators and cannot take moderation actions.",
      },
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "unavailable" }, { status: dbFailureStatus(error) });
  }
}
