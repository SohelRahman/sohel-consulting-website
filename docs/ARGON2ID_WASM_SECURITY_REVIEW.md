## Runtime retry checkpoint — 2026-11-26

- Runtime #45859485701 failed when `/verify` returned HTML instead of JSON. The prior harness parsed JSON without recording HTTP status/content type. Cleanup nevertheless passed (HTTP 200 deletion, HTTP 404 absence check).
- Added bounded retries and diagnostics for transient non-JSON, 5xx and 429 responses. Rerun #45859898860 is queued.
- No CPU-time evidence was captured. The prototype remains not approved for integration or production.

## Latest verification update — 2026-11-26

- Runtime #45857773930 passed isolated Worker deployment, health, hash/verify, correct/wrong password checks, sequential/concurrent requests and cleanup (HTTP 200 deletion; HTTP 404 absence verification).
- Memory grew from 17 to 323 Wasm pages and remained stable. Two concurrent hash requests took 124.138 ms combined wall-clock; this is not CPU-time evidence.
- Cloudflare telemetry key discovery exposed `$workers.cpuTimeMs` and `$workers.wallTimeMs`, but the invocation query returned zero groups. The unverified `$metadata.service` filter has been removed; unfiltered metadata diagnostic #45859485701 is running.
- Prototype CI #45856402852 passed RustSec audit, test/build pipeline and provenance artifact upload.
- Decision remains **not approved for application integration or production release**. Actual CPU-time samples, repeatable performance characterization, signed provenance, independent rebuild, license review and external security assessment remain open.

## Latest verification update — 2026-11-26 (run #45856609844)

- Prototype CI #45856402852 passed the full test/build pipeline and the locked RustSec audit. The audit scanned 34 locked dependencies against 1,568 loaded advisories and exited successfully. Provenance artifact ID: `15134694932`.
- Isolated Cloudflare runtime #45856609844 passed Worker deployment, health, PHC generation/verification, correct/wrong password checks, sequential/concurrent requests and cleanup (HTTP 200 deletion; HTTP 404 absence verification).
- Memory grew from 17 to 323 Wasm pages and remained stable through the request exercise. Two concurrent hash requests took 160.404 ms combined wall-clock. Per-operation timers returned 0 ms; no CPU-time inference is valid.
- The telemetry query did not expose CPU/wall-time keys. Runtime workflow corrected in commit `8ee6e9e` to enumerate keys and filter by `$metadata.service`; rerun pending.
- Build emitted a future-incompatibility warning for `buf_redux 0.8.4` and `multipart 0.18.0`; dependency paths need review. License expressions still require manual review.
- Decision remains **not approved for application integration or production release**. Signed provenance, independent rebuild, CPU-time samples, repeatable performance characterization and external security assessment remain open.

## Latest verification update — 2026-11-26

