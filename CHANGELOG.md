## 2026-11-18 — Stage 9A.3 Preview D1 evidence review (partial)
- Recorded user-supplied Preview query results: foreign-key enforcement returned 1, no foreign-key violation rows were displayed, and legacy row counts were pages=1, site_content=4, page_styles=1.
- Identified that all seven CMS tables already exist in Preview D1 even though the current development-branch migration directory contains no CMS migration file (migrations 0001–0011 only). The d1_migrations result was not supplied, so the origin/applied migration history remains unknown.
- Compared actual Preview CMS definitions with the proposed Stage 9A schema and documented material differences: missing section renderer type/configuration, missing textarea content type, mutable published_value, and missing locale draft/publication revisions/current published pointer, among other field-name/version-history differences.
- Stage 9A.3 remains partially verified. Do not apply the proposed schema as fresh-table DDL or drop/replace Preview CMS tables. Obtain migration history and inspect CMS data and Worker/API dependencies before proposing a compatibility migration.
- Documentation-only update; no D1 data, CMS code, migration or Production resource was changed.

## 2026-11-18 — Stage 9A.4 final CMS schema review
- Added `docs/CMS_FINAL_SCHEMA_REVIEW_STAGE_9A4.md` with the final design review of the seven-table additive CMS model, publication/concurrency invariants, legacy compatibility conditions and remaining implementation gates.
- Accepted the seven-table model as the design direction, subject to Preview D1 evidence review and final route, Global fallback/cache and D1 transaction/FK decisions. The schema is not approved for migration.
- The user reported successful execution of all four Stage 9A.3 read-only queries, but the result sets have not been supplied; actual Preview migration history, table definitions, row counts and foreign-key integrity therefore remain unverified.
- Documentation-only update on `current-focus-development`. No CMS code, migration SQL, D1 data, Preview deployment or Production resource was changed. Next gate: inspect Stage 9A.3 outputs and proceed to Stage 9A.5 explicit schema approval only after verification.

## 2026-11-18 — Stage 9A.1–9A.2 revised CMS schema and integrity review
- Added `docs/CMS_SCHEMA_TABLE_SPEC_STAGE_9A.md` with a complete proposed table-level definition for all seven CMS tables, including column types, nullability, defaults, checks, primary/foreign/unique keys, indexes, snapshot requirements and relationships.
- Documented immutable published snapshots, page/language-scoped optimistic concurrency, same-locale publication pointer integrity, soft-delete/restore rules, `textarea` preservation, page-builder section types/configuration, legacy mapping and reuse of `audit_logs`.
- Recorded Stage 9A.2 integrity findings and D1/SQLite compatibility gates. Confirmed Global Option A remains independently published for EN and BN.
- Updated the database reference and Stage 9A review document. Documentation-only change on `current-focus-development`; no CMS code, migration SQL, D1 data, Preview deployment or Production resource was changed.
- Next stage: Stage 9A.3 read-only Preview D1 verification. Schema approval and implementation remain pending.

## 2026-11-18 — Stage 9A global publication decision
- Recorded the user's selection of Option A: Global English and Bangla content each have independent Draft, Preview, Publish and Version History workflows.
- Revised the Stage 9A schema review and database reference: one logical Global page with separate locale records, independent publication/version pointers, isolated page/global publish operations, and public composition from the current published page and Global snapshots.
- Specified that Global Draft is never public, Global content is not embedded in page snapshots, and successful Global publication must invalidate/revalidate affected public responses.
- Updated the master project handover. Documentation-only change; no migration, D1 data, Worker code, Preview deployment or Production resource was changed. Full schema approval and Preview D1 verification remain pending.

## 2026-11-18 — Stage 9A CMS schema review
- Reviewed the proposed seven-table CMS schema against existing page-builder, site-content, page-style, audit-log and RBAC migrations.
- Recorded required revisions for section renderer compatibility, draft/published structure isolation, current published-version tracking and concurrency, structural audit coverage, section deletion/restoration, textarea compatibility and global-content publication.
- Added `docs/CMS_SCHEMA_REVIEW_STAGE_9A.md` and linked it from the database reference, master handover and README.
- Review outcome: current proposed SQL is not approved for migration. User decision on global publication and Preview D1 verification remain pending.
- Documentation-only update. No CMS code, migration, D1 data or Production resource was changed.

