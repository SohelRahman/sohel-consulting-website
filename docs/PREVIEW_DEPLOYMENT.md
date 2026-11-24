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
