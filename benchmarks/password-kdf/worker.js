import { argon2id, argon2Verify } from "hash-wasm";

const MEMORY_KIB = 19_456;
const ITERATIONS = 2;
const PARALLELISM = 1;
const HASH_LENGTH = 32;

async function runOne(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const start = performance.now();
  const hash = await argon2id({ password, salt, memorySize: MEMORY_KIB, iterations: ITERATIONS, parallelism: PARALLELISM, hashLength: HASH_LENGTH, outputType: 'encoded' });
  const hashMs = performance.now() - start;
  const verifyStart = performance.now();
  const valid = await argon2Verify({ password, hash });
  const verifyMs = performance.now() - verifyStart;
  return { valid, hashMs: Math.round(hashMs * 100) / 100, verifyMs: Math.round(verifyMs * 100) / 100, encodedHashLength: hash.length };
}

export default {
  async fetch(request, env) {
    if (request.method !== 'POST' || new URL(request.url).pathname !== '/benchmark') return new Response('Not found', { status: 404 });
    if (!env.BENCHMARK_TOKEN || request.headers.get('authorization') !== `Bearer ${env.BENCHMARK_TOKEN}`) return new Response('Unauthorized', { status: 401 });
    const started = performance.now();
    try {
      const sequential = await runOne('isolated-preview-kdf-benchmark-password');
      const concurrentStarted = performance.now();
      const concurrent = await Promise.all([runOne('concurrent-test-password-one'), runOne('concurrent-test-password-two')]);
      const totalMs = performance.now() - started;
      return Response.json({
        algorithm: 'Argon2id', version: '1.3', memoryKiB: MEMORY_KIB, iterations: ITERATIONS, parallelism: PARALLELISM, hashLength: HASH_LENGTH,
        sequential, concurrent, concurrentPairWallMs: Math.round((performance.now() - concurrentStarted) * 100) / 100,
        totalWallMs: Math.round(totalMs * 100) / 100,
        note: 'Wall-clock timings only. Cloudflare CPU-time and isolate memory must be confirmed from runtime analytics; this endpoint does not claim to measure either directly.'
      }, { headers: { 'cache-control': 'no-store' } });
    } catch {
      return Response.json({ error: 'KDF benchmark failed in the Worker runtime.' }, { status: 500, headers: { 'cache-control': 'no-store' } });
    }
  }
};
