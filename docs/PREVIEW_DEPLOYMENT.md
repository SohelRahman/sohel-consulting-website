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
