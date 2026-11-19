# Development Guide

## Repository

- Repository: `SohelRahman/sohel-consulting-website`
- Active development branch: `current-focus-development`
- Production branch: `main`
- Worker entry point: `src/worker.js`
- Shared browser code: `assets/site.js`
- Shared styles: `assets/site.css`
- Database migrations: `migrations/`

## Page structure

English pages are at the repository root. Bangla equivalents are under `bn/`. The administrator interface is `admin.html`. The site also contains shared assets, migration scripts, validation scripts and GitHub Actions workflows.

## Local development

The project uses Cloudflare Wrangler 4. A local Node.js 22 environment is used by the CI workflow.

1. Clone the repository and check out `current-focus-development`.
2. Install/use a supported Node.js 22 runtime.
3. Review `wrangler.toml` before running any command that accesses Cloudflare resources.
4. Confirm the configured D1 target is the intended development/Preview database.
5. Configure local secrets using Wrangler's local secret mechanism; never commit them.
6. Run the validation commands below before committing.

Do not run migration or deployment commands against Production while developing.

## Validation commands

The current GitHub Actions workflow runs:

```sh
node --input-type=module --check < src/worker.js
node --check assets/site.js
node scripts/validate-site.mjs
```

These checks cover JavaScript syntax and the repository's HTML/local-link/inline-script validation. They do not replace browser-based functional, responsive, accessibility or performance testing.

## Change workflow

1. Work only on `current-focus-development`.
2. Inspect existing implementation before editing.
3. Keep changes focused and avoid unrelated refactoring.
4. Update the relevant documentation in the same change.
5. Add or update automated tests when behavior changes.
6. Run all available validation.
7. Record known limitations and manual QA still required.
8. Review the diff and CI result before considering the change ready.

## Coding conventions

- Keep browser code compatible with the site's current vanilla JavaScript approach unless a deliberate architecture change is approved.
- Keep Worker API validation on the server; never rely only on browser-side validation.
- Use parameterized D1 statements.
- Keep English and Bangla user-facing experiences aligned.
- Do not expose internal files such as `src/`, `migrations/` or Wrangler configuration through public routes.
- Do not add paid external services or APIs without approval.

## Documentation rule

Any change to routes, database schema, secrets, environment configuration, user-facing behavior, deployment or testing must update the corresponding document and `CHANGELOG.md`.


### CMS planning and implementation gate

Stages 6–8 CMS work is currently documentation/planning only. Before implementation:
1. Read `docs/CHATGPT_PROJECT_CONTEXT.md` and `docs/CMS_ADMIN_UI_WORKFLOW.md`.
2. Obtain explicit Stage 6 schema approval.
3. Verify the Preview D1 migration history, schema, relevant record counts and foreign keys.
4. Re-inspect the current Worker, Admin Panel and page-builder implementation.
5. Implement and test only on `current-focus-development` and the dedicated Preview D1 database.
6. Preserve existing public appearance, existing APIs and operational modules during gradual migration.
7. Do not touch Production without separate explicit approval.

Do not treat proposed CMS endpoints, tables or permissions in the planning documents as implemented.
