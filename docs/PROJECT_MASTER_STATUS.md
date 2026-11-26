# Project Master Status

**Latest handover update:** 2026-11-24  
**Repository:** `SohelRahman/sohel-consulting-website`  
**Development branch:** `current-focus-development`  
**Latest implementation update:** `dd58978d36e1014c3bd99772fe681521d4aa3458` (Preview bootstrap/deployment workflow)  
**Latest verified source CI:** [Run #1015](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45319956996) passed.

## Active priority — Preview runtime and functional acceptance

**Status:** The isolated Preview Worker is deployed successfully. Runtime HTTP smoke tests are now being added and executed; browser-based acceptance and full workflow QA remain pending.

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
1. Complete and record the guarded HTTP smoke workflow.
2. Perform browser QA for English/Bangla navigation, mobile/desktop layouts, accessibility, console/network errors and consent behavior.
3. Verify Admin bootstrap/account readiness, login/MFA enrollment and role-based access.
4. Execute two-session CMS concurrency tests and verify stale-write HTTP 409, revision increments and history/audit consistency.
5. Test Page Builder, Media Library/Cloudinary, course, registration, inquiry, quotation and chat workflows.
6. Complete formal OWASP ASVS Level 2 verification and release-readiness review.

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
