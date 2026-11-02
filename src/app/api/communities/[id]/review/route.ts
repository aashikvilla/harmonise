import { NextResponse } from "next/server";
import { bodyTooLarge, parseJsonBody } from "@/lib/api-guard";
import { checkUserRateLimit } from "@/lib/meta-model";
import { dbFailureStatus, getAuthUser, isDatabaseConfigured } from "@/lib/db/supabase";
import { ensureProfile } from "@/lib/db/sessions";
import { declinePendingCommunity, reviewPendingCommunity, validCommunityId } from "@/lib/db/community";

export const runtime = "nodejs";

/**
 * Human reviewer decision on a pending community. Allowlisted; approve
 * requires explicit coverage confirmation, decline requires a kind note.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  if (!validCommunityId(id)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "signed-out" }, { status: 401 });
  const reviewers = new Set((process.env.COMMUNITY_REVIEWER_USER_IDS ?? "").split(",").map((value) => value.trim()).filter(Boolean));
  if (!reviewers.has(user.id)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (await checkUserRateLimit(user.id, "community-review", 10)) return NextResponse.json({ error: "rate-limited" }, { status: 429 });
  if (bodyTooLarge(request, 2_000)) return NextResponse.json({ error: "invalid" }, { status: 413 });
  const parsed = await parseJsonBody(request);
  const body = parsed.ok && typeof parsed.value === "object" && parsed.value !== null
    ? parsed.value as Record<string, unknown>
    : {};
  try {
    await ensureProfile(user.id);
    if (body.decision === "declined") {
      if (typeof body.message !== "string" || body.message.trim().length === 0 || body.message.length > 1000) {
        return NextResponse.json({ error: "message-required" }, { status: 400 });
      }
      const community = await declinePendingCommunity(id, user.id, body.message.trim());
      if (!community) return NextResponse.json({ error: "not-found" }, { status: 404 });
      return NextResponse.json({ community: { id: community.id, launch_status: community.launch_status } });
    }
    if (body.coverageConfirmed !== true) {
      return NextResponse.json({ error: "coverage-confirmation-required" }, { status: 400 });
    }
    const community = await reviewPendingCommunity(id, user.id, true);
    if (!community) return NextResponse.json({ error: "not-found" }, { status: 404 });
    return NextResponse.json({ community: { id: community.id, launch_status: community.launch_status } });
  } catch (error) {
    return NextResponse.json({ error: "unavailable" }, { status: dbFailureStatus(error) });
  }
}
