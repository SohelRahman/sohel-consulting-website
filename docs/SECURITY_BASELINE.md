

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
## 2026-11-27 — MFA challenge replay remediation status

The source now persists MFA challenge nonce, user, purpose and expiry. A successful login challenge is claimed once and the accepted TOTP counter or recovery-code row is updated only when the same claim succeeds. Enrollment confirmation similarly claims its challenge before enabling MFA and issuing recovery codes. This closes the previously identified source-level replay path in the intended D1 transaction model, subject to CI and D1 runtime verification.

Open verification: CI pass; migration 0020 review and authorized Preview application; authenticated sequential and concurrent replay tests; then ASVS evidence update. No remote migration or deployment has occurred. See `docs/TEST_REPORT.md`.
## 2026-11-27 — MFA challenge single-use gap identified

Read-only source review found that MFA challenge cookies are signed, purpose-bound and expire after five minutes, but their random nonce is not persisted or consumed. A successful MFA verification does not invalidate the challenge or change the session version. TOTP counter replay prevention and one-time recovery-code consumption do not make the challenge itself single-use; another valid time-step TOTP or unused recovery code could be accepted during the same challenge window. This is a high-priority source-review finding, not a live exploit demonstration.

Release blocker: persist challenge state and atomically consume each challenge once with the successful factor update. Add sequential and concurrent replay tests. See `docs/ADMIN_AUTH_MFA_SECURITY_ASSESSMENT.md`.


### Additional Cloudflare usage-model finding (official docs checked 2026-11-27)

Cloudflare's current limits documentation also lists the deprecated legacy **Bundled** usage model, whose HTTP-request CPU limit is 50 ms; legacy Unbound has limits matching Workers Paid. This is another possible explanation to investigate, but it does not resolve the observed 51–97 ms samples or establish which model applies to this Worker. Confirm the exact Worker Usage Model in the Dashboard. Official source: https://developers.cloudflare.com/workers/platform/limits/ (sections “CPU time” and “Unbound and Bundled plan limits”).
## 2026-11-27 — Argon2id execution-budget gate

The isolated runtime's 11 non-zero route-level invocation CPU samples were 44–97 ms. This conflicts with the previously recorded Free-plan 10 ms/request assumption. The effective account and per-Worker usage model/CPU limit remain unverified. Do not claim CPU-limit compliance or integrate the prototype until read-only account/Worker settings and invocation outcomes are confirmed. No billing/plan upgrade or limit/configuration change is authorized.

# Security Baseline — Sohel Consulting Website

**Updated:** 2026-11-27  
**Scope:** Website, Cloudflare Worker, D1, Admin authentication/authorization, CMS, media and release operations.  
**Status:** Baseline and gap register; not a completed penetration test or ASVS certification.

## Security principles

1. Enforce authentication and authorization server-side for every protected operation. UI visibility is not an access-control boundary.
2. Keep Preview and Production Workers, D1 databases, secrets and deployment permissions separate.
3. Validate and bound untrusted input before processing or database writes.
4. Use parameterized database access and atomic transactions for related state/history/audit changes.
5. Apply optimistic concurrency to mutable CMS content and reject stale writes.
6. Minimize secret exposure. Never place credentials, tokens, TOTP seeds, password hashes or sensitive user data in source, logs, docs or chat.
7. Fail closed on unknown protected routes, missing permissions and invalid sessions.
8. Treat CI, source review, Preview acceptance and Production release as separate evidence levels.

## Authentication and password storage

- Admin authentication, MFA and RBAC source controls/tests exist in the development branch.
- User-confirmed authenticated Admin dashboard access on 2026-11-26 is recorded. This does not prove MFA enrollment, recovery-code single use, throttling or all session behaviors.
- `docs/PASSWORD_STORAGE_DESIGN_ASSESSMENT.md` records PBKDF2-HMAC-SHA-256 with a 16-byte salt, 32-byte derived value and 100,000 iterations as a temporary compatibility configuration. The assessment states this is below the cited OWASP recommendation and is not an approved Production baseline.
- A server-side pepper is supplementary and does not compensate for an unsuitable password KDF.
- The isolated Argon2id WASM prototype is not integrated into application authentication and is not approved for integration. See `docs/ARGON2ID_WASM_SECURITY_REVIEW.md` and `docs/ARGON2ID_BUILD_PROVENANCE.md`.
- Isolated runtime #45879657641 passed and returned 6 /hash and 5 /verify invocation CPU samples. These are route invocation metrics, not pure KDF timings. Reconcile with actual account plan/CPU budget before compliance claims.

