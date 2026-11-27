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
async function sessionCookie({ role = "admin", permissions = [], active = 1, sessionVersion = 4, tokenVersion = sessionVersion, id: sessionUserId = userId, email: sessionEmail = email } = {}) {
  const payload = b64url(Buffer.from(JSON.stringify({
    userId: sessionUserId, email: sessionEmail, sessionVersion: tokenVersion, exp: now + 60_000
  })));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = b64url(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload)));
  return { cookie: `sr_admin=${payload}.${signature}`, user: { id: sessionUserId, email: sessionEmail, full_name: "Test User", role, permissions_json: JSON.stringify(permissions), is_active: active, session_version: sessionVersion } };
}
function mockDb(user, { mfaEnabled = true, targetUser = null, activeAdminCount = 2, createdUsers = [] } = {}) {
  return {
    prepare(sql) {
      let values = [];
      const statement = {
        bind(...args) { values = args; return statement; },
        async first() {
          if (sql.includes("FROM admin_users WHERE id=?")) {
            if (values[0] === user.id) return user;
            if (targetUser && values[0] === targetUser.id) return targetUser;
            return null;
          }
          if (sql.includes("COUNT(*) AS n FROM admin_users WHERE role='admin' AND is_active=1")) return { n: activeAdminCount };
          if (sql.includes("FROM admin_mfa_credentials WHERE user_id=?")) return mfaEnabled ? { enabled_at: "2026-01-01T00:00:00Z" } : null;
          if (sql.includes("registration_status='pending_review'")) return { n: 2 };
          if (sql.includes("enrollment_status='confirmed'")) return { n: 3 };
          if (sql.includes("COUNT(*) AS n FROM registrations")) return { n: 7 };
          if (sql.includes("FROM inquiries WHERE status")) return { n: 4 };
          throw new Error("Unexpected D1 first() query in test: " + sql);
        },
        async all() {
          if (sql.includes("FROM admin_users ORDER BY role,email")) return { results: [...(targetUser ? [targetUser] : []), ...createdUsers] };
          return { results: [] };
        },
        async run() {
          if (sql.includes("INSERT INTO admin_users (id,email,full_name,role,password_hash,permissions_json,is_active)")) {
            createdUsers.push({ id: values[0], email: values[1], full_name: values[2], role: values[3], password_hash: values[4], permissions_json: values[5], is_active: 1 });
          } else if (targetUser && sql.includes("UPDATE admin_users SET full_name=COALESCE")) {
            targetUser.full_name = values[0] ?? targetUser.full_name;
            targetUser.role = values[1];
            targetUser.is_active = values[2];
            targetUser.permissions_json = values[3];
            targetUser.session_version = Number(targetUser.session_version || 0) + 1;
          } else if (targetUser && sql.includes("UPDATE admin_users SET is_active=0,session_version=session_version+1")) {
            targetUser.is_active = 0;
            targetUser.session_version = Number(targetUser.session_version || 0) + 1;
          }
          return { meta: { changes: 1 } };
        }
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

// Account-management self-protection: an administrator cannot disable or demote their own account.
{
  const targetPath = "/api/admin/users/123e4567-e89b-12d3-a456-426614174000";
  const auth = await sessionCookie({ role: "admin", id: "123e4567-e89b-12d3-a456-426614174000" });
  const disable = await requestJson(targetPath, {
    user: auth.user, cookie: auth.cookie, method: "PATCH", body: { is_active: false }
  });
  assert.equal(disable.status, 400, "Admin cannot disable their own account through account management");
  const demote = await requestJson(targetPath, {
    user: auth.user, cookie: auth.cookie, method: "PATCH", body: { role: "user" }
  });
  assert.equal(demote.status, 400, "Admin cannot demote their own account through account management");
  const remove = await requestJson(targetPath, {
    user: auth.user, cookie: auth.cookie, method: "DELETE", body: {}
  });
  assert.equal(remove.status, 400, "Admin cannot delete their own account");
  expandedScenarios += 3;
}
// The account manager must preserve the final active administrator.
{
  const auth = await sessionCookie({ role: "admin" });
  const targetId = "123e4567-e89b-12d3-a456-426614174001";
  const targetUser = { id: targetId, email: "other-admin@example.test", role: "admin", is_active: 1, permissions_json: "[]" };
  const db = mockDb(auth.user, { targetUser, activeAdminCount: 1 });
  const patch = await worker.fetch(new Request("https://example.test/api/admin/users/" + targetId, {
    method: "PATCH",
    headers: { cookie: auth.cookie, origin: "https://example.test", "content-type": "application/json" },
    body: JSON.stringify({ is_active: false })
  }), { DB: db, SESSION_SECRET: secret });
  assert.equal(patch.status, 409, "Admin cannot disable the last active administrator");

  const remove = await worker.fetch(new Request("https://example.test/api/admin/users/" + targetId, {
    method: "DELETE",
    headers: { cookie: auth.cookie, origin: "https://example.test" }
  }), { DB: db, SESSION_SECRET: secret });
  assert.equal(remove.status, 409, "Admin cannot delete the last active administrator");
  expandedScenarios += 2;
}

// Account creation stores an allowlisted permission set and returns a created identifier.
{
  const auth = await sessionCookie({ role: "admin" });
  const createdUsers = [];
  const response = await worker.fetch(new Request("https://example.test/api/admin/users", {
    method: "POST",
    headers: { cookie: auth.cookie, origin: "https://example.test", "content-type": "application/json" },
    body: JSON.stringify({
      email: "new-limited@example.test",
      name: "New Limited User",
      password: "Valid-Test-Password-2026",
      role: "user",
      permissions: ["courses.view", "unknown.permission"]
    })
  }), { DB: mockDb(auth.user, { createdUsers }), SESSION_SECRET: secret });
  assert.equal(response.status, 201, "Admin can create a limited account");
  const result = await response.json();
  assert.match(result.id, /^[0-9a-f-]{36}$/i, "creation returns a UUID");
  assert.equal(createdUsers.length, 1);
  assert.deepEqual(JSON.parse(createdUsers[0].permissions_json), ["courses.view"]);
  assert.notEqual(createdUsers[0].password_hash, "Valid-Test-Password-2026", "password is stored as a hash, not plaintext");
  expandedScenarios++;
}

// Account listing returns the configured account fields but never password hashes.
{
  const auth = await sessionCookie({ role: "admin" });
  const target = { id: "123e4567-e89b-12d3-a456-426614174002", email: "limited@example.test", full_name: "Limited User", role: "user", permissions_json: '["courses.view"]', is_active: 1, password_hash: "must-not-leak" };
  const response = await worker.fetch(new Request("https://example.test/api/admin/users", {
    headers: { cookie: auth.cookie }
  }), { DB: mockDb(auth.user, { targetUser: target }), SESSION_SECRET: secret });
  assert.equal(response.status, 200, "Admin can list configured accounts");
  const payload = await response.json();
  assert.equal(payload.users.length, 1);
  assert.equal(payload.users[0].id, target.id);
  assert.deepEqual(payload.users[0].permissions, ["courses.view"]);
  assert.equal("password_hash" in payload.users[0], false, "account list never exposes password hashes");
  expandedScenarios++;
}

// Permission edits increment the target session version and persist the allowlisted permission set.
{
  const auth = await sessionCookie({ role: "admin" });
  const target = { id: "123e4567-e89b-12d3-a456-426614174003", email: "limited@example.test", role: "user", is_active: 1, permissions_json: "[]", session_version: 7 };
  const response = await worker.fetch(new Request("https://example.test/api/admin/users/" + target.id, {
    method: "PATCH",
    headers: { cookie: auth.cookie, origin: "https://example.test", "content-type": "application/json" },
    body: JSON.stringify({ permissions: ["courses.view", "unknown.permission"] })
  }), { DB: mockDb(auth.user, { targetUser: target }), SESSION_SECRET: secret });
  assert.equal(response.status, 200, "Admin can update a limited account's permissions");
  assert.deepEqual(JSON.parse(target.permissions_json), ["courses.view"], "unknown permissions are discarded");
  assert.equal(target.session_version, 8, "permission change revokes existing sessions");
  expandedScenarios++;
}

// Disabling an account revokes its existing signed session.
{
  const actor = await sessionCookie({ role: "admin" });
  const target = { id: "123e4567-e89b-12d3-a456-426614174004", email: "disabled@example.test", full_name: "Disabled User", role: "user", is_active: 1, permissions_json: "[]", session_version: 3 };
  const oldSession = await sessionCookie({ role: "user", id: target.id, email: target.email, sessionVersion: 3 });
  const disable = await worker.fetch(new Request("https://example.test/api/admin/users/" + target.id, {
    method: "PATCH",
    headers: { cookie: actor.cookie, origin: "https://example.test", "content-type": "application/json" },
    body: JSON.stringify({ is_active: false })
  }), { DB: mockDb(actor.user, { targetUser: target }), SESSION_SECRET: secret });
  assert.equal(disable.status, 200, "Admin can disable a separate limited account");
  assert.equal(target.is_active, 0);
  const followup = await requestSummary({ user: target, cookie: oldSession.cookie });
  assert.equal(followup.status, 401, "disabled account's previously signed session is rejected");
  expandedScenarios += 2;
}

// Password reset advances session_version and rejects the target's previous signed session.
{
  const actor = await sessionCookie({ role: "admin" });
  const target = { id: "123e4567-e89b-12d3-a456-426614174005", email: "reset@example.test", full_name: "Reset User", role: "user", is_active: 1, permissions_json: "[]", session_version: 11 };
  const oldSession = await sessionCookie({ role: "user", id: target.id, email: target.email, sessionVersion: 11 });
  const reset = await worker.fetch(new Request("https://example.test/api/admin/users/" + target.id, {
    method: "PATCH",
    headers: { cookie: actor.cookie, origin: "https://example.test", "content-type": "application/json" },
    body: JSON.stringify({ password: "New-Strong-Test-Password-2026" })
  }), { DB: mockDb(actor.user, { targetUser: target }), SESSION_SECRET: secret });
  assert.equal(reset.status, 200, "Admin can reset a separate account password");
  assert.equal(target.session_version, 12, "password reset increments session version");
  const followup = await requestSummary({ user: target, cookie: oldSession.cookie });
  assert.equal(followup.status, 401, "password reset invalidates the previous signed session");
  expandedScenarios += 2;
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


 // CMS read access and content-edit permission boundary.
{
  const auth = await sessionCookie({ role: "user", permissions: ["content.view"] });
  const read = await requestPath("/api/admin/cms?page=home&lang=en", { user: auth.user, cookie: auth.cookie });
  assert.equal(read.status, 200, "content.view can read CMS page content");
  assert.deepEqual(await read.json(), { page: "home", language: "en", content: [] });
  const save = await requestJson("/api/admin/cms/save", {
    user: auth.user, cookie: auth.cookie, method: "POST", body: {}
  });
  assert.equal(save.status, 403, "content.view cannot save CMS drafts");
  expandedScenarios += 2;
}
{
  const auth = await sessionCookie({ role: "user", permissions: ["content.manage"] });
  const response = await requestJson("/api/admin/cms/save", {
    user: auth.user, cookie: auth.cookie, method: "POST", body: {}
  });
  assert.equal(response.status, 400, "content.manage reaches CMS draft validation");
  expandedScenarios++;
}


 // CMS publishing is a manage-only operation.
{
  const auth = await sessionCookie({ role: "user", permissions: ["content.view"] });
  const response = await requestJson("/api/admin/cms/publish", {
    user: auth.user, cookie: auth.cookie, method: "POST", body: { page: "home" }
  });
  assert.equal(response.status, 403, "content.view cannot publish CMS content");
  expandedScenarios++;
}
{
  const auth = await sessionCookie({ role: "user", permissions: ["content.manage"] });
  const response = await requestJson("/api/admin/cms/publish", {
    user: auth.user, cookie: auth.cookie, method: "POST", body: { page: "../invalid" }
  });
  assert.equal(response.status, 400, "content.manage reaches CMS publish page validation");
  expandedScenarios++;
}

console.log(`PASS authenticated Worker Admin API integration: ${expandedScenarios} scenarios`);
