

## 2026-11-27 — Last-active-Administrator protection integration coverage added

Extended the Admin API integration fixture to distinguish the authenticated administrator from a separate target account and to model the active-Administrator count query. Added real Worker-handler tests asserting that both PATCH disablement and DELETE are rejected with HTTP 409 when the target is the only active administrator. This validates the existing guard at the handler boundary; it does not establish behavior under concurrent D1 mutations. CI validation for commit `75ab74ca89850fbc37d743f394c3b22638228c47` is pending. No Preview/Production deployment or remote D1 write was performed.


## 2026-11-27 — Admin self-delete integration fixture corrected

The latest Admin API integration run failed because the self-delete test used a request helper that omitted the required same-origin `Origin` header. The route correctly rejected that request with HTTP 403 before reaching its self-delete guard; the test expected HTTP 400. Updated the test to use the JSON request helper, which sends the same-origin header. This is a test-fixture correction, not a Worker behavior change. Validation for commit `a9d0e1c66c1499576f7dab28bb3265d210fff1ef` is pending. No Preview/Production deployment, remote D1 migration, or data write was performed.


## 2026-11-27 — MFA migration compatibility test strengthened

The SQLite challenge test now builds its schema by applying the existing `migrations/0019_admin_mfa.sql` followed by `migrations/0020_admin_mfa_challenge_state.sql`, instead of manually creating simplified MFA tables. It asserts the added `last_factor_claim_id`, `used_by`, and challenge-consumption columns exist, then exercises challenge replay, factor single-use and reset/session-revocation transactions against that migrated schema. This improves migration-order coverage but is still SQLite validation, not a remote Cloudflare D1 migration rehearsal. CI for this latest change is pending. No Preview/Production migration or deployment was performed.


## 2026-11-27 — MFA challenge and disable/reset hardening CI passed

