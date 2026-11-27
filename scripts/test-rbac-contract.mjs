import fs from "node:fs";
import assert from "node:assert/strict";

const worker = fs.readFileSync("src/worker.js", "utf8");
const migration = fs.readFileSync("migrations/0009_admin_rbac.sql", "utf8");
const adminHtml = fs.readFileSync("admin.html", "utf8");
const deletionMigration = fs.readFileSync("migrations/0014_cloudinary_delete_operations.sql", "utf8");
const referenceLockMigration = fs.readFileSync("migrations/0015_cloudinary_reference_locks.sql", "utf8");
const uploadJournalMigration = fs.readFileSync("migrations/0016_cloudinary_upload_operations.sql", "utf8");

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

// Exercise the real permission-mapping function in isolation, rather than relying only on source-pattern checks.
const permissionFunctionStart = worker.indexOf("function requiredPermission(path, method) {");
const permissionFunctionEnd = worker.indexOf("\nasync function makeSession", permissionFunctionStart);
assert.ok(permissionFunctionStart >= 0 && permissionFunctionEnd > permissionFunctionStart, "requiredPermission function can be isolated");
const requiredPermission = new Function(worker.slice(permissionFunctionStart, permissionFunctionEnd) + "\nreturn requiredPermission;")();
const routePermissionCases = [
  ["/api/admin/summary", "GET", "dashboard.view"],
  ["/api/admin/courses", "GET", "courses.view"],
  ["/api/admin/courses/abc", "GET", "courses.view"],
  ["/api/admin/courses", "POST", "courses.manage"],
  ["/api/admin/registrations", "GET", "registrations.view"],
  ["/api/admin/registrations/abc", "PATCH", "registrations.manage"],
  ["/api/admin/inquiries", "GET", "inquiries.view"],
  ["/api/admin/inquiries/abc", "POST", "inquiries.manage"],
  ["/api/admin/cms/history", "GET", "content.view"],
  ["/api/admin/cms/pages", "GET", "content.view"],
  ["/api/admin/cms/publish", "POST", "content.manage"],
  ["/api/admin/site-content/key", "PUT", "content.manage"],
  ["/api/admin/page-styles", "GET", "styles.view"],
  ["/api/admin/page-styles", "PUT", "styles.manage"],
  ["/api/admin/pages", "GET", "pages.view"],
  ["/api/admin/pages/home", "DELETE", "pages.manage"],
  ["/api/admin/media", "GET", "media.view"],
  ["/api/admin/media", "POST", "media.manage"],
  ["/api/admin/media/audit", "GET", "media.view"],
  ["/api/admin/media/audit", "POST", null],
  ["/api/admin/media/inventory", "GET", "media.view"],
  ["/api/admin/media/inventory", "POST", "media.manage"],
  ["/api/admin/analytics", "GET", "analytics.view"],
  ["/api/admin/chat/conversations", "GET", "chat.view"],
  ["/api/admin/chat/conversations/abc", "POST", "chat.reply"],
  ["/api/admin/me", "GET", null],
  ["/api/admin/users", "GET", null],
  ["/api/admin/not-a-real-route", "GET", null]
];
for (const [path, method, expected] of routePermissionCases) {
  assert.equal(requiredPermission(path, method), expected, `permission mapping: ${method} ${path}`);
}
assert.equal(requiredPermission("/api/admin/courses", "OPTIONS"), "courses.manage", "unsupported methods never receive read permission");

// Exercise the real permission normalizer for Admin and limited-user roles.
const permissionModelStart = worker.indexOf("const ADMIN_PERMISSIONS = [");
const permissionModelEnd = worker.indexOf("\nasync function makeSession", permissionModelStart);
assert.ok(permissionModelStart >= 0 && permissionModelEnd > permissionModelStart, "permission model can be isolated");
const permissionModel = new Function(worker.slice(permissionModelStart, permissionModelEnd) + "\nreturn { ADMIN_PERMISSIONS, permissionsFor };")();
assert.deepEqual(permissionModel.permissionsFor({ role: "admin", permissions_json: "[]" }), permissionModel.ADMIN_PERMISSIONS, "Admin role always receives the complete permission set");
assert.deepEqual(permissionModel.permissionsFor({ role: "user", permissions_json: JSON.stringify(["courses.view", "media.manage", "unknown.admin", "dashboard.delete"]) }), ["courses.view", "media.manage"], "limited users receive only allowlisted permissions");
assert.deepEqual(permissionModel.permissionsFor({ role: "user", permissions_json: "{malformed" }), [], "malformed permission JSON fails closed");
assert.deepEqual(permissionModel.permissionsFor({ role: "user", permissions_json: JSON.stringify({ permission: "courses.manage" }) }), [], "non-array permission data fails closed");

