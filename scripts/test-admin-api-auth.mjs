import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";

if (!globalThis.crypto) globalThis.crypto = webcrypto;
const { default: worker } = await import("../src/worker.js");

const secret = "integration-test-session-secret";
const userId = "test-admin-user";
const email = "admin@example.test";
const now = Date.now();

function b64url(bytes) {
  return Buffer.from(bytes).toString("base64url");
}
async function sessionCookie({ role = "admin", permissions = [], active = 1, sessionVersion = 4, tokenVersion = sessionVersion } = {}) {
  const payload = b64url(Buffer.from(JSON.stringify({
    userId, email, sessionVersion: tokenVersion, exp: now + 60_000
  })));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = b64url(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload)));
  return { cookie: `sr_admin=${payload}.${signature}`, user: { id: userId, email, full_name: "Test User", role, permissions_json: JSON.stringify(permissions), is_active: active, session_version: sessionVersion } };
}
function mockDb(user, { mfaEnabled = true } = {}) {
  return {
    prepare(sql) {
      let values = [];
      const statement = {
        bind(...args) { values = args; return statement; },
        async first() {
          if (sql.includes("FROM admin_users WHERE id=?")) return user;
          if (sql.includes("FROM admin_mfa_credentials WHERE user_id=?")) return mfaEnabled ? { enabled_at: "2026-01-01T00:00:00Z" } : null;
          if (sql.includes("registration_status='pending_review'")) return { n: 2 };
          if (sql.includes("enrollment_status='confirmed'")) return { n: 3 };
          if (sql.includes("COUNT(*) AS n FROM registrations")) return { n: 7 };
          if (sql.includes("FROM inquiries WHERE status")) return { n: 4 };
          throw new Error("Unexpected D1 first() query in test: " + sql);
        },
        async all() { return { results: [] }; },
        async run() { return { meta: { changes: 1 } }; }
      };
      return statement;
    }
  };
}

async function requestPath(path, { user, cookie, method = "GET", mfaEnabled = true } = {}) {
  return worker.fetch(new Request("https://example.test" + path, {
    method, headers: cookie ? { cookie } : {}
  }), { DB: mockDb(user, { mfaEnabled }), SESSION_SECRET: secret });
}

async function requestSummary({ user, cookie, mfaEnabled = true } = {}) {
  return worker.fetch(new Request("https://example.test/api/admin/summary", {
    headers: cookie ? { cookie } : {}
  }), { DB: mockDb(user, { mfaEnabled }), SESSION_SECRET: secret });
}

// No cookie: the actual Worker handler must reject the request.
{
  const response = await requestSummary();
  assert.equal(response.status, 401, "missing session returns HTTP 401");
}
// Admin: valid signed session and MFA state reach the protected handler.
{
  const auth = await sessionCookie({ role: "admin" });
  const response = await requestSummary({ user: auth.user, cookie: auth.cookie });
  assert.equal(response.status, 200, "Admin session can read summary");
  assert.deepEqual(await response.json(), { registrations: 7, pending: 2, confirmed: 3, openInquiries: 4 });
}
// Limited user without dashboard.view: authenticated but forbidden.
{
  const auth = await sessionCookie({ role: "user", permissions: ["courses.view"] });
  const response = await requestSummary({ user: auth.user, cookie: auth.cookie });
  assert.equal(response.status, 403, "limited user without dashboard.view returns HTTP 403");
}
// Revoked session: DB session_version no longer matches the signed token.
{
  const auth = await sessionCookie({ role: "admin", sessionVersion: 5, tokenVersion: 4 });
  const response = await requestSummary({ user: auth.user, cookie: auth.cookie });
  assert.equal(response.status, 401, "revoked session returns HTTP 401");
}
// Disabled account: valid token cannot bypass the database active-state check.
{
  const auth = await sessionCookie({ role: "admin", active: 0 });
  const response = await requestSummary({ user: auth.user, cookie: auth.cookie });
  assert.equal(response.status, 401, "disabled account returns HTTP 401");
}
// Valid identity without completed MFA is still rejected.
{
  const auth = await sessionCookie({ role: "admin" });
  const response = await requestSummary({ user: auth.user, cookie: auth.cookie, mfaEnabled: false });
  assert.equal(response.status, 401, "MFA enrollment gate returns HTTP 401");
}

