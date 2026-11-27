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
