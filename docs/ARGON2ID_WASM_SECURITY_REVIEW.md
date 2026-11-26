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
