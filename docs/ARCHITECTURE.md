# Architecture

## System overview

The application is a bilingual English/Bangla consulting and professional-training website.

- **Presentation:** Static HTML pages, shared CSS and browser JavaScript.
- **Runtime/API:** Cloudflare Worker implemented in `src/worker.js`.
- **Static asset delivery:** Cloudflare Workers Static Assets, exposed to the Worker through the `ASSETS` binding.
- **Relational data:** Cloudflare D1, exposed as `env.DB`.
- **Media storage:** Cloudinary integration for administrator-managed media.
- **Automation:** GitHub Actions for development validation, Preview secret configuration and manually triggered Production deployment.

The Worker handles `/api/*`, selected dynamic page routes and administrative operations. Other requests are passed to the static-assets binding.

## Request flow

1. A browser requests an English or Bangla page.
2. Cloudflare serves the static HTML/CSS/JS assets.
3. Browser JavaScript calls the Worker API for dynamic content and form operations.
4. The Worker validates the request, applies authentication/rate-limit checks where applicable, and reads or writes D1.
5. The Worker returns JSON responses; the browser updates the page.

## Main runtime bindings

| Binding | Purpose |
| --- | --- |
| `ASSETS` | Static website assets |
| `DB` | D1 database |

The Worker also uses encrypted runtime secrets. See [Configuration](CONFIGURATION.md).

## Security boundaries

- Administrator endpoints are protected by a signed session cookie.
- Mutating administrator requests require same-origin validation.
- Public write endpoints use rate limiting.
- Rate-limit identifiers are derived from a hash; raw client IP addresses are not stored in the rate-limit table.
- Chat visitor tokens and analytics visitor identifiers are hashed before database storage.
- Analytics is intended to run only after optional analytics consent.
- Secret values must never be committed to Git.

These are implementation notes, not a substitute for a security audit.

## Environment isolation

Development uses the `current-focus-development` branch and its Worker Preview configuration. Preview must use the dedicated Preview D1 database. Production uses a separate D1 database and must not be used for development or testing.

See [Deployment](DEPLOYMENT.md) before changing Cloudflare resources.


## Proposed CMS architecture (planning only)

The website-wide CMS is a planned extension, not part of the current implemented architecture.

The proposed design adds a CMS content-resolution and administration layer to the existing Cloudflare Worker/D1 application:
- The existing static website and page templates remain responsible for presentation.
- The Worker remains the API entry point and enforces session authentication, RBAC, validation and publication transactions.
- Proposed CMS records separate logical pages, language-specific page records, sections, elements, default/draft/published values and version snapshots.
- Public page delivery reads published values only.
- Admin preview reads draft values only after authorization.
- English and Bangla are separate publication scopes.
- Existing `pages`, `site_content` and `page_styles` remain compatible during gradual page-by-page migration.
- Courses, registrations, inquiries, media assets, chat and analytics remain separate operational domains.

This proposal depends on Stage 6 schema approval and Preview D1 verification. It must not be interpreted as implemented or as authorization to create tables or change public rendering. See [CMS Admin UI and workflow specification](CMS_ADMIN_UI_WORKFLOW.md), [API Reference](API.md) and [Database Reference](DATABASE.md).
