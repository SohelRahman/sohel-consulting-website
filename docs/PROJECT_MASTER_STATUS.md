# Project Master Status

**Last verified:** 2026-11-23  
**Repository:** `SohelRahman/sohel-consulting-website`  
**Development branch:** `current-focus-development`  
**Verified branch head:** `f4cadf992879052d9ee8fd76cf143613c4361610`  
**Latest verified CI:** [Run #45140128176](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45140128176) — success for the verified branch head.

## Operating rules

- This file is the concise handover index; GitHub source and named CI runs are the evidence.
- Before every task, re-fetch the branch head, relevant files and latest CI. Do not assume chat history is current.
- Implement only on `current-focus-development`. Do not merge/rebase/reconcile the divergent branch, modify `main`, deploy, apply migrations, change Cloudflare settings or touch Production without explicit approval.
- Never access, request, print or commit secret values.
- Update this file, the relevant technical docs and `CHANGELOG.md` in the same commit as each completed task.
- Separate source implementation, CI, Preview deployment, Preview runtime acceptance and Production release status. Never treat one as proof of another.

## Current verified state

- Branch head: `f4cadf992879052d9ee8fd76cf143613c4361610` (commit message: `Update CMS transaction contract for conditional saves`).
- Latest CI run #45140128176 completed successfully for that exact commit.
- The latest implementation includes CMS optimistic concurrency control and migration 0018 in source.
- Migration 0018 has **not been independently verified as applied to Preview or Production**. Do not deploy the dependent Worker change until the appropriate migration status is checked and deployment/migration is separately approved.
- No deployment, migration, Preview configuration change, Production change or branch reconciliation was performed in the latest verification.
- The branch remains divergent from `main`; verify current compare data before any future release planning.

## Active priority

### P1 — Admin MFA and login security

**Status:** Security assessment completed; implementation not yet started.  
**Assessment:** [Administrator Authentication and MFA Security Assessment](ADMIN_AUTH_MFA_SECURITY_ASSESSMENT.md).

Confirmed source findings:
- Password authentication only; no MFA enrollment, challenge or recovery flow exists.
- Existing controls include PBKDF2-HMAC-SHA-256 password hashing (600,000 iterations), IP-scoped login rate limiting (5 attempts/15 minutes), HMAC-signed eight-hour sessions, HttpOnly/Secure/SameSite=Strict cookie, D1 session-version checks, exact same-origin mutation checks and Worker-side RBAC.
- Key improvement areas are mandatory MFA, account-keyed throttling in addition to IP throttling, replay-safe TOTP, hashed one-time recovery codes and session lifecycle hardening.

**Next action:** Implement RFC 6238 TOTP with encrypted-at-rest seeds, short-lived purpose-limited challenge cookies, replay prevention, one-time recovery codes, audit events, bilingual Admin UI and automated tests. Keep the change on the development branch.

## Remaining major work (planning estimate; not a verified issue count)

1. Admin MFA and login security implementation.
2. Bulk CMS initialization recovery and failure-path verification.
3. CMS revision/concurrency runtime testing.
4. Page Builder end-to-end testing.
5. Admin dashboard and RBAC verification.
6. Media Library and Cloudinary recovery testing.
7. Course, registration and quotation workflow testing.
8. Full bilingual QA, documentation and release readiness.

Several items are implemented in source but still need runtime acceptance. Reassess this list against GitHub issues, code and Preview evidence before presenting it as an exact backlog.

## Release and migration gates

- No Production merge, deployment, migration, secret/configuration change or data operation is authorized by this status file.
- Preview migration/deployment operations also require separate approval.
- Confirm the exact target database identity and migration ledger before any SQL operation.
- The current source migration inventory includes 0001–0018; source file presence is not proof of remote application.
- Do not assume the existing Preview deployment matches the current development branch head.

## New-chat handover

Read this file first, then read `docs/ADMIN_AUTH_MFA_SECURITY_ASSESSMENT.md` and the relevant implementation/test files. Verify the branch head and latest CI before continuing. Resume at the **Next action** above; do not repeat the completed assessment.
