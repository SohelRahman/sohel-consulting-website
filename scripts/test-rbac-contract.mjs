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
check("Media deletion endpoint requires same-origin POST and media.manage permission", /path === "\/api\/admin\/media\/delete" && method === "POST"/.test(worker) && /if \(!sameOrigin\(request\)\) return json\(\{error:"Invalid request origin\."\},403\);/.test(worker) && /if\(!isAdmin && !allowed\)/.test(worker));
check("Media deletion validates folder-scoped public IDs and calls Cloudinary image destroy", /publicId\.startsWith\("sohel-consulting\/"\)/.test(worker) && /\/image\/destroy/.test(worker));
check("Media deletion removes the D1 record only after Cloudinary confirms deletion", /!\["ok","not found"\]\.includes\(cloudinaryResult\?\.result\)/.test(worker) && /DELETE FROM media_assets WHERE public_id=\?/.test(worker));
check("Media Library Delete button calls the deletion endpoint", /fetch\('\/api\/admin\/media\/delete'/.test(adminHtml));
check("User-management endpoints are Admin-only", /if\(!isAdmin\)return json\(\{error:"Only administrators can manage dashboard accounts\."\},403\)/.test(worker));
check("Self-service password changes require a 12-character minimum", /next\.length<12/.test(worker));
check("Password storage uses Cloudflare Workers-compatible PBKDF2 with 100,000 iterations", /iterations:100000,hash:"SHA-256"/.test(worker));
check("Sessions are bound to account session_version", /sessionVersion/.test(worker) && /session_version/.test(worker));
check("Session version is incremented after password change", /nextVersion=Number\(user\.session_version\)\+1/.test(worker));
check("Dashboard exposes role-based User Access controls", /User Access/i.test(adminHtml) && /permissions/i.test(adminHtml));
check("RBAC migration creates admin_users with constrained roles", /CREATE TABLE IF NOT EXISTS admin_users/.test(migration) && /CHECK \(role IN \('admin','user'\)\)/.test(migration));
check("RBAC migration stores active state and session version", /is_active INTEGER/.test(migration) && /session_version INTEGER/.test(migration));

check("Cloudinary upload signatures support PDF raw uploads and image uploads for course syllabi", /purpose=data\?\.purpose==="syllabus"/.test(worker) && /data\?\.fileType==="pdf"/.test(worker) && /allowedFormats=purpose==="syllabus"/.test(worker));
check("Syllabus upload is authenticated, same-origin and rate-limited", /path === "\/api\/admin\/media\/signature" && method === "POST"/.test(worker) && /if \(!sameOrigin\(request\)\)/.test(worker) && /purpose==="syllabus"\?"syllabus-upload":"media-upload"/.test(worker) && /bucket\+"-hour"/.test(worker) && /bucket\+"-day"/.test(worker));
check("Course form uploads PDF and supported images to Cloudinary and saves the returned URL", /course-syllabus-upload/.test(adminHtml) && /signed\.resourceType/.test(adminHtml) && /form\.elements\.syllabusUrl\.value=asset\.secure_url/.test(adminHtml));
check("Existing Media Library uploads include the signed allowed_formats parameter", /data\.append\('allowed_formats',signed\.allowedFormats\)/.test(adminHtml));
check("English and Bangla course detail pages display saved syllabus links", /course-syllabus-link/.test(fs.readFileSync("course.html","utf8")) && /course-syllabus-link/.test(fs.readFileSync("bn/course.html","utf8")));
check("Bangla course detail page displays active course discounts", /course-discount/.test(fs.readFileSync("bn/course.html","utf8")) && /activeDiscount/.test(fs.readFileSync("bn/course.html","utf8")));

if (failures.length) {
  console.error("\\nRBAC contract checks failed:");
  for (const failure of failures) console.error("- " + failure);
  process.exitCode = 1;
} else {
  console.log("\\nAll RBAC source-contract checks passed. These checks do not replace live API or browser tests.");
}
