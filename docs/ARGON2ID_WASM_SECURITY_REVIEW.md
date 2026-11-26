# Argon2id WASM Prototype — Security Review

**Review date:** 2026-11-26  
**Scope:** `prototypes/argon2id-wasm` only. This is a source-level review, not an external audit or penetration test.  
**Decision:** **Not approved for application integration or release.** Keep isolated until runtime and performance gates pass.

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

## Findings and remaining risks

| Severity | Finding | Required action |
|---|---|---|
| **Release blocker** | Cloudflare Workers Free has a 10 ms CPU-time limit per HTTP request. The Argon2id baseline performs substantial CPU work; the current harness records `performance.now()` elapsed time, not Cloudflare CPU time. | Confirm runtime compatibility and obtain invocation CPU-time evidence. Do not lower KDF parameters to force a pass. |
| **High / unresolved** | Cloudflare runtime compatibility has not yet been accepted. Local Node tests and Wasm compilation do not prove Wrangler's compiled-module import or Workers execution. | Require the isolated Worker workflow to pass hash, correct-password, wrong-password, memory-growth and cleanup checks. |
| **Medium** | Zeroization tests verify the wrapper's wipe routine, not all compiler, allocator, runtime-copy, snapshot, crash or process-termination behavior. JavaScript strings are immutable and cannot be reliably erased. | Retain precise claims; avoid promising complete password erasure. Review generated Wasm and runtime behavior before integration. |
| **Medium** | Independent PHC evidence consists of one `argon2-cffi` fixture. There is no broad fuzz/property suite or multi-implementation version matrix. | Add malformed-input fuzzing, property tests and more independent fixtures before production consideration. |
| **Medium** | There is no concurrency/load, peak-memory or failure-injection evidence. A 19 MiB matrix is only the algorithm's working-memory baseline; isolate memory and CPU behavior still need measurement. | Benchmark serial and concurrent requests, memory reuse/growth and allocation-failure behavior on the actual Worker plan. |
| **Low** | The WASM ABI exposes raw tag derivation in addition to PHC generation/verification, although the current Worker adapter uses the PHC operations. | Reassess whether the raw-tag export is needed; minimize exported surface before application integration. |

## Security boundary

The temporary Worker is a test harness, not an authentication service. Its static test password, test-only endpoints and ephemeral token must not be copied into application code. The harness has no account-level rate limiting, D1 access, session handling, MFA, password migration or application authorization logic.

No change to `src/password-hash.js`, stored password hashes, Admin authentication, D1, existing Preview services or Production resources is part of this prototype.

## Release gates

- [ ] Isolated Wrangler precompiled-Wasm import and Cloudflare Worker execution pass.
- [ ] Temporary Worker deletion is confirmed even on failed test paths.
- [ ] Actual invocation CPU-time evidence is collected; wall-clock timing is labelled separately.
- [ ] Serial/concurrent latency and memory behavior are characterized.
- [ ] Broader PHC interoperability and fuzz/property tests pass.
- [ ] Generated Wasm/bindings and dependency provenance receive a separate review.
- [ ] Application rate limiting, account lockout/resource controls, legacy hash migration, audit logging and rollback design are reviewed.
- [ ] A separate security review approves application integration.

## Overall conclusion

The current source has useful defensive controls and its dedicated CI suite passes. That is not equivalent to a production security approval. Runtime compatibility, Workers Free CPU budget, concurrency/memory behavior and broader interoperability remain unresolved. Keep the prototype isolated and do not alter application authentication or stored password hashes.

## References

- Cloudflare Workers limits (official): https://developers.cloudflare.com/workers/platform/limits/
- Cloudflare Workers real-time logs (official): https://developers.cloudflare.com/workers/observability/logs/real-time-logs/
- OWASP Password Storage Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- RFC 9106 — Argon2: https://www.rfc-editor.org/rfc/rfc9106
