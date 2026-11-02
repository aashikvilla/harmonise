import { NextResponse } from "next/server";
import { parseJsonBody } from "@/lib/api-guard";
import { isCommunityRoleVerificationEnabled } from "@/lib/community-progress";
import { isModerator, validCommunityId } from "@/lib/db/community";
import { dbFailureStatus, getAuthUser, isDatabaseConfigured, isUuid, supabaseRest } from "@/lib/db/supabase";
import { checkUserRateLimit } from "@/lib/meta-model";

export const runtime = "nodejs";

type TargetMembership = { id: string; user_id: string; status: string };

async function verifiedModerator(request: Request, communityId: string) {
  if (!isDatabaseConfigured()) return { response: NextResponse.json({ error: "unavailable" }, { status: 503 }) };
  if (!isCommunityRoleVerificationEnabled()) return { response: NextResponse.json({ error: "disabled" }, { status: 404 }) };
  if (!validCommunityId(communityId)) return { response: NextResponse.json({ error: "invalid" }, { status: 400 }) };
  const user = await getAuthUser(request);
  if (!user) return { response: NextResponse.json({ error: "signed-out" }, { status: 401 }) };
  if (await checkUserRateLimit(user.id, "community-verification", 10)) {
    return { response: NextResponse.json({ error: "rate-limited" }, { status: 429 }) };
  }
  try {
    if (!(await isModerator(user.id, communityId))) return { response: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  } catch (error) {
    return { response: NextResponse.json({ error: "unavailable" }, { status: dbFailureStatus(error) }) };
  }
  return { user };
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = await verifiedModerator(request, id);
  if ("response" in access) return access.response;
  const parsed = await parseJsonBody(request);
  const body = parsed.ok && typeof parsed.value === "object" && parsed.value !== null ? parsed.value as Record<string, unknown> : {};
  const membershipId = typeof body.membershipId === "string" ? body.membershipId : "";
  const roleLabel = typeof body.roleLabel === "string" ? body.roleLabel.trim() : "";
  if (!isUuid(membershipId) || roleLabel.length < 2 || roleLabel.length > 64) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  try {
    const memberships = await supabaseRest<TargetMembership[]>("memberships", {
      query: `?id=eq.${membershipId}&community_id=eq.${encodeURIComponent(id)}&status=eq.active&select=id,user_id,status&limit=1`,
    });
    const target = memberships[0];
    if (!target || target.user_id === access.user.id) return NextResponse.json({ error: "invalid-target" }, { status: 400 });
    await supabaseRest("community_member_verifications", {
      method: "POST",
      query: "?on_conflict=membership_id",
      body: { membership_id: target.id, community_id: id, role_label: roleLabel, reviewed_by: access.user.id, reviewed_at: new Date().toISOString() },
      prefer: "resolution=merge-duplicates,return=minimal",
    });
    return NextResponse.json({ verified: true });
  } catch (error) {
    return NextResponse.json({ error: "unavailable" }, { status: dbFailureStatus(error) });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = await verifiedModerator(request, id);
  if ("response" in access) return access.response;
  const parsed = await parseJsonBody(request);
  const body = parsed.ok && typeof parsed.value === "object" && parsed.value !== null ? parsed.value as Record<string, unknown> : {};
  const membershipId = typeof body.membershipId === "string" ? body.membershipId : "";
  if (!isUuid(membershipId)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  try {
    await supabaseRest("community_member_verifications", {
      method: "DELETE",
      query: `?membership_id=eq.${membershipId}&community_id=eq.${encodeURIComponent(id)}`,
    });
    return NextResponse.json({ verified: false });
  } catch (error) {
    return NextResponse.json({ error: "unavailable" }, { status: dbFailureStatus(error) });
  }
}
