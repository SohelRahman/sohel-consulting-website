import fs from "node:fs";
import assert from "node:assert/strict";

const worker=fs.readFileSync("src/worker.js","utf8");
const route=worker.slice(worker.indexOf('if (path === "/api/admin/cms/save"'));
const save=route.slice(0,route.indexOf('if (path === "/api/admin/cms/publish"'));
const publish=route.slice(route.indexOf('if (path === "/api/admin/cms/publish"'),route.indexOf('if (path === "/api/admin/cms/delete"'));
const archive=route.slice(route.indexOf('if (path === "/api/admin/cms/delete"'),route.indexOf('if (path === "/api/admin/cms/restore"'));
const restore=route.slice(route.indexOf('if (path === "/api/admin/cms/restore"'),route.indexOf('if (path === "/api/admin/cms/preview"'));
const restoreVersion=route.slice(route.indexOf('if (path === "/api/admin/cms/restore-version"'),route.indexOf('if (path === "/api/admin/cms/history"'));
const checks=[
  ["Draft upsert, draft version and audit entry share one D1 batch",save.includes("env.DB.batch([")&&save.includes("INSERT INTO cms_content")&&save.includes("INSERT INTO cms_static_content_versions")&&save.includes("INSERT INTO audit_logs")],
  ["Published values and published history snapshots are created in one D1 batch",publish.includes("env.DB.batch([")&&publish.includes("UPDATE cms_content SET published_value=CASE")&&publish.includes("INSERT INTO cms_static_content_versions")&&publish.includes("SELECT page_key,language,content_key,content_type,draft_value")],
  ["Publication audit is part of the publication batch",publish.includes("INSERT INTO audit_logs")&&publish.indexOf("INSERT INTO audit_logs")<publish.indexOf("]);")],
  ["Publication snapshots select draft values inside the batch rather than from a stale pre-read array",!publish.includes("for(const row of results)")&&!publish.includes("results.map(row=>env.DB.prepare")],
  ["Archive state change and audit entry share one D1 batch",archive.includes("env.DB.batch([")&&archive.includes("UPDATE cms_content SET is_deleted=1")&&archive.includes("INSERT INTO audit_logs")],
  ["Restore state change and audit entry share one D1 batch",restore.includes("env.DB.batch([")&&restore.includes("UPDATE cms_content SET is_deleted=0")&&restore.includes("INSERT INTO audit_logs")],
  ["Historical version restore, draft snapshot and audit entry share one D1 batch",restoreVersion.includes("env.DB.batch([")&&restoreVersion.includes("INSERT INTO cms_content")&&restoreVersion.includes("INSERT INTO cms_static_content_versions")&&restoreVersion.includes("INSERT INTO audit_logs")],
  ["Static CMS mutations retain same-origin checks",[save,publish,archive,restore,restoreVersion].every(x=>x.includes("sameOrigin(request)"))]
];
let failed=0;
for(const [name,ok] of checks){if(ok)console.log("PASS "+name);else{failed++;console.error("FAIL "+name);}}
if(failed)process.exitCode=1;else console.log("\nAll CMS atomicity source-contract checks passed. Runtime D1 integration and concurrent-editor tests remain separate.");
