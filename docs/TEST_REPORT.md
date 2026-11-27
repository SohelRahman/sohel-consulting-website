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