- Prototype CI [#45838494936](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45838494936) passed the expanded deterministic PHC corpus, formatting, host tests, Clippy, WASM build, binding generation and JavaScript integration/memory-growth tests.
- Controlled failure-path runtime test [#45840895843](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45840895843) passed. It injected the expected post-runtime failure, deleted the temporary Worker (HTTP 200), then confirmed the Worker was absent through a follow-up API GET (HTTP 404). Failure-path cleanup is now verified for this workflow path.
- That run's concurrent two-hash batch was 201.874 ms wall-clock; per-operation timers were 0 ms, and memory remained at 323 pages after growth from 17. No CPU-time figure was captured.
- Native invocation logging has been enabled in the prototype Wrangler config, and a dedicated measurement procedure is documented in `docs/ARGON2ID_CPU_TIME_MEASUREMENT.md`. The config has not yet been exercised by a completed runtime run.

## CPU-time observability implementation — 2026-11-26

- Enabled Cloudflare native Workers invocation logs for the isolated Argon2id Worker at 100% head sampling in its Wrangler configuration.
- Added `docs/ARGON2ID_CPU_TIME_MEASUREMENT.md` with the dashboard/API measurement procedure and acceptance criteria.
- Cloudflare documents CPU time separately from wall time in invocation logs and Trace Events. Workers Logs is listed as included on Workers Free; this prototype does not create a Logpush job or external destination.
- **Status remains blocked:** no actual `CPUTimeMs` samples have been collected yet. The config change must deploy and invocation records must be inspected and tied to the correct temporary Worker/run before performance conclusions are drawn.

## Additional runtime observation — 2026-11-26

A second ordinary isolated runtime run, [#45837980987](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45837980987), passed Worker build/deploy, hash/verify, sequential/concurrent request checks and cleanup (HTTP 200). The two-request batch was 145.017 ms wall-clock; per-operation hash/verify timer samples again reported 0 ms. Memory grew 17 to 323 pages and remained at 323. This reinforces that the current per-operation timer is not useful and that wall-clock is not CPU time. This run did not exercise the injected failure path.

- **Failure-path cleanup status correction:** the marked run #45838191990 was canceled before execution; it did not verify cleanup. The latest normal runtime run #45838254764 is queued without failure injection. Treat failure-path cleanup as open until a marked run completes and confirms HTTP 404 after deletion.

## Latest test work — 2026-11-26

- Added a deterministic PHC parser corpus covering structural mutations, canonical Base64 boundaries and 4,096 arbitrary bounded ASCII inputs. Formatting, host tests and Clippy passed in prototype CI #45837980772; WASM binding and adapter checks were still in progress at the time of this update.
- Added an opt-in controlled failure injection after successful Worker runtime checks. The cleanup trap now verifies both deletion success and subsequent API-level absence (HTTP 404). The test is enabled only by the `[argon2-cleanup-failure-test]` commit marker; runtime CI #45838191990 is pending.
- These are test additions, not a security approval. The prototype remains isolated.

# Argon2id WASM Prototype — Security Review

**Review date:** 2026-11-26  
**Scope:** `prototypes/argon2id-wasm` only. This is a source-level review, not an external audit or penetration test.  
**Decision:** **Not approved for application integration or release.** Basic Cloudflare Workers compatibility is verified; CPU-time evidence, meaningful performance characterization and additional security tests remain open.

## Files reviewed

- `src/lib.rs`: fixed-profile Argon2id derivation, PHC parsing/verification, memory owner and WASM exports.
- `adapter.mjs`: password byte conversion, salt generation, input bounds and JS buffer cleanup.
- `worker-adapter.mjs`: precompiled module import and adapter initialization.
- `worker.mjs`: temporary token-gated runtime test endpoints.
- `wrangler.toml` and the dedicated prototype/runtime CI workflows.

## Positive controls observed

1. **Fixed KDF profile.** Argon2id v=19 is fixed at m=19,456 KiB, t=2, p=1 and a 32-byte tag. PHC verification rejects unsupported algorithms, versions and cost parameters instead of honoring attacker-controlled costs.
2. **Input bounds.** Password and salt lengths are checked before typed-array copies in the WASM exports. PHC input is bounded before parsing; malformed encoding and decoded field lengths are rejected.
3. **Salt generation.** The JavaScript adapter generates 16-byte salts using the host Web Crypto `getRandomValues` API.
4. **Working-memory cleanup.** The prototype owns its Argon2 matrix and zeroizes each block in `Drop`. A unit test fills every word in a multi-block allocation and asserts the wipe routine clears it.
5. **Password-buffer cleanup.** Rust-owned password buffers use `Zeroizing<Vec<u8>>`; mutable JavaScript byte copies are cleared in `finally` blocks.
6. **Tag comparison.** PHC verification accumulates byte differences across the full tag and does not exit early on the first mismatch.
7. **Test isolation.** The Worker harness is separate from application authentication, has no D1 binding or Admin routes, and requires an ephemeral bearer token. The explicit memory-growth export is compiled only with the test-hooks feature.

## Runtime benchmark evidence

Dedicated prototype CI [Run #45836658113](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45836658113) passed all listed build, test and binding steps.

Isolated Cloudflare runtime workflow [Run #45836666885](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45836666885) passed precompiled-Wasm deployment, Worker health, hash generation, correct/wrong password verification, repeated sequential requests, a two-request concurrent hash batch and temporary Worker cleanup (HTTP 200).

Observed in that single run:
- Wasm memory grew from 17 to 323 pages and remained at 323 pages after sequential and concurrent requests.
- Two concurrent hash requests completed as a batch in 108.956 ms wall-clock.
- Per-operation `performance.now()` hash and verify samples were all reported as 0 ms. The per-operation timer therefore had insufficient effective resolution for useful characterization in this run.
- The benchmark explicitly measures elapsed wall-clock, not Cloudflare CPU time. No `CPUTimeMs` value was captured.

These results verify basic compatibility and exercise concurrency; they do **not** establish production throughput, CPU-limit compliance, peak memory under load or a stable latency distribution.

## Findings and remaining risks

| Severity | Finding | Required action |
|---|---|---|
| **Release blocker** | No Cloudflare invocation CPU-time value has been captured. The harness's `performance.now()` readings are wall-clock and its per-operation values were 0 ms in the latest run. | Obtain `CPUTimeMs` evidence from supported invocation logs/trace events. Do not infer CPU time from wall-clock duration. |
| **Resolved for basic compatibility** | The isolated runtime workflow passed Wrangler compiled-Wasm import, Worker startup, health, hash, correct/wrong password verification, memory growth and temporary Worker deletion. | Retain as basic runtime acceptance only; it is not production readiness approval. |
| **Medium** | One two-request concurrent batch was exercised; the 108.956 ms batch wall-clock is a single observation, not a load or latency distribution. | Add controlled repeated concurrency and memory characterization after CPU-time observability is available. |
| **Medium** | Zeroization tests verify the wrapper's wipe routine, not all compiler, allocator, runtime-copy, snapshot, crash or process-termination behavior. JavaScript strings are immutable and cannot be reliably erased. | Retain precise claims; avoid promising complete password erasure. Review generated Wasm and runtime behavior before integration. |
| **Medium** | Independent PHC evidence consists of one `argon2-cffi` fixture. Broad malformed-input fuzz/property coverage and a multi-implementation version matrix are not yet present. | Add a deterministic parser/property corpus and further independent fixtures. |
| **Medium** | Failed-path cleanup has not been verified with a controlled failure injected after deployment. | Add a test-only failure injection and assert API deletion in the workflow trap. |
| **Low** | The WASM ABI exposes raw tag derivation in addition to PHC generation/verification, although the current Worker adapter uses the PHC operations. | Reassess whether the raw-tag export is needed; minimize exported surface before application integration. |

## Security boundary

The temporary Worker is a test harness, not an authentication service. Its static test password, test-only endpoints and ephemeral token must not be copied into application code. The harness has no account-level rate limiting, D1 access, session handling, MFA, password migration or application authorization logic.

No change to `src/password-hash.js`, stored password hashes, Admin authentication, D1, existing Preview services or Production resources is part of this prototype.

## Release gates

- [x] Isolated Wrangler precompiled-Wasm import and Cloudflare Worker execution pass (CI run #45827375696; repeated benchmark workflow #45836666885).
- [x] Temporary Worker deletion confirmed on successful runs (HTTP 200).
- [x] Basic sequential and two-request concurrent runtime exercise completed; results are wall-clock only and per-operation timer samples were 0 ms.
- [ ] Actual invocation CPU-time evidence is collected.
- [ ] Repeatable latency distribution and meaningful peak-memory/concurrency behavior are characterized.
- [ ] Broader PHC malformed-input/property tests and additional independent interoperability fixtures pass.
- [ ] Controlled failed-path Worker cleanup test passes.
- [ ] Generated Wasm/bindings and dependency provenance receive a separate review.
- [ ] Application rate limiting, account lockout/resource controls, legacy hash migration, audit logging and rollback design are reviewed.
- [ ] A separate security review approves application integration.

## Overall conclusion

The current source has useful defensive controls and its dedicated CI suite passes. Basic Cloudflare Workers runtime compatibility is verified. The latest isolated benchmark exercised sequential and concurrent requests, but the per-operation timer returned 0 ms and the single concurrent batch measurement is not enough to characterize performance. CPU-time evidence, broader interoperability/property coverage, failure-path cleanup and provenance review remain unresolved. Keep the prototype isolated and do not alter application authentication or stored password hashes.

## References

- Cloudflare Workers limits (official): https://developers.cloudflare.com/workers/platform/limits/
- Cloudflare Workers real-time logs (official): https://developers.cloudflare.com/workers/observability/logs/real-time-logs/
- OWASP Password Storage Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- RFC 9106 — Argon2: https://www.rfc-editor.org/rfc/rfc9106


## Verification correction — 2026-11-26 (latest)

The earlier findings table above is historical and several rows are now superseded by verified work:

- Independent PHC fixture coverage now includes both argon2-cffi and libsodium; both tests passed in prototype CI [#45843299302](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45843299302).
- Deterministic malformed-PHC parser coverage now includes 4,096 bounded arbitrary ASCII inputs; host tests passed in the same run.
- The controlled post-runtime failure cleanup test passed in [#45840895843](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45840895843): expected failure injected, temporary Worker deletion returned HTTP 200, and follow-up API check returned HTTP 404.
- JavaScript adapter tests passed buffer cleanup checks for adapter-owned mutable buffers on successful operations and controlled WASM errors. This remains best effort and does not prove full erasure.
- The latest runtime run [#45843299379](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45843299379) passed basic Worker execution and cleanup. A subsequent Cloudflare Workers Logs query for that script over the last 24 hours returned zero records, so actual CPUTimeMs/WallTimeMs evidence remains unavailable.

**Updated release blockers:** capture invocation CPU-time telemetry while the temporary Worker is still available; add repeatable load/latency and memory characterization; review a committed dependency lockfile and generated WASM/binding provenance; complete security assessment before application integration. This remains a source-level review, not an external audit. No production release approval is implied.


## Dependency reproducibility checkpoint — 2026-11-26

- Retrieved the generated lockfile from successful prototype CI artifact `argon2id-wasm-f541b2a72b4aba872c294af035c9aa3257ae3a96` (GitHub Actions artifact ID `15131972377`).
- Committed it as `prototypes/argon2id-wasm/Cargo.lock` in commit `e67b6e669be50fe6922c3df3bf1b01979ba51aa2`. The committed file is 7,682 bytes, 293 lines and contains 34 package entries including the prototype root package.
- Prototype CI now uses `--locked` for host tests, Clippy, WebAssembly builds and wasm-bindgen crate resolution; the CLI installation itself uses `--locked`.
- The post-commit clean-checkout workflow [#45852609412](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45852609412) completed successfully: lockfile setup, formatting, host tests, Clippy, locked WebAssembly compilation, wasm-bindgen generation, Node adapter/memory-growth tests and artifact upload all passed. The dependency reproducibility CI gate is closed for the currently pinned graph; provenance documentation and security review remain separate work.
- The Cloudflare runtime workflow was also updated to use the committed lockfile with `--locked`. Its next run [#45852694342](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45852694342) is queued. It includes a bounded 150-second post-test hold so Cloudflare invocation telemetry can be inspected before the existing EXIT cleanup removes the temporary Worker.

The Argon2 source remains pinned to immutable revision `dc7e0c25cda9a8421d2604debf548d663886b431`. Dependency version pinning is now implemented; full reproducibility remains pending until the post-commit CI completes all steps, and provenance review must still record the Rust toolchain, wasm-bindgen CLI version and artifact checksums. This does not constitute an external security audit or approval for application integration.


## Build provenance and dependency audit update — 2026-11-26

- Rust toolchain is now pinned to 1.100.0 in both prototype CI and isolated runtime workflow.
- Added a provenance artifact containing compiler/tool versions, locked dependency tree, license/source inventory and SHA-256 checksums for the generated WASM and bindings.
- Added RustSec `cargo-audit 0.23.0` against the committed Cargo.lock. The CI run [#45855759095](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45855759095) is still running; no clean audit result is claimed yet.
- Build provenance design and residual risks are documented in `docs/ARGON2ID_BUILD_PROVENANCE.md`.
- Remaining supply-chain items include immutable GitHub Action SHAs, exact Node.js patch pinning, license compatibility review, signed provenance and an independent clean rebuild.

These controls improve traceability but do not replace an independent security audit. CPU-time evidence, repeatable performance characterization and application security review remain separate release blockers.


## Toolchain warning classification — 2026-11-26

The future-incompatibility warning for `buf_redux 0.8.4` and `multipart 0.18.0` was emitted while compiling the separately installed `wasm-bindgen-cli` build tool, not while compiling the Argon2id crate. A direct check of the committed application `Cargo.lock` confirms neither package is present in its 34-package dependency graph. Keep this as a tooling dependency warning for follow-up; do not misclassify it as an application runtime dependency or a RustSec advisory. The pinned `wasm-bindgen-cli` version remains 0.2.130.