const failures = [];
function check(name, condition) {
  try { assert.ok(condition, name); console.log("PASS " + name); }
  catch (error) { failures.push(error.message); console.error("FAIL " + name); }
}


const mutationHandlers = worker.slice(worker.indexOf("async function handleApi")).split("\n");
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
check("Cloudinary inventory endpoint is permission-gated and rate-limited for persistent scan operations", worker.includes('path==="/api/admin/media/inventory"') && worker.includes('if (path === "/api/admin/media/inventory")') && worker.includes('rateLimit(env,request,"media-remote-inventory",60,60*60*1000)') && worker.includes('return method==="GET"?"media.view":method==="POST"?"media.manage":null;'));
check("Persistent remote inventory uses Cloudinary Basic Auth, image/raw prefix pagination and bounded page size", worker.includes('"/resources/"+target+"/upload"') && worker.includes('set("prefix","sohel-consulting/")') && worker.includes('set("max_results","100")') && worker.includes('authorization:"Basic "+credentials') && worker.includes('["image","raw"]'));
check("Persistent inventory snapshot is compared only after both resource types complete", worker.includes("if(after.image_complete&&after.raw_complete)") && worker.includes('scan.status==="complete"') && worker.includes("cloudinary_inventory_assets WHERE scan_id=? LIMIT 50001") && worker.includes("FROM cloudinary_upload_operations WHERE status<>'deleted'"));
check("Admin Media Library exposes persistent image/raw inventory scans and resume controls", adminHtml.includes("media-inventory-image") && adminHtml.includes("media-inventory-raw") && adminHtml.includes("media-inventory-start") && adminHtml.includes("media-inventory-refresh"));
const inventoryMigration = fs.readFileSync("migrations/0017_cloudinary_inventory_snapshots.sql", "utf8");
check("Persistent Cloudinary inventory migration stores independent image/raw cursors, page states and remote asset snapshots", inventoryMigration.includes("cloudinary_inventory_scans") && inventoryMigration.includes("image_cursor") && inventoryMigration.includes("raw_cursor") && inventoryMigration.includes("image_complete") && inventoryMigration.includes("raw_complete") && inventoryMigration.includes("cloudinary_inventory_assets") && inventoryMigration.includes("PRIMARY KEY (scan_id, resource_type, public_id)"));
check("Inventory scan schema enforces one active scan with a partial unique index", inventoryMigration.includes("idx_cloudinary_inventory_one_running_scan") && inventoryMigration.includes("WHERE status = 'running'"));
check("Persistent Cloudinary inventory rejects methods outside GET and POST", worker.includes('if (!["GET","POST"].includes(method)) return json({error:"Method not allowed."},405)'));
check("Inventory reconciliation uses literal prefix matching rather than SQL LIKE wildcard semantics", worker.includes("instr(public_id,'sohel-consulting/')=1") && !worker.includes("public_id LIKE 'sohel-consulting/%'"));
check("Inventory reconciliation withholds missing-remote results when a local asset resource type is unknown", worker.includes("unclassifiedLocalRecords") && worker.includes("missing-remote comparison withheld"));
check("Inventory comparison preserves the specific remote snapshot cap explanation", worker.includes("Remote snapshot exceeded the 50,000-record comparison cap; missing-remote comparison withheld.") && worker.includes("missing.scope=\"D1 media"));
check("Cloudinary inventory reads require media.view while scan-start and scan-step POST operations require media.manage", worker.includes('if(path==="/api/admin/media/inventory")return method==="GET"?"media.view":method==="POST"?"media.manage":null;'));
check("Persistent inventory scan API supports same-origin start/step, per-resource leases, stale scans and a bounded 500-page cap", worker.includes('body?.action==="start"') && worker.includes('body?.action==="step"') && worker.includes('sameOrigin(request)') && worker.includes('target+"_lease_until"') && worker.includes('target+"_cursor"') && worker.includes('pages||0)>=500') && worker.includes("datetime('now','-24 hours')"));
check("Persistent inventory only completes after image and raw scans finish and withholds comparison when local or remote caps are exceeded", worker.includes("if(after.image_complete&&after.raw_complete)") && worker.includes('scan.status==="complete"') && worker.includes("LIMIT 10001") && worker.includes("LIMIT 50001") && worker.includes("missing-remote comparison withheld"));
check("Persistent inventory compares the complete snapshot against media, upload journal and syllabus records without per-record remote queries", worker.includes("cloudinary_inventory_assets WHERE scan_id=? LIMIT 50001") && worker.includes("new Set((remoteRows.results||[]).map") && worker.includes("FROM cloudinary_upload_operations WHERE status<>'deleted'") && worker.includes("cloudinaryPublicIdFromUrl(row.secure_url"));
check("Admin UI can start, resume and advance persisted image/raw inventory scans", adminHtml.includes("media-inventory-start") && adminHtml.includes("media-inventory-refresh") && adminHtml.includes("stepMediaInventory") && adminHtml.includes("Scan next image page") && adminHtml.includes("Scan next raw page"));
check("Read-only Cloudinary audit endpoint is mapped to media.view and rate-limited", worker.includes('path==="/api/admin/media/audit"') && worker.includes('rateLimit(env,request,"media-audit",20,60*60*1000)'));
check("Cloudinary audit uses bounded pagination and labels unreferenced assets as candidates", worker.includes("requestedLimit>10") && worker.includes("requestedPage>200") && worker.includes('"potential_orphan_candidate"'));
check("Cloudinary audit reports syllabus URLs and deletion-journal states without remote-existence claims", worker.includes("FROM courses WHERE syllabus_file_url IS NOT NULL") && worker.includes("GROUP BY status") && worker.includes('remote_existence:"unknown"'));
check("Admin Media Library exposes the read-only audit and its limitations", adminHtml.includes("media-audit") && adminHtml.includes("Run read-only asset audit") && adminHtml.includes("Cloudinary remote existence is not checked"));
check("Admin asset audit provides previous/next pagination and displays capped-scan warnings", adminHtml.includes("media-audit-prev") && adminHtml.includes("media-audit-next") && adminHtml.includes("200-page API cap"));
check("Cloudinary upload lifecycle migration records purpose, status and metadata", uploadJournalMigration.includes("public_id TEXT NOT NULL UNIQUE") && uploadJournalMigration.includes("purpose TEXT NOT NULL") && uploadJournalMigration.includes("needs_review") && uploadJournalMigration.includes("secure_url TEXT"));
check("Cloudinary uploads are journaled before remote upload and uncertain outcomes are flagged", worker.includes("INSERT INTO cloudinary_upload_operations") && worker.indexOf("INSERT INTO cloudinary_upload_operations")<worker.indexOf('"/"+resourceType+"/upload"') && worker.includes("status='needs_review'"));
check("Media upload registration advances the lifecycle journal and failed registration remains reviewable", worker.includes("status='registered'") && worker.includes("media_assets registration failed"));
check("Course syllabus upload lifecycle changes to attached after successful course create/update", worker.includes("status='attached'") && worker.includes("cloudinaryPublicIdFromUrl"));
check("Cloudinary deletion finalization marks matching upload lifecycle records deleted", worker.includes("cloudinary_upload_operations SET status='deleted'"));
check("Read-only audit reports upload lifecycle counts and unresolved upload records", worker.includes("upload_operations:{items:uploads,counts:uploadCounts") && adminHtml.includes("Uploads needing attention"));

