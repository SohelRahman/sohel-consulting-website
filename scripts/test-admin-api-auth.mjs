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
console.log(`PASS authenticated Worker Admin API integration: ${expandedScenarios} scenarios`);
