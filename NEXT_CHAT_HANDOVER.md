## Critical open blocker — Cloudflare CPU limit

Runtime #45879657641 returned 6 /hash invocation CPU samples (44–78 ms) and 5 /verify samples (51–97 ms), while the previous account assessment recorded Workers Free at 10 ms/request. Current Cloudflare documentation confirms Free 10 ms/request and Paid Standard 30-second default, with flexibility only for infrequent overruns. This discrepancy is unresolved. Before any Argon2id integration decision, obtain read-only Cloudflare Dashboard evidence for account plan/usage model, disposable Worker usage model/CPU limit, invocation outcome details, and the application Preview Worker's effective limit. No plan upgrade, billing change or configuration adjustment is authorized. See `docs/ARGON2ID_CPU_TIME_MEASUREMENT.md`.

# Next Chat Handover — Sohel Consulting Website

**Last updated:** 2026-11-27  
**Repository:** https://github.com/SohelRahman/sohel-consulting-website  
**Active branch:** `current-focus-development`  
**Open PR:** #1, Draft, base `main`. Do not merge without explicit instruction.

## Start here

1. Read `docs/PROJECT_MASTER_STATUS.md` for current status and active priority.
2. Read this file for operational boundaries and next actions.
3. Read `docs/TEST_REPORT.md` for evidence-based test status.
4. Read `docs/SECURITY_BASELINE.md` before security or authentication changes.
5. Read `DEVELOPMENT_STRATEGY_WBS.md` for workstreams and dependencies.
6. Read `README.md` for architecture and setup.

## Immediate engineering status

- Argon2id isolated Cloudflare runtime workflow #67 passed: https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45879657641
- The reporting-only jq quoting correction is validated. Cloudflare Observability returned 12 invocation records for the exact disposable Worker: 6 POST /hash, 5 POST /verify and 1 GET /health.
- Hash invocation CPU samples: 45, 48, 44, 51, 78, 66 ms. Verify invocation CPU samples: 84, 73, 63, 51, 97 ms. These are platform invocation metrics for route requests, not pure Argon2 primitive timings.
- Each request was correlated using the Cloudflare event source URL and the disposable Worker script name. Sample counts are small and must not be treated as a stable performance distribution or compliance proof.
- Temporary Worker cleanup passed: DELETE HTTP 200 and follow-up GET HTTP 404.
- Development validation #1557 was triggered by documentation updates; check its final result before treating docs as CI-validated.

## Next actions

1. Reconcile the observed 44–97 ms invocation CPU samples with the account's current Workers plan and effective per-request CPU limit. Do not claim CPU-limit compliance; obtain authoritative account/plan evidence.
2. Repeat isolated runtime measurements if needed for reproducibility, with no unnecessary paid operations. Preserve exact per-run telemetry and cleanup evidence.
3. Return to authenticated Preview acceptance: MFA enrollment/login/recovery-code single use, RBAC denial for limited users, session revocation, CMS optimistic-concurrency conflict handling, Page Builder, Cloudinary/media, registration, inquiry, quotation and chat flows.
4. Complete formal OWASP ASVS Level 2 verification and document each requirement as pass/fail/not tested with evidence.
5. Complete Production readiness preflight only after acceptance: Production D1 identity, migration ledger, backup/restore evidence, secret presence without disclosure, environment protections, PR review and release approval.

## Non-negotiable operating rules

- Work only on `current-focus-development`.
- Do not change `main`, merge/rebase PR #1, or rewrite branch history unless explicitly authorized.
- Do not deploy to Production, modify Production configuration, apply migrations, write D1 data, rotate secrets, or deploy the existing Preview Worker without explicit authorization.
- Never request or expose credentials, tokens, TOTP seeds, secret values or password hashes.
- Keep Argon2id prototype isolated. Do not integrate it into application authentication until technical, security, licensing, provenance and owner-approval gates pass.
- Distinguish source implementation, CI pass, Preview deployment, Preview runtime acceptance and Production release.
- Use TinyFish only when it materially improves browser testing, Preview inspection, research or execution. Avoid unnecessary operations and charges. Do not perform unauthorized authenticated actions or data mutations. Record meaningful evidence.
- Update the six project-control documents after meaningful changes: `docs/PROJECT_MASTER_STATUS.md`, this handover, `README.md`, `DEVELOPMENT_STRATEGY_WBS.md`, `docs/TEST_REPORT.md`, and `docs/SECURITY_BASELINE.md`.

## Environment facts

- Preview Worker URL: https://current-focus-development.sohelrahman118.workers.dev
- Preview Worker name: `current-focus-development`
- Preview D1: `consulting-preview-db` (ID recorded in `docs/PREVIEW_DEPLOYMENT.md`)
- The last confirmed Preview deployment was the documented 2026-11-24 deployment. Do not infer the currently deployed commit from development branch head.
- User confirmed authenticated Admin dashboard access on 2026-11-26; MFA enrollment and full RBAC workflows remain unverified.

## Evidence policy

Every test entry must include the test/run identifier, commit when known, scope, result, limitations and cleanup/side-effect status. Never mark an item complete from source inspection alone when runtime evidence is required.
