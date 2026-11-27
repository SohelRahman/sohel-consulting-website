import fs from "node:fs";
import assert from "node:assert/strict";
const worker=fs.readFileSync("src/worker.js","utf8"),admin=fs.readFileSync("admin.html","utf8");
const start=worker.indexOf('if (path === "/api/admin/cms/initialize" && method === "POST")'),end=worker.indexOf('if (path === "/api/admin/cms/save" && method === "POST")',start);
assert.notEqual(start,-1);assert.notEqual(end,-1);const route=worker.slice(start,end);
const uiStart=admin.indexOf('$cms("cms-initialize").addEventListener("click"'),uiEnd=admin.indexOf('$cms("cms-inspect").addEventListener',uiStart);
assert.notEqual(uiStart,-1);assert.notEqual(uiEnd,-1);const ui=admin.slice(uiStart,uiEnd);
const checks=[
["Full payload validation precedes database statement construction",route.indexOf("prepared.push")<route.indexOf("const statements=[]")],
["Server rejects requests above 400 items before writing",route.includes("items.length>400")&&route.indexOf("items.length>400")<route.indexOf("const statements=[]")],
["Existing keys are preserved on retry",route.includes("INSERT OR IGNORE INTO cms_content")],
["Draft history follows only successful content inserts",route.includes("SELECT ?,?,?,?,?, 'draft',? WHERE changes()>0")],
["Content, history and audit use one D1 batch",route.includes("const results=await env.DB.batch(statements)")&&route.includes("INSERT INTO audit_logs")],
["Created/skipped counts derive from actual insert results",route.includes("results[index*2]?.meta?.changes")&&route.includes("const skipped=prepared.length-created")],
["Initialization never publishes content",!route.includes("published_value=")&&!route.includes("version_type,'published'")],
["Client blocks over-limit payloads before API submission",ui.indexOf("items.length>400")<ui.indexOf('request("/api/admin/cms/initialize"')&&ui.includes("No data was sent")],
["Client explains safe retry after an ambiguous network failure",ui.includes("retrying is safe")&&ui.includes("existing keys are preserved")],
["Client restores the button state on every exit path",ui.includes("finally{button.disabled=false;}")],
["Initialization remains separate from publication",!ui.includes('request("/api/admin/cms/publish"')]
];
let failed=0;for(const [name,ok] of checks){if(ok)console.log("PASS "+name);else{failed++;console.error("FAIL "+name);}}
if(failed)process.exitCode=1;else console.log("All CMS initialization recovery source-contract checks passed. Real D1 failure injection and Preview browser acceptance remain separate.");
