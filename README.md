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

## Cloudflare resources

The D1 database `consulting-db` is configured in `wrangler.toml` with binding `DB`. Its initial schema migration is applied to the remote database.

The Worker uses the static assets binding `ASSETS` and the D1 binding `DB`.

## Manual production deployment through GitHub Actions

The workflow at `.github/workflows/deploy-cloudflare.yml` is deliberately manual. It only deploys when it is run from the `main` branch; it does not deploy on every push or pull request.

Before using it:

1. Create a Cloudflare API token for CI/CD. Give it the Workers **Editor** role scoped to the existing `consulting` Worker only, if the Cloudflare account UI offers that resource scope. Do not grant account-wide Admin access. Cloudflare's current guidance: https://developers.cloudflare.com/workers/authorization/workers/ and https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/.
2. In GitHub, open **Settings → Secrets and variables → Actions** for this repository.
3. Add repository secrets named `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. Paste the token and account ID into GitHub's secret-value fields. Never commit either value to the repository or paste them into chat.
4. Merge the reviewed development pull request into `main` only after the application has passed review and testing.
5. In GitHub, open **Actions → Deploy Cloudflare Worker → Run workflow**. Select `main` and start the workflow. The workflow will deploy the Worker and static assets to the existing `consulting` Worker.

The deployment token is for GitHub Actions deployment only. It is not the same as the application's runtime secrets.

## Worker runtime secrets

After the Worker script has been deployed, configure these three encrypted secrets in Cloudflare under the `consulting` Worker:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `SESSION_SECRET`

Use a unique administrator password and a long random session secret. Do not put these values in GitHub source files or share them in chat. These secrets are required for administrator login.

## Database migration

The remote D1 migration `0001_initial_schema.sql` has already been applied to `consulting-db`. Do not run it again manually unless a new migration file is added and its status is checked first.

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

## Payment status

No payment gateway is connected. Registration records use a `not_configured` payment status. Gateway selection, merchant onboarding, payment initiation and server-side transaction verification are a later phase after the website is fully developed and tested.

## Before public launch

- Replace the LinkedIn placeholder with the actual profile URL.
- Confirm biography, exact degree titles, employment history and case-study details.
- Review privacy, terms and refund drafts for the actual business and applicable legal requirements.
- Confirm course titles, schedules, delivery availability and fee amounts.
- Configure the three Worker runtime secrets.
- Run end-to-end tests in English and Bangla, including registration, inquiry intake and administrator actions.

Never publish unconfirmed client names, project outcomes, prices or credentials.
