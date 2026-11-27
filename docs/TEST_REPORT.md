

## 2026-11-27 — MFA disable/reset atomicity hardening added

A further source review found MFA disable previously consumed the TOTP counter or recovery code before the separate session-revocation/deletion batch. The route now updates the factor and assigns a unique `factorClaimId` in the same guarded batch sequence; session-version increment is permitted only when that exact claim marker is present, followed by recovery-code and credential deletion. Migration 0020 adds `last_factor_claim_id` and `used_by` columns for these claim markers. Added source assertions and SQLite transaction coverage. CI result is pending for this additional change. No remote migration or deployment has occurred.


## 2026-11-27 — MFA single-use challenge CI validation passed

- Development validation [#45996901546](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45996901546) completed successfully for branch head `782cec9dfd2951d0571d64e5baaf9d6f321b35e5`.
- Passed Worker syntax, site validation, RBAC, CMS/Page Builder atomicity, CMS revision SQL, password compatibility, Admin MFA cryptographic/source-contract checks, the new MFA challenge SQLite transaction/replay test, course pricing, registration and quotation response tests.
- This is CI/source-level evidence only. It does not prove remote D1 migration compatibility or authenticated Preview replay resistance.
- Migration 0020 remains unapplied remotely; Preview deploy job was skipped. No D1 write, Preview deployment, Production action, `main` update or PR merge occurred.
## 2026-11-27 — MFA challenge replay remediation tests added

- Source changes: database-backed challenge issuance and validation; one-time claim is coupled to TOTP counter or recovery-code consumption in one D1 batch. Enrollment challenge consumption is coupled to MFA credential activation and recovery-code creation.
- Added static/source assertions to `scripts/test-admin-mfa.mjs` and SQLite transaction tests to `scripts/test-admin-mfa-challenge.py` covering first use, replay with a different TOTP factor, recovery-code replay, enrollment replay, expiry and purpose mismatch.
- Added the SQLite test to `.github/workflows/validate-development.yml`.
- **Result pending:** do not report these checks as passed until the new CI run completes. SQLite tests model serialized transaction outcomes; they are not a substitute for authenticated concurrent requests against D1.
- Migration 0020 has not been applied remotely; no Preview/Production deployment or D1 write was performed.

## 2026-11-27 — MFA challenge replay test gap

Source review of `src/worker.js` found that the signed five-minute MFA challenge nonce is not persisted or consumed after successful verification. The current MFA tests cover TOTP vectors, encryption, recovery-code hashing and static source contracts, but do not test single-use challenge replay or concurrent verification against one challenge. This is a high-priority unresolved security finding. No live exploit test was performed. Required retests: sequential replay, concurrent replay, wrong-purpose, expiry and successful fresh challenge after new password login.


### Additional Cloudflare usage-model finding (official docs checked 2026-11-27)

Cloudflare's current limits documentation also lists the deprecated legacy **Bundled** usage model, whose HTTP-request CPU limit is 50 ms; legacy Unbound has limits matching Workers Paid. This is another possible explanation to investigate, but it does not resolve the observed 51–97 ms samples or establish which model applies to this Worker. Confirm the exact Worker Usage Model in the Dashboard. Official source: https://developers.cloudflare.com/workers/platform/limits/ (sections “CPU time” and “Unbound and Bundled plan limits”).
## 2026-11-27 — CPU budget interpretation limitation

Runtime #45879657641 is a test PASS for its isolated runtime and cleanup scope. It does not establish plan compatibility. The 11 non-zero route-level CPU samples (44–97 ms) conflict with the earlier recorded Workers Free 10 ms/request assumption. Account/Worker usage model and effective CPU limit are not yet verified. No compliance conclusion is made. See `docs/ARGON2ID_CPU_TIME_MEASUREMENT.md`.

# Test Report — Sohel Consulting Website

**Updated:** 2026-11-27  
**Branch:** `current-focus-development`  
**Evidence rule:** A test is passed only for the scope and run stated. Source tests do not prove live workflow acceptance.

## Latest verified run: Isolated Argon2id Cloudflare runtime — PASS

- Workflow [#45879657641](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45879657641), run number 67.
- Commit: `275c122fd11019670823902e4e41a1e9bde86543`.
- Job `runtime`: conclusion `success`.
- Precompiled WASM build and bindings passed.
- Disposable Worker deployment, health, hash/verify, correct/wrong password checks, sequential and concurrent request exercise passed.
- Telemetry report succeeded and returned 12 invocation records for the exact disposable Worker.
- Cleanup passed: DELETE HTTP 200; follow-up absence check HTTP 404.
- No application authentication integration, existing Preview deployment, D1 operation, Production change, `main` update or PR merge occurred.

## Request-level invocation observations

The telemetry event source URL included the request path and each event's script name matched the exact disposable Worker. This supports attribution to individual Worker route requests, not isolation of the Argon2 primitive from other route work.

| Route | Count | CPU-time samples (ms) | Wall-time samples (ms) |
|---|---:|---|---|
| POST /hash | 6 | 45, 48, 44, 51, 78, 66 | 63, 48, 44, 51, 79, 66 |
| POST /verify | 5 | 84, 73, 63, 51, 97 | 85, 74, 63, 52, 100 |
| GET /health | 1 | 0 | 0 |

These are small samples from one disposable Worker run. They are not a stable performance distribution, pure KDF-only measurements, or proof of CPU-limit compliance. Reconcile them with the account's actual plan and effective CPU limit before any compliance statement.

## Other recorded validation

- Development website validation run #1557 was triggered by documentation updates. Check its final conclusion before claiming the latest documentation commit passed CI.
- Earlier Preview browser smoke run #45 passed HTTP/security checks and responsive checks for four pages at 390px and 1440px, including unauthenticated Admin entry-state assertions. This is historical smoke evidence, not complete authenticated acceptance.
- Preview deployment Run #16 (2026-11-24) was recorded as successful. Do not assume current development head is deployed.
- Argon2id prototype CI #45856402852 previously passed locked RustSec audit, host tests, Clippy, WASM build/bindings and artifact upload. Check later run history before treating this as latest prototype CI status.

## Acceptance matrix

| Area | Current evidence | Status |
|---|---|---|
| JS syntax/source validation | Automated checks exist; latest run pending review | Partial |
| Public EN/BN page smoke | Prior HTTP and responsive smoke passed | Partial |
| Admin login entry state | Unauthenticated browser checks passed | Partial |
| Authenticated Admin dashboard | User confirmed access on 2026-11-26 | Access confirmed only |
| MFA enrollment and fresh MFA login | No complete independent runtime evidence recorded | Not tested |
| Recovery code single use | No complete independent runtime evidence recorded | Not tested |
| RBAC direct API allow/deny | Source review exists; limited-role runtime tests pending | Not tested |
| CMS concurrency and stale-write 409 | Source implementation exists; two-session Preview acceptance pending | Not tested |
| Page Builder | Source exists; full runtime acceptance pending | Not tested |
| Cloudinary upload/media inventory | End-to-end acceptance pending | Not tested |
| Courses, pricing and registration | End-to-end acceptance pending | Not tested |
| Inquiry, quotation and enrollment | End-to-end acceptance pending | Not tested |
| Chat workflow | End-to-end acceptance pending | Not tested |
| OWASP ASVS Level 2 | No completed requirement-by-requirement report | Not tested |
| Production backup/migration/secrets | Preflight evidence incomplete | Not tested |
| Production deployment | Not performed in this checkpoint | Not deployed |

## Test execution policy

Record run ID/URL, tested commit, environment, exact scope, result, metrics, limitations, cleanup and side effects. Use synthetic records only with explicit authorization. Never submit real business records as test data.