check("Cloudinary reference lookup scans legacy content, CMS drafts/publications/history, custom pages, styles and course syllabus URLs", ["site_content","cms_content","cms_static_content_versions","pages","page_styles","courses"].every(table=>worker.includes("FROM "+table)) && worker.includes("async function findCloudinaryReferences"));
check("Media deletion refuses referenced assets before creating a deletion journal entry", worker.includes("findCloudinaryReferences(env,publicId)") && worker.includes("This image is still referenced by website content") && worker.indexOf("findCloudinaryReferences(env,publicId)")<worker.indexOf('INSERT INTO cloudinary_delete_operations (id,public_id,target_type,target_id,status) VALUES (?,?, \'media\''));
check("Course syllabus deletion checks for references outside its own course", worker.includes("findCloudinaryReferences(env,publicId,course.id)") && worker.includes("This syllabus asset is also referenced by other website content"));
check("Deletion recovery rechecks asset references and reports blocked operations", worker.includes("findCloudinaryReferences(env,operation.public_id") && worker.includes('status:"blocked"') && adminHtml.includes("Blocked by active references"));

check("Cloudinary reference-lock migration installs write guards for every database-managed content store", ["site_content","cms_content","cms_static_content_versions","pages","page_styles","courses"].every(table=>referenceLockMigration.includes("ON "+table)) && (referenceLockMigration.match(/CREATE TRIGGER IF NOT EXISTS/g)||[]).length===11);
check("Reference-lock triggers reject writes that introduce assets with pending or failed deletion operations", (referenceLockMigration.split("status IN ('pending','failed')").length-1)>=11 && referenceLockMigration.includes("RAISE(ABORT,'Cloudinary asset is pending deletion')"));
check("Media and syllabus deletion reserve the asset then recheck references before calling Cloudinary", worker.includes("DELETE FROM cloudinary_delete_operations WHERE id=? AND status='pending'") && worker.indexOf("references=await findCloudinaryReferences(env,publicId)")<worker.indexOf("const result=await destroyCloudinaryAsset(env,publicId)"));


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
