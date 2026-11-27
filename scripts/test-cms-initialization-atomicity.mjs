import fs from "node:fs";
import assert from "node:assert/strict";

const worker=fs.readFileSync("src/worker.js","utf8");
const start=worker.indexOf('if (path === "/api/admin/cms/initialize" && method === "POST")');
const end=worker.indexOf('if (path === "/api/admin/cms/save" && method === "POST")',start);
assert.notEqual(start,-1,"Bulk initialization route exists");
assert.notEqual(end,-1,"Bulk initialization route has a following boundary");
const route=worker.slice(start,end);
const checks=[
  ["Initialization validates the complete payload before writing",route.indexOf("prepared.push")<route.indexOf("const statements=[]")],
  ["Request is capped at 400 items to bound batch bindings",route.includes("items.length>400")&&route.includes("between 1 and 400")],
  ["All content and version writes are submitted in one D1 batch",route.includes("const results=await env.DB.batch(statements)")&&!route.includes(".run()")],
  ["Content insertion preserves existing keys",route.includes("INSERT OR IGNORE INTO cms_content")],
  ["Version history is inserted only after a successful content insert",route.includes("SELECT ?,?,?,?,?, 'draft',? WHERE changes()>0")],
  ["Audit record is part of the same batch",route.includes("INSERT INTO audit_logs")&&route.indexOf("INSERT INTO audit_logs")<route.indexOf("env.DB.batch(statements)")],
  ["Created/skipped counts use per-insert batch results",route.includes("results[index*2]?.meta?.changes")&&route.includes("const skipped=prepared.length-created")],
  ["Same-origin protection remains enabled",route.includes("sameOrigin(request)")]
];
let failed=0;
for(const [name,ok] of checks){if(ok)console.log("PASS "+name);else{failed++;console.error("FAIL "+name);}}
if(failed)process.exitCode=1;else console.log("\nAll bulk CMS initialization atomicity source-contract checks passed. Runtime D1 failure-injection tests remain separate.");
