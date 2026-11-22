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


const mutationHandlers = worker.split("\n");
const mutationRoutes = [];
for (let index = 0; index < mutationHandlers.length; index++) {
  if (/method\s*===?\s*["'](?:POST|PUT|PATCH|DELETE)["']/.test(mutationHandlers[index])) {
    mutationRoutes.push({ line: index + 1, source: mutationHandlers.slice(index + 1, index + 5).join("\n") });
  }
}
check("Every declared POST, PUT, PATCH and DELETE handler enforces same-origin requests", mutationRoutes.length > 0 && mutationRoutes.every(route => /sameOrigin\(request\)/.test(route.source)));
check("Every Admin API path family has an explicit permission mapping or an Admin-only account-management boundary", [
  'path==="/api/admin/me" || path==="/api/admin/users"',
  'path.startsWith("/api/admin/courses/")',
  'path.startsWith("/api/admin/registrations/")',
  'path.startsWith("/api/admin/inquiries/")',
  'path.startsWith("/api/admin/cms/")',
  'path.startsWith("/api/admin/site-content/")',
  'path.startsWith("/api/admin/media/")',
  'path.startsWith("/api/admin/pages/")',
  'path.startsWith("/api/admin/chat/conversations/")'
].every(route => worker.includes(route)));

check("All documented RBAC permissions are defined", permissions.every(p => worker.includes('"'+p+'"')));
check("Admin role receives the complete permission set", /if\(user\?\.role==="admin"\)return ADMIN_PERMISSIONS/.test(worker));
check("Unknown admin API routes fail closed for User accounts", /const allowed=Boolean\(required &&/.test(worker) && /if\(!isAdmin && !allowed\)return json\(\{error:"You do not have permission/.test(worker));
check("Manage permissions imply view permissions", worker.includes('required.endsWith(".view")') && worker.includes('required.replace(/\\.view$/, ".manage")'));
check("Chat reply permission implies chat view", /required==="chat\.view" && permissions\.includes\("chat\.reply"\)/.test(worker));
check("Media deletion endpoint requires same-origin POST and media.manage permission", /path === "\/api\/admin\/media\/delete" && method === "POST"/.test(worker) && /if \(!sameOrigin\(request\)\) return json\(\{error:"Invalid request origin\."\},403\);/.test(worker) && /if\(!isAdmin && !allowed\)/.test(worker));
check("Media deletion validates folder-scoped public IDs and calls Cloudinary image destroy", /publicId\.startsWith\("sohel-consulting\/"\)/.test(worker) && /\/image\/destroy/.test(worker));
check("Media deletion removes the D1 record only after Cloudinary confirms deletion", /!\["ok","not found"\]\.includes\(cloudinaryResult\?\.result\)/.test(worker) && /DELETE FROM media_assets WHERE public_id=\?/.test(worker));
check("Media Library Delete button calls the deletion endpoint", /fetch\('\/api\/admin\/media\/delete'/.test(adminHtml));
check("User-management endpoints are Admin-only", /if\(!isAdmin\)return json\(\{error:"Only administrators can manage dashboard accounts\."\},403\)/.test(worker));
check("Self-service password changes require a 12-character minimum", /next\.length<12/.test(worker));
check("Worker imports the shared versioned PBKDF2 password helper", /from "\.\/password-hash\.js"/.test(worker));
check("Successful login upgrades legacy password hashes without overwriting concurrent password changes", /needsPasswordRehash\(user\.password_hash\)/.test(worker) && /WHERE id=\? AND password_hash=\?/.test(worker));
check("Password helper uses PBKDF2-HMAC-SHA-256 with the 600,000-iteration current work factor", /CURRENT_ITERATIONS = 600000/.test(fs.readFileSync("src/password-hash.js", "utf8")));
check("Password helper retains legacy 100,000-iteration verification for gradual migration", /LEGACY_ITERATIONS = 100000/.test(fs.readFileSync("src/password-hash.js", "utf8")));
check("Password hashing has dedicated compatibility and malformed-hash tests", fs.existsSync("scripts/test-password-hash.mjs"));
check("Sessions are bound to account session_version", /sessionVersion/.test(worker) && /session_version/.test(worker));
check("Session version is incremented after password change", /nextVersion=Number\(user\.session_version\)\+1/.test(worker));
check("Admin account edits always increment session_version to invalidate existing sessions", /session_version=session_version\+1,updated_at=CURRENT_TIMESTAMP WHERE id=\?/.test(worker));
check("Disabling an Admin account increments session_version so old sessions stay revoked after reactivation", /UPDATE admin_users SET is_active=0,session_version=session_version\+1,updated_at=CURRENT_TIMESTAMP WHERE id=\?/.test(worker));
check("Dashboard exposes role-based User Access controls", /User Access/i.test(adminHtml) && /permissions/i.test(adminHtml));
check("RBAC migration creates admin_users with constrained roles", /CREATE TABLE IF NOT EXISTS admin_users/.test(migration) && /CHECK \(role IN \('admin','user'\)\)/.test(migration));
check("RBAC migration stores active state and session version", /is_active INTEGER/.test(migration) && /session_version INTEGER/.test(migration));

check("Cloudinary uploads are proxied through an authenticated same-origin Worker endpoint", /path === "\/api\/admin\/media\/upload" && method === "POST"/.test(worker) && /if \(!sameOrigin\(request\)\)/.test(worker) && /request\.formData\(\)/.test(worker) && /\/image\/upload/.test(worker));
check("Worker enforces 3 MB image and 10 MB PDF size limits", /3\*1024\*1024/.test(worker) && /10\*1024\*1024/.test(worker) && /file\.size>maxBytes/.test(worker));
check("Worker validates actual file signatures for PDF, JPEG, PNG, GIF and WebP", /%PDF-/.test(worker) && /0xff,0xd8,0xff/.test(worker) && /0x89,0x50,0x4e,0x47/.test(worker) && /GIF87a/.test(worker) && /RIFF/.test(worker) && /WEBP/.test(worker));
check("Upload signatures and Cloudinary API credentials are no longer returned to the browser", !worker.includes("/api/admin/media/signature") && !adminHtml.includes("/api/admin/media/signature") && !adminHtml.includes("signed.apiKey"));
check("Worker assigns an unpredictable public ID and verifies Cloudinary upload metadata", /crypto\.randomUUID\(\)/.test(worker) && /asset\.public_id!==publicId/.test(worker) && /asset\.bytes!==file\.size/.test(worker) && /asset\.resource_type!==resourceType/.test(worker));
check("Media library records are created from the Worker-verified Cloudinary response", /INSERT INTO media_assets/.test(worker) && !/path === "\/api\/admin\/media" && method === "POST"/.test(worker));
check("Upload rate limits remain enforced for hourly and daily quotas", /bucket\+"-hour"/.test(worker) && /bucket\+"-day"/.test(worker));
check("Admin media and syllabus forms submit files to the same-origin Worker upload endpoint", (adminHtml.match(/\/api\/admin\/media\/upload/g)||[]).length===2 && /data\.append\('purpose','syllabus'\)/.test(adminHtml) && /form\.elements\.syllabusFileUrl\.value=asset\.secure_url/.test(adminHtml));
check("English and Bangla course detail pages display reference and uploaded syllabus links separately", /course-reference-link/.test(fs.readFileSync("course.html","utf8")) && /course-file-link/.test(fs.readFileSync("course.html","utf8")) && /course-reference-link/.test(fs.readFileSync("bn/course.html","utf8")) && /course-file-link/.test(fs.readFileSync("bn/course.html","utf8")));
check("Course syllabus file URL has a dedicated migration and is persisted by create and update APIs", /ALTER TABLE courses ADD COLUMN syllabus_file_url TEXT/.test(fs.readFileSync("migrations/0011_course_syllabus_file_url.sql","utf8")) && /syllabus_file_url/.test(worker));
check("Bangla course detail page displays active course discounts", /course-discount/.test(fs.readFileSync("bn/course.html","utf8")) && /activeDiscount/.test(fs.readFileSync("bn/course.html","utf8")));

if (failures.length) {
  console.error("\\nRBAC contract checks failed:");
  for (const failure of failures) console.error("- " + failure);
  process.exitCode = 1;
} else {
  console.log("\\nAll RBAC source-contract checks passed. These checks do not replace live API or browser tests.");
}
