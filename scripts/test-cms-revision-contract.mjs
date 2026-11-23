import fs from "node:fs";
import assert from "node:assert/strict";

const worker=fs.readFileSync("src/worker.js","utf8");
const admin=fs.readFileSync("admin.html","utf8");
const migration=fs.readFileSync("migrations/0018_cms_content_revision.sql","utf8");
assert.match(migration,/ALTER TABLE cms_content ADD COLUMN revision INTEGER NOT NULL DEFAULT 1 CHECK \(revision >= 1\)/);

const read=worker.slice(worker.indexOf('if (path === "/api/admin/cms" && method === "GET")'),worker.indexOf('if (path === "/api/admin/cms/initialize"'));
const save=worker.slice(worker.indexOf('if (path === "/api/admin/cms/save"'),worker.indexOf('if (path === "/api/admin/cms/publish"'));
const archive=worker.slice(worker.indexOf('if (path === "/api/admin/cms/delete"'),worker.indexOf('if (path === "/api/admin/cms/preview"'));
const restoreVersion=worker.slice(worker.indexOf('if (path === "/api/admin/cms/restore-version"'),worker.indexOf('if (path === "/api/admin/cms/history"'));
const checks=[
 ["Migration adds a positive revision counter with a safe default",/revision INTEGER NOT NULL DEFAULT 1/.test(migration)],
 ["CMS read API returns the revision",read.includes("revision FROM cms_content")],
 ["Draft updates compare the submitted revision and increment on success",save.includes("AND revision=?")&&save.includes("revision=revision+1")],
 ["Stale draft saves return HTTP 409",save.includes("},409)")],
 ["Version and audit writes are conditional on a successful save",save.includes("changes()>0")],
 ["Archive and restore compare-and-swap and increment revisions",archive.includes("AND revision=?")&&archive.includes("revision=revision+1")],
 ["Historical restore compares revision and rejects stale requests",restoreVersion.includes("AND revision=?")&&restoreVersion.includes("},409)")],
 ["Admin editor carries revision tokens for draft saves and row actions",admin.includes("form.dataset.revision")&&admin.includes("revision:Number(form.dataset.revision)")&&admin.includes("revision:Number(rows.find")]
];
let failed=0;
for(const [name,ok] of checks){if(ok)console.log("PASS "+name);else{failed++;console.error("FAIL "+name);}}
if(failed)process.exitCode=1;else console.log("\nAll CMS revision concurrency source-contract checks passed. Runtime concurrent D1 tests remain separate.");