let expandedScenarios = 6;
// A view-only course permission cannot invoke a course mutation.
{
  const auth = await sessionCookie({ role: "user", permissions: ["courses.view"] });
  const response = await requestPath("/api/admin/courses", { user: auth.user, cookie: auth.cookie, method: "POST" });
  assert.equal(response.status, 403, "courses.view cannot create or mutate courses");
  expandedScenarios++;
}
// A user with no course permission cannot read the course collection.
{
  const auth = await sessionCookie({ role: "user", permissions: ["dashboard.view"] });
  const response = await requestPath("/api/admin/courses", { user: auth.user, cookie: auth.cookie });
  assert.equal(response.status, 403, "dashboard.view does not grant courses.view");
  expandedScenarios++;
}
// Account administration remains Admin-only, independent of ordinary permissions.
{
  const auth = await sessionCookie({ role: "user", permissions: ["dashboard.view", "courses.manage", "content.manage"] });
  for (const [path, method] of [["/api/admin/users", "GET"], ["/api/admin/users", "POST"], ["/api/admin/users/target-user", "PATCH"], ["/api/admin/users/target-user", "DELETE"]]) {
    const response = await requestPath(path, { user: auth.user, cookie: auth.cookie, method });
    assert.equal(response.status, 403, `limited user is denied ${method} ${path}`);
    expandedScenarios++;
  }
}
// An administrator retains access to the account list endpoint.
{
  const auth = await sessionCookie({ role: "admin" });
  const response = await requestPath("/api/admin/users", { user: auth.user, cookie: auth.cookie });
  assert.equal(response.status, 200, "Admin can read account-management endpoint");
  assert.deepEqual(await response.json(), { users: [] });
  expandedScenarios++;
}

// Course view permission reaches the real collection handler.
{
  const auth = await sessionCookie({ role: "user", permissions: ["courses.view"] });
  const response = await requestPath("/api/admin/courses", { user: auth.user, cookie: auth.cookie });
  assert.equal(response.status, 200, "courses.view can read the course collection");
  assert.deepEqual(await response.json(), { courses: [] });
  expandedScenarios++;
}
// Manage permission passes RBAC and reaches input validation; no write is attempted.
{
  const auth = await sessionCookie({ role: "user", permissions: ["courses.manage"] });
  const response = await worker.fetch(new Request("https://example.test/api/admin/courses", {
    method: "POST",
    headers: { cookie: auth.cookie, origin: "https://example.test", "content-type": "application/json" },
    body: JSON.stringify({})
  }), { DB: mockDb(auth.user), SESSION_SECRET: secret });
  assert.equal(response.status, 400, "courses.manage reaches course validation (empty payload rejected)");
  assert.match((await response.json()).error, /title and URL slug are required/i);
  expandedScenarios++;
}
// View-only permission is denied before the same mutation validation path.
{
  const auth = await sessionCookie({ role: "user", permissions: ["courses.view"] });
  const response = await worker.fetch(new Request("https://example.test/api/admin/courses", {
    method: "POST",
    headers: { cookie: auth.cookie, origin: "https://example.test", "content-type": "application/json" },
    body: JSON.stringify({})
  }), { DB: mockDb(auth.user), SESSION_SECRET: secret });
  assert.equal(response.status, 403, "courses.view cannot reach course mutation validation");
  expandedScenarios++;
}


