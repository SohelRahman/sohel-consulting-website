

## 2026-11-27 — MFA disable/reset atomicity hardening added

A further source review found MFA disable previously consumed the TOTP counter or recovery code before the separate session-revocation/deletion batch. The route now updates the factor and assigns a unique `factorClaimId` in the same guarded batch sequence; session-version increment is permitted only when that exact claim marker is present, followed by recovery-code and credential deletion. Migration 0020 adds `last_factor_claim_id` and `used_by` columns for these claim markers. Added source assertions and SQLite transaction coverage. CI result is pending for this additional change. No remote migration or deployment has occurred.


## 2026-11-27 — MFA single-use challenge CI validation passed

- Development validation [#45996901546](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45996901546) completed successfully for branch head `782cec9dfd2951d0571d64e5baaf9d6f321b35e5`.
- Passed Worker syntax, site validation, RBAC, CMS/Page Builder atomicity, CMS revision SQL, password compatibility, Admin MFA cryptographic/source-contract checks, the new MFA challenge SQLite transaction/replay test, course pricing, registration and quotation response tests.
- This is CI/source-level evidence only. It does not prove remote D1 migration compatibility or authenticated Preview replay resistance.
- Migration 0020 remains unapplied remotely; Preview deploy job was skipped. No D1 write, Preview deployment, Production action, `main` update or PR merge occurred.
## 2026-11-27 — Single-use challenge remediation implemented in source

Migration `0020_admin_mfa_challenge_state.sql` persists challenge nonce, user, purpose, expiry, and consumption state. The Worker validates persisted unconsumed challenge state and claims the nonce in a D1 batch; the factor update is conditioned on that same unique claim. TOTP counter and recovery-code consumption are therefore coupled to the one-time challenge claim. Enrollment confirmation also claims the challenge in the same batch as MFA credential activation and recovery-code insertion.

Source and SQLite transaction tests have been added, but CI is pending and no authenticated D1 runtime replay test has been run. Migration 0020 has not been applied remotely. Do not mark MFA acceptance complete until the exact deployed Preview commit passes sequential and concurrent replay tests after explicit migration/deployment authorization.
## 2026-11-27 — Source review finding: MFA challenge replay is not prevented

A follow-up read-only source review of `src/worker.js` found that signed MFA challenges include a random nonce and a five-minute expiry, but `readMfaChallenge()` validates the signature, purpose, expiry and current account/session version without checking whether that nonce has already been consumed. After a successful `POST /api/admin/mfa/verify`, the route issues a full session using the same `session_version` and does not invalidate the challenge. The TOTP counter and recovery-code rows prevent reuse of the same factor, but they do not invalidate the challenge itself. During the challenge lifetime, a valid subsequent TOTP time-step code or a different unused recovery code may therefore be accepted against the same signed challenge, creating additional sessions.

**Severity: High-priority authentication control gap; remediation required before MFA acceptance.** This is a source-review finding, not a demonstrated live exploit. No authenticated Preview replay test was run.

Required remediation: persist challenge nonce state with a bounded expiry; atomically consume a challenge exactly once on successful MFA login and enrollment confirmation. Ensure factor consumption and challenge consumption are atomic so concurrent requests cannot consume multiple recovery codes for one challenge. Add tests for sequential replay, concurrent replay, wrong-purpose challenge, expiry and successful fresh challenge after a new password login. Do not simply increment global `session_version` on every login unless the intended policy is to revoke all other sessions.
# Administrator Authentication and MFA Security Assessment

> **Historical snapshot notice (2026-11-26):** The assessment below was written against commit `f4cadf992879052d9ee8fd76cf143613c4361610` on 2026-11-23, before MFA implementation. Its statements that MFA is missing and its proposed implementation steps are historical, not the current source state. The development branch now contains TOTP MFA, encrypted credential storage, restricted challenge sessions, recovery codes, replay prevention, and automated source/cryptographic tests. See the current status and acceptance record at the end of this document. Authenticated Preview acceptance remains outstanding.

**Assessment date:** 2026-11-23  
**Repository:** `SohelRahman/sohel-consulting-website`  
**Branch reviewed:** `current-focus-development`  
**Reviewed commit:** `f4cadf992879052d9ee8fd76cf143613c4361610`  
**Scope:** Administrator login, session handling, password controls, rate limiting, RBAC and related database schema.

## Executive finding

The current implementation has a useful baseline: password hashes use PBKDF2-HMAC-SHA-256 with a 600,000-iteration work factor and per-password random salts; administrator sessions are HMAC-signed, held in an HttpOnly/Secure/SameSite=Strict cookie, expire after eight hours, and are checked against the account's active state and `session_version` on each Admin API request. Admin mutations require an exact same-origin check, and role/permission checks are enforced in the Worker.

**Critical gap for this priority:** authentication is single-factor. The reviewed login route verifies an email/password pair and immediately issues a full administrator session. No TOTP, WebAuthn/passkey, MFA enrollment, MFA challenge, recovery-code flow or MFA database fields were found in the reviewed Worker, Admin page or migrations.

MFA is not implemented and must not be described as enabled.

## Evidence-based current state

| Control | Current source behavior | Assessment |
|---|---|---|
| Password storage | PBKDF2-HMAC-SHA-256, 600,000 iterations, per-hash random salt; legacy verification and rehash | Implemented in source; runtime verification remains separate |
| Password minimum | 12 characters for Admin account creation and self-service change | Implemented in source |
| Login error | Generic invalid email/password or disabled-account response | Reduces direct account enumeration |
| Login throttling | 5 attempts per 15-minute window, keyed by a hash of client IP and login scope | Implemented, but only IP-scoped |
| Session integrity | HMAC-SHA-256 signed token with eight-hour expiry | Implemented in source |
| Cookie | HttpOnly, Secure, SameSite=Strict, Path=/ | Implemented; host-prefixed cookie hardening not present |
| Session revocation | Account active state and session_version checked against D1 on each Admin API request | Implemented in source |
| Logout | Clears the browser cookie | Does not maintain a server-side per-session revocation record |
| CSRF/origin | Mutating Admin routes require exact same-origin Origin header | Implemented in source |
| Authorization | Worker-side role and permission checks; unknown User routes fail closed | Implemented in source |
| Audit | Admin mutations and password changes are audited | Implemented in source; failed login/MFA events need explicit coverage |
| MFA | No enrollment, verification, challenge, recovery or persisted MFA state found | **Missing** |

## Findings and remediation order

### P0 — Add mandatory MFA before issuing a full Admin session

Implement an authenticator-app TOTP flow based on RFC 6238 as the first MFA method. Require MFA for every administrator-dashboard account, including the primary Admin and permission-limited User accounts. A password-valid account without MFA enrollment must receive only a restricted enrollment challenge, never a full dashboard session.

Required controls:

1. Add a separate encrypted-secret key as a Cloudflare runtime secret. Do not reuse `SESSION_SECRET` for encryption.
2. Encrypt TOTP seeds at rest with authenticated encryption (AES-GCM); never store the raw seed in D1 or logs.
3. Use a short-lived, purpose-limited MFA challenge cookie after password verification. The challenge must not authorize ordinary Admin API routes.
4. Require a valid TOTP code to complete enrollment and every subsequent login.
5. Apply rate limiting to MFA challenge attempts and enrollment/disable operations.
6. Prevent TOTP replay by storing and atomically advancing the last accepted time-step counter.
7. Generate one-time recovery codes. Store only salted/cryptographic hashes; consume each code once.
8. Require current password plus a valid second factor or recovery code to disable/reset MFA.
9. Audit enrollment, successful/failed MFA verification, recovery-code use, disable/reset and administrative recovery actions without logging secrets or codes.
10. Set explicit no-store responses and maintain secure cookie attributes for both challenge and authenticated sessions.

### P1 — Strengthen login throttling

The current login bucket is based on IP and scope, not the normalized account identifier. Add an account-keyed control in addition to the IP bucket, with bounded retention and generic responses. Avoid a permanent account lockout that could let an attacker deny service to an administrator. Test behavior behind Cloudflare and when the client IP header is absent.

### P1 — Harden session cookie and lifecycle

After MFA is implemented, consider a `__Host-` cookie name (Secure, Path=/, no Domain), explicit issued-at claims, and a shorter configurable idle timeout. Preserve database-backed session-version revocation. If server-side logout/revocation of an individual stolen session is required, add a session registry rather than assuming clearing a browser cookie revokes a copied token.

### P2 — Operational recovery and monitoring

Document key rotation and recovery procedures, alert on repeated failed first-/second-factor attempts, and test administrator recovery without bypassing MFA. Recovery must not depend on sharing secrets through chat or logs.

## Proposed implementation design

### Database migration (proposed; not created or applied)

A new additive migration (next migration number after 0018) should add fields/tables for:

- MFA enabled state and enrollment timestamp on `admin_users`.
- Encrypted active and pending TOTP secret payloads (or a dedicated one-to-one credential table).
- Last accepted TOTP counter for replay prevention.
- Hashed, individually consumable recovery codes with created/used timestamps.

Choose a dedicated credential table if it keeps the existing account table focused. Include uniqueness/foreign-key constraints and indexes for lookup/cleanup. Migration review and target verification are required before any application.

### Authentication state machine

1. **Password rejected:** return the existing generic error; do not issue any cookie.
2. **Password accepted, MFA not enrolled:** issue a short-lived enrollment-only challenge; allow only setup/confirm routes.
3. **Password accepted, MFA enrolled:** issue a short-lived login challenge; allow only TOTP/recovery verification.
4. **Second factor accepted:** consume the challenge, update replay/recovery state, then issue the normal eight-hour authenticated session.
5. **Challenge expired/replayed/invalid:** reject and clear the challenge cookie; do not issue a full session.
6. **MFA disable/reset:** require fresh verification, revoke existing sessions by incrementing `session_version`, and audit the action.

### TOTP parameters

Use RFC 6238-compatible HMAC-SHA-1 TOTP, six digits and a 30-second time step for compatibility with common authenticator applications. Permit only a narrow clock-skew window and store the accepted counter to reject reuse. Keep the implementation covered by published RFC test vectors and deterministic clock injection in tests.

## Acceptance criteria

- Password-only login cannot reach any protected Admin API or dashboard view.
- MFA enrollment cannot be completed without a valid first TOTP code.
- The encrypted seed is never returned after setup confirmation and is not readable as plaintext in D1.
- A valid code works once; replaying the same time-step code is rejected.
- Expired, malformed, wrong-user and purpose-mismatched challenge cookies are rejected.
- A recovery code works once only; only its hash is stored.
- Disabling/resetting MFA requires fresh proof and revokes prior sessions.
- Rate limits apply independently to password login and second-factor attempts.
- No MFA secret, password, TOTP or recovery code appears in responses, logs, audit details or source.
- Admin account creation, permission changes, password reset, session revocation and bilingual Admin UI remain functional.
- Automated contract/unit tests pass, then Preview browser/integration tests are completed against the exact deployed commit.
- OWASP ASVS Level 2 mapping and evidence are updated; a passing source-contract test alone is not formal ASVS verification.

## Change and environment boundaries

This assessment is documentation-only. No application source, migration, secret, database, Cloudflare setting or deployment was changed. Migration 0018 remains present in the development source tree; its remote application state must be verified separately. Preview and Production must not be migrated or deployed as part of this work without explicit approval. `main` and the existing branch divergence remain untouched.

## Next implementation step

Implement the MFA database design, Worker authentication state machine, Admin enrollment/challenge UI, recovery-code lifecycle and automated tests together as a separately reviewable development change. First review the exact migration numbering and CI test conventions, then implement only on `current-focus-development`.


## 2026-11-26 — Implementation status superseding this historical assessment

### Source and automated evidence
- MFA implementation is present in `src/admin-mfa.js`, `src/worker.js`, `admin.html` and `migrations/0019_admin_mfa.sql`.
- `scripts/test-admin-mfa.mjs` verifies RFC-compatible TOTP test vectors, invalid/expired-window behavior, encrypted seed round-trip and user binding, recovery-code generation and hashing, password-login challenge restrictions, challenge cookie properties, replay/recovery SQL guards, and bilingual UI copy.
- Development validation Run #1076 passed with the Admin MFA cryptographic/source-contract test step.
- Project history records migration 0019 applied to the dedicated Preview D1 database in Preview migration Run #11. The live remote migration ledger has not been re-read for this checkpoint.

### Still unverified
- Successful authenticated Preview enrollment and login with a real test Admin account.
- Wrong/expired/purpose-mismatched challenge behavior in the deployed Worker.
- Actual TOTP replay rejection and one-time recovery-code consumption against Preview D1.
- MFA disable/reset, session revocation, rate-limit behavior and role-specific API access in the deployed environment.
- Production MFA secret availability and Production migration state.

Automated source/cryptographic tests are not a substitute for deployed authenticated acceptance or a formal OWASP ASVS Level 2 assessment.
