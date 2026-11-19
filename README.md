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

### Configure Preview secrets through GitHub Actions

The workflow `.github/workflows/configure-preview-secrets.yml` configures both the shared Previews Base and the existing `current-focus-development` Preview. It only runs when manually started from `current-focus-development`; it cannot run from `main`.

In the repository's **Settings → Secrets and variables → Actions**, add these repository secrets:

- `CLOUDFLARE_API_TOKEN` — a Cloudflare API token with permission to manage Worker Preview secrets.
- `CLOUDFLARE_ACCOUNT_ID` — the Cloudflare account ID.
- `PREVIEW_ADMIN_EMAIL` — the administrator email to use in Preview.
- `PREVIEW_ADMIN_PASSWORD` — a unique Preview-only password.
- `PREVIEW_SESSION_SECRET` — a long, randomly generated Preview-only session secret.

Do not reuse Production administrator credentials for Preview. Never place secret values in source code, workflow YAML, commit messages, or chat.

Then open **Actions → Configure Cloudflare Preview runtime secrets → Run workflow** and select `current-focus-development`. Review the run logs for success. The workflow sends secret values to Wrangler through standard input; it does not print them in the workflow commands.

This workflow requires the Cloudflare API token and account ID to be configured as GitHub Actions secrets. It does not change Production Worker secrets or deploy to Production.

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

## Bilingual static-page CMS

The CMS manages approved static website content for all 12 English pages, their 12 Bangla counterparts, and shared header/footer content in a separate Global context. It uses the existing static HTML pages and Worker/D1 architecture.

Editing options:
- **Dashboard editor:** select page and language, inspect or enter a content key, edit the value, and save a draft.
- **On-page editor:** open a page with `?cmsKeys=1`, click a highlighted eligible element, and edit it in the inline panel. The editor shows the content key and saves through the same CMS draft API.

Both paths save drafts only. Public content changes only after an authorized administrator publishes the selected page/language. Draft preview requires an authenticated admin session. The CMS does not replace Courses, Registration, Page Styles, Media Library, custom Pages, chat or other operational modules.

Implementation and operational limits: [Bilingual CMS implementation notes](docs/WEBSITE_CMS_IMPLEMENTATION.md), [CMS Admin UI workflow](docs/CMS_ADMIN_UI_WORKFLOW.md), [CMS API routes](docs/API.md#static-page-cms).

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


## Developer documentation

- [Stage 9A CMS schema review](docs/CMS_SCHEMA_REVIEW_STAGE_9A.md) — review findings and required schema revisions.
- [Stage 9A.4 final CMS schema review](docs/CMS_FINAL_SCHEMA_REVIEW_STAGE_9A4.md) — conditional design acceptance, unresolved Preview evidence and migration approval gates.
- [CMS Admin UI and workflow specification](docs/CMS_ADMIN_UI_WORKFLOW.md) — original Stage 8 requirements, implementation mapping, and acceptance tests.
- [Master ChatGPT project context](docs/CHATGPT_PROJECT_CONTEXT.md) — current project handover context and development/release rules.
- [Development handover prompt](docs/DEVELOPMENT_HANDOVER_PROMPT.md) — reusable instructions for continuing work in a new ChatGPT conversation.

The maintained technical documentation is in [`docs/`](docs/):

- [Architecture](docs/ARCHITECTURE.md) — application components, request flow and security boundaries.
- [Development guide](docs/DEVELOPMENT.md) — repository structure, local setup and development workflow.
- [Database reference](docs/DATABASE.md) — D1 environments, migration history and table responsibilities.
- [API reference](docs/API.md) — public and administrator route inventory.
- [Configuration and secrets](docs/CONFIGURATION.md) — bindings, runtime secrets and environment isolation.
- [Deployment guide](docs/DEPLOYMENT.md) — Preview validation and Production release controls.
- [Version control and release policy](docs/VERSION_CONTROL_RELEASE.md) — branch rules, pull requests, semantic versioning, approvals, release gates and rollback.
- [Testing and QA](docs/TESTING.md) — automated checks and manual test cases.
- [Maintenance runbook](docs/MAINTENANCE.md) — troubleshooting, data protection and incident response.
- [Changelog](CHANGELOG.md) — significant development and maintenance history.

**Maintenance requirement:** Update the relevant documentation and changelog in the same development change whenever code, APIs, database schema, configuration, security behavior, testing or deployment procedures change. Documentation must describe verified implementation; unresolved details must be marked as pending verification.

> **Current CMS status — 2026-11-19**
>
> The bilingual static-page CMS is implemented on `current-focus-development`. Preview D1 migration 0012 was applied manually by the user and the user-reported verification showed four imported English homepage records, four published history rows, all six legacy CMS tables preserved, and migration ledger entries 0001–0012. These are user-supplied D1 Console results, not a direct database inspection by the repository maintainer.
>
> The CMS supports 12 English and 12 Bangla static pages plus a separate Global context. The Admin Dashboard supports page/language selection, draft save, page/language publish, authenticated draft preview, key inspection, soft archive/restore, version history and restore-to-draft. The public binding layer targets eligible static text nodes, image sources, links and SEO metadata; it deliberately excludes forms, dynamically generated course data, chat and other interactive controls.
>
> **Two editing paths:** (1) Dashboard editing by selecting or entering a content key; (2) on-page editing from the `?cmsKeys=1` inspector by clicking a highlighted element and using the inline editor panel. Both save drafts through the same authenticated `POST /api/admin/cms/save` endpoint. Inline editing was committed in `assets/cms.js` at commit `754507b0a28290cc972929f61bef891fbe9b880c`; it still requires a fresh Preview deployment and live browser acceptance testing. A successful CI run for the final follow-up commit and live inline-editor behavior have not yet been confirmed.
>
> Do not treat the earlier Cloudflare “Ready” screenshot as deployment evidence for commit `754507b`; it showed an earlier commit. No Production deployment, migration, merge to `main`, or Production data change is authorized.
