import fs from "node:fs";
import assert from "node:assert/strict";

const worker = fs.readFileSync("src/worker.js", "utf8");
const migration = fs.readFileSync("migrations/0009_admin_rbac.sql", "utf8");
const adminHtml = fs.readFileSync("admin.html", "utf8");
const deletionMigration = fs.readFileSync("migrations/0014_cloudinary_delete_operations.sql", "utf8");

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
check("Media deletion validates folder-scoped public IDs and uses the shared Cloudinary destroy helper", worker.includes('publicId.startsWith("sohel-consulting/")') && worker.includes("async function destroyCloudinaryAsset"));
check("Media deletion journals the operation before Cloudinary and finalizes D1 only after confirmation", worker.includes("INSERT INTO cloudinary_delete_operations") && worker.includes('target_type:"media"') && worker.includes("DELETE FROM media_assets WHERE public_id=?"));
check("Cloudinary deletion journal supports pending, failed and completed states with retry metadata", deletionMigration.includes("status TEXT NOT NULL DEFAULT 'pending'") && deletionMigration.includes("attempts INTEGER NOT NULL DEFAULT 0") && deletionMigration.includes("last_error TEXT"));
check("Admin recovery endpoint retries pending and failed Cloudinary deletions", worker.includes('path === "/api/admin/media/reconcile" && method === "POST"') && worker.includes("status IN ('pending','failed')") && worker.includes("destroyCloudinaryAsset(env,operation.public_id)"));
check("Course syllabus deletion is journaled with its prior URL for safe conditional finalization", worker.includes("target_type,target_id,previous_url,status") && worker.includes('target_type:"course_syllabus"') && worker.includes("WHERE id=? AND syllabus_file_url=?"));
check("Admin Media Library exposes the retry action", adminHtml.includes("media-reconcile") && adminHtml.includes("/api/admin/media/reconcile"));
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
