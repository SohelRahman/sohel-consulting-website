import { hashPassword, verifyPassword, wasmMemoryPages } from "./worker-adapter.mjs";

const json = (value, status = 200) => new Response(JSON.stringify(value), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
});
const TEST_PASSWORD = "isolated Cloudflare Workers Argon2id runtime test";

export default {
  async fetch(request, env) {
    if (!env.TEST_TOKEN || request.headers.get("authorization") !== `Bearer ${env.TEST_TOKEN}`) {
      return new Response("Not found", { status: 404 });
    }
    const url = new URL(request.url);
    if (url.pathname === "/health" && request.method === "GET") {
      return json({ ok: true, runtime: "cloudflare-workers" });
    }
    if (url.pathname === "/hash" && request.method === "POST") {
      const memoryPagesBefore = wasmMemoryPages();
      const started = performance.now();
      const phc = hashPassword(TEST_PASSWORD);
      const elapsedMs = Number((performance.now() - started).toFixed(6));
      const memoryPagesAfter = wasmMemoryPages();
      return json({
        phc,
        hashMs: elapsedMs,
        memoryPagesBefore,
        memoryPagesAfter,
        memoryGrowthObserved: memoryPagesAfter > memoryPagesBefore
      });
    }
    if (url.pathname === "/verify" && request.method === "POST") {
      let body;
      try { body = await request.json(); } catch { return json({ error: "Invalid JSON." }, 400); }
      if (typeof body?.phc !== "string" || body.phc.length > 128 || typeof body?.password !== "string" || body.password.length > 1024) {
        return json({ error: "Invalid test input." }, 400);
      }
      const started = performance.now();
      const valid = verifyPassword(body.password, body.phc);
      const elapsedMs = Math.round((performance.now() - started) * 100) / 100;
      return json({ valid, verifyMs: elapsedMs });
    }
    return new Response("Not found", { status: 404 });
  }
};
