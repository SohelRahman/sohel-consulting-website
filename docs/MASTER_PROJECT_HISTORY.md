## 2026-11-27 — Argon2id runtime and telemetry-query follow-up

- Isolated runtime #45875891768 passed deployment, health, PHC hash/verify, correct/wrong password, sequential/concurrent checks and automatic cleanup (HTTP 200 deletion; HTTP 404 absence check). Two concurrent hash requests took 683.469 ms combined wall-clock; memory grew from 17 to 323 WASM pages and remained stable. This is not CPU-time evidence.
- Cloudflare telemetry keys exposed CPU/wall-time fields, but the invocation query returned zero groups. Current Cloudflare API documentation specifies `view` as a top-level query field. Corrected the harness to use top-level `view: "invocations"` and filter by `$workers.scriptName` for the exact disposable Worker. Commit `09e84882e5eac8099dddbf3cc15dd5bf1f6ee090`.
- Runtime rerun #45876662415 was in progress at the time of this entry; CPU-time evidence remains open until real invocation events are returned.
- Latest available provenance artifact inventory lists dependency license expressions, mainly MIT/Apache-2.0; `unicode-ident` also declares Unicode-3.0. The prototype crate is `UNKNOWN` in the inventory and has no LICENSE file. A project-owner licensing decision is required before distribution/integration; no license has been invented or added.
- Website validation #45876662428 passed. No existing Preview deployment, application auth, D1, Production, `main` or PR merge operation occurred.

## 2026-11-27 — Fresh branch and release-state audit

- Fresh GitHub compare `main...current-focus-development` reports status `ahead`, 1,074 commits ahead and 0 behind. This supersedes the older 2026-11-22 divergence snapshot (575 ahead / 14 behind); retain the older figures only as historical evidence.
- Development head at the start of this audit was `0838779a7fcd6f13a5577102a96e25fb4bf6f361`; subsequent isolated Argon2id health-probe correction commit is `4d513470159e48e3a7f18790974fa56c8c110dcc`, followed by documentation commits. The current head must be re-read before any release operation.
- PR #1 remains open and Draft, with `current-focus-development` targeting `main`. No merge or branch rewrite was performed.
- Latest isolated Argon2id runtime run #45860426221 built and deployed the temporary Worker but failed at the health probe (HTTP 404); automatic cleanup was verified (delete HTTP 200 and follow-up absence HTTP 404). The prototype CI run #45860260434 passed.
- A follow-up change moves the static, non-sensitive `GET /health` endpoint ahead of the temporary test-token guard. Website validation run #45875591292 passed. Prototype CI #45875591553 and runtime #45875591303 were still running at the time of this audit entry.
- The runtime CPU-time evidence gate remains open. No application authentication integration, existing Preview deployment, D1 operation, Production change, `main` update, PR merge or deployment occurred.

# Master Project History and Audit Baseline

