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
