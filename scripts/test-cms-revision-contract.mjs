import fs from "node:fs";
import assert from "node:assert/strict";

const worker=fs.readFileSync("src/worker.js","utf8");
const admin=fs.readFileSync("admin.html","utf8");
const migration=fs.readFileSync("migrations/0018_cms_content_revision.sql","utf8");
assert.match(migration,/ALTER TABLE cms_content ADD COLUMN revision INTEGER NOT NULL DEFAULT 1 CHECK \(revision >= 1\)/);

const route=(path,next)=>worker.slice(worker.indexOf(`if (path === "${path}"`),worker.indexOf(`if (path === "${next}"`));
const read=route("/api/admin/cms","/api/admin/cms/initialize");
const save=route("/api/admin/cms/save","/api/admin/cms/publish");
const archive=route("/api/admin/cms/delete","/api/admin/cms/restore");
const restore=route("/api/admin/cms/restore","/api/admin/cms/preview");
const restoreVersion=route("/api/admin/cms/restore-version","/api/admin/cms/history");

const checks=[
 ["Migration adds a positive revision counter with a safe default",/revision INTEGER NOT NULL DEFAULT 1/.test(migration)],
 ["Admin CMS reads return the current revision",read.includes("revision FROM cms_content")],
 ["Draft update uses compare-and-swap and increments the revision",save.includes("AND revision=?")&&save.includes("revision=revision+1")],
 ["Stale draft save returns HTTP 409",save.includes("},409)")],
 ["Draft history and audit inserts depend on a successful update",save.includes("changes()>0")&&save.includes("env.DB.batch(statements)")],
 ["Archive validates a positive revision, compare-and-swaps and returns 409 when stale",archive.includes("!Number.isInteger(revision)||revision<1")&&archive.includes("AND revision=?")&&archive.includes("},409)")],
 ["Restore validates a positive revision, compare-and-swaps and returns 409 when stale",restore.includes("!Number.isInteger(revision)||revision<1")&&restore.includes("AND revision=?")&&restore.includes("},409)")],
 ["Historical restore scopes the version lookup to the same page, language and key",restoreVersion.includes("WHERE id=? AND page_key=? AND language=? AND content_key=?")],
 ["Historical restore compare-and-swaps and conditionally writes history/audit",restoreVersion.includes("AND revision=?")&&restoreVersion.includes("changes()>0")&&restoreVersion.includes("},409)")],
 ["Admin draft editor submits the revision it loaded",admin.includes("form.dataset.revision=String(x.revision)")&&admin.includes("revision:form.dataset.revision?Number(form.dataset.revision):null")],
 ["Admin archive and restore actions submit row revisions",admin.includes("revision:Number(rows.find(x=>x.content_key===b.dataset.cmsDelete)?.revision)")&&admin.includes("revision:Number(rows.find(x=>x.content_key===b.dataset.cmsRestore)?.revision)")],
 ["Admin historical restore submits the current editor revision",admin.includes("revision:Number(form.dataset.revision)")],
 ["Admin surfaces stale-write conflict messages from the Worker",admin.includes("catch(err){msg(err.message);}")&&admin.includes("catch(e){msg(e.message);}")]
];
let failed=0;
for(const [name,ok] of checks){if(ok)console.log("PASS "+name);else{failed++;console.error("FAIL "+name);}}
if(failed)process.exitCode=1;else console.log("\nAll CMS revision API/UI source-contract checks passed. SQLite transaction tests run separately; live Cloudflare D1 and Preview acceptance remain separate.");