**Project:** Sohel Consulting Website  
**Repository:** [SohelRahman/sohel-consulting-website](https://github.com/SohelRahman/sohel-consulting-website)  
**Development branch:** `current-focus-development`  
**Audit record date:** 2026-11-22

## 1. Purpose and evidence standard

This document consolidates the available project conversation summaries, repository documentation, source-tree observations, migration inventory and GitHub metadata. It is intended to prevent repeated work and preserve decisions across the Website 1–4 discussions.

The available conversation history is not a complete verbatim export of every prior chat. Historical statements attributed to the user are identified as conversation-reported requirements or results. Repository statements are based on files and GitHub metadata inspected during this audit. A committed implementation or passing CI check is not proof of successful deployment or end-to-end browser behavior.

Use these status terms consistently:

- **Requested:** stated as a requirement.
- **Decided:** explicitly agreed as a project decision.
- **Implemented:** source code or configuration exists in the development branch.
- **CI passed:** a named GitHub Actions run passed for a specific commit.
- **Preview deployed:** the exact commit is confirmed deployed to Cloudflare Preview.
- **Preview verified:** the stated user journey was exercised successfully on Preview.
- **Production approved / deployed:** explicit approval and evidence of the corresponding Production action exist.

## 2. Product scope and standing decisions

The project is a bilingual English/Bangla consulting and professional-training website with a protected administration interface.

The following decisions are retained from the project discussions and repository documentation:

1. Runtime and hosting: Cloudflare Workers with static assets.
2. Relational data: Cloudflare D1.
3. Media and syllabus files: Cloudinary.
4. Languages: English and Bangla.
5. Development work is performed on `current-focus-development`.
6. Preview and Production must use separate D1 databases and separate runtime configuration.
7. Pricing and discounts are calculated and validated by the server; the browser must not be authoritative.
8. Registration, quotation, payment and enrollment are separate business states.
9. CMS drafts must not become public until an authorized publish action.
10. Backend authorization is required; hiding a UI control is not an access-control mechanism.
11. Payment gateway integration is intentionally not enabled.
12. Production merges, deployments, migrations and data changes require explicit approval.
13. Never commit secrets or place secret values in chat, logs, documentation or source files.

## 3. Historical discussion summary

### Website 1 — Infrastructure and deployment foundation

**Available history:** conversation summary dated around 2026-11-11.

Requirements and issues:
- Establish the Cloudflare Worker deployment and Preview environment.
- Configure administrator email, password and session secrets.
- Use Wrangler Preview secret configuration.
- Resolve a Cloudflare dashboard Preview command configuration error reported as: “We couldn't save this change. Try again.”

Lessons retained:
- Preview and Production bindings and secrets must remain isolated.
- Deployment instructions must reflect the actual Cloudflare configuration.
- A saved configuration, successful workflow or Git commit must be verified independently; do not infer successful deployment.

### Website 2 — Course management and CMS usability

**Available history:** conversation summary dated around 2026-11-15.

User requirements:
- Add course discount support.
- After saving a course, remain in the Courses workflow rather than navigating away.
- Support syllabus PDF/image uploads and external syllabus links.
- Make content keys discoverable to administrators.
- Make Short, Long and URL content types work as intended.
- Improve CMS usability so administrators can manage real website content.

Implementation recorded in later repository history:
- Discount fields and centralized pricing logic.
- Separate external syllabus URL and uploaded syllabus file URL.
- Content-key inspection, bilingual CMS, draft/publish workflow and on-page editing.

Remaining acceptance must be checked against the current Preview deployment; repository implementation alone is insufficient.

### Website 3 — Database and implementation troubleshooting

**Available history:** conversation summary dated around 2026-11-17.

Key technical distinction:
- `syllabus_url` stores an external syllabus/share URL.
- `syllabus_file_url` stores the uploaded Cloudinary file URL.

Historical work recorded:
- SQL inspection of course syllabus fields.
- Syllabus removal and Cloudinary URL parsing correction.
- Course date validation, missing form submit handling, course reference-link updates and edit-form display of existing syllabus links.
- Migrations 0010 and 0011 for course discounts and uploaded syllabus file URLs.

Operational lesson: verify schema source, migration ledger and real feature behavior separately. A field in SQL does not prove upload, edit, delete and public display flows work.

### Website 4 — Recent requirements, workflows and security hardening

**Available history:** conversation summaries and current repository documentation through 2026-11-20.

Major implementation areas recorded:
- Course discounts and shared server-side fee calculation.
- Registration lifecycle and quotation history.
- Audited manual payment-status updates and enrollment controls.
- Learner quotation acceptance/decline using one-time bearer tokens.
- Bilingual static-page CMS, drafts, publication, previews, key inspection, archive/restore and version history.
- On-page inline CMS editing.
- Admin account and role/permission management.
- Session revocation after administrator account changes.
- Cloudflare Preview diagnostics and token-verification workflows.

Recent technical sequence:
- Learner quotation response links were changed from query-string tokens to URL-fragment tokens.
- The page removes the token from browser history after reading it.
- Quotation details are fetched using same-origin POST rather than a token-bearing GET.
- A source-review correction restored the separate quotation lookup used by accept/decline.
- CI run `44588832549` is recorded in the handover document as passing for test commit `42d58e24ff59fe728dd59b043c879783b7b948b8`.
- Admin account edits and disables increment `session_version` to revoke prior sessions.
- CI run `44638857897` is recorded as passing for test commit `7f40889ac5f053a16b8fb8320dc67a4d5f96b0b6`.

The two CI results above are repository-documentation records and should be rechecked against GitHub Actions before a release decision. Neither establishes live Preview acceptance.

## 4. Current architecture and repository evidence

The inspected repository documents and configures:

- Static HTML/CSS/JavaScript website.
- Cloudflare Worker API in `src/worker.js`.
- Static assets binding `ASSETS`.
- D1 database binding `DB`.
- Cloudinary media integration.
- Administrator interface at `/admin.html`.
- GitHub Actions for development validation, Preview secrets and Preview database operations, plus a manually triggered Production deployment workflow.

The migration files in the development branch are recorded through:
- `0001_initial_schema.sql`
- `0002_rate_limits.sql`
- `0003_site_content.sql`
- `0004_page_styles.sql`
- `0005_pages.sql`
- `0006_cloudinary_media.sql`
- `0007_chat.sql`
- `0008_analytics.sql`
- `0009_admin_rbac.sql`
- `0010_course_discounts_syllabus.sql`
- `0011_course_syllabus_file_url.sql`
- `0012_bilingual_static_cms.sql`
- `0013_quotation_response_tokens.sql`

A migration file being present does not establish that it has been applied to Preview or Production. Existing CMS and migration documentation explicitly labels several database observations as user-supplied D1 Console output, not direct database inspection by the maintainer.

## 5. GitHub branch and release baseline

GitHub compare metadata retrieved during the initial audit reported 558 commits ahead and 12 behind. A follow-up comparison on 2026-11-22 reported:

- Base: `main`
- Head: `current-focus-development`
- Status: **diverged**
- Development ahead: **575 commits**
- Development behind: **14 commits**
- Merge base: `5260b56751f2e1d1a946d619b2d8f68dd633c2fd`

Draft PR #1 remains recorded in the repository:
[Build bilingual training registration and admin platform foundation](https://github.com/SohelRahman/sohel-consulting-website/pull/1)

This divergence is a release blocker until the histories and intended release strategy are reviewed. Do not merge, rebase, force-push, retarget or otherwise reconcile branches as part of this documentation audit.

The inspected Production deployment workflow:
- Is manually triggered.
- Has a job condition requiring `refs/heads/main`.
- References a GitHub Environment named `production`.
- Uses `npx --yes wrangler@4 deploy`.

The Preview secrets workflow:
- Is restricted to `current-focus-development`.
- Uses the dedicated `CLOUDFLARE_WORKERS_API_TOKEN` secret.
- Uses Wrangler `4.160.1` for Preview secret writes.

The workflow file referencing the `production` environment does not prove that required reviewers or environment protection rules are configured. Those settings require separate GitHub Settings verification. The Wrangler version usage is inconsistent and should be standardized in a reviewed change.


### 2026-11-22 follow-up — branch divergence review

A fresh GitHub compare reports `current-focus-development` 575 commits ahead of `main` and 14 commits behind it. The merge base remains `5260b56751f2e1d1a946d619b2d8f68dd633c2fd`. The 14-commit main-side comparison identifies six Preview/Cloudflare workflow files:

- Five workflows are byte-identical on both branches: the three Preview Admin diagnostic workflows, Cloudflare token verification and Preview migration audit.
- `.github/workflows/migrate-preview-d1.yml` differs. `main` uses a single-bracket `[previews.d1_databases]` parser, which does not match the actual `[[previews.d1_databases]]` declaration in `wrangler.toml`. Development has the reviewed parser that reads the array-of-table section and requires the exact Preview UUID.

The open draft PR #1 remains based on `main`, unmerged, and its description still contains initial-project setup/test statements that do not describe the current Website 4 implementation or acceptance status. Its description should be refreshed as part of a separately reviewed release proposal, not as a substitute for branch reconciliation.

**Disposition:** the file-level review suggests the main-only changes are largely duplicated workflow files plus an older migration-workflow version; however, the commit histories remain divergent. This is not sufficient evidence to rebase, merge or force-update either branch. Prepare a reviewed reconciliation plan and obtain explicit approval before changing branch history. No branch changes, deployment, migration, secret access or Production action occurred during this follow-up.

## 6. Feature inventory and acceptance gaps

| Area | Repository implementation recorded | Evidence still required |
|---|---|---|
| Bilingual public website | Implemented | English/Bangla browser acceptance |
| Course administration | Implemented | Create/edit/status/delete Preview tests |
| Course discounts | Implemented | Discount edge cases and persisted fee verification |
| Syllabus upload and external link | Implemented | Cloudinary upload, edit, remove and public access |
| Registration and inquiry | Implemented | End-to-end Preview submissions |
| Quotation history and lifecycle | Implemented | Full lifecycle and invalid-transition tests |
| Manual payment status | Implemented | Role, audit and business-process checks |
| Enrollment status | Implemented | Authorized state-transition tests |
| Learner quotation response | Implemented | Fragment URL, accept/decline, expiry, revocation and replay browser tests |
| Admin RBAC | Implemented | Live permission-denial and role-change tests |
| Admin session revocation | Implemented | Disable/re-enable and permission-change session tests |
| Static-page CMS | Implemented | Draft isolation, publish, restore and public rendering |
| On-page CMS editor | Implemented | Fresh Preview deployment and browser acceptance |
| Chat | Implemented | Browser, permission and data-retention tests |
| Analytics | Implemented | Consent, retention and reporting checks |
| Payment gateway | Not implemented by design | Separate future approval required |
| Automated quotation email | Not implemented; manual link sharing is documented | Provider and workflow decision required |

## 7. Security review findings to carry forward

Source/documentation review has recorded positive controls including password hashing, signed sessions, secure cookie attributes, server-side permission checks, same-origin mutation checks, rate limiting, parameterized database access and hashed one-time quotation tokens.

These controls do not establish a security certification.

Open review items:
1. Verify the current password-hashing parameters and assess migration to a current OWASP-recommended work factor. Historical source review recorded PBKDF2-HMAC-SHA-256 at 100,000 iterations; verify the exact current implementation before changing it.
2. Assess and implement administrator MFA as part of the stated OWASP ASVS Level 2 target.
3. Inspect actual deployed response headers and determine whether CSP and HSTS are configured at the Worker/Cloudflare layer. The repository `_headers` file alone does not establish the complete deployed policy.
4. Review CMS publication/history consistency and concurrent-edit behavior; ensure partial failures cannot leave misleading publication/audit state.
5. Review rate-limit cleanup cost and consider scheduled cleanup if justified by usage.
6. Pin Wrangler and action dependencies consistently.
7. Complete a documented ASVS verification and independent security testing before making any compliance claim.

No formal penetration test or complete ASVS Level 2 verification is recorded by this audit.

## 8. Documentation quality gaps

The following documentation issues were identified:
- `docs/API.md` explicitly describes itself as a route inventory, not a complete request/response contract.
- `docs/CHATGPT_PROJECT_CONTEXT.md` contains status statements dated 2026-11-19 that say CI is pending, while later sections record passing runs. It needs a single dated current-status section and links to the authoritative handover.
- `docs/DATABASE.md` needs a current, clearly qualified migration inventory and a distinction between committed migration files, user-reported D1 verification and independently inspected database state.
- The handover and changelog contain valuable stage-level history, but overlapping status statements can become stale. This master history should summarize decisions; the handover should remain the operational next-task record.
- Deployment docs should be checked against actual GitHub Environment protection and Cloudflare Preview/Production settings.

## 9. Prioritized action plan

### P0 — Release and environment integrity
1. Review the 558-ahead / 12-behind branch divergence and draft PR #1; prepare a safe reconciliation proposal without merging or rewriting history.
2. Verify branch protection/rulesets and `production` Environment reviewers in GitHub Settings.
3. Verify Preview and Production Worker/D1 bindings, secret separation and deployment workflow guards.
4. Verify which commit is currently deployed to Preview and the actual D1 migration ledger using read-only checks.

### P1 — Preview functional acceptance
1. Course create/edit/discount/syllabus upload and removal.
2. Registration and inquiry submission.
3. Quotation lifecycle and learner accept/decline, expiry, revocation and replay.
4. Admin role/permission denial and session revocation.
5. CMS draft, preview, publish, history restore and public rendering in both languages.
6. Chat and analytics consent/reporting.

### P2 — Security hardening
1. Password hash work-factor assessment and migration plan.
2. Administrator MFA.
3. CSP/HSTS and deployed header verification.
4. CMS concurrency/transaction review.
5. Rate-limit operational review.
6. ASVS Level 2 verification evidence and remediation tracking.

### P3 — Documentation and maintainability
1. Reconcile the current status in `CHATGPT_PROJECT_CONTEXT.md`.
2. Update `DATABASE.md` with all 13 migration files and explicit evidence qualifiers.
3. Expand API documentation incrementally with authentication, permissions, schemas, validation, error responses and side effects.
4. Pin Wrangler consistently.
5. Keep `CHANGELOG.md`, this history and the handover aligned.

### P4 — Release readiness
Only after P0–P3:
- Complete Preview acceptance.
- Review the release diff and CI evidence.
- Obtain explicit Production approval.
- Apply only reviewed migrations to the confirmed target.
- Deploy and verify the exact approved commit.
- Record rollback and post-deployment checks.

## 10. Audit boundaries and next update

This audit did not:
- Merge or rebase branches.
- Change `main`.
- Run deployments or database migrations.
- Read or modify secrets.
- Modify Production resources or data.
- Claim a fresh browser acceptance test.

Update this document when a material requirement, decision, architecture change, migration, release or verified acceptance result occurs. Add the date, commit/run reference and environment, and clearly state whether evidence is user-reported, repository-derived or independently verified.


## 2026-11-22 — Preview audit and Admin diagnostic follow-up

### Independently verified

- Read-only Preview D1 audit workflow run `45024256326` completed successfully on `current-focus-development`.
- Cloudflare token validation succeeded and Preview D1 identity matched `consulting-preview-db`, ID `e0317397-77cb-4f36-9d19-2594ff75b0c2`.
- Remote migration listing reported only `0013_quotation_response_tokens.sql` as pending. No migration was applied.
- The three Admin diagnostic workflows were inspected. Each has an incorrectly escaped JavaScript regex for token whitespace normalization; the intended expression is `/\\s+/g`. These workflow files have not been changed and their live diagnostic runs remain unverified.

### Current boundary

- Migration 0013 remains pending on Preview and requires explicit approval before application.
- Admin diagnostic workflow corrections require explicit authorization.
- No Preview deployment, Production operation, `main` modification, branch reconciliation or PR merge was performed.


## 2026-11-22 — Admin diagnostic regex corrections

- Corrected the token whitespace-normalization regex in all three Preview Admin diagnostic workflows on `current-focus-development`.
- Each modified workflow was fetched after its commit and verified to contain the intended `/\\s+/g` expression and not the malformed expression.
- Re-inspected the Preview migration workflow and confirmed its manual dispatch trigger, development-branch guard, exact Preview database ID guard, Production database exclusion, and Preview-only binding for the apply command.
- The connected GitHub tools do not expose a workflow-dispatch operation. The migration workflow has therefore not been started, and migration 0013 remains pending. No migration or Production operation is claimed.


## 2026-11-22 — Preview Admin operational checkpoint; remaining testing deferred

### Preview database and diagnostics
- The guarded Preview D1 migration workflow completed successfully (workflow run #8) on `current-focus-development`. The visible verification output stated `No migrations to apply!`. The supplied screenshots did not show the complete migration ledger, so retain this evidence qualification when referring to individual migration filenames.
- All three corrected read-only Admin diagnostic workflows completed successfully.
- Verified Preview D1 identity: `consulting-preview-db`, ID `e0317397-77cb-4f36-9d19-2594ff75b0c2`.
- Confirmed `admin_users`, `audit_logs` and `rate_limits` exist; the Admin account count was 1.
- PRAGMA inspection returned the expected observed columns for all three tables. Diagnostic queries made no database changes and wrote zero rows.

### Browser acceptance (user-reported)
- User opened the Preview Admin page and reported that login worked.
- User confirmed the Admin dashboard opened fully with all menu items visible.
- User reported that Website Content worked perfectly.
- These are user-reported browser checks, not independently captured browser automation results.

### User's testing decision and next action
- The user explicitly requested that further testing be done later and that documentation be updated now.
- Pause additional functional testing. Do not keep asking the user to test Courses or other modules in this phase.
- Preserve the remaining acceptance checklist for a later testing session: courses (discounts and syllabus), quotations and learner response security, registrations, roles/permissions and session revocation, payment/email integrations, bilingual/public rendering, and security verification including the stated OWASP ASVS Level 2 target.
- Do not describe the entire project as complete. The Preview Admin login/dashboard and Website Content have been reported working; other modules and formal security/release checks remain unverified.
- Production and `main` remain untouched. No Production deployment, merge, rebase or branch reconciliation was performed.

## 2026-11-23 — Backend RBAC audit and correction

### Finding
A source review found that `/api/admin/media/inventory` mapped both GET and POST requests to `media.view`. POST starts and advances persistent Cloudinary inventory scans and writes scan state/assets to D1, so treating it as a read-only permission was too permissive.

### Development-branch correction
- GET inventory reads now require `media.view`.
- POST inventory scan operations now require `media.manage`.
- Unsupported methods receive no permission mapping for User accounts and remain rejected by the route's method guard for Admin accounts.
- Updated `scripts/test-rbac-contract.mjs` to assert the GET/POST permission split.

### Verification status
- Change committed to `current-focus-development` only.
- CI result and Preview browser verification are pending; do not treat this as deployed or runtime-verified.
- No D1 migration, deployment, Production change, `main` change or PR merge was performed.

## 2026-11-23 — RBAC regression-test scanner correction

- The first CI run after the Cloudinary inventory permission fix exposed a false positive in the RBAC contract test: its mutation-handler scanner also matched HTTP-method comparisons inside the `requiredPermission` helper, which is not a request handler.
- Scoped the scanner to `handleApi` so it checks actual API route handlers rather than permission-mapping expressions.
- The first run failed at the RBAC contract check; syntax and HTML validation passed. Re-run CI is required before treating the correction as verified.

## 2026-11-23 — Static CMS write consistency hardening

### Findings
Static CMS draft save, publication, archive/restore and historical restore previously performed content, history and audit writes as separate database operations. A mid-sequence failure could leave content and its history/audit trail inconsistent. Publication also selected draft rows before updating published values and later inserted history snapshots from that earlier read, creating a stale-snapshot window under concurrent editing.

### Development-branch correction
- Draft upsert, draft snapshot and audit entry now execute in one D1 batch.
- Publication updates the page/language and inserts published snapshots by selecting the current draft rows within the same D1 batch; its audit entry is included in that batch.
- Archive and restore state changes are batched with their audit entries.
- Historical-version restore, draft snapshot and audit entry are batched together.
- Added a dedicated CMS atomicity source-contract test to CI.

### Remaining concurrency boundary
There is still no per-editor optimistic-lock revision token. Concurrent saves to the same content key remain last-write-wins. Custom Page Builder structure saves and bulk CMS initialization still have multi-statement sequences outside this static CMS transaction hardening and require separate review.

### Verification boundary
Source changes and documentation are on `current-focus-development` only. CI is required before marking the changes validated. No Preview deployment, D1 migration, Production change, `main` update or branch reconciliation is part of this work.


## 2026-11-23 — Custom Page Builder transaction consistency

### Finding
Custom Page Builder create, update and delete operations previously committed the page row, CMS key/version records and audit/cleanup records in separate D1 calls. A mid-sequence failure could leave incomplete CMS registration, missing audit history or orphaned CMS records.

### Development-branch correction
- Page creation and initial CMS registration/audit now share one D1 batch.
- Page structure updates, conditional insert-if-absent CMS registration, draft snapshots and audit now share one D1 batch.
- Page deletion, CMS content/history cleanup and audit now share one D1 batch.
- Added the Page Builder atomicity source-contract test to development CI.

### Verification boundary
The source-contract test is included in CI; runtime D1 failure-injection and concurrent-editor tests remain separate. No Preview deployment, D1 migration, Production change, main update or branch reconciliation is part of this work.

- Added a 400-field cap to Page Builder structure saves to stay below D1's documented approximate 5,000-binding per-Worker-invocation limit while retaining a single atomic batch.
