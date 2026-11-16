# Deployment Guide

Read the [Version Control and Release Management Policy](VERSION_CONTROL_RELEASE.md) before preparing a release. It defines branch protection, PR approvals, version tags, Production release gates and rollback records.

## Environment policy

- Development branch: `current-focus-development`
- Production branch: `main`
- Worker: `consulting`
- Preview uses its dedicated D1 database.
- Production uses `consulting-db`.

Development and acceptance testing must happen in Preview. Production changes require explicit approval.

## Development validation

The GitHub Actions workflow `.github/workflows/validate-development.yml` runs on pushes to the development branch and qualifying pull requests targeting `main`. It checks Worker JavaScript syntax, shared browser JavaScript syntax and site HTML/local links/inline scripts.

A passing workflow is not proof of full browser QA.

Before Preview deployment, apply D1 migrations using the manually triggered workflow `.github/workflows/migrate-preview-d1.yml` from `current-focus-development`. Confirm that the workflow verifies the dedicated Preview database ID, generates a temporary config containing only that database, and completes its post-migration listing. The workflow requires `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` GitHub Actions secrets. It must not be run from `main`.

## Preview setup and verification

1. Confirm Cloudflare Worker Previews are enabled for the Worker.
2. Confirm Preview D1 binding uses the dedicated Preview database ID in `wrangler.toml`.
3. Configure Preview runtime secrets separately from Production.
4. Confirm Preview migrations are applied.
5. Deploy/update the development Preview using the configured Cloudflare workflow.
6. Open the Preview URL and test public pages, forms, chat, consent, administrator flows and media integration.
7. Record failures and unresolved checks.

The repository includes a manually triggered Preview secrets workflow. Review its YAML and required GitHub secrets before running it. It is intended to configure Preview, not Production.

## Production deployment (approval required)

The Production deployment job references the GitHub Environment named `production`. An authorized repository administrator must create/configure this environment in **Settings → Environments** and add required reviewers and any deployment restrictions. Without those environment protection rules, the environment reference alone does not enforce a human approval gate.

The workflow `.github/workflows/deploy-cloudflare.yml` is manually triggered and contains a branch guard requiring `main`. It deploys the Worker and static assets using Wrangler.

Before a Production release:
- Development changes must be reviewed and accepted.
- The pull request must be reviewed and merged by an authorized person.
- Production D1 migration state and backups must be checked.
- Production runtime secrets and Cloudflare settings must be verified.
- Business content, policies, analytics and payment status must be approved.
- The release plan and rollback approach must be approved.

Do not merge a pull request, trigger Production deployment or modify Production resources without explicit user approval.

## Rollback

The exact rollback method depends on the Cloudflare deployment/version state and any database migrations included in the release. Before deployment, identify the previous Worker version and whether the migration is backward-compatible. Do not assume rolling back Worker code reverses D1 schema/data changes. For destructive database changes, prepare a tested recovery plan before deployment.
