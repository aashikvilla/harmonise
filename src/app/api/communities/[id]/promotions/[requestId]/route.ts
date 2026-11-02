import { NextResponse } from "next/server";
import { getAuthUser, isDatabaseConfigured } from "@/lib/db/supabase";
import { decidePromotionRequest, validCommunityId } from "@/lib/db/community";
import { checkUserRateLimit } from "@/lib/meta-model";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string; requestId: string }> }) {
  const { id, requestId } = await params;
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  if (!validCommunityId(id)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "signed-out" }, { status: 401 });
  if (await checkUserRateLimit(user.id, "promotions-decide", 30)) {
    return NextResponse.json({ error: "rate-limited" }, { status: 429 });
  }
  const record = (await request.json().catch(() => null)) as { decision?: unknown; rationale?: unknown } | null;
  if (!record || (record.decision !== "approved" && record.decision !== "declined")) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  if (typeof record.rationale !== "string" || record.rationale.trim().length === 0 || record.rationale.length > 1000) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  try {
    const result = await decidePromotionRequest(user.id, id, requestId, record.decision, record.rationale);
    if (!result) return NextResponse.json({ error: "unavailable" }, { status: 503 });
    if ("error" in result) {
      const status = result.error === "not-found" ? 404 : 403;
      return NextResponse.json({ error: result.error }, { status });
    }
    return NextResponse.json({ request: result.request });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 502 });
  }
}