## 2026-11-18 — CMS planning documentation (Stages 6–8)
- Added the Stage 8 CMS Admin Panel UI and workflow specification.
- Recorded the user's confirmed Stage 7 decisions: page-and-language scoped publishing; automatic registration through approved CMS/page-builder workflows; historical restore into Draft; deleted elements removed publicly at the next successful page publication; gradual legacy integration.
- Updated the API reference with proposed CMS endpoints and security/publication rules, explicitly marked not implemented.
- Updated the database reference with the proposed seven-table CMS schema and outstanding approval/Preview D1 verification gates.
- Added a future CMS acceptance test matrix and updated the master ChatGPT project handover and README documentation index.
- Documentation-only change. No CMS code, migration, database records, Preview deployment or Production resources were changed. Stage 6 schema approval and Preview D1 verification remain outstanding.

## 2026-11-18 — Cloudinary course syllabus uploads (development)
- Added signed Cloudinary upload support for course syllabus PDFs via `raw/upload` and JPG/PNG/WebP images via `image/upload`, using the existing `sohel-consulting` folder and Cloudinary credentials. Standard PDFs use Cloudinary's image asset type so they can be delivered and transformed like other PDFs.
- Added browser-side file validation (PDF up to 10 MB; images up to 3 MB), upload progress/error feedback, and automatic population of the course syllabus URL field. The link is persisted when the course is saved.
- Updated English and Bangla course detail pages to display saved syllabus links; the Bangla page now also displays active course discounts.
- Updated the existing Media Library upload client to send the signed `allowed_formats` parameter.
- Added source-contract checks and Preview QA checklist items; documented the upload API contract.
- No D1 migration was added. Preview deployment and live PDF/image upload tests remain pending. Production branch, database, Worker and secrets were not changed.

## 2026-11-16 — Preview D1 migration workflow
- Added a manually triggered GitHub Actions workflow restricted to `current-focus-development` for Preview D1 migration listing, application and post-application verification.
- Added a guard that checks the configured Preview D1 UUID, resolves the database name through Cloudflare, and generates a temporary Wrangler config containing only the Preview D1 binding before remote migration commands.
- Documented the required Cloudflare GitHub Actions secrets and manual execution procedure.
- This workflow has been committed but has not yet been run. Migration state and application remain unverified; Production was not targeted.

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
## 2026-11-18 — Stage 9A.5 final CMS migration specification

- Added `docs/CMS_MIGRATION_SPECIFICATION_STAGE_9A5.md` with the verified Preview CMS schema, named indexes, all seven foreign-key relationships, legacy content mapping, target publication controls, migration phases, recovery plan, validation SQL and Preview acceptance criteria.
- Recorded Preview baseline: legacy `pages=1`, `site_content=4`, `page_styles=1`; all seven CMS tables are empty.
- Recorded legacy mapping: Corporate Training remains Draft with no published JSON; four published homepage hero values map to Home EN, including preservation of the `textarea` type; homepage styles remain in `page_styles`; homepage-specific content is not Global content.
- Confirmed all seven CMS foreign-key relationships from individual Preview PRAGMA outputs and table DDL. Existing delete behavior is `RESTRICT`.
- Migration provenance remains unresolved. The specification is not executable migration SQL and does not authorize a migration.
- Documentation-only change on `current-focus-development`. No CMS code, migration SQL, D1 data, Preview deployment or Production resource was changed.
## 2026-11-18 — Stage 9A.6 CMS provenance and technical feasibility review

- Added `docs/CMS_PROVENANCE_FEASIBILITY_REVIEW_STAGE_9A6.md` documenting repository migration inventory, workflow behavior, unresolved CMS table provenance, D1/SQLite feasibility and required read-only follow-up evidence.
- Confirmed no tracked CMS schema migration exists in the inspected development-branch recursive tree. The Preview diagnostic workflows inspect schema and run `EXPLAIN`; they do not create CMS tables.
- Identified a migration workflow risk: the existing Preview workflow applies all pending migration files. The last user-supplied Preview history listed `0001`–`0009`, while repository migrations `0010` and `0011` exist. Migration `0011` updates matching Cloudinary PDF syllabus URLs. Do not run the workflow until this discrepancy and course-data effects are reconciled.
- Reviewed official D1 documentation for foreign-key enforcement/defer behavior, migrations and transactional batch operations. Exact table-rebuild and same-locale pointer enforcement still require disposable D1 tests.
- Documentation-only review on `current-focus-development`. No migration SQL, D1 data, application code, Preview deployment or Production resource was changed.
