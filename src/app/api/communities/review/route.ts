import { NextResponse } from "next/server";
import { checkUserRateLimit } from "@/lib/meta-model";
import { dbFailureStatus, getAuthUser, isDatabaseConfigured } from "@/lib/db/supabase";
import { listPendingCommunityReviews } from "@/lib/db/community";

export const runtime = "nodejs";

/** Reviewer-only, proposal-safe launch queue. */
export async function GET(request: Request) {
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "signed-out" }, { status: 401 });
  const reviewers = new Set((process.env.COMMUNITY_REVIEWER_USER_IDS ?? "").split(",").map((value) => value.trim()).filter(Boolean));
  if (!reviewers.has(user.id)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (await checkUserRateLimit(user.id, "community-review-list", 30)) {
    return NextResponse.json({ error: "rate-limited" }, { status: 429 });
  }
  try {
    const proposals = await listPendingCommunityReviews();
    return NextResponse.json({
      proposals: proposals.map((proposal) => ({
        id: proposal.id,
        name: proposal.name,
        purpose: proposal.description,
        topics: proposal.topics,
        createdAt: proposal.created_at,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: "unavailable" }, { status: dbFailureStatus(error) });
  }
}
