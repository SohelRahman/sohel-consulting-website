import fs from "node:fs";
import assert from "node:assert/strict";

const worker = fs.readFileSync("src/worker.js", "utf8");
const migration = fs.readFileSync("migrations/0009_admin_rbac.sql", "utf8");
const adminHtml = fs.readFileSync("admin.html", "utf8");

const permissions = [
  "dashboard.view",
  "courses.view", "courses.manage",
  "content.view", "content.manage",
  "styles.view", "styles.manage",
  "pages.view", "pages.manage",
  "media.view", "media.manage",
  "registrations.view", "registrations.manage",
  "inquiries.view", "inquiries.manage",
  "analytics.view",
  "chat.view", "chat.reply"
];

const failures = [];
function check(name, condition) {
  try { assert.ok(condition, name); console.log("PASS " + name); }
  catch (error) { failures.push(error.message); console.error("FAIL " + name); }
}

check("All documented RBAC permissions are defined", permissions.every(p => worker.includes('"'+p+'"')));
check("Admin role receives the complete permission set", /if\(user\?\.role==="admin"\)return ADMIN_PERMISSIONS/.test(worker));
check("Unknown admin API routes fail closed for User accounts", /const allowed=Boolean\(required &&/.test(worker) && /if\(!isAdmin && !allowed\)return json\(\{error:"You do not have permission/.test(worker));
check("Manage permissions imply view permissions", worker.includes('required.endsWith(".view")') && worker.includes('required.replace(/\\.view$/, ".manage")'));
check("Chat reply permission implies chat view", /required==="chat\.view" && permissions\.includes\("chat\.reply"\)/.test(worker));
check("User-management endpoints are Admin-only", /if\(!isAdmin\)return json\(\{error:"Only administrators can manage dashboard accounts\."\},403\)/.test(worker));
check("Self-service password changes require a 12-character minimum", /next\.length<12/.test(worker));
check("Password storage uses Cloudflare Workers-compatible PBKDF2 with 100,000 iterations", /iterations:100000,hash:"SHA-256"/.test(worker));
check("Sessions are bound to account session_version", /sessionVersion/.test(worker) && /session_version/.test(worker));
check("Session version is incremented after password change", /nextVersion=Number\(user\.session_version\)\+1/.test(worker));
check("Dashboard exposes role-based User Access controls", /User Access/i.test(adminHtml) && /permissions/i.test(adminHtml));
check("RBAC migration creates admin_users with constrained roles", /CREATE TABLE IF NOT EXISTS admin_users/.test(migration) && /CHECK \(role IN \('admin','user'\)\)/.test(migration));
check("RBAC migration stores active state and session version", /is_active INTEGER/.test(migration) && /session_version INTEGER/.test(migration));

if (failures.length) {
  console.error("\\nRBAC contract checks failed:");
  for (const failure of failures) console.error("- " + failure);
  process.exitCode = 1;
} else {
  console.log("\\nAll RBAC source-contract checks passed. These checks do not replace live API or browser tests.");
}
