import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const [worker,admin]=await Promise.all([
 readFile(new URL("../src/worker.js",import.meta.url),"utf8"),
 readFile(new URL("../admin.html",import.meta.url),"utf8")
]);
assert.ok(worker.includes("INSERT INTO quotations (id,registration_id,amount_minor,currency,description,status)"));
assert.ok(worker.includes("status) VALUES (?,?,?,?,?,'draft')"));
assert.ok(worker.includes("UPDATE registrations SET pricing_type='custom',quoted_fee_minor=?,currency=?"));
assert.ok(worker.includes("SELECT id,amount_minor,currency,description,status,valid_until,created_at FROM quotations WHERE registration_id=?"));
assert.ok(worker.includes('["not_configured","pending","paid","failed","refunded"].includes(data?.paymentStatus)'));
assert.ok(worker.includes("payment_status=?"));
assert.ok(admin.includes("data-payment"));
assert.ok(admin.includes("data-quotes"));
assert.ok(admin.includes("Update payment status"));
assert.ok(admin.includes("Quote history"));
console.log("All registration workflow contract tests passed.");

assert.ok(worker.includes('const quoteStatusMatch=path.match'));
assert.ok(worker.includes('Administrators can issue response links only for draft quotations'));
assert.ok(worker.includes('registration_status=\'approved\',payment_status=\'pending\''));
assert.ok(worker.includes('quotation_learner_'));
assert.ok(worker.includes('enrollment_status<>'cancelled''));
assert.ok(admin.includes('secure learner response link'));
assert.ok(!admin.includes("Allowed next status:"));
console.log("Quotation lifecycle and learner-response contracts passed.");
