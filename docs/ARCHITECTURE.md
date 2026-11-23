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

## Implemented static-page CMS

The static-page CMS extends the existing architecture without replacing static page templates or operational modules.

- `assets/cms.js` discovers eligible static content elements and assigns deterministic content keys based on tag order.
- Public pages request published content from `GET /api/cms-content`.
- The Admin Dashboard edits draft values through the protected CMS API.
- The on-page editor is activated with `?cmsKeys=1`; clicking a highlighted eligible element opens an inline panel and saves through the same draft endpoint as the Dashboard.
- Authenticated draft preview is activated with `?cmsPreview=1`.
- `cms_content` stores page/language/key draft and published values.
- `cms_static_content_versions` stores version snapshots.
- English, Bangla and Global are separate content contexts.

The CMS intentionally excludes forms, dynamic course records, registration records, chat, analytics and other interactive/operational data. It does not replace the custom Pages builder or Page Styles module. See [CMS implementation](WEBSITE_CMS_IMPLEMENTATION.md) and [API reference](API.md).


## Administrator authentication and MFA status

The current development source implements password-only administrator authentication. Password hashes use PBKDF2-HMAC-SHA-256; signed eight-hour sessions are carried in an HttpOnly, Secure, SameSite=Strict cookie and checked against D1 account state and `session_version`. Admin mutations require same-origin validation and Worker-side RBAC.

**MFA is not implemented yet.** Do not describe administrator login as MFA-protected. The planned TOTP enrollment, short-lived challenge, encrypted seed storage, replay prevention and recovery-code design is documented in [Administrator Authentication and MFA Security Assessment](ADMIN_AUTH_MFA_SECURITY_ASSESSMENT.md).

## Administrator MFA enforcement

The administrator API now requires a completed MFA credential for every authenticated session. Password verification issues only a short-lived, purpose-bound enrollment or verification challenge. A full eight-hour session is issued only after TOTP enrollment or second-factor verification.

TOTP secrets are encrypted with AES-256-GCM using the dedicated `MFA_ENCRYPTION_KEY` secret and user-ID-bound additional authenticated data. A conditional D1 counter update rejects TOTP replay. Recovery codes are individually salted and hashed, then consumed once. MFA enrollment increments the account session version to invalidate pre-MFA sessions. See [Configuration and Secrets](CONFIGURATION.md), [Testing and QA](TESTING.md), and the [MFA security assessment](ADMIN_AUTH_MFA_SECURITY_ASSESSMENT.md).

Migration `0019_admin_mfa.sql` and a separate Preview runtime encryption secret are required before deploying the new Worker. Neither has been applied/configured by the source implementation change.
