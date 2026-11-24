# Cloudflare Preview deployment

## Dedicated configuration

The development branch uses `wrangler.preview.toml` for Preview deployments. It pins:

- Worker name: `current-focus-development`
- D1 database: `consulting-preview-db`
- D1 database ID: `e0317397-77cb-4f36-9d19-2594ff75b0c2`
- Runtime marker: `ENVIRONMENT=preview`
- Worker entry point: `src/worker.js`

The configuration does not contain the Production D1 binding or Production Worker name. Do not replace this file with the root `wrangler.toml` for Preview deployment.

## Guarded workflow

Run `.github/workflows/deploy-cloudflare-preview.yml` manually from `current-focus-development` only. It:

1. Requires the GitHub Actions secrets `CLOUDFLARE_WORKERS_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`; it does not print their values.
2. Confirms the configured Worker name, Preview D1 name/ID, Preview environment marker and entry point.
3. Verifies the Cloudflare API token is active and Cloudflare resolves the exact Preview D1 ID/name.
4. Runs the development source validation checks.
5. Deploys using `wrangler.preview.toml`, not the Production configuration.

The workflow has a hard branch guard and a dedicated concurrency group. It is manual-dispatch only. The existing `.github/workflows/deploy-cloudflare.yml` remains Production-only and must not be used for Preview.

## Required secrets

The deployment workflow requires these GitHub Actions secrets:

- `CLOUDFLARE_WORKERS_API_TOKEN`: dedicated Cloudflare token with the minimum permissions required to deploy the Worker and static assets and read/verify the Preview D1 target.
- `CLOUDFLARE_ACCOUNT_ID`: Cloudflare account identifier.

Application secrets (Admin credentials/session secret and Cloudinary credentials) must already be configured on the named Preview Worker through the approved Preview secret process. Never place secret values in this file, source code, workflow output or chat. A successful deployment does not prove every application secret is present or every runtime feature works.

## Release boundary and acceptance

- Applying D1 migrations and deploying the Worker are separate operations.
- Preview deployment does not authorize Production deployment, Production D1 changes, merging the development branch, or changing `main`.
- After deployment, verify the deployment URL and commit in Cloudflare/GitHub, then perform the manual Preview QA checklist in `docs/TESTING.md`.
- CI/source validation is not browser acceptance. Do not mark login, uploads, media inventory, CMS, registration or other runtime tests as passed without direct evidence.

## GitHub Actions workflow visibility and dispatch status

GitHub requires a `workflow_dispatch` workflow to exist on the repository's default branch before the Actions UI can manually start it.

Repository state checked on 2026-11-23:
- Default branch: `main`.
- `.github/workflows/audit-preview-d1-migrations.yml` exists on both `main` and `current-focus-development`. Its manual dispatch UI prerequisite is satisfied.
- `.github/workflows/deploy-cloudflare-preview.yml` exists on `current-focus-development` but is absent from `main`. Its manual dispatch UI prerequisite is not yet satisfied.
- Do not add the deployment workflow to `main` without separate explicit approval. Do not merge or copy application code to `main`.

### Read-only Preview migration audit

Start the audit from GitHub Actions:
1. Open **Actions**.
2. Select **Audit Cloudflare Preview D1 migrations (read-only)**.
3. Select **Run workflow**.
4. Select branch `current-focus-development`.
5. Start the workflow and inspect the complete log.

The audit checks the Cloudflare token, verifies the exact Preview D1 identity and runs `wrangler d1 migrations list --remote`. It contains no migration-apply command and does not write application data. The connected GitHub integration used for this task has no workflow-dispatch operation, so the user must start this read-only run in the GitHub UI.

