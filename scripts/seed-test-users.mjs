#!/usr/bin/env node
/**
 * One-off local test-data seeder (NOT committed for CI use).
 * Reads .env.local, creates two users + one moderator via the Auth Admin API,
 * joins them to steady-ground, and writes JWTs to a temp file for Playwright.
 * Never prints secrets: stdout shows user ids and membership ids only.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outPath = process.argv[2] ?? "C:\\tmp\\test_jwts.json";

function loadEnv() {
  const env = {};
  const file = join(root, ".env.local");
  if (!existsSync(file)) throw new Error(".env.local missing");
  for (const raw of readFileSync(file, "utf8").split("\n")) {
    const line = raw.trim();
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (match) env[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

const env = loadEnv();
const base = (env.SUPABASE_URL ?? "").replace(/\/$/, "");
const anon = env.SUPABASE_ANON_KEY ?? "";
const svc = env.SUPABASE_SERVICE_ROLE_KEY ?? "";
if (!base || !anon || !svc) throw new Error("Supabase env vars missing");

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
