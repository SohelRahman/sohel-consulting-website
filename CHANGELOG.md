# Changelog

## 2026-11-16 — Role-based dashboard access
- Added a database-backed `admin_users` account model with Admin and User roles and granular module permissions.
- Replaced the single shared administrator login path with salted PBKDF2 password hashes and signed user-bound sessions; configured Worker administrator credentials provision the initial Admin account on first successful login after migration.
- Added server-side permission enforcement for dashboard API modules, account management endpoints, account disable/password reset/role updates and protection against removing the last active Admin.
- Added an Admin-only User Access section to the dashboard with account creation, role assignment, module permissions, activation and password reset controls.
- Added self-service password changes for authenticated dashboard accounts, with session renewal; administrator password resets revoke the target account's existing sessions using a database-backed session version.
- Added migration `0009_admin_rbac.sql`. It must be applied to the dedicated Preview D1 database before testing the new login flow. Existing sessions must sign in again.
- Production database, Production secrets and Production deployment were not changed.

## 2026-11-16 — Project status update
- Updated the master ChatGPT context to record the user's confirmation that privacy/analytics, security, UI/UX/accessibility, SEO/performance and business-content workstreams are complete.
- Reprioritized remaining work around full Preview browser QA, test automation, API contract documentation and release administration.
- Recorded that these completion statuses are user-reported and have not been independently re-audited in this documentation update; no Production deployment or environment change was performed.

## 2026-11-16

### Master project context prompt
- Added `docs/CHATGPT_PROJECT_CONTEXT.md` as the canonical reusable context and handover prompt for new ChatGPT sessions.
- Consolidated business objectives, feature scope, architecture, environment boundaries, database/API inventory, completed capabilities, open verification gaps, pending work and release controls.
- Added an explicit maintenance rule to keep the prompt synchronized with future project changes.

All notable project changes should be recorded here. Entries describe repository changes and verification status; they do not imply Production deployment.

## 2026-11-15

### Development branch documentation baseline
- Added architecture, development, database, API, configuration, deployment, testing and maintenance documentation.
- Documented current Worker/D1/Cloudflare architecture and environment separation.
- Recorded the migration inventory through `0008_analytics.sql`.
- Recorded the current API route inventory from `src/worker.js`.
- Added a documentation maintenance rule for future code and configuration changes.

### Previously completed development work
- Added bilingual cookie-consent preferences and gated optional first-party analytics.
- Improved responsive navigation across English and Bangla pages.
- Improved chat accessibility and keyboard behavior.
- Added accessibility, metadata and performance-related frontend improvements.
- Standardized the refund policy navigation.
- Development validation workflow passed on commit `16f4cbb7dc0d440b99d17c5c6a831a79ad576293` according to the project handover record.

### Known verification gaps
- Full browser-based Preview QA has not been completed.
- Consent reject/withdraw/re-accept behavior needs manual verification; a possible analytics re-consent restart issue was identified for follow-up.
- Cross-browser, responsive, form, chat, admin and Cloudinary end-to-end checks remain outstanding.
- Production deployment has not been authorized.

## 2026-11-15 — Version control and release governance
- Added branch, pull-request, commit-message and Semantic Versioning guidance.
- Documented Production release gates, database migration controls, rollback and hotfix procedures.
- Added release governance checks to the deployment checklist and README index.
- Updated the Production deployment workflow to target the GitHub Environment named `production`; required reviewers and branch restrictions still need to be configured in repository settings.