The last recorded audit, run [#45024256326](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45024256326), is dated 2026-11-22 and predates migration 0018. It is not evidence of the current 0018 status. A fresh run is required.

### Separate migration and deployment gates

- If migration 0018 appears as pending, do not deploy the Worker. Review the migration, target identity and recovery plan, then obtain explicit approval before applying it to Preview.
- If migration 0018 is already applied, record the audit run and exact target evidence.
- Preview Worker deployment remains separate and requires explicit approval. Its workflow UI prerequisite is currently unresolved because the workflow is absent from `main`.
- Never use the Production deployment workflow for Preview.
- No step here authorizes Production changes, merging, or modifications to `main`.

Reference: [GitHub Docs — Manually running a workflow](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow).

## Deployment status

The workflow and isolated configuration are committed to the development branch and development CI passed. The workflow has not been dispatched. No Preview Worker deployment is confirmed. Preview browser acceptance remains pending.


## 2026-11-23 — Preview migration audit Run #5 result

Read-only audit [Run #5](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45155468446) completed successfully on `current-focus-development`. Its `List remote Preview migration history (read-only)` step ran Wrangler 4.160.1 against `PREVIEW_DB` and listed `0018_cms_content_revision.sql` and `0019_admin_mfa.sql` under **Migrations to be applied**. The preceding workflow step is designed to verify the dedicated Preview D1 ID `e0317397-77cb-4f36-9d19-2594ff75b0c2`; the workflow also excludes the known Production D1 ID.

**Current gate:** Both migrations are pending. Run #5 did not apply either migration. Applying migrations requires explicit approval. Migration 0018 must be applied and verified before deploying Worker code that reads or writes `cms_content.revision`. Migration 0019 requires a separately configured Preview-only `MFA_ENCRYPTION_KEY`; never expose its value. Preview Worker deployment requires separate explicit approval and is not authorized by this successful read-only audit. Do not modify `main` to expose the deployment workflow without separate approval.


## 2026-11-24 — Preview D1 migrations applied and verified

The authorized Preview migration workflow [Run #11](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/4516057616) completed successfully. Job `migrate-preview` verified the dedicated remote Preview D1 ID `e0317397-77cb-4f36-9d19-2594ff75b0c2` before migration activity. The pre-apply migration list contained `0018_cms_content_revision.sql` and `0019_admin_mfa.sql`. Wrangler reported both migrations with successful status after execution. The final remote migration-list step returned **No migrations to apply!** The job steps `Apply pending migrations to Preview D1 only` and `Verify Preview migration state` both completed successfully.

This is direct GitHub Actions execution evidence for the Preview D1 migration ledger. It confirms the two migrations were applied to the dedicated Preview database. It does not establish that a Worker containing the corresponding source code has been deployed or that runtime/browser acceptance has passed. Production and `main` were not targeted by this workflow.


## MFA key preflight in the guarded deployment workflow

The development-only `.github/workflows/deploy-cloudflare-preview.yml` now checks the Preview Worker's secret-name metadata before deployment. If `MFA_ENCRYPTION_KEY` is absent, the workflow generates a cryptographically random 32-byte value, encodes it as base64url, and pipes it directly to `wrangler secret put` for Worker `current-focus-development`. It never writes the value to repository files or logs. If the secret already exists, it is not rotated, because rotating an AES-GCM key would make existing encrypted TOTP seeds unreadable. The workflow also runs the CMS revision source/SQLite tests and Admin MFA cryptographic/source-contract tests before deployment.

**Dispatch limitation:** This workflow file currently exists only on `current-focus-development`, not the repository default branch `main`. GitHub Actions UI dispatch generally requires the workflow file to exist on the default branch. Do not copy it to `main` without a separately approved, reviewed change. Therefore secret provisioning and deployment have not been executed by this source change.


## Preview deployment trigger gate — 2026-11-24

The guarded Preview deployment workflow now supports a branch-scoped `push` trigger on `current-focus-development` in addition to manual `workflow_dispatch`. The job runs only when the pushed commit message contains the exact marker `[deploy-preview]` or when the event is a manual workflow dispatch. Ordinary pushes to the development branch skip the deployment job. This avoids modifying `main` merely to expose the workflow in the Actions UI, while retaining an explicit deployment gate. The trigger itself does not authorize or execute deployment. No marker commit has been created and no deployment has been run.


## 2026-11-24 — Preview deployment Run #7 preflight failure and diagnostic hardening

The authorized isolated Preview deployment attempt [Run #7](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45319057699) started on commit `e93021fa412d1dcf7dcf7c9b23535b8a7808fc15` and failed in the isolated Preview D1 identity preflight. GitHub Actions confirmed both required Cloudflare credential secrets were present, and the Cloudflare token verification step accepted the token as active. The D1 detail response did not satisfy the expected Preview database name/ID check. The workflow stopped before Preview secret provisioning, application tests, or Worker deployment. No deployment is confirmed.

The deployment preflight was hardened on `current-focus-development` to emit sanitized diagnostic fields on identity mismatch: HTTP status, API success flag, Cloudflare error codes/messages, returned database name/ID, and result field names. It does not print the token, account ID, or secret values. The exact Preview ID and name checks remain mandatory; deployment remains fail-closed. The next marker-triggered run must be inspected before any deployment can be considered successful.


## 2026-11-24 — Credential separation correction

Preview deployment Run #10 confirmed the D1 detail request returned HTTP 401 with Cloudflare error code 10000 (Authentication error), while the deployment token verification succeeded. Inspection of the successful Preview migration workflow showed that D1 identity lookup uses the GitHub Actions secret `CLOUDFLARE_API_TOKEN`, whereas the deployment workflow had incorrectly supplied `CLOUDFLARE_WORKERS_API_TOKEN` to that lookup. The deployment workflow now uses `CLOUDFLARE_API_TOKEN` only for the D1 identity preflight and retains `CLOUDFLARE_WORKERS_API_TOKEN` for Wrangler Worker deployment and secret operations. The exact Preview database ID/name guard remains unchanged. No credentials or values are recorded here.


## 2026-11-24 — First-time Worker bootstrap ordering

The Preview D1 identity preflight passed on deployment Run #13, confirming the dedicated Preview database name and ID. The next step failed because Cloudflare reported that Worker `current-focus-development` did not yet exist; Wrangler cannot list or set Worker secrets before the first deployment creates the Worker. The workflow now runs source and contract tests, performs an initial isolated Preview Worker bootstrap deployment, provisions `MFA_ENCRYPTION_KEY` only after the Worker exists (without rotating an existing key), and then performs the final Preview deployment. Both deployments use only `wrangler.preview.toml` and the dedicated Worker name. The workflow remains restricted to `current-focus-development`; Production and `main` are excluded.


## 2026-11-24 — Isolated Preview Worker deployed

The authorized Preview deployment [Run #16](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45319857793) completed successfully on commit `dd58978d36e1014c3bd99772fe681521d4aa3458`. The workflow passed credential checks, exact Preview D1 identity verification, source validation, CMS revision contract/SQLite tests, and Admin MFA tests. It bootstrapped Worker `current-focus-development`, created and stored a Preview-only `MFA_ENCRYPTION_KEY` because the Worker did not previously exist, then successfully deployed the final Worker bundle and assets.

Deployment evidence from Wrangler:
- Preview URL: https://current-focus-development.sohelrahman118.workers.dev
- Worker version: `bd3a71ff-a09c-46f1-897c-8b9a07a6d214`
- Worker binding: `DB` → `consulting-preview-db`
- Environment: `preview`
- Assets binding: `ASSETS`
- Wrangler: `4.160.1`

This confirms the Cloudflare Preview deployment operation, not browser/runtime acceptance. Automated source/contract tests passed; the public Worker URL could not be fetched through the available external page inspection path in this session. Continue with Preview runtime smoke checks and browser QA before treating the environment as accepted. Production and `main` were not modified.


## 2026-11-24 — Runtime acceptance gate started

The Preview Worker deployment is confirmed by Actions Run #16. A new guarded HTTP smoke workflow, `.github/workflows/preview-runtime-smoke.yml`, now targets the deployed URL `https://current-focus-development.sohelrahman118.workers.dev`. It checks the English and Bangla homepages, Admin and quotation-response static pages, unauthenticated Admin API rejection, denial of direct source/migration/config access, and quotation-response privacy headers. The workflow is marker-gated with `[preview-smoke]` and is separate from deployment; it cannot deploy or change D1. Browser interaction and the wider functional QA matrix remain separate acceptance gates.


## 2026-11-24 — Initial runtime smoke result

Preview runtime smoke [Run #5](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45320166771) confirmed the four static-page HTTP 200 responses, unauthenticated Admin API HTTP 401, and HTTP 404 protection for Worker source, migration SQL and Wrangler configuration paths. The run stopped at the quotation-response privacy-header assertion. The smoke workflow now parses the final response header block and emits only the relevant privacy-header names/values to aid diagnosis. No application data was changed by the smoke test. The privacy-header check remains unaccepted pending a passing rerun.


## 2026-11-24 — Quotation-response privacy routing fix

The second runtime smoke execution showed that `/quote-response.html` was served directly by the static-assets layer, bypassing the Worker wrapper that sets `Cache-Control: no-store`, `Referrer-Policy: no-referrer` and `X-Robots-Tag: noindex, nofollow, noarchive`. The Preview `run_worker_first` asset route list did not include this exact path. `wrangler.preview.toml` now includes `/quote-response.html` in `run_worker_first`, ensuring the Worker applies the intended privacy headers before returning the asset. This Preview-only routing change requires deployment and a passing HTTP smoke rerun; it is not yet accepted.


## 2026-11-24 — Preview privacy routing correction deployed

The isolated Preview deployment [Run #34](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45320348541) completed successfully on commit `55585c4fa3f6927df14776eac508c2eed6efd290`. Worker version: `8f6489b1-7ef9-4423-a01a-6bdf63a48755`. The Preview configuration now routes `/quote-response.html` through Worker middleware. The deployment's source, CMS revision/SQLite and Admin MFA checks passed. The HTTP smoke rerun must still confirm the three response headers before this security check is accepted.


## 2026-11-24 — Preview HTTP smoke acceptance passed

Guarded runtime smoke [Run #20](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45320457740) passed against the deployed Preview origin. It confirmed HTTP 200 for the English homepage, Admin page, Bangla homepage and quotation-response page; HTTP 401 for unauthenticated Admin summary; HTTP 404 for Worker source, migration SQL and Wrangler configuration paths; and all three quotation-response privacy headers (`Cache-Control: no-store, max-age=0`, `Referrer-Policy: no-referrer`, `X-Robots-Tag: noindex, nofollow, noarchive`). The quotation-response route is now explicitly Worker-first in `wrangler.preview.toml`. These results accept only the listed HTTP checks; browser and end-to-end functional acceptance remain pending.
