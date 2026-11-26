## Latest execution checkpoint — 2026-11-26

- Prototype CI [#45856402852](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45856402852) passed all checks, including `cargo audit` across 34 locked dependencies, formatting, host tests, Clippy, WASM build/bindings, Node adapter/memory-growth tests and provenance artifact upload. Artifact ID: `15134694932`.
- Isolated Cloudflare runtime [#45856609844](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45856609844) passed deployment, health, hash/verify, correct/wrong password checks, sequential/concurrent requests and cleanup (HTTP 200 deletion, HTTP 404 absence check).
- WASM memory grew from 17 to 323 pages and remained at 323 pages after sequential/concurrent tests. Two concurrent hash requests took 160.404 ms combined wall-clock. Per-operation `performance.now()` samples were 0 ms and are not useful timing evidence.
- CPU-time telemetry remains unverified. The key-discovery response exposed only `$metadata.service`; the runtime query was corrected in commit `8ee6e9e` to request the complete key set and filter invocations using the documented `$metadata.service` field. A new runtime run is required.
- RustSec audit completed successfully after loading 1,568 advisories and scanning 34 locked dependencies. Build emitted a future-incompatibility warning for `buf_redux 0.8.4` and `multipart 0.18.0`; review their dependency paths before integration.
- Prototype remains experimental and isolated. No application authentication, D1 or Production deployment is approved.

Logging-enabled runtime deployment [#45841415366](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45841415366) is in progress. It must deploy the updated Wrangler observability settings before invocation CPU-time samples can be collected. No CPU-time value is currently verified.

## Latest verification — 2026-11-26

- PHC corpus prototype CI [#45838494936](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45838494936) passed formatting, host tests, Clippy, WASM build, wasm-bindgen generation, Node adapter/memory-growth tests and artifact upload.
- Controlled failure-path runtime test [#45840895843](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45840895843) passed. The workflow deliberately exited after successful runtime checks; its EXIT cleanup deleted the temporary Worker (HTTP 200), and a follow-up Cloudflare API GET confirmed absence (HTTP 404).
- In that run, the two-request concurrent batch was 201.874 ms wall-clock; per-operation hash and verify timers again reported 0 ms. Memory grew 17 to 323 pages and remained stable. This is not CPU-time evidence.
- Native invocation logging is now enabled in Wrangler configuration. A new runtime run is required to deploy that configuration before CPU-time records can be inspected.

## Cloudflare CPU-time observability — 2026-11-26

The isolated Wrangler config now enables native Workers invocation logs at 100% head sampling. This is intended to expose Cloudflare's invocation CPU-time and wall-time fields for the temporary benchmark Worker. A measurement procedure is documented in `docs/ARGON2ID_CPU_TIME_MEASUREMENT.md`. Workers Logs is included on the Free plan according to current Cloudflare documentation; no Logpush job or paid external destination is configured.

**Important:** enabling logs is not the same as collecting or validating CPU-time results. The actual hash/verify invocation CPU samples remain outstanding. Use the dashboard Query Builder or supported Observability API after the next runtime deployment. The current Cloudflare cleanup failure-injection workflow must also complete before that gate can be marked passed.

The controlled cleanup-failure workflow change is committed, but its first marked run (#45838191990) was canceled before execution when a newer push superseded it. The latest normal runtime run is queued at #45838254764; it does not enable failure injection. The failure-path test therefore remains **unverified** and needs a dedicated marker commit after the current prototype CI run completes.

## Parser robustness work

Added `tests/phc_input_corpus.rs` with structural PHC mutations, canonical Base64 edge cases and 4,096 deterministic arbitrary bounded inputs. The first CI attempt caught two rustfmt-only differences; those were corrected. Host tests, including the new corpus, and Clippy now pass in the latest run, while WASM binding generation and integration checks are still running. See [prototype CI #45837980772](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45837980772).

The dedicated Cloudflare runtime workflow now supports a controlled post-deployment failure mode, enabled only by a commit containing `[argon2-cleanup-failure-test]`. Its cleanup trap deletes the temporary Worker and confirms the Cloudflare API returns HTTP 404 before treating the injected failure as a successful cleanup test. Verification is pending in [runtime CI #45838191990](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45838191990).

# Isolated Argon2id prototype

**Status: experimental source prototype; not approved for application use or deployment.**

This crate pins RustCrypto Argon2 to commit `dc7e0c25cda9a8421d2604debf548d663886b431` and uses Argon2id v=19 with fixed parameters: 19,456 KiB, two passes, one lane and a 32-byte output. The JavaScript host generates a unique 16-byte salt with `crypto.getRandomValues`.

## Implemented and CI-verified

- Bounded password, salt and PHC inputs; length checks occur before copying data into Wasm memory.
- `wasm-bindgen` exports for fixed-profile tag derivation, PHC generation and PHC verification.
- JavaScript adapter with CSPRNG salt generation, byte-length validation and best-effort clearing of mutable JavaScript byte buffers.
- Password copies inside Wasm use `Zeroizing<Vec<u8>>`; output and verification tag buffers use zeroizing wrappers.
- Fixed Argon2id parameters; PHC cost values cannot be selected by the caller.
- Strict PHC algorithm, version, parameter, base64 and decoded-field-length validation.
- Independent `argon2-cffi 25.1.0` PHC fixture verification, wrong-password rejection and exact encoding agreement.
- Working-memory wipe test that fills a multi-block matrix, invokes the wipe routine and asserts every word is zero.
- RustCrypto Argon2id v=19 known-answer test, determinism/differentiation tests, malformed-input tests and ABI boundary tests.
- Generated `wasm-bindgen` web and Node.js glue in CI.
- JavaScript adapter tests covering CSPRNG handling, input boundaries, PHC operations and explicit Wasm memory growth.

Latest prototype CI: [Run #45836658113](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45836658113) passed formatting, host tests, Clippy, release Wasm compilation, binding generation, JavaScript adapter/memory-growth tests and artifact upload.

## Cloudflare Workers runtime and benchmark

Isolated runtime workflow [Run #45836666885](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45836666885) passed:

- Precompiled Wasm build and Wrangler Worker deployment.
- Worker startup and health response.
- PHC generation, correct-password acceptance and wrong-password rejection.
- Linear-memory growth from 17 to 323 Wasm pages (64 KiB per page); memory remained at 323 pages after sequential and concurrent requests.
- Four sequential hash requests, four sequential verification requests and two concurrent hash requests.
- Temporary Worker deletion confirmed by Cloudflare API (HTTP 200).

**Benchmark interpretation:** the concurrent two-request batch took 108.956 ms wall-clock in this single CI run. The Worker-reported per-operation `performance.now()` samples were all 0 ms, so that timer did not provide usable per-operation resolution in this run. These are not CPU-time measurements and are not a statistically meaningful performance characterization. Cloudflare invocation CPU-time evidence remains outstanding.

## Not yet verified or approved

- Actual Cloudflare invocation CPU-time evidence (`CPUTimeMs`) for Argon2id hash and verify requests.
- Repeatable latency distribution, peak memory under meaningful concurrent load and plan-limit compliance.
- Broad PHC fuzz/property coverage and multiple independent implementation/version fixtures.
- Controlled failure-path cleanup test.
- Generated Wasm/binding and dependency provenance review.
- Application authentication integration, stored-password migration, rate limiting, rollback and Production release approval.

## Security limitations

The explicit zeroization test verifies the wrapper's wipe routine. It does not prove resistance to compiler transformations, allocator copies, runtime snapshots, crashes or process termination. Clearing mutable JavaScript buffers is best effort; JavaScript strings are immutable and cannot be reliably zeroized. Do not describe this implementation as guaranteeing complete password erasure.

## Next engineering priority

Add a deterministic malformed-PHC/property corpus that exercises parser boundaries and canonical base64 handling without repeatedly invoking the expensive KDF. Then add controlled failure-path Worker cleanup verification. Keep CPU-time evidence as a separate release blocker; do not infer it from wall-clock timing or lower the KDF parameters to fit a runtime limit.

This prototype remains separate from the website's authentication path until runtime compatibility, security review and release assessment are complete.


## Verification checkpoint — 2026-11-26 (latest)

- Prototype CI [#45843299302](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45843299302) passed formatting, host tests, Clippy, WASM compilation, wasm-bindgen generation, JavaScript adapter/memory-growth tests and artifact upload.
- The host-test log confirms both independent PHC fixtures passed: argon2-cffi and libsodium. The deterministic malformed-PHC corpus also passed (including 4,096 bounded arbitrary ASCII inputs).
- Adapter tests passed Web Crypto salt generation, input-boundary rejection, memory-growth handling and best-effort cleanup of adapter-owned buffers on success and controlled WASM failures.
- Controlled runtime cleanup test [#45840895843](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45840895843) passed: injected post-runtime failure, Worker deletion HTTP 200, and API absence verification HTTP 404.
- Runtime test [#45843299379](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45843299379) passed, including Worker deployment, hash/verify and cleanup. Cloudflare Logs was subsequently queried for that Worker over the last 24 hours and returned zero matching records. No CPUTimeMs or WallTimeMs values were available.

**Current status:** experimental and isolated; not approved for application integration or production. Actual Cloudflare invocation CPU-time evidence, repeatable performance characterization, dependency lockfile/provenance review and an external security assessment remain open. Do not infer CPU time from performance.now() wall-clock samples. Zeroization tests do not prove complete erasure.


## Dependency reproducibility checkpoint — 2026-11-26

- Retrieved the generated lockfile from successful prototype CI artifact `argon2id-wasm-f541b2a72b4aba872c294af035c9aa3257ae3a96` (GitHub Actions artifact ID `15131972377`).
- Committed it as `prototypes/argon2id-wasm/Cargo.lock` in commit `e67b6e669be50fe6922c3df3bf1b01979ba51aa2`. The committed file is 7,682 bytes, 293 lines and contains 34 package entries including the prototype root package.
- Prototype CI now uses `--locked` for host tests, Clippy, WebAssembly builds and wasm-bindgen crate resolution; the CLI installation itself uses `--locked`.
- The post-commit clean-checkout workflow [#45852609412](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45852609412) has passed lockfile setup, formatting, host tests, Clippy and WebAssembly compilation. At the time of this update, wasm-bindgen generation and Node integration tests are still running. Therefore the full reproducibility gate is **not yet closed**.
- The Cloudflare runtime workflow was also updated to use the committed lockfile with `--locked`. Its next run [#45852694342](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45852694342) is queued. It includes a bounded 150-second post-test hold so Cloudflare invocation telemetry can be inspected before the existing EXIT cleanup removes the temporary Worker.

The Argon2 source remains pinned to immutable revision `dc7e0c25cda9a8421d2604debf548d663886b431`. Dependency version pinning is now implemented; full reproducibility remains pending until the post-commit CI completes all steps, and provenance review must still record the Rust toolchain, wasm-bindgen CLI version and artifact checksums. This does not constitute an external security audit or approval for application integration.



## Build provenance checkpoint — 2026-11-26

- Added `docs/ARGON2ID_BUILD_PROVENANCE.md` with the pinned build inputs, audit boundaries and remaining supply-chain controls.
- Pinned the Rust toolchain to 1.100.0 in both prototype CI and the isolated runtime workflow. Earlier successful CI logs confirmed rustc 1.100.0 (commit `0ef1bc386`, 2026-11-09).
- Locked `wasm-bindgen` CLI resolution to the crate version in Cargo.lock (0.2.130); Wrangler is pinned to 4.160.1.
- Added RustSec `cargo-audit 0.23.0` to prototype CI, plus a package license/source inventory, compiler/tool versions and SHA-256 checksums for generated artifacts.
- The new audit/provenance CI run [#45855759095](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45855759095) is still running. No vulnerability-scan or artifact-checksum result is claimed until it completes.
- GitHub Actions references remain major-version tags and Node.js remains pinned to major 22; immutable action SHAs and an exact Node patch are still supply-chain hardening items.

**Current status:** dependency provenance work is implemented but not yet CI-verified. Application integration and production remain blocked. Actual Cloudflare invocation CPU-time telemetry and an independent security assessment are also outstanding.
