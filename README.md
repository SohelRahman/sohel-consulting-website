# Sohel Rahman — Consulting & Professional Training

Bilingual English/Bangla website with consulting pages, course registration, inquiry intake and a protected administrator dashboard.

## Current architecture

- Static website assets served by Cloudflare Workers.
- Worker API in `src/worker.js`.
- Cloudflare D1 relational database.
- Database schema and seed courses in `migrations/0001_initial_schema.sql`.
- Administrator interface at `/admin.html`.
- Online payments are intentionally not integrated yet.

## Main pages

- `index.html`, `services.html`, `training.html`, `about.html`, `case-studies.html`, `contact.html`
- `register.html`, `faq.html`, `privacy.html`, `terms.html`, `refund.html`
- Bangla pages are provided under `/bn/`.
- `404.html` provides the not-found page.

## Cloudflare resources and environment isolation

The production D1 database `consulting-db` is configured in `wrangler.toml` with binding `DB`. The production database ID is configured only in the top-level `d1_databases` binding.

Worker Previews use the separate `consulting-preview-db` database ID under the `previews.d1_databases` binding. Do not point a Preview at the production database.

The Worker uses the static assets binding `ASSETS` and the D1 binding `DB`. The `previews.vars.ENVIRONMENT` value marks Preview requests for diagnostics; it is not a secret.

### One-time Cloudflare Worker Previews setup

This repository is prepared for Cloudflare Worker Previews, but the Cloudflare dashboard still needs the one-time migration for this existing Git-connected Worker:

1. In Cloudflare, open **Workers & Pages → consulting → Settings → Builds**.
2. Find the **Set up Worker Previews** banner and start the setup.
3. Review the Preview configuration. The Preview command must be `npx wrangler preview`.
4. Complete **Switch to Worker Previews** only after confirming that the Preview D1 binding points to `consulting-preview-db`, not the production database.
5. After the switch, configure Preview runtime secrets in **Settings → Variables and Secrets → Previews Base**. Add `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `SESSION_SECRET` as encrypted secrets. Re-enter secret values; build-time secrets are not runtime secrets.
6. Re-deploy/update the Preview branch so the new Preview receives its runtime configuration.

Cloudflare documents that the legacy-to-Worker-Previews switch cannot be reversed. Do not switch until the Preview database binding and secret plan have been checked. Production settings remain separate; do not edit or remove Production secrets as part of Preview setup.

Preview secrets cannot be stored in `wrangler.toml` or committed to Git. Cloudflare's Wrangler CLI also supports setting them with `npx wrangler preview base-config secret put SECRET_NAME`, but never put secret values in source files, commit history, issue comments or chat.

## Manual production deployment through GitHub Actions

The workflow at `.github/workflows/deploy-cloudflare.yml` is deliberately manual. It only deploys when it is run from the `main` branch; it does not deploy on every push or pull request.

Before using it:

1. Create a Cloudflare API token for CI/CD. Give it the Workers **Editor** role scoped to the existing `consulting` Worker only, if the Cloudflare account UI offers that resource scope. Do not grant account-wide Admin access. Cloudflare's current guidance: https://developers.cloudflare.com/workers/authorization/workers/ and https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/.
2. In GitHub, open **Settings → Secrets and variables → Actions** for this repository.
3. Add repository secrets named `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. Paste the token and account ID into GitHub's secret-value fields. Never commit either value to the repository or paste them into chat.
4. Merge the reviewed development pull request into `main` only after the application has passed review and testing.
5. In GitHub, open **Actions → Deploy Cloudflare Worker → Run workflow**. Select `main` and start the workflow. The workflow will deploy the Worker and static assets to the existing `consulting` Worker.

The deployment token is for GitHub Actions deployment only. It is not the application's runtime secrets.

## Worker runtime secrets

After the Worker script has been deployed, configure these three encrypted secrets in Cloudflare under the Worker's **Runtime → Variables and Secrets** settings:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `SESSION_SECRET`

For Worker Previews, configure the secrets separately under **Previews Base** (or for one specific Preview). Build-time secrets under **Builds → Variables and secrets** are only available during the build and are not available to the Worker at runtime.

Use a unique administrator password and a long random session secret. Do not put these values in GitHub source files or share them in chat. These secrets are required for administrator login.

## Database migration

The initial D1 migration `0001_initial_schema.sql` was applied to `consulting-db`. Migration `0002_rate_limits.sql` is included in this branch. Confirm the migration status separately for both the production and Preview databases before deploying updated Worker code. Do not apply Preview migrations to the production database or vice versa.

## Current API routes

- `GET /api/health`
- `GET /api/courses`
- `POST /api/registrations`
- `POST /api/inquiries`
- `POST /api/admin/login`
- `POST /api/admin/logout`
- `GET /api/admin/summary`
- `GET /api/admin/courses`
- `POST /api/admin/courses`
- `PATCH /api/admin/courses/:id/status`
- `GET /api/admin/registrations`
- `PATCH /api/admin/registrations/:id`
- `PATCH /api/admin/registrations/:id/quote`
- `PATCH /api/admin/registrations/:id/enrollment`
- `GET /api/admin/inquiries`
- `PATCH /api/admin/inquiries/:id`

## Payment status

No payment gateway is connected. Registration records use a `not_configured` payment status. Gateway selection, merchant onboarding, payment initiation and server-side transaction verification are a later phase after the website is fully developed and tested.

## Before public launch

- Replace the LinkedIn placeholder with the actual profile URL.
- Confirm biography, exact degree titles, employment history and case-study details.
- Review privacy, terms and refund drafts for the actual business and applicable legal requirements.
- Confirm course titles, schedules, delivery availability and fee amounts.
- Confirm migrations are applied to the intended database only.
- Configure Worker runtime secrets in Production and separately in Previews.
- Run end-to-end tests in English and Bangla, including registration, inquiry intake and administrator actions.

Never publish unconfirmed client names, project outcomes, prices or credentials.
