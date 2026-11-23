import fs from "node:fs";
import assert from "node:assert/strict";

const worker=fs.readFileSync("src/worker.js","utf8");
const helper=worker.slice(worker.indexOf("function builderPageCmsStatements"),worker.indexOf("\n\nasync function audit"));
const create=worker.slice(worker.indexOf('if (path === "/api/admin/pages" && method === "POST")'),worker.indexOf('const pageAdminSlug='));
const update=worker.slice(worker.indexOf('if (/^[a-z0-9-]+$/.test(pageAdminSlug) && method === "PUT")'),worker.indexOf('if (/^[a-z0-9-]+$/.test(pageAdminSlug) && method === "DELETE")'));
const remove=worker.slice(worker.indexOf('if (/^[a-z0-9-]+$/.test(pageAdminSlug) && method === "DELETE")'),worker.indexOf('if (path === "/api/admin/cms/pages"'));
const checks=[
  ["Page CMS seed helper prepares guarded content inserts and version snapshots",helper.includes("INSERT OR IGNORE INTO cms_content")&&helper.includes("WHERE EXISTS (SELECT 1 FROM pages")&&helper.includes("changes()>0")],
  ["Page creation, CMS seed and audit are committed in one D1 batch",create.includes("env.DB.batch(statements)")&&create.includes("builderPageCmsStatements")&&create.includes("INSERT INTO audit_logs")],
  ["Page structure update, CMS registration and audit share one D1 batch",update.includes("env.DB.batch(statements)")&&update.includes("builderPageCmsStatements")&&update.includes("INSERT INTO audit_logs")],
  ["CMS key registration is capped below the D1 per-invocation binding limit",update.includes("cmsStatements.length>800")&&update.includes("too many CMS fields")],
  ["Missing page update does not seed CMS records or report success",update.includes("if(!results[0]?.meta?.changes)")],
  ["Page deletion, CMS cleanup, history cleanup and audit share one D1 batch",remove.includes("env.DB.batch([")&&remove.includes("DELETE FROM pages")&&remove.includes("DELETE FROM cms_content")&&remove.includes("DELETE FROM cms_static_content_versions")&&remove.includes("INSERT INTO audit_logs")],
  ["Missing page deletion is reported after the atomic batch",remove.includes("if(!results[0]?.meta?.changes)")],
  ["Page Builder mutation handlers retain same-origin checks",[create,update,remove].every(x=>x.includes("sameOrigin(request)"))],
["Existing custom-page language is checked before update",update.includes('SELECT language FROM pages WHERE slug=?')&&update.includes('existingPage.language!==language')&&update.includes('},409)')],
  ["Page update is constrained to the original language",update.includes('WHERE slug=? AND language=?')&&update.includes('pageAdminSlug,language')],
  ["Page editor locks the language field and explicitly submits its value",fs.readFileSync("admin.html","utf8").includes("f.elements.language.disabled=true")&&fs.readFileSync("admin.html","utf8").includes("data.language=f.elements.language.value")]
];
let failed=0;
for(const [name,ok] of checks){if(ok)console.log("PASS "+name);else{failed++;console.error("FAIL "+name);}}
if(failed)process.exitCode=1;else console.log("\nAll Page Builder atomicity source-contract checks passed. Runtime D1 integration and concurrent-editor tests remain separate.");
