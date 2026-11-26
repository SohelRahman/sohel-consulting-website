# Project Master Status

**Latest handover update:** 2026-11-26  
**Repository:** `SohelRahman/sohel-consulting-website`  
**Development branch:** `current-focus-development`  
**Latest development head:** `3c6cb93ba65425fe8de10bfb5f3903c9b0c6f572`  
**Latest verified source CI:** [Run #1076](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45756744386) passed on application-equivalent merge commit `4aed95bba0af650f3e8c913405852d62dc88e5a0`.

## Active priority — Authenticated Preview acceptance and Production readiness

**Status:** Development validation and Preview HTTP/responsive browser smoke checks have passed. The PBKDF2 runtime compatibility fix is deployed to Preview. The user explicitly confirmed access to the authenticated Admin dashboard with management navigation on 2026-11-26. This is user-confirmed authenticated access; MFA enrollment and recovery-code consumption have not been independently verified from server-side evidence. RBAC and management workflows remain to be tested. Production D1, secrets, environment protections and backup readiness remain unverified. PR #1 remains draft with no recorded reviews.

### Deployment evidence
- Preview URL: https://current-focus-development.sohelrahman118.workers.dev
- Deployment workflow [Run #16](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45319857793) succeeded.
- Deployed source commit: `dd58978d36e1014c3bd99772fe681521d4aa3458`.
- Worker version: `bd3a71ff-a09c-46f1-897c-8b9a07a6d214`.
- Preview D1 identity verified; migrations 0018 and 0019 are applied.
- Source validation, CMS revision contract/SQLite tests and Admin MFA tests passed during deployment.
- Preview-only `MFA_ENCRYPTION_KEY` was provisioned without exposing its value.
- No Production deployment or `main` modification occurred.

### Runtime smoke tests
- Added `.github/workflows/preview-runtime-smoke.yml`, gated to `current-focus-development` commits containing `[preview-smoke]`.
- Checks English and Bangla homepage delivery, Admin and quotation-response pages, unauthenticated Admin API rejection, source/migration/config path denial, and quotation-response privacy headers.
- Workflow [run](https://github.com/SohelRahman/sohel-consulting-website/actions/workflows/preview-runtime-smoke.yml) must pass before marking these HTTP checks accepted.

### Remaining acceptance sequence
1. Confirm whether the opened Admin page is the authenticated dashboard, not only the login/enrollment screen.
2. Complete MFA enrollment and test a fresh MFA login, recovery-code single use and RBAC using the authorized Preview account.
3. Execute two-session CMS concurrency tests and verify stale-write HTTP 409, revision increments and history/audit consistency.
4. Test Page Builder, Media Library/Cloudinary, course, registration, inquiry, quotation and chat workflows.
5. Complete formal OWASP ASVS Level 2 verification and release-readiness review.
6. Complete Production D1 identity/backup/migration-ledger and runtime-secret/environment preflight, obtain required PR review, then merge and deploy.

Do not treat deployment success or CI as browser/runtime acceptance. Keep all tests on Preview and preserve the Production/`main` boundary.

## Completed source priority — Bulk CMS initialization recovery
- Admin preflight blocks more than 400 eligible items before network submission.
- Ambiguous network failures explain safe retry behavior; existing keys are preserved.
- Initialization remains draft-only and content/history/audit writes use one D1 batch.
- Previous development CI run [#45149919998](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45149919998) passed.

## Completed source priority — Admin MFA
MFA source implementation and automated checks passed in [CI run #45149126646](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45149126646). Migration `0019_admin_mfa.sql` is applied to Preview D1 by Run #11. The development Preview deployment workflow provisions `MFA_ENCRYPTION_KEY` if absent without rotating an existing value and runs the CMS/MFA tests. It now has an explicit commit-message-gated push trigger on `current-focus-development`, avoiding changes to `main`. Actual secret provisioning, Preview deployment and browser acceptance remain pending.

## Mandatory operating gates
- Work only on `current-focus-development`; do not modify, merge, rebase or reconcile `main`.
- Never access or expose secret values.
- No migration, D1 write, Cloudflare configuration change or deployment without explicit approval.
- Distinguish source implementation, CI, Preview deployment, Preview runtime acceptance and Production release.
- Update this file, relevant technical documentation and `CHANGELOG.md` in the same implementation commit.


## 2026-11-24 — Preview D1 migrations applied and verified

The authorized Preview migration workflow [Run #11](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/4516057616) completed successfully. Job `migrate-preview` verified the dedicated remote Preview D1 ID `e0317397-77cb-4f36-9d19-2594ff75b0c2` before migration activity. The pre-apply migration list contained `0018_cms_content_revision.sql` and `0019_admin_mfa.sql`. Wrangler reported both migrations with successful status after execution. The final remote migration-list step returned **No migrations to apply!** The job steps `Apply pending migrations to Preview D1 only` and `Verify Preview migration state` both completed successfully.

This is direct GitHub Actions execution evidence for the Preview D1 migration ledger. It confirms the two migrations were applied to the dedicated Preview database. It does not establish that a Worker containing the corresponding source code has been deployed or that runtime/browser acceptance has passed. Production and `main` were not targeted by this workflow.


## Preview deployment trigger gate — 2026-11-24

The guarded Preview deployment workflow now supports a branch-scoped `push` trigger on `current-focus-development` in addition to manual `workflow_dispatch`. The job runs only when the pushed commit message contains the exact marker `[deploy-preview]` or when the event is a manual workflow dispatch. Ordinary pushes to the development branch skip the deployment job. This avoids modifying `main` merely to expose the workflow in the Actions UI, while retaining an explicit deployment gate. The trigger itself does not authorize or execute deployment. No marker commit has been created and no deployment has been run.


## 2026-11-24 — Preview runtime smoke testing initiated

A marker-gated HTTP smoke workflow was added to test the deployed Preview origin. The checks cover the English/Bangla homepage, Admin and quotation-response static pages, unauthenticated Admin API rejection, sensitive source/config path denial, and quotation-response privacy headers. The workflow does not mutate D1 or deploy code. Browser-based functional acceptance remains pending.


### Runtime smoke checkpoint — 2026-11-24

Initial Preview HTTP smoke execution confirmed static page delivery (English/Bangla home, Admin and quotation page), unauthenticated Admin API rejection, and denial of source/migration/config paths. The first run failed only at the quotation-response privacy-header assertion; the workflow's header parser and diagnostic output were corrected. Rerun is pending. Do not mark quotation privacy headers or overall runtime acceptance passed until the rerun succeeds.


### Quotation-response privacy routing remediation — 2026-11-24

The Preview smoke run found that `/quote-response.html` bypassed Worker middleware because it was absent from `wrangler.preview.toml`'s `run_worker_first` list. The response therefore lacked the intended no-store, no-referrer and noindex headers. Added the exact path to the Preview-only Worker-first route list. Deployment and a passing smoke rerun are pending; do not mark this privacy control accepted until both complete.


### Preview privacy routing deployment — 2026-11-24

The Preview-only routing correction for `/quote-response.html` was deployed successfully via [Run #34](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45320348541). Deployed commit `55585c4fa3f6927df14776eac508c2eed6efd290`; Worker version `8f6489b1-7ef9-4423-a01a-6bdf63a48755`. Deployment source/CMS/MFA checks passed. Final HTTP smoke confirmation of the no-store, no-referrer and noindex headers remains pending.


### Preview HTTP smoke acceptance — 2026-11-24

Guarded Preview runtime smoke [Run #20](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45320457740) passed. It confirmed public English/Bangla homepage, Admin and quotation page HTTP delivery; unauthenticated Admin summary rejection (401); direct source/migration/config path denial (404); and quotation-response no-store, no-referrer and noindex headers. The Preview-only Worker-first route correction for `/quote-response.html` was deployed in Run #34. This closes the listed HTTP smoke gate only. Browser interaction, responsive/accessibility QA, authenticated Admin/MFA, CMS concurrency, Page Builder, Cloudinary/media and business workflow acceptance remain open.


### Responsive browser smoke expansion — 2026-11-24

Expanded the guarded Preview runtime smoke workflow with Playwright/Chromium checks at 390px and 1440px for the English homepage, Bangla homepage, Admin and quotation-response pages. Checks cover successful load, title/body presence, uncaught page errors and horizontal overflow. This provides automated browser smoke evidence but not full manual visual/accessibility or authenticated functional acceptance. The expanded workflow is pending execution.


### Playwright runner adjustment — 2026-11-24

Responsive Chromium smoke execution reached the browser-install step but failed because `ubuntu-latest` resolved to Ubuntu 26.04, unsupported by Playwright 1.55.0. The workflow now uses `ubuntu-24.04`. HTTP smoke checks remain passed; responsive browser results remain pending the rerun.


### Browser smoke workflow checkout correction — 2026-11-24

Playwright/Chromium installed successfully on Ubuntu 24.04, but the browser test failed because the workflow had not checked out the repository containing `scripts/test-preview-browser.py`. Added `actions/checkout@v4` before the smoke steps. Responsive browser assertions remain pending the next run.


### Responsive Preview browser smoke accepted — 2026-11-24

Preview smoke [Run #39](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45320815398) passed for the English homepage, Bangla homepage, Admin page and quotation-response page at mobile (390px) and desktop (1440px) viewports. All eight combinations loaded successfully, had title/body content, produced no uncaught browser page errors and had no horizontal overflow. HTTP/API/path/privacy checks passed in the same run. This is public-page smoke acceptance only, not full visual/accessibility or authenticated functional acceptance.

### Next acceptance job — Admin login/MFA entry-state UI

Added read-only browser assertions for visible Admin login controls, required email/password fields, hidden unauthenticated dashboard/MFA panels, and bilingual MFA enrollment/recovery guidance. The next guarded smoke run will execute these checks. Live authenticated MFA enrollment, recovery-code lifecycle and RBAC verification remain blocked on a separately authorized test Admin account; no password or TOTP seed will be requested in chat or committed to GitHub.


### Admin MFA entry-state smoke diagnosis — 2026-11-24

Preview smoke [Run #44](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45321214679) failed only two new MFA copy assertions. All HTTP/security checks, eight responsive page/viewport checks and the development validation workflow passed. The test incorrectly searched visible body text for copy inside panels intentionally hidden before authentication. Corrected the browser test to inspect the enrollment and recovery panels' DOM text directly, including English and Bangla wording. Correction commit: 72d5c51a2b038445943a5b32ea442ed0d1eb4eaa. Guarded Preview smoke rerun is pending. This was a test-only change; no application deployment, D1 mutation, or main-branch change occurred.


### Admin unauthenticated/MFA entry-state smoke accepted — 2026-11-24

Preview runtime smoke [Run #45](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45322065022) passed. HTTP/security checks and all eight responsive page/viewport checks succeeded. Admin assertions verified the visible login panel and email/password fields, hidden dashboard/enrollment/verification/recovery panels before authentication, and English/Bangla MFA enrollment and recovery wording in the hidden-panel DOM. The prior Run #44 failure was a test assertion visibility mistake and has been corrected. This does not establish authenticated MFA, recovery-code lifecycle, replay prevention or RBAC acceptance. No credentials, Worker deployment, D1 mutation or main-branch change was involved.


## 2026-11-26 — Website 8 startup audit and continuity update

### Repository baseline
- Repository: `SohelRahman/sohel-consulting-website` (public; default branch `main`).
- Development branch: `current-focus-development` at `48f87901f2609db8d8b82050087ec67490c43312` (latest branch head observed during this audit).
- Production branch: `main` at `cae9a07bb20b509459231ee43be9f0601770c664` (latest branch head observed during this audit).
- Open PR #1: `current-focus-development` to `main`, title “Build bilingual training registration and admin platform foundation”; it remains open and unmerged in the inspected GitHub response.
- The development branch contains the application, 19 numbered D1 migrations (0001–0019), Worker/API code, English and Bangla pages, Admin UI, CMS, Cloudinary integration, tests, workflows and technical documentation.
- `docs/PROJECT_MASTER_STATUS.md` exists on the development branch. A root-level `PROJECT_MASTER_STATUS.md` does not exist; the authoritative path remains `docs/PROJECT_MASTER_STATUS.md`.

### Fresh CI/runtime evidence
- Development validation [Run #1068](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45322210311), commit `48f87901f2609db8d8b82050087ec67490c43312`, completed successfully on 2026-11-24.
- Preview runtime smoke [Run #45](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45322065022), commit `72d5c51a2b038445943a5b32ea442ed0d1eb4eaa`, completed successfully. Job steps confirmed public page/security checks and responsive Chromium smoke for English homepage, Bangla homepage, Admin and quotation-response pages at 390px and 1440px.
- These are CI and Preview smoke results. They do not establish authenticated Admin/MFA workflow acceptance, complete CMS/business workflow acceptance, or Production release.
- The latest `main` commit found is `cae9a07` (“Fix false-positive read-only migration audit guard”). This is not evidence that the development PR was merged.

### Reconciled current status
- **Implemented on development branch:** bilingual public site, Worker API, D1 migrations 0001–0019, Admin/CMS and documented module capabilities; consult module documents for details.
- **CI passed:** latest source validation run #1068.
- **Preview smoke passed:** HTTP/security checks and public-page responsive smoke run #45.
- **Preview deployment:** previous documentation records Preview Worker deployment and Preview D1 migration application. This audit did not independently re-confirm the live Worker version or re-read the remote D1 migration ledger.
- **Not accepted yet:** authenticated Admin login/MFA enrollment and verification, recovery-code lifecycle/replay prevention, live RBAC, deployed CMS stale-write/concurrency, full Page Builder/Cloudinary and business workflows, comprehensive accessibility/browser QA, and formal ASVS Level 2 sign-off.
- **Production:** no Production deployment or migration is authorized by this audit. The open PR is not merged; keep `main` untouched during routine development.

### Immediate next execution priority
1. Inspect Preview workflow history and deployed Preview commit/version against the current development branch head; read-only only.
2. Review the latest test scripts/workflows and run or extend automated checks that do not require credentials or mutate remote data.
3. Prepare authenticated Admin/MFA acceptance using a designated test account; never request credentials or secrets in chat.
4. Execute CMS concurrency and module-level Preview acceptance only when required test access and explicit remote-action approvals exist.
5. Update this status and changelog after each verified milestone.

### Operational boundary
- Work only on `current-focus-development` for Website 8 development.
- Do not merge, rebase, force-push, alter, or commit to `main` without explicit separate authorization.
- Do not run remote migrations, D1 writes, Cloudflare secret/configuration changes, or Worker deployments without explicit approval.
- Never read, print, request, or commit secret values.
- No work from other projects is in scope for this repository or chat.


## 2026-11-26 — Preview deployment reconciliation (read-only)

- Latest confirmed successful Preview deployment found in the inspected GitHub Actions history: [Deploy run #34](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45320348541), deploying commit `55585c4fa3f6927df14776eac508c2eed6efd290` to the isolated Preview Worker. All deployment job steps completed successfully, including Preview Worker/D1 identity verification, source and CMS/MFA checks, secret-presence handling, and Preview-only Worker/static-asset deployment.
- Subsequent deployment workflow runs inspected for commits `02cb4ef`, `72d5c51`, `48f8790`, `adb5dff` and `45fed5a` were skipped by the commit-message/manual-dispatch gate. No later successful deployment was identified in the inspected run history.
- GitHub compare from deployed commit `55585c4` to current development head `45fed5a` reports 39 commits ahead and 0 behind. The changed paths are limited to the Preview smoke workflow, changelog, Preview deployment/status/testing documentation, and `scripts/test-preview-browser.py`. No Worker source, public site asset, Wrangler configuration, or migration file changed in this range. This supports source-level application parity between the last confirmed deployment and current development head; it does not prove that no manual Cloudflare-side change occurred.
- Preview smoke [Run #45](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45322065022) passed against the Preview origin after the #34 deployment. It confirms the specified HTTP/security and responsive public-page smoke assertions at that time, not a current live-edge check on 2026-11-26.
- A direct live-origin check could not be completed in this audit because the web retrieval service could not access either documented Worker hostname. Therefore **current live Worker availability/version remains unverified**; do not report the current live deployment as freshly confirmed.
- No deployment was triggered. The deployment workflow can bootstrap/deploy the Preview Worker and create the Preview-only `MFA_ENCRYPTION_KEY` if missing, so it is a mutating operation. Obtain explicit user approval before running it. No remote D1 read/write, migration, secret read, secret change, Worker deployment, or Production action was performed.

### D1 reconciliation result
- **Source parity:** confirmed for application/runtime files relative to the last confirmed deployment.
- **Last confirmed deployed source:** `55585c4fa3f6927df14776eac508c2eed6efd290` (Run #34).
- **Current development head:** `45fed5af355be5b4bf7a52f539ac5c1b44f361f7` (documentation/test-only changes since deployment).
- **Live Worker state:** pending independent current-origin verification.
- **Next priority:** perform an approved Preview deployment only if a fresh live deployment is required; otherwise continue with non-mutating automated acceptance work and authenticated test-plan preparation.


## 2026-11-26 — Production release authorization and preflight

The project owner authorized the Production release, including the required merge to `main`, Production D1 migrations and Worker deployment, provided release safeguards are met. This authorization does not waive review, database backup/identity checks, migration verification, authenticated acceptance or release gates.

### Current GitHub release state
- PR #1 remains open and marked draft; GitHub reports it is not mergeable. No approvals or review threads are recorded.
- Development head: `9a3548b86bf9a94ed5c7c860767f974eb4f38b1e`.
- Main head at audit: `cae9a07bb20b509459231ee43be9f0601770c664`.
- Branch comparison reports development 833 commits ahead and 14 commits behind; six workflow files changed on both branches. The overlapping workflow contents are not identical in all cases. Do not merge until the branch divergence and conflicts are reconciled and the final diff is reviewed.
- The Production deployment workflow `.github/workflows/deploy-cloudflare.yml` exists on the development branch but is absent from `main`. Production Worker configuration and application files are likewise not present at the checked paths on `main`; the current PR is the first proposed introduction of this application to the production branch.
- The development-branch Production workflow only invokes `wrangler deploy`; it does not itself run application validation, verify the Production D1 migration ledger, or apply migrations.
- No PR review approvals or commit status checks were returned for the current head through the connected GitHub integration. Cloudflare's latest PR comment reports Preview build/deployment success for commit `9a3548b`; this is Preview deployment evidence, not Production release acceptance.

### Production release blockers
- Production D1 database identity, backup/restore readiness and remote migration ledger have not been independently verified.
- Production runtime secret presence and the protected GitHub `production` environment/reviewer configuration are not verified.
- Authenticated Admin/MFA, RBAC, CMS concurrency and full business workflows remain unaccepted on Preview.
- Business content, course fees and policy copy still require owner approval as recorded in the launch checklist.

### Actions taken
- Read-only inspection of repository metadata, PR #1, branch comparison, release workflow and Wrangler configuration.
- No PR merge, branch rewrite, Production D1 operation, secret change or Production deployment was performed.

### Next release action
Reconcile the 14-commit branch divergence and six overlapping workflow files without force-pushing; then rerun required validation and complete the Production D1/secret/environment preflight before merge and deployment.


## 2026-11-26 — Development/main ancestry reconciliation

### Completed
- Reconciled the development branch with the current `main` history using a non-force-forward merge commit: `4aed95bba0af650f3e8c913405852d62dc88e5a0`.
- The merge commit retains the audited development tree and adds the exact current `main` head as its second parent. The branch update used an expected-head lease; no force push was used.
- Re-audit of all six files changed on both sides found two identical files and four where the development version contains the safer/fixed logic: correct Cloudflare token whitespace normalization and strict parsing of the Preview D1 array-of-table configuration. Those development versions were retained.
- Branch comparison now reports development is 0 commits behind `main`; PR #1 is reported mergeable by GitHub.
- PR #1 remains a draft. The current diff contains 110 files. Development validation workflow Run #1076 was observed in progress at the time of this update; final result remains pending.

### Not yet complete
- No merge to `main` has occurred.
- PR review/approval and readiness transition remain outstanding.
- Production D1 identity, backup, migration ledger, protected environment and secret readiness remain unverified.
- Authenticated Admin/MFA and end-to-end acceptance remain outstanding.
- Final owner approval of business content, pricing and policies remains outstanding.

### Safety
No Production deployment, Production D1 operation, secret mutation, or change to the `main` ref was performed.

### Next action
Wait for the validation run on the reconciled head, inspect its jobs and results, then address any failures before proceeding with the remaining release gates.


## 2026-11-26 — Current MFA and release acceptance checkpoint

- The Admin MFA implementation is present in `src/worker.js`, `src/admin-mfa.js`, `admin.html` and migration `0019_admin_mfa.sql`. The historical assessment dated 2026-11-23 below describes an earlier commit and must not be read as the current implementation state.
- Development validation Run #1076 passed. Its workflow explicitly ran `scripts/test-admin-mfa.mjs`, which covers TOTP vectors, verification windows, encrypted-secret round-trip and associated-data binding, recovery-code generation/hash normalization, restricted password-login challenge, MFA replay/recovery SQL guards, challenge-cookie properties and bilingual Admin UI source contracts.
- Project history records Preview migration 0019 applied by migration Run #11. This is historical workflow evidence; current remote ledger has not been re-read during this checkpoint.
- Preview browser smoke Run #45 passed unauthenticated entry-state checks only. It did not submit credentials or exercise authenticated MFA enrollment, second-factor verification, recovery-code consumption or role-specific access.
- The latest development branch head includes documentation and ancestry commits after Run #1076; no application source changed in those commits. The successful run was on the reconciled merge commit.
- Production remains blocked pending current Production D1 identity/backup/ledger verification, secret/environment verification, authenticated Preview acceptance, content approval and authorized PR review.

### Next acceptance action
Complete authenticated Preview Admin/MFA acceptance using an authorized test account through a secure browser/session workflow. Do not send passwords, TOTP values, recovery codes or secret values in chat. If no test account exists, provision one only through a reviewed Preview-only procedure and record the state change.


## 2026-11-26 — Preview Admin login configuration remediation

The Preview deployment workflow now checks the Worker secret-name list for `SESSION_SECRET`. If absent, it generates a cryptographically random 32-byte base64url signing secret and stores it only on the Preview Worker. Existing values are preserved and never printed. This complements the existing non-rotating `MFA_ENCRYPTION_KEY` provisioning.

The change is committed to `current-focus-development`. It is not yet evidence of a successful Preview deployment or a working Admin login. The next guarded Preview deployment must complete, then the login endpoint must be rechecked. If login proceeds to MFA enrollment, the bootstrap Admin account still requires valid Preview bootstrap credentials or an existing active account. No credentials are included in source or documentation. Production and `main` remain untouched.


## 2026-11-26 — Preview sign-in PBKDF2 failure diagnosed

The Preview Admin diagnostic exposed the exact failure: Cloudflare Workers production Web Crypto rejects PBKDF2 iteration counts above 100,000, while the application requested 600,000. The password-hash module now uses 100,000 iterations, and its parser rejects unsupported stored iteration counts. The updated password-hash tests pass in development CI [Run #45758627145](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45758627145).

**Security qualification:** 100,000 PBKDF2-SHA-256 iterations are below OWASP's current 600,000 recommendation. This is a Workers runtime compatibility workaround, not the final preferred password-storage posture. A stronger production design requires a Worker-compatible memory-hard KDF or a dedicated authentication service. Preview deployment and live login acceptance remain pending; no Production changes have been made.


## 2026-11-26 — PBKDF2 compatibility fix deployed to Preview

- Preview deployment workflow Run [#45758679816](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45758679816) completed successfully for commit `df6b7a311c1d92e3091a6b3c80f0aa142afd43be`.
- The Worker now has the Workers-compatible 100,000-iteration PBKDF2 implementation. Development validation passed on the tested code commit `90a47a50f3d052eceda82d97a67d6095ec1bb2d6`; subsequent changes were documentation only.
- The existing Preview smoke workflow was skipped because its explicit `[preview-smoke]` commit-message gate was not met. A docs-only commit will trigger that smoke workflow without redeploying the Worker.
- Admin sign-in has not yet been retested after this deployment. The 100,000-iteration PBKDF2 setting remains a documented security compromise requiring a stronger future KDF design.


## 2026-11-26 — Preview runtime acceptance and Production gate audit

### Verified
- Preview deployment Run [#45758679816](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45758679816) succeeded for PBKDF2 compatibility fix commit `df6b7a311c1d92e3091a6b3c80f0aa142afd43be`.
- Development validation Run [#45759504101](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45759504101) passed.
- Preview runtime smoke Run [#45759498860](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45759498860) passed, including public page delivery, unauthenticated Admin API rejection, sensitive path denial, privacy headers and responsive Chromium checks.
- The user reports that the Preview Admin link opens. This is not sufficient evidence of a completed authenticated session; a dashboard screenshot or successful authenticated API check is still required.
- PBKDF2 at 100,000 iterations is a compatibility workaround and remains below OWASP's current 600,000 PBKDF2-SHA-256 recommendation. Do not treat this as the final password-storage security design.

### Production release gate audit
- PR #1 is still **open and draft**, with 856 commits ahead of `main`, 0 behind, 110 changed files, and no recorded PR reviews or review threads.
- The current Production workflow `.github/workflows/deploy-cloudflare.yml` only runs `wrangler deploy` from `main`. It does not run the repository validation suite, verify the exact Production D1 identity, check the remote migration ledger, or apply/verify pending migrations.
- Production D1 identity is configured in `wrangler.toml` as `consulting-db` / `3a4f765a-46c2-4040-9753-36e9483893a4`; this is configuration evidence, not independent confirmation of the live Cloudflare database.
- Production backups/restore readiness, remote migration ledger, runtime secret presence and GitHub `production` environment protection/reviewer configuration remain unverified.
- No merge, Production D1 operation, Production secret mutation or Production deployment was performed.

### Next engineering priority
Complete authenticated Preview Admin/MFA acceptance, then harden the Production deployment workflow with validation and read-only target/migration preflight. Do not merge or deploy while PR review, Production database/backup and secret/environment gates remain open.


## 2026-11-26 — User-confirmed authenticated Admin dashboard access

The user explicitly confirmed that the Preview Admin dashboard opens with management navigation after the MFA setup and sign-in troubleshooting. Record this as user-confirmed successful authenticated dashboard access. Do not overstate it as independent server-side evidence of every MFA, recovery-code or RBAC control. Those controls and role-specific authorization still require explicit acceptance tests.

### Next engineering priority
1. Verify Admin and limited-User permission boundaries at the Worker API layer, including direct API requests and denied mutations.
2. Test the Admin dashboard's read/write management workflows on Preview using authorized test data.
3. Resolve the password-hashing security limitation: Preview currently uses 100,000 PBKDF2-SHA-256 iterations for Cloudflare Workers compatibility, below OWASP's 600,000 iteration recommendation. Do not release this compromise as final Production password storage without an approved stronger Worker-compatible design.
4. Harden Production deployment workflow with source validation, exact Production D1 identity verification, read-only migration-ledger inspection, and explicit backup/restore readiness checks.
5. Verify Production secrets by name/presence only and inspect the GitHub `production` environment protection/reviewer configuration.
6. Obtain required PR review and approvals before merge; then deploy Production and run live smoke tests.

No Production resource was changed.
## 2026-11-26 — RBAC acceptance record clarified

`docs/TESTING.md` now records the user's confirmation of authenticated Preview Admin dashboard access separately from the still-pending live permission-limited User acceptance. The Worker source review confirms that Admin API requests reload the active account/session version, require MFA enrollment, apply route-to-permission mapping, and deny unauthorized non-Admin requests with HTTP 403. Unknown Admin API routes fail closed for limited Users; account-management routes are handled separately.

These are source-review findings backed by existing static contract tests, not live limited-User API acceptance. No Preview account or D1 data was changed. A live limited-User account and direct read/write denial tests remain required before RBAC acceptance can be marked complete.

Latest documentation commit: `3db5302519ceeb8e3dcfdc87f793451a452fb5b9` (`docs/TESTING.md`). Production and `main` remain unchanged.
## 2026-11-26 — Production deployment workflow validation gate added

The manual Production deployment workflow now runs the repository's development validation suite before the deployment job. The Production job remains restricted to `main` and the GitHub `production` environment, and now runs `wrangler deploy --dry-run` before the actual deploy command. This is a workflow-source change on `current-focus-development`; it has not been executed against Production.

Important remaining gates: validate the workflow through GitHub Actions; independently verify the Production D1 identity and remote migration ledger; confirm backup/restore readiness, runtime secret presence and environment protection; complete stronger password-storage design and live RBAC/MFA acceptance; obtain PR review and approval. The dry-run is not a substitute for D1 migration or backup preflight. No Production resource was changed.

Latest workflow commit: `24a6480d20baa34807733ab378f6e90cc6e93a7a`.
## 2026-11-26 — Password-storage architecture assessment

Added `docs/PASSWORD_STORAGE_DESIGN_ASSESSMENT.md` after reviewing current OWASP, Cloudflare Workers, WebAssembly and Argon2 references. The assessment confirms that the current 100,000-iteration PBKDF2-HMAC-SHA-256 setting is below OWASP's recommended 600,000 iterations. Argon2id via WebAssembly is a plausible candidate, but it is not approved until actual Preview CPU-time, isolate-memory, concurrency, compatibility and dependency checks pass. Cloudflare documents a 10 ms CPU limit per HTTP request on Workers Free and 128 MB per isolate; this account's plan and Worker CPU configuration remain unverified.

Decision: do not alter the current hash format yet, do not treat a pepper as a replacement for a suitable KDF, and do not release the 100,000-iteration workaround as the final Production design. A controlled Preview benchmark and architecture decision remain required. No Preview Worker, database, secret or Production resource was changed.

Validation workflow commit `9bc1fb47b5156cd155ae46e355858e77f1155162` also adds a YAML parse step for the Production deployment workflow; its run result is pending.
## 2026-11-26 — Isolated Argon2id benchmark harness prepared

Added a separate, short-lived Cloudflare Worker benchmark using pinned `hash-wasm` 4.12.0 and OWASP's Argon2id baseline (19,456 KiB, 2 passes, parallelism 1). The harness performs a single hash/verify and a two-operation concurrent test. It has no D1 binding, no Admin routes, and requires a random ephemeral bearer token. The workflow deletes the benchmark Worker on exit, including failure paths.

The benchmark Worker explicitly sets a 10 ms CPU budget to test the Cloudflare Workers Free constraint; this is not the production Worker and cannot modify the production application. The response reports wall-clock durations only; these are not represented as CPU-time or memory measurements. If the request exceeds the runtime limit, the workflow will report the failure and remove the Worker.

The benchmark workflow is tagged to run only on a development commit containing `[kdf-benchmark]` or by manual dispatch. Workflow YAML validation was added to development CI. No password hash implementation or existing Admin credential was changed.

Benchmark harness execution trigger commit. The isolated workflow is configured to run for this tagged development commit and remove its temporary Worker after the test.
## 2026-11-26 — Cloudflare Free plan confirmed; benchmark configuration corrected

The first isolated benchmark deployment was rejected by Cloudflare with API error 100328: CPU limits are not supported for the Free plan. This is direct account-plan evidence that the linked Cloudflare deployment account is on Workers Free. The benchmark did not deploy or execute in that attempt. The failure was caused by setting an explicit `cpu_ms` limit in the benchmark Wrangler config, not by Argon2 execution.

Removed the explicit CPU limit from the isolated benchmark config so the Worker uses the Free plan's default 10 ms request CPU limit. The benchmark remains isolated, authenticated with an ephemeral token, has no D1 binding, and is configured for automatic deletion. Its next tagged run will determine whether the Argon2id baseline fits the Free runtime. No application Worker or database was changed.

The isolated benchmark is now configured to use the default Workers Free CPU budget. A tagged development commit triggers the corrected run; the temporary benchmark Worker will be removed automatically after execution.
## 2026-11-26 — Isolated benchmark deployment path verified; request retry added

The corrected benchmark deployment successfully uploaded the isolated Worker and its temporary bearer secret. The first authenticated request returned HTTP 401 immediately after secret creation, consistent with a deployment/secret propagation delay; the benchmark did not run. The workflow's exit cleanup ran. Added bounded retries for HTTP 401 to allow the new Worker version and secret to propagate. The next tagged run will verify this. No existing Worker, Admin credential, D1 database or Production resource was changed.

Retry-enabled isolated Argon2id benchmark execution trigger.
## 2026-11-26 — Argon2id Free-tier runtime test requires error detail

The isolated benchmark Worker deployed successfully on Workers Free, and the ephemeral authentication secret was accepted after bounded retries. The benchmark request then returned HTTP 500 with a sanitized generic KDF failure; no timing data was produced. The workflow's cleanup trap ran. The failure does not yet establish whether the cause is WebAssembly initialization, Argon2 parameter handling, or a runtime resource limit.

Added a bounded, non-secret error reason to the isolated benchmark response so the next run can distinguish initialization/parameter errors from runtime resource failures. This diagnostic exists only in the temporary benchmark Worker source; no Admin password hashes or application authentication behavior were changed.

Retry trigger for the isolated Argon2id benchmark with sanitized runtime diagnostics.
## 2026-11-26 — Argon2id benchmark compatibility finding

The isolated benchmark ran on the Cloudflare Workers Free plan. The selected `hash-wasm` implementation failed before hashing with `WebAssembly.compile(): Wasm code generation disallowed by embedder`. Cloudflare's current Workers documentation states that Worker code must instantiate precompiled WebAssembly modules; Wrangler can import `.wasm` assets as `WebAssembly.Module` values. Therefore this result identifies a library packaging/runtime incompatibility, not proof that Argon2id cannot run on Workers.

Next candidate: inspect a maintained Argon2id implementation that ships a precompiled `.wasm` module and imports it through Wrangler's compiled-Wasm module mechanism. Review source, license, release provenance, API, PHC format and test coverage before benchmarking it. Do not integrate a package into Admin authentication solely because its README claims Workers compatibility.

The benchmark workflow cleanup now reports success/failure for deletion rather than silently ignoring delete errors. The prior benchmark run's cleanup attempt was not independently verified because its delete output was suppressed. No application authentication code or existing password hashes were changed.


## 2026-11-26 — Precompiled-Wasm Argon2id candidate review

Reviewed the public README for `@hallaxius/argon2w`. Its documented standalone SIMD Wasm asset and Cloudflare Workers compiled-module import make it a technically relevant candidate, but the package is not approved: the exact published tarball, npm provenance, source/build workflow, release-to-commit correspondence, maintainer identity and upstream tests were not independently verified. A third-party listing reports version 0.0.1, Apache-2.0, zero dependencies, zero weekly downloads and an incomplete health report; this is a weak adoption signal, not a security finding. The README's `m16t2` profile is below OWASP's 19 MiB / 2-pass / p=1 baseline; its `standard` profile is documented as 19,456 KiB / 3 passes. No package was added and no password/authentication code changed.

Next: verify the exact registry artifact and provenance, inspect the source and licences, run known-answer tests, then benchmark a verified 19,456 KiB / 2-pass / p=1 configuration in the isolated Worker. If package provenance cannot be established, reject it and build a reproducible precompiled module from the PHC reference implementation. Production and the `main` branch remain untouched.


## 2026-11-26 — Argon2id fallback source review

The unverified `@hallaxius/argon2w` candidate remains rejected pending exact npm artifact, signature/provenance and source-to-build verification. As a fallback, inspected the official PHC reference Argon2 C source: it supports Argon2id, provides PHC encoded hash handling and known-answer tests, includes memory-clearing code, and offers a `NO_THREADS=1` build option. Its licence permits use under CC0 1.0 or Apache 2.0. This was source inspection only; the upstream branch has not yet been pinned to an immutable commit and no Emscripten build or Workers benchmark has been run.

**Next build gate:** pin the upstream commit and source manifest; create a minimal single-thread hash/verify wrapper; compile a standalone prebuilt Wasm module; verify upstream vectors, PHC compatibility, malformed input and memory handling; then test Wrangler import and the isolated Free-plan OWASP-baseline benchmark. Do not modify application authentication or stored hashes before all gates pass. No application, Preview or Production resources were changed.


## 2026-11-26 — Preferred Argon2id prototype candidate updated

The PHC reference C repository remains useful as a reference and known-answer source, but its latest published release is shown as 2019-07-02 and the inspected master commit is dated 2021-06-25. Its maintenance gap is a concern for a new security-critical integration.

Preferred isolated prototype candidate is RustCrypto Argon2 0.6.0 pinned to signed commit `dc7e0c25cda9a8421d2604debf548d663886b431` (2026-11-05). Source review confirms pure Rust/no_std, Argon2id, PHC interfaces, single-thread default, optional zeroize support and MIT OR Apache-2.0 licensing. Its documented default matches OWASP's m=19,456 KiB, t=2, p=1 baseline. **Important:** the inspected allocated block-buffer Drop deallocates without wiping the full matrix; a wrapper must explicitly zeroize its owned matrix on all exit paths. Do not assume enabling the optional zeroize feature solves that issue.

Next: build a bounded single-thread `wasm32-unknown-unknown` prototype with fixed Argon2id v=19 parameters, PHC-compatible input/output, pre-allocation PHC parameter limits, RAII full-matrix wiping and KAT/interop/ABI tests. Then import the precompiled module in the isolated Workers Free benchmark and measure CPU/memory. This is candidate selection only: no dependency or application code was changed; Production remains blocked.