async function requestJson(path, { user, cookie, method = "POST", body = {}, origin = "https://example.test" } = {}) {
  return worker.fetch(new Request("https://example.test" + path, {
    method,
    headers: { cookie, origin, "content-type": "application/json" },
    body: JSON.stringify(body)
  }), { DB: mockDb(user), SESSION_SECRET: secret });
}
// Inquiry view access and mutation permission boundary.
{
  const auth = await sessionCookie({ role: "user", permissions: ["inquiries.view"] });
  const read = await requestPath("/api/admin/inquiries", { user: auth.user, cookie: auth.cookie });
  assert.equal(read.status, 200, "inquiries.view can read inquiry collection");
  assert.deepEqual(await read.json(), { inquiries: [] });
  const mutate = await requestJson("/api/admin/inquiries/123e4567-e89b-12d3-a456-426614174000", {
    user: auth.user, cookie: auth.cookie, method: "PATCH", body: { status: "invalid" }
  });
  assert.equal(mutate.status, 403, "inquiries.view cannot change inquiry status");
  expandedScenarios += 2;
}
// Inquiry manage permission passes RBAC and reaches status validation without a write.
{
  const auth = await sessionCookie({ role: "user", permissions: ["inquiries.manage"] });
  const response = await requestJson("/api/admin/inquiries/123e4567-e89b-12d3-a456-426614174000", {
    user: auth.user, cookie: auth.cookie, method: "PATCH", body: { status: "invalid" }
  });
  assert.equal(response.status, 400, "inquiries.manage reaches inquiry status validation");
  expandedScenarios++;
}
// Registration quote history is view-only; quote creation requires manage.
{
  const auth = await sessionCookie({ role: "user", permissions: ["registrations.view"] });
  const read = await requestPath("/api/admin/registrations/123e4567-e89b-12d3-a456-426614174000/quotes", { user: auth.user, cookie: auth.cookie });
  assert.equal(read.status, 200, "registrations.view can read quote history");
  assert.deepEqual(await read.json(), { quotations: [] });
  const mutate = await requestJson("/api/admin/registrations/123e4567-e89b-12d3-a456-426614174000/quote", {
    user: auth.user, cookie: auth.cookie, method: "PATCH", body: { amount: 0 }
  });
  assert.equal(mutate.status, 403, "registrations.view cannot create a quote");
  expandedScenarios += 2;
}
{
  const auth = await sessionCookie({ role: "user", permissions: ["registrations.manage"] });
  const response = await requestJson("/api/admin/registrations/123e4567-e89b-12d3-a456-426614174000/quote", {
    user: auth.user, cookie: auth.cookie, method: "PATCH", body: { amount: 0 }
  });
  assert.equal(response.status, 400, "registrations.manage reaches quote amount validation");
  expandedScenarios++;
}
// Chat view and reply permissions are distinct.
{
  const auth = await sessionCookie({ role: "user", permissions: ["chat.view"] });
  const read = await requestPath("/api/admin/chat/conversations", { user: auth.user, cookie: auth.cookie });
  assert.equal(read.status, 200, "chat.view can read conversation list");
  assert.deepEqual(await read.json(), { conversations: [] });
  const reply = await requestJson("/api/admin/chat/conversations/123e4567-e89b-12d3-a456-426614174000", {
    user: auth.user, cookie: auth.cookie, method: "POST", body: { message: "" }
  });
  assert.equal(reply.status, 403, "chat.view cannot reply to conversations");
  expandedScenarios += 2;
}
{
  const auth = await sessionCookie({ role: "user", permissions: ["chat.reply"] });
  const response = await requestJson("/api/admin/chat/conversations/123e4567-e89b-12d3-a456-426614174000", {
    user: auth.user, cookie: auth.cookie, method: "POST", body: { message: "" }
  });
  assert.equal(response.status, 400, "chat.reply reaches reply validation");
  expandedScenarios++;
}

console.log(`PASS authenticated Worker Admin API integration: ${expandedScenarios} scenarios`);
