import { hashPassword, verifyPassword, wasmMemoryPages } from "./worker-adapter.mjs";

const json = (value, status = 200) => new Response(JSON.stringify(value), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
});

export default {
  async fetch(request, env) {
    if (!env.TEST_TOKEN || request.headers.get("authorization") !== `Bearer ${env.TEST_TOKEN}`) {
      return new Response("Not found", { status: 404 });
    }
    const url = new URL(request.url);
    if (url.pathname === "/health" && request.method === "GET") {
      return json({ ok: true, runtime: "cloudflare-workers" });
    }
    if (url.pathname === "/self-test" && request.method === "POST") {
      const beforePages = wasmMemoryPages();
      const password = "isolated Cloudflare Workers Argon2id runtime test";
      const phc = hashPassword(password);
      const afterHashPages = wasmMemoryPages();
      const valid = verifyPassword(password, phc);
      const invalid = verifyPassword("incorrect test password", phc);
      const result = {
        hashGenerated: phc.startsWith("$argon2id$v=19$m=19456,t=2,p=1$"),
        validPasswordAccepted: valid,
        wrongPasswordRejected: !invalid,
        memoryPagesBefore: beforePages,
        memoryPagesAfterHash: afterHashPages,
        memoryGrowthObserved: afterHashPages > beforePages
      };
      const passed = result.hashGenerated && valid && !invalid && result.memoryGrowthObserved;
      return json({ ...result, passed }, passed ? 200 : 500);
    }
    return new Response("Not found", { status: 404 });
  }
};