- Development validation [#45997274827](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45997274827) completed successfully for branch head `a4f93af07ac9df33ad19cc8a4c8a722ec7910d37`.
- The passing job includes Worker syntax, site validation, RBAC, CMS/Page Builder atomicity, CMS revision SQL, password compatibility, MFA cryptographic/source-contract tests, SQLite challenge replay/expiry/purpose tests, and MFA disable/reset factor-claim transaction checks, plus course pricing, registration and quotation tests.
- The MFA disable route now assigns a unique factor claim marker to the consumed TOTP counter or recovery-code row. Session-version revocation is conditional on that exact marker, then MFA credential and recovery-code state are removed. This prevents a competing reset request from relying only on a factor value already consumed by another request.
- This remains CI/source-level evidence. No authenticated D1 runtime replay/reset test has run. Migration 0020 has not been applied remotely and Preview deployment was skipped.
- Next gate requires explicit authorization to apply migration 0020 and deploy the development Worker to Preview, then test fresh enrollment, MFA login, sequential/concurrent challenge replay, recovery-code single use, MFA reset and RBAC using a controlled Preview account. No Production action is included.


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

## MFA migration compatibility and CI — 2026-11-27

- Branch: `current-focus-development`; tested commit: `0832630d1b3dd034db064a7d778df5a5eeaa1ea0`.
- GitHub Actions [validation run #46002420731](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/46002420731): validation job completed successfully.
- The test applies migrations `0019_admin_mfa.sql` then `0020_admin_mfa_challenge_state.sql` to SQLite and checks challenge replay, expiry, purpose, TOTP counter, recovery-code replay, enrollment replay and MFA-disable/reset factor/session atomicity.
- The initial failure was a test fixture violating migration 0019's enabled-credential CHECK constraint (enabled credentials require `secret_ciphertext`). The fixture was corrected; no production code change was needed for this failure.
- This is SQLite transaction/schema compatibility evidence, not a live Cloudflare D1 migration or Preview runtime test. Migration 0020 remains unapplied remotely pending explicit authorization.
- Preview deployment and runtime smoke workflows were skipped; Production remains untouched.

## Test execution policy

Record run ID/URL, tested commit, environment, exact scope, result, metrics, limitations, cleanup and side effects. Use synthetic records only with explicit authorization. Never submit real business records as test data.

## Preview deployment MFA gate — 2026-11-27

The guarded Preview deployment workflow now runs `python3 scripts/test-admin-mfa-challenge.py` alongside the existing MFA cryptographic/source-contract checks before any Preview deployment step. This adds the SQLite migration-order, challenge replay, expiry, purpose, recovery-code and factor/session transaction checks to the deployment gate. It does not apply migration 0020 or deploy the Worker. The workflow change is on `current-focus-development`; its CI validation is pending.

## Preview workflow and development CI gate — 2026-11-27

- Validation run [#46002620627](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/46002620627) passed for commit `0bf2e16032b97bab504170caa8d1738aded25c74` on `current-focus-development`.
- The successful job parsed the Preview deployment workflow YAML and passed all listed source, contract and SQLite tests, including `scripts/test-admin-mfa-challenge.py`.
- The guarded Preview deployment workflow now includes that MFA transaction test before its deployment steps. The workflow change was syntax-validated; this CI run did not dispatch the deployment workflow.
- No remote migration, Preview deployment or Production operation occurred. The last known Preview D1 migration state still requires a fresh read-only audit to confirm it remains current.


## 2026-11-27 — Executable Admin RBAC route matrix added

Added an executable test matrix to `scripts/test-rbac-contract.mjs`. It extracts and runs the actual `requiredPermission(path, method)` function from `src/worker.js` and asserts representative read/manage mappings across dashboard, courses, registrations, inquiries, CMS, site content, styles, pages, media, analytics and chat. It also checks Admin-only identity/user routes, unknown paths, the media-audit unsupported-method case, and ensures an unsupported method does not receive a read permission. This is a deterministic unit-level check of the permission mapper, not an authenticated API test: it does not prove role/session enforcement, HTTP status codes or Cloudflare D1 behavior. CI is pending. No Preview deployment, migration, D1 write or Production change was performed.


## 2026-11-27 — Admin and limited-user permission normalization tests added

Extended the RBAC test to execute the actual `permissionsFor()` implementation. New cases assert that Admin receives the complete permission set, limited users retain only allowlisted permissions, malformed JSON grants no permissions, and non-array permission data grants no permissions. Combined with the route-to-permission matrix, this strengthens deterministic unit coverage of the permission model. It still does not exercise authenticated HTTP requests, session revocation, 401/403 responses or live D1. CI is pending. No remote migration, Preview deployment or Production change was performed.


## 2026-11-27 — Read-only Admin route method allowlist

- Updated `requiredPermission()` so Admin summary, registrations, inquiries, analytics, and chat-conversation collection endpoints receive their view permission only for `GET`.
- Extended `scripts/test-rbac-contract.mjs` to execute the real permission mapper and assert that `POST`, `PUT`, `PATCH`, `DELETE`, and `OPTIONS` return no permission requirement for those read-only routes.
- Validation status: CI pending. These are isolated function/contract tests, not authenticated Worker HTTP tests or Preview runtime checks.
- No D1 migration, Preview deployment, or Production action was performed.


## 2026-11-27 — Authenticated Admin API handler tests

- Added `scripts/test-admin-api-auth.mjs`; it invokes the actual Worker `fetch()` handler with signed test sessions and a controlled D1 mock.
- Scenarios: unauthenticated request 401; Admin summary read 200; limited user lacking `dashboard.view` 403; revoked session version 401; disabled account 401; MFA-not-enrolled account 401.
- Added the test to `.github/workflows/validate-development.yml`.
- Validation status: CI pending. The test uses mocked D1 and does not establish remote D1/Preview behavior.
- No Preview or Production deployment/migration was performed.


## 2026-11-27 — Authenticated Admin API handler integration CI passed

Development validation [#46030635598](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/46030635598) completed successfully. The authenticated Admin API handler integration step passed, along with the workflow's remaining validation steps. The test uses a mocked D1 adapter, so this does not replace remote Preview/D1 runtime verification. The Preview runtime smoke and Preview deployment jobs for this commit were skipped by workflow conditions; no Preview deployment occurred.


## 2026-11-27 — Authenticated Admin API permission boundary coverage expanded

Expanded `scripts/test-admin-api-auth.mjs` beyond the initial six authentication scenarios. New real-Worker-handler cases verify that a limited user with only `courses.view` cannot POST to the course collection, a dashboard-only user cannot read courses, and a limited user is denied GET/POST/PATCH/DELETE access to Admin-only account-management routes even when holding unrelated manage permissions. An Admin account-list GET is also checked. The test now contains 13 scenarios. These checks use signed test sessions and mocked D1; they do not establish live Cloudflare D1 or Preview runtime behavior. CI is pending. No Preview deployment, migration 0020 application, or Production action was performed.


## 2026-11-27 — Authenticated course view/manage boundary tests added

Extended `scripts/test-admin-api-auth.mjs` with three real Worker-handler cases: a `courses.view` user can read the course collection (200); a `courses.manage` user passes the RBAC gate and reaches course input validation (400 for an intentionally empty payload); and a `courses.view`-only user is denied the same POST (403). The invalid manage request is deliberately rejected before any database write, so this tests permission routing without mutating data. The suite now contains 16 scenarios. D1 remains mocked; CI is pending and this is not Preview runtime evidence. No deployment, remote migration, or Production change was performed.


## 2026-11-27 — Authenticated inquiry, registration and chat permission tests added

Extended `scripts/test-admin-api-auth.mjs` with real Worker-handler coverage for inquiry collection read and status mutation boundaries, registration quote-history read and quote-creation boundaries, and chat conversation read/reply boundaries. View-only inquiry/registration users and chat.view users are denied mutation (403); corresponding manage/reply permissions reach handler validation (400 for deliberately invalid input); permitted collection/history reads return 200. The invalid mutation payloads are rejected before writes. The suite now contains 24 scenarios. All use signed test sessions and mocked D1, not live Cloudflare D1 or Preview. CI is pending. No Preview deployment, migration application or Production action was performed.


## 2026-11-28 — Authenticated CMS permission coverage and release status

Added three authenticated Worker-handler cases to `scripts/test-admin-api-auth.mjs`: a `content.view` user can read a CMS page (200) but cannot save a draft (403); a `content.manage` user passes RBAC and reaches draft validation (400 for an intentionally empty payload). The invalid save does not reach D1 writes. The authenticated Admin API suite now contains 27 scenarios. Tests use signed sessions and mocked D1; CI for this update is pending and no Preview runtime proof is claimed.

**Release / Production status:** This is a source-and-test update on `current-focus-development` only. Production Worker, Production D1, secrets and configuration were not changed. No Production deployment or migration was performed. Preview deployment remains gated/skipped; migration 0020 remains unapplied remotely. Production release is not approved and is not complete. Existing release blockers remain: fresh Preview D1 migration audit, explicit approval for Preview migration 0020 and Preview deployment, live Preview acceptance for MFA/RBAC/Admin workflows, and Production readiness review.


## 2026-11-28 — CMS publishing authorization boundary added

Added two further authenticated Worker-handler tests: `content.view` is denied CMS publish (403), while `content.manage` reaches page-identifier validation (400 for an intentionally invalid page identifier). The test rejects before any publishing query or database write. The authenticated Admin API integration suite now contains 29 scenarios. This remains mocked-D1 handler coverage, not live Preview CMS publishing evidence. CI is pending for this latest test change.

**Production update:** No Production feature was deployed. Production Worker, D1, secrets and configuration remain untouched. The Preview deployment job was inspected for the prior documentation/test update and its deploy job was skipped. No migration 0020 was applied. Production release remains blocked pending Preview migration audit, approved Preview migration/deployment, live acceptance and Production readiness checks.

## 2026-11-28 — Admin account self-protection tests

Added three real-Worker-handler assertions in `scripts/test-admin-api-auth.mjs`: an authenticated Admin receives HTTP 400 when attempting to disable their own account, demote their own account, or delete their own account. The tests use signed sessions and mocked D1 and do not perform writes to a real database.

The expected suite count is 32 (previously documented 29 plus three); the CI output must confirm the actual emitted counter. CI for commit `240ec22c2cb733db2cba285a09920616c5e0ff00` is pending. This does not verify target-account updates, last-active-Admin protection, password reset, or actual session revocation against D1. No Preview/Production deployment or migration occurred.

## 2026-11-28 — Self-protection test fixture correction

CI identified that the new DELETE self-account test did not reach the route's self-delete check because the fixture user ID was not UUID-shaped. Updated `sessionCookie()` to accept a test identity override and use the same UUID in the signed token and route path. This corrects the test setup only. Previous run failed on the DELETE assertion (403 versus expected 400); rerun for fix commit `d56c8ecdfecb8b208b109b1f10535ef7230f5066` is pending.
