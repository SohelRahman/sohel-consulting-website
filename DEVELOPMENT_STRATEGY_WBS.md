## 2026-11-27 — WBS 3.0 MFA challenge replay remediation

Source remediation implemented: persisted challenge records, purpose/expiry validation, single-use claim coupled with accepted factor consumption, enrollment challenge consumption and CI tests. Acceptance remains pending until CI passes, migration 0020 is reviewed/applied to an authorized Preview database, and authenticated sequential/concurrent replay tests pass against the exact deployed commit. No remote migration/deployment authorized or performed.

## 2026-11-27 — Authentication acceptance sequencing update

A source review identified that the signed five-minute MFA challenge nonce is not persisted/consumed after success. Add a remediation subtask under WBS 3.0: persist challenge state, atomically consume it with the accepted TOTP/recovery factor, and test sequential/concurrent replay. This remediation precedes authenticated MFA Preview acceptance and ASVS sign-off. Do not apply the new migration or deploy without explicit approval.



### Additional Cloudflare usage-model finding (official docs checked 2026-11-27)

Cloudflare's current limits documentation also lists the deprecated legacy **Bundled** usage model, whose HTTP-request CPU limit is 50 ms; legacy Unbound has limits matching Workers Paid. This is another possible explanation to investigate, but it does not resolve the observed 51–97 ms samples or establish which model applies to this Worker. Confirm the exact Worker Usage Model in the Dashboard. Official source: https://developers.cloudflare.com/workers/platform/limits/ (sections “CPU time” and “Unbound and Bundled plan limits”).
## 2026-11-27 — Argon2id CPU-budget gate clarification

The latest isolated runtime produced route-level Worker CPU samples of 44–78 ms for /hash and 51–97 ms for /verify. This conflicts with the previously recorded Workers Free 10 ms/request assumption. The actual account and Worker usage model/limit must be verified read-only in Cloudflare Dashboard before the prototype can be accepted or rejected for the target runtime. No paid-plan upgrade, billing change, CPU-limit change or deployment configuration change is authorized. This gate blocks Argon2id integration, not unrelated Preview acceptance work.

# Development Strategy and Work Breakdown Structure

**Project:** Sohel Consulting Website  
**Updated:** 2026-11-27  
**Execution branch:** `current-focus-development`  
**Status:** Planning baseline; task completion is governed by repository evidence.

## Strategy

Complete engineering and acceptance in gated workstreams. Keep the bilingual website and Preview environment isolated from Production. Close authentication, data-integrity and security acceptance gaps before release. Keep the Argon2id prototype isolated until independent technical, security, licensing and owner-approval gates pass.

## Work breakdown

| WBS | Workstream | Deliverables / acceptance evidence | Current status |
|---|---|---|---|
| 1.0 | Repository and documentation control | Six maintained project-control documents; branch/PR state and evidence log | In progress |
| 2.0 | Argon2id prototype verification | Locked build/tests, PHC interoperability, Cloudflare runtime, request-level telemetry, memory/zeroization, provenance and license review | Runtime workflow passed; adoption blocked |
| 3.0 | Authentication and MFA | Enrollment, challenge, fresh MFA login, recovery-code single use, throttling, session revocation | Source implemented; Preview acceptance incomplete |
| 4.0 | RBAC | Positive/negative permission tests for Admin and limited roles, including direct API calls | Source review/tests exist; live acceptance incomplete |
| 5.0 | CMS integrity | Two-session concurrent edits, stale revision HTTP 409, revision increments, history/audit consistency | Source implemented; live acceptance pending |
| 6.0 | Page Builder and Media | Create/edit/preview/publish/delete, Cloudinary upload, folder permissions, media inventory and access controls | Runtime acceptance pending |
| 7.0 | Business workflows | Courses, pricing/discounts, registrations, inquiries, quotations, enrollment and chat | End-to-end Preview acceptance pending |
| 8.0 | Public website quality | English/Bangla routes, navigation, responsive layouts, accessibility, SEO, performance and browser console | Basic HTTP/responsive smoke passed; broader acceptance pending |
| 9.0 | Security verification | OWASP ASVS Level 2 requirement-by-requirement assessment and remediation | Not complete |
| 10.0 | Production readiness | Production D1 identity/backup/migration ledger, runtime secret presence, environment protections | Not verified |
| 11.0 | Release approval and execution | PR review, content/legal approval, migration plan, explicit release approval, deploy and post-deploy verification | Blocked |

## Dependency sequence

1. Maintain accurate documentation and verify current CI state.
2. Close or explicitly defer the isolated Argon2id prototype gate; do not silently make it an application authentication dependency.
3. Complete authenticated Preview MFA and RBAC tests.
4. Complete CMS concurrency and Page Builder/media acceptance.
5. Complete business workflow and public-site acceptance.
6. Perform formal ASVS Level 2 assessment and remediate findings.
7. Verify Production infrastructure, backup/restore and secrets without exposing values.
8. Obtain PR review, content/legal approval and explicit Production release authorization.
9. Deploy only after gates pass; verify health, critical journeys, logs and rollback readiness.

## Release gates

- **G0 — Source quality:** syntax, static checks and automated tests pass.
- **G1 — Preview environment:** exact Worker/D1 identity and deployed commit confirmed.
- **G2 — Functional acceptance:** authenticated workflows and negative authorization cases pass.
- **G3 — Security:** ASVS assessment complete; no unresolved release-blocking findings.
- **G4 — Operations:** backup/restore, migration, secret and environment checks complete.
- **G5 — Governance:** PR approval, content approval and explicit deployment authorization recorded.
- **G6 — Production verification:** post-deployment smoke and critical journey evidence recorded.

Green CI alone does not satisfy G1–G6.

## Schedule

No new completion date is committed. The earlier 15–25 working-day estimate was a planning estimate, not a measured remaining-duration forecast. Re-estimate after authenticated Preview acceptance and the ASVS gap review. External approvals, Cloudflare access and test-account availability can change the schedule.

## Operating constraints

- Work only on `current-focus-development`.
- No `main` updates, PR merge/rebase, Production deployment, D1 mutation/migration, secret rotation or existing Preview deployment without explicit authorization.
- Never expose credentials, tokens, TOTP seeds or password hashes.
- Keep Argon2id isolated pending security, provenance, licensing and owner approval.
- Use TinyFish only when materially useful; avoid unnecessary calls/costs and unauthorized authenticated actions or data mutations.
- Update the six project-control documents after meaningful changes.
