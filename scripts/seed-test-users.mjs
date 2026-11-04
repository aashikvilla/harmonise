#!/usr/bin/env node
/**
 * One-off test-data seeder for a throwaway Supabase project (NOT for production).
 * Requires dedicated HARMONISE_TEST_SUPABASE_* variables and an explicit
 * HARMONISE_CONFIRM_TEST_DB value before it creates users or memberships.
 * Creates two users + one moderator via the Auth Admin API,
 * joins them to steady-ground, and writes JWTs to a temp file for Playwright.
 * Never prints secrets: stdout shows user ids and membership ids only.
 */
import { writeFileSync } from "node:fs";

const outPath = process.argv[2] ?? "C:\\tmp\\test_jwts.json";

const base = (process.env.HARMONISE_TEST_SUPABASE_URL ?? "").replace(/\/$/, "");
const anon = process.env.HARMONISE_TEST_SUPABASE_ANON_KEY ?? "";
const svc = process.env.HARMONISE_TEST_SUPABASE_SERVICE_ROLE_KEY ?? "";
const projectRef = process.env.HARMONISE_TEST_SUPABASE_PROJECT_REF ?? "";
const confirmation = process.env.HARMONISE_CONFIRM_TEST_DB ?? "";
if (!base || !anon || !svc || !projectRef) {
  throw new Error("Dedicated HARMONISE_TEST_SUPABASE_* variables are required; app environment files are not used.");
}
const targetUrl = new URL(base);
if (!targetUrl.hostname.startsWith(`${projectRef}.`) && targetUrl.hostname !== projectRef) {
  throw new Error("HARMONISE_TEST_SUPABASE_PROJECT_REF must match the configured test database host.");
}
if (confirmation !== `seed-test-users:${projectRef}`) {
  throw new Error(`Refusing to seed ${projectRef}; set HARMONISE_CONFIRM_TEST_DB=seed-test-users:${projectRef} only for a throwaway test database.`);
}

async function adminCreateUser(email, password) {
  const response = await fetch(`${base}/auth/v1/admin/users`, {
    method: "POST",
    headers: { apikey: svc, Authorization: `Bearer ${svc}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`admin create failed: ${response.status} ${text.slice(0, 200)}`);
  }
  return response.json();
}

async function signIn(email, password) {
  const response = await fetch(`${base}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anon, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw new Error(`signin failed for ${email}: ${response.status}`);
  return response.json();
}

async function rest(table, { method = "GET", query = "", body, prefer } = {}) {
  const response = await fetch(`${base}/rest/v1/${table}${query}`, {
    method,
    headers: {
      apikey: svc,
      Authorization: `Bearer ${svc}`,
      "Content-Type": "application/json",
      ...(prefer ? { Prefer: prefer } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`rest ${method} ${table} failed: ${response.status}`);
  const text = await response.text();
  return text ? JSON.parse(text) : [];
}

const stamp = Date.now().toString(36);
const password = `Test-${stamp}-x9!q2`;
const users = {};
for (const who of ["a", "b", "mod", "am", "bm", "modm"]) {
  const email = `harmonise-test-${who}-${stamp}@example.com`;
  try {
    const created = await adminCreateUser(email, password);
    users[who] = { id: created.id ?? created.user?.id, email };
  } catch (error) {
    console.log(`${who}: create skipped (${String(error).slice(0, 120)})`);
    throw error;
  }
  const session = await signIn(email, password);
  users[who].jwt = session.access_token;
  console.log(`${who}: id=${users[who].id}`);
}

for (const who of ["a", "b", "mod", "am", "bm", "modm"]) {
  const isMod = who === "mod" || who === "modm";
  await rest("profiles", { method: "POST", body: { id: users[who].id }, prefer: "resolution=ignore-duplicates" });
  if (!isMod) continue; // specs join a/b themselves to test join/leave/non-member guards
  const existing = await rest("memberships", { query: `?user_id=eq.${users[who].id}&community_id=eq.steady-ground&select=id` });
  if (existing.length === 0) {
    const rows = await rest("memberships", {
      method: "POST",
      body: { community_id: "steady-ground", user_id: users[who].id, alias: isMod ? `Mod${who}` : `River${who.toUpperCase()}`, role: isMod ? "moderator" : "member" },
      prefer: "return=representation",
    });
    console.log(`${who}: membership=${rows[0]?.id}`);
  } else {
    console.log(`${who}: membership exists=${existing[0]?.id}`);
    if (isMod) {
      await rest("memberships", { method: "PATCH", query: `?id=eq.${existing[0].id}`, body: { role: "moderator", status: "active" } });
    }
  }
}

writeFileSync(outPath, JSON.stringify({ a: users.a.jwt, b: users.b.jwt, mod: users.mod.jwt, am: users.am.jwt, bm: users.bm.jwt, modm: users.modm.jwt }));
console.log(`jwts written (values hidden)`);
