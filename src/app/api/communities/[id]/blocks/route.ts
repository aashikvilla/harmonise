import { NextResponse } from "next/server";
import { bodyTooLarge, parseJsonBody } from "@/lib/api-guard";
import { checkUserRateLimit } from "@/lib/meta-model";
import { dbFailureStatus, getAuthUser, isDatabaseConfigured } from "@/lib/db/supabase";
import { blockMember, listBlockedAliases, unblockMember, validAlias, validCommunityId } from "@/lib/db/community";

export const runtime = "nodejs";

function blockStatus(error: string) {
  if (error === "no-such-member" || error === "not-found") return 404;
  if (error === "forbidden" || error === "cannot-block-self") return 403;
  return 400;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  if (!validCommunityId(id)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "signed-out" }, { status: 401 });
  try {
    const blocked = await listBlockedAliases(user.id, id);
    return NextResponse.json({ blocked });
  } catch (error) {
    return NextResponse.json({ error: "unavailable" }, { status: dbFailureStatus(error) });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  if (!validCommunityId(id)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "signed-out" }, { status: 401 });
  if (await checkUserRateLimit(user.id, "community-block", 20)) return NextResponse.json({ error: "rate-limited" }, { status: 429 });
  if (bodyTooLarge(request, 2_000)) return NextResponse.json({ error: "invalid" }, { status: 413 });
  const parsed = await parseJsonBody(request);
  const record = (parsed.ok && typeof parsed.value === "object" && parsed.value !== null ? parsed.value : {}) as Record<string, unknown>;
  const alias = validAlias(record.alias);
  if (!alias) return NextResponse.json({ error: "invalid" }, { status: 400 });
  try {
    const result = await blockMember(user.id, id, alias);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: blockStatus(result.error) });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "unavailable" }, { status: dbFailureStatus(error) });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  if (!validCommunityId(id)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "signed-out" }, { status: 401 });
  const alias = validAlias(new URL(request.url).searchParams.get("alias"));
  if (!alias) return NextResponse.json({ error: "invalid" }, { status: 400 });
  try {
    const result = await unblockMember(user.id, id, alias);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: blockStatus(result.error) });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "unavailable" }, { status: dbFailureStatus(error) });
  }
}
