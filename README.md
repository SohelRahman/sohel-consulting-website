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
- Bangla pages are currently provided under `/bn/` for Home, Consulting, Training, Registration and Contact.
- `404.html` provides the not-found page.

## Cloudflare setup required before deployment

1. Create a D1 database named `consulting-db` in the Cloudflare account.
2. Copy its database ID into `wrangler.toml`, replacing `REPLACE_WITH_CLOUDFLARE_D1_DATABASE_ID`.
3. Ensure the Worker is deployed with the D1 binding named `DB` and the static assets binding named `ASSETS`.
4. Configure these Worker secrets: `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `SESSION_SECRET`. Use a unique, strong password and a long random session secret.
5. Apply the migration to the remote database with `npx wrangler d1 migrations apply consulting-db --remote`.
6. Deploy with `npx wrangler deploy`.
7. Test `/api/health`, public course listing, registration submission, admin login and administrator status updates.

Do not publish the Worker with the placeholder D1 database ID or without setting all three administrator secrets. Do not commit secrets to GitHub.

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
- Configure D1, Worker secrets and deploy the Worker.
- Run end-to-end tests in English and Bangla.

Never publish unconfirmed client names, project outcomes, prices or credentials.
