# Password Storage Design Assessment — Cloudflare Workers

**Assessment date:** 2026-11-26
**Scope:** Preview/Production Admin password verification in `src/password-hash.js`.
**Status:** Design decision pending a real Preview benchmark. No password-hashing implementation changed in this assessment.

## Current implementation

- Passwords are stored as salted PBKDF2-HMAC-SHA-256 hashes with a 16-byte random salt and a 32-byte derived value.
- Current work factor is 100,000 iterations because the prior Preview login attempt failed when the implementation requested 600,000 iterations from Workers Web Crypto.
- The current work factor is below the OWASP Password Storage Cheat Sheet recommendation of 600,000 PBKDF2-HMAC-SHA-256 iterations. It must not be described as meeting that recommendation.
- A server-side pepper can add defense in depth, but OWASP explicitly treats it as supplementary; it does not make an under-strength password hash equivalent to a recommended KDF configuration.

## Runtime constraints verified from current official documentation

- Cloudflare Workers Web Crypto documents the supported cryptographic operations and algorithms; it does not list Argon2id as a Web Crypto deriveBits algorithm.
- Cloudflare Workers supports precompiled WebAssembly modules, but does not support threading.
- Cloudflare documents a 128 MB memory limit per isolate. WebAssembly allocations count toward this limit, and multiple requests can be served by one isolate.
- Cloudflare documents a 10 ms CPU-time limit per HTTP request on Workers Free. The actual account plan and configured CPU limit for this Worker have not been independently verified.

## Candidate design

Argon2id via a maintained WebAssembly implementation is the leading in-Worker candidate. OWASP's current baseline includes Argon2id with 19 MiB memory, 2 passes and parallelism 1. The `hash-wasm` project documents Argon2id support and an encoded hash format. These facts establish technical plausibility, not production suitability.

Before adoption, a controlled Preview benchmark must verify all of the following:

1. RFC 9106 / known-answer test compatibility for the exact implementation and selected parameters.
2. Hash and verify compatibility across Node test runtime and Cloudflare Workers Preview.
3. CPU time on the actual Worker plan, including p50/p95/p99 under serial and concurrent sign-in load.
4. Peak isolate memory and behavior when concurrent requests share the isolate.
5. Correct parameter parsing, per-user random salt, versioned hash format, constant-time verification where applicable, and legacy PBKDF2 migration on successful login.
6. Rate-limit behavior and resistance to authentication-driven resource exhaustion.
7. Bundle size, deployment compatibility, dependency integrity, license and maintenance review.

Do not reduce Argon2id parameters below OWASP's baseline merely to fit an unverified CPU budget. If the supported free-tier CPU budget cannot accommodate the baseline safely, do not deploy an under-strength custom KDF as a workaround. Reassess a managed identity/authentication boundary or an explicitly approved runtime/cost change.

## Decision

**Do not change the current hash format yet.** Keep the 100,000-iteration PBKDF2 implementation confined to Preview while benchmarking and architecture review proceed. It is a temporary compatibility workaround, not an approved Production security baseline.

Do not introduce a pepper-only change and call the issue resolved. A pepper is defense in depth, not a substitute for a suitable password KDF.

## Sources

- OWASP Password Storage Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- Cloudflare Workers Web Crypto: https://developers.cloudflare.com/workers/runtime-apis/web-crypto/
- Cloudflare Workers WebAssembly: https://developers.cloudflare.com/workers/runtime-apis/webassembly/
- Cloudflare Workers limits: https://developers.cloudflare.com/workers/platform/limits/
- `hash-wasm` Argon2id API and parameter interface: https://github.com/Daninet/hash-wasm
- RFC 9106, Argon2: https://www.rfc-editor.org/rfc/rfc9106

Source review performed 2026-11-26. Account-specific Worker plan, CPU configuration, and live Preview Argon2id benchmark remain unverified.