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
- Cloudflare documents a 10 ms CPU-time limit per HTTP request on Workers Free. Cloudflare API error 100328 during the isolated benchmark deployment confirmed that the linked account is on Workers Free; the benchmark uses the Free plan's default 10 ms CPU limit. The application Worker's configured CPU limit remains unverified.

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
## Isolated Workers benchmark result — 2026-11-26

The `hash-wasm` 4.12.0 candidate deployed successfully as an isolated Worker on the linked Workers Free account, but the request failed before Argon2 ran. The sanitized runtime error was `WebAssembly.compile(): Wasm code generation disallowed by embedder` (`CompileError`). No latency, CPU-time or memory result was obtained. This is consistent with Cloudflare's requirement to use precompiled Wasm modules and Wrangler's support for importing `.wasm` files as `WebAssembly.Module` objects.

**Decision:** reject `hash-wasm` for direct use in this Worker. Continue evaluating an implementation that ships a precompiled `.wasm` asset. Do not change Admin authentication until the candidate passes RFC/known-answer tests, PHC compatibility, code/license/provenance review, Worker deployment, and Free-plan CPU/memory acceptance.

Additional source: Cloudflare Wrangler bundling and precompiled Wasm module imports: https://developers.cloudflare.com/workers/wrangler/bundling/


## Precompiled-Wasm candidate review — 2026-11-26

The package `@hallaxius/argon2w` is a technically relevant candidate because its public README describes a standalone SIMD `.wasm` asset, a Cloudflare Workers `/wasm` import that resolves to a compiled `WebAssembly.Module`, and PHC-compatible Argon2id strings. This directly addresses the runtime dynamic-compilation failure seen with `hash-wasm`. These are package-maintainer claims, not independently reproduced results.

The published README lists profiles including `m16t2` (16 MiB, 2 passes, p=1) and `standard` (19,456 KiB, 3 passes, p=1). The former is below OWASP's 19 MiB / 2-pass / p=1 baseline; the latter exceeds its pass count. Do not infer that a profile named `standard` is a certification or select `m16t2` as an equivalent baseline. A custom 19,456 KiB / 2-pass / p=1 profile would need direct known-answer and runtime testing.

The available third-party package-health listing reports version 0.0.1, Apache-2.0, zero dependencies and zero weekly downloads, while indicating its health report is incomplete. This is a weak adoption signal, not a vulnerability finding. The GitHub repository's source tree, exact published tarball, npm provenance attestation, release-to-commit correspondence, maintainer identity, CI/test suite and full transitive/bundled source could not be independently inspected through the available connected GitHub access during this review. The package is therefore **not approved for adoption or production use**.

### Gate decision

- Candidate status: **unverified; do not add it to application dependencies**.
- Next evidence required: retrieve the exact npm tarball and registry metadata; verify npm signatures/provenance (for example, `npm audit signatures`); inspect the full source and build workflow; confirm the bundled PHC reference source and licences; run upstream known-answer tests; verify the Worker export really resolves to a compiled module under this project's Wrangler version; then benchmark 19,456 KiB / 2 passes / p=1 on the isolated Free-plan Worker.
- Do not modify `src/password-hash.js`, existing stored hashes, Admin authentication or production resources during candidate evaluation.
- If provenance or source review remains unavailable, reject the package and build a reproducible precompiled module from the PHC reference implementation with its dual CC0/Apache-2.0 licensing preserved.

Sources reviewed:
- Package README: https://github.com/orgShtora-1/argon2w
- Third-party package-health listing (incomplete report): https://npm.io/package/%40hallaxius/argon2w
- npm provenance verification guidance: https://docs.npmjs.com/viewing-package-provenance/
- Cloudflare precompiled WebAssembly requirement: https://developers.cloudflare.com/workers/runtime-apis/webassembly/
- OWASP Password Storage Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- PHC Argon2 reference implementation and licensing: https://github.com/P-H-C/phc-winner-argon2


## Primary-source fallback review — PHC reference Argon2 implementation — 2026-11-26

The official `P-H-C/phc-winner-argon2` repository was inspected as the fallback if the unverified third-party wrapper is rejected. The upstream README identifies it as the reference C implementation of the Password Hashing Competition winner and documents Argon2id as a supported variant. Its root licence explicitly offers CC0 1.0 or Apache 2.0. The inspected implementation includes Argon2id selection in `src/argon2.c`, memory allocation and wiping in `src/core.c`, the single-thread reference block-filling implementation in `src/ref.c`, PHC-style encoding/verification support in `src/encoding.c`, and known-answer/encoded-hash tests in `src/test.c`.

The upstream `Makefile` has a `NO_THREADS=1` build option that defines `ARGON2_NO_THREADS`; `src/thread.c` excludes pthread wrappers under that define. Its source selection also uses the reference implementation when native architecture optimization detection fails. These are useful starting points for a deterministic single-thread WebAssembly build, but they do not prove an Emscripten build is correct or Workers-compatible. The inspected `master` branch was not pinned to a commit SHA in this review, so no upstream revision is yet approved for vendoring.

### Decision and next build gate

- Reject `@hallaxius/argon2w` for now: exact tarball, registry signature/provenance, source-to-artifact correspondence and upstream CI could not be independently verified.
- Prefer a reproducible build from the official PHC reference source, pinned to an immutable upstream commit, retaining the dual CC0/Apache-2.0 notices and any file-specific third-party notices.
- Before building, pin and record the upstream commit and source file manifest. Build a small C ABI wrapper exposing only Argon2id hash/verify, use single-thread reference code (no pthreads), and compile to a standalone precompiled `.wasm` module. Do not use dynamic `WebAssembly.compile()` in the Worker.
- Validate against upstream known-answer vectors and PHC encoded strings, malformed-input tests, salt generation, version/parameter parsing, memory wiping and allocation failures. Then import the compiled module through Wrangler and run the isolated Workers Free benchmark at the OWASP baseline of 19,456 KiB / 2 passes / p=1.
- Do not change application authentication or stored hashes until the artifact, tests and runtime benchmark pass. Do not lower parameters to fit the Free CPU limit.

Primary source reviewed: https://github.com/P-H-C/phc-winner-argon2 (README, LICENSE, Makefile, `src/argon2.c`, `src/core.c`, `src/ref.c`, `src/thread.c`, `src/encoding.c`, `src/test.c`).


## Updated Argon2id implementation selection — 2026-11-26

The official PHC reference C repository was source-reviewed, but its latest GitHub release is documented as 2019-07-02 and the current `master` commit inspected is `f57e61e19229e23c4445b85494dbf7c07de721cb`, dated 2021-06-25. That long gap is a maintenance concern for a new security-critical integration. Do not treat it as the preferred new implementation solely because it is the reference C source.

A stronger current candidate is RustCrypto's pure-Rust Argon2 crate, version 0.6.0, at repository commit `dc7e0c25cda9a8421d2604debf548d663886b431` (2026-11-05). The commit has a valid GitHub signature. Its 0.6.0 changelog is dated 2026-08-27. The crate is `no_std`, supports Argon2id by default, uses single-thread processing unless its optional `parallel` feature is enabled, exposes PHC password-hash interfaces, and offers an optional `zeroize` feature. It is dual-licensed MIT OR Apache-2.0. Its documented default parameters are m=19,456 KiB, t=2, p=1.

Important memory-handling caveat found during source review: enabling the crate's `zeroize` feature wipes selected intermediate values and provides `Zeroize` for `Block`, but the inspected `Blocks::drop` implementation only deallocates its buffer; it does not itself wipe the allocated Argon2 memory matrix. A production wrapper must therefore own the memory buffer and explicitly zeroize every block on all success and error paths (prefer an RAII zeroizing buffer), or establish equivalent verified cleanup. This must be tested; do not assume the feature alone clears the full working matrix.

### Selected candidate and next gate

- Preferred candidate for an isolated prototype: RustCrypto Argon2 0.6.0 pinned to commit `dc7e0c25cda9a8421d2604debf548d663886b431`.
- Build target: `wasm32-unknown-unknown`, single-thread (do not enable `parallel`), precompiled `.wasm` imported as `WebAssembly.Module` by Wrangler.
- Wrapper design: expose only bounded hash/verify functions; enforce fixed Argon2id v=19 parameters and OWASP baseline; accept a 16-byte random salt supplied by the JS host; emit/parse standard PHC strings; reject malformed or excessive PHC parameters before allocating memory; use an RAII buffer that zeroizes all Argon2 blocks before deallocation, including error/panic-safe handling; do not expose raw memory or secret values.
- Test gates: RustCrypto KATs including Argon2id v=19; PHC cross-implementation fixtures; wrong-password and malformed-input cases; memory zeroization tests; WASM ABI bounds tests; repeat and concurrent Worker tests; then measure CPU and peak memory on the isolated Workers Free environment.
- This is a candidate selection only. No Rust/WASM source or dependency has been added to the application. The prototype and benchmark remain pending.

Sources:
- RustCrypto Argon2 crate: https://github.com/RustCrypto/password-hashes/tree/dc7e0c25cda9a8421d2604debf548d663886b431/argon2
- Pinned signed commit: https://github.com/RustCrypto/password-hashes/commit/dc7e0c25cda9a8421d2604debf548d663886b431
- PHC reference releases: https://github.com/P-H-C/phc-winner-argon2/releases
- Cloudflare Wrangler Wasm imports: https://developers.cloudflare.com/workers/wrangler/bundling/
- OWASP Password Storage Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html


## Isolated RustCrypto prototype — source stage — 2026-11-26

Created `prototypes/argon2id-wasm` as an isolated Rust crate pinned to RustCrypto Argon2 0.6.0 commit `dc7e0c25cda9a8421d2604debf548d663886b431`. The wrapper fixes Argon2id v=19 at 19,456 KiB, two passes, one lane and a 32-byte tag; bounds passwords to 1,024 bytes and requires a 16-byte caller-supplied salt. It owns the working matrix and explicitly zeroizes each block in `Drop`.

Added an upstream Argon2id v=19 known-answer test using the upstream test vector's secret and associated data, plus deterministic output, password/salt differentiation and input-bound tests. Added CI for formatting, host tests, Clippy and `wasm32-unknown-unknown` compilation.

**Current gate:** source files and CI workflow are committed to the development branch, but CI has not yet been observed passing. No C/WASM ABI, JavaScript adapter, PHC verification, Cloudflare Worker integration or runtime benchmark exists yet. The prototype is not connected to application authentication and is not deployable as a Worker at this stage. No Preview or Production resource, D1 data, stored password hash or application authentication code changed.

**Next:** inspect CI results, fix any compile/test failures, add the bounded ABI and PHC compatibility layer, then benchmark only in the isolated Worker. A Preview app integration or Production release requires separate passing gates and approval.
