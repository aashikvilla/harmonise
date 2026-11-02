import { NextResponse } from "next/server";
import { getAuthUser, isDatabaseConfigured } from "@/lib/db/supabase";
import { listPromotionRequests, requestPromotion, validCommunityId } from "@/lib/db/community";
import { checkUserRateLimit } from "@/lib/meta-model";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  if (!validCommunityId(id)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "signed-out" }, { status: 401 });
  if (await checkUserRateLimit(user.id, "promotions-read", 60)) {
    return NextResponse.json({ error: "rate-limited" }, { status: 429 });
  }
  try {
    const result = await listPromotionRequests(user.id, id);
    if (!result) return NextResponse.json({ error: "unavailable" }, { status: 503 });
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 403 });
    return NextResponse.json({ requests: result });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 502 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  if (!validCommunityId(id)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "signed-out" }, { status: 401 });
  if (await checkUserRateLimit(user.id, "promotions-write", 10)) {
    return NextResponse.json({ error: "rate-limited" }, { status: 429 });
  }
  const record = (await request.json().catch(() => null)) as { requestedRole?: unknown; note?: unknown } | null;
  if (!record || (record.requestedRole !== "volunteer" && record.requestedRole !== "verified-supporter")) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  if (typeof record.note !== "string" || record.note.length > 1000) return NextResponse.json({ error: "invalid" }, { status: 400 });
  try {
    const result = await requestPromotion(user.id, id, record.requestedRole, record.note);
    if (!result) return NextResponse.json({ error: "unavailable" }, { status: 503 });
    if ("error" in result) {
      const status = result.error === "not-found" ? 404 : result.error === "already-open" ? 409 : 403;
      return NextResponse.json({ error: result.error }, { status });
    }
    return NextResponse.json({ request: result.request });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 502 });
  }
}
