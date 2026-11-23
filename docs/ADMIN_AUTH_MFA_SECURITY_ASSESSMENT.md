# Administrator Authentication and MFA Security Assessment

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