## Authorization and session controls

Required acceptance:
- Test each role's allowed and denied actions using separate authorized Preview accounts.
- Test direct API requests, not only hidden/disabled UI controls.
- Verify session expiry, logout, revocation, invalid/expired tokens and account-state changes.
- Verify MFA challenge cannot be bypassed and enrollment is enforced by policy.
- Verify recovery codes are single-use and cannot be replayed.
- Verify throttling and lockout behavior.
- Verify unknown Admin API routes and unsupported methods fail closed.

Status: source review and automated contract tests exist; complete authenticated Preview MFA/RBAC acceptance remains open.

## Input, API and data integrity

Required controls:
- Bound body size, string lengths, arrays, pagination and expensive inputs.
- Reject malformed encodings, invalid identifiers, invalid state transitions and unexpected content types.
- Use parameterized SQL; no user-controlled SQL fragments.
- Enforce server-side pricing, discount and registration validation.
- Use atomic D1 batches/transactions for related writes, history and audit events.
- Verify CMS optimistic concurrency with two sessions: stale update returns HTTP 409; revision/history/audit state remains consistent.
- Verify quotation-response privacy headers and data disclosure boundaries.
- Test rate limiting, replay and CSRF protections where applicable.

Status: source implementations and contract tests are recorded; live Preview acceptance remains incomplete.

## Browser, content and media security

- Preserve context-aware output encoding for user-managed content.
- Restrict upload type, size, file name and storage scope; validate server-side.
- Keep Cloudinary credentials server-side and least-privileged.
- Verify media inventory scan/write endpoints require appropriate permission.
- Verify unpublished CMS drafts remain private.
- Test English/Bangla route parity, responsive behavior and browser console errors.
- Avoid logging secrets, private quotation data or unnecessary personal information.

Status: historical public HTTP/responsive smoke passed; Cloudinary/media and full CMS privacy acceptance remain open.

## Cloudflare and operational security

- Verify exact Preview/Production D1 identity before each migration.
- Require explicit approval before migrations, D1 writes, secret rotation or Production deployment.
- Store secrets only in approved secret stores; verify presence without printing values.
- Protect the Production GitHub environment with required reviewers and restrict deployment to the approved branch.
- Maintain backups and test restore before Production schema/data changes.
- Verify deployment commit, Worker version, migration ledger and rollback procedure.
- Use least-privilege Cloudflare API tokens.
- Use TinyFish only when materially useful; avoid unnecessary cost and unauthorized authenticated actions or data mutations.

## Formal verification and open gates

The intended target is OWASP ASVS Level 2. No completed requirement-by-requirement assessment is recorded. Complete and evidence:
1. Authentication, MFA, recovery, session and throttling.
2. Role/permission matrix and direct API denial.
3. Input validation, output encoding, CSRF and security headers.
4. D1 authorization, transaction, concurrency and data isolation.
5. Upload/media authorization and file validation.
6. Rate-limit/abuse and sensitive-data logging review.
7. Dependency, build provenance, license and vulnerability review.
8. Production secrets, environment, backup/restore and deployment controls.
9. Findings with severity, reproduction evidence, remediation and retest status.

## Security release blockers

- Do not describe current PBKDF2 settings as meeting the cited OWASP recommendation.
- Do not integrate Argon2id until independent build/provenance, license, security and runtime review plus owner approval.
- Do not claim Argon2id CPU-limit compliance until actual plan/limit is verified against observed invocation metrics.
- Do not release while MFA/RBAC, CMS concurrency, business workflows or ASVS Level 2 remain unaccepted.
- Do not deploy Production or alter Production D1/secrets without explicit approval.

## Related records

See `docs/PROJECT_MASTER_STATUS.md`, `docs/TEST_REPORT.md`, `docs/PASSWORD_STORAGE_DESIGN_ASSESSMENT.md`, `docs/ARGON2ID_WASM_SECURITY_REVIEW.md`, `docs/ARGON2ID_CPU_TIME_MEASUREMENT.md`, `docs/ARGON2ID_BUILD_PROVENANCE.md`, `docs/PREVIEW_DEPLOYMENT.md` and `DEPLOYMENT-CHECKLIST.md`.
