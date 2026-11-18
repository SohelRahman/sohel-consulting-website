# Database Reference

## D1 environments

The Worker accesses D1 through the `DB` binding. The repository's Wrangler configuration defines separate Production and Preview database bindings.

| Environment | Database name | Database ID |
| --- | --- | --- |
| Production | `consulting-db` | `3a4f765a-46c2-4040-9753-36e9483893a4` |
| Preview | Dedicated Preview D1 | `e0317397-77cb-4f36-9d19-2594ff75b0c2` |

**Safety:** Never use the Production database for development, Preview testing or experiments. Verify the target before every migration command.

## Migration history

Apply migrations in ascending order using Wrangler D1 migration commands with the correct environment/configuration.

| Migration | Main objects |
| --- | --- |
| `0001_initial_schema.sql` | `courses`, `learners`, `registrations`, `inquiries`, `quotations`, `audit_logs`; initial course records |
| `0002_rate_limits.sql` | `rate_limits` and expiry index |
| `0003_site_content.sql` | `site_content` and initial homepage content |
| `0004_page_styles.sql` | `page_styles` |
| `0005_pages.sql` | `pages` and status/slug index |
| `0006_cloudinary_media.sql` | `media_assets` and creation-date index |
| `0007_chat.sql` | `chat_conversations`, `chat_messages` and indexes |
| `0008_analytics.sql` | `analytics_events` and reporting indexes |
| `0009_admin_rbac.sql` | `admin_users`, account roles, PBKDF2 password hashes, per-user permission assignments and session revocation version |

This list reflects migration files present in the development branch. The actual applied migration state must be checked independently in each D1 environment before deployment.

## Table responsibilities

- **courses:** Course catalogue, bilingual titles/summaries, delivery modes, languages, pricing configuration and active state.
- **learners:** Contact details for people registering for courses.
- **registrations:** Course registration, reference code, preferences, review status, payment status and enrollment status.
- **inquiries:** General consulting/training inquiries and workflow status.
- **quotations:** Draft and issued fee quotations associated with registrations or inquiries.
- **audit_logs:** Administrator action history.
- **rate_limits:** Hashed rate-limit keys, counters and expiry timestamps.
- **site_content:** Editable site text and publication state.
- **page_styles:** Draft and published style configuration.
- **pages:** Custom page metadata and draft/published page content.
- **media_assets:** Cloudinary asset metadata; binary media is not stored in D1.
- **chat_conversations:** Conversation token hash, language and support status.
- **chat_messages:** Visitor, bot and administrator messages.
- **analytics_events:** Limited analytics event metadata and visitor hash.
- **admin_users:** Dashboard accounts, role, salted password hash, assigned permissions, account status and session version used to revoke existing sessions after credential resets.

## Important status constraints

The schema constrains registration, payment, enrollment, inquiry, quotation, page, chat and analytics status values. Review the SQL migration before changing any status value in Worker code or the admin interface.

Payments are not integrated. The initial schema uses `not_configured` as the payment status for new registrations.

## Preview migration workflow

The repository workflow `.github/workflows/migrate-preview-d1.yml` is manually triggered from `current-focus-development`. It verifies the Preview D1 UUID in the `[previews.d1_databases]` section, looks up that exact database name through the Cloudflare API, generates a temporary Wrangler config containing only the Preview D1 binding, lists pending migrations, applies them remotely, and lists migration state again. The workflow requires the GitHub Actions secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.

The workflow is restricted to the development branch and targets the configured Preview binding only. Do not run it from `main`. A successful workflow run is the evidence that migrations were applied; merely committing this workflow does not apply any migration.

## Migration procedure

1. Review the SQL file and its compatibility with the current schema.
2. Confirm the target environment and D1 database ID.
3. Check which migrations have already been applied.
4. Back up/export data when the change warrants it.
5. Apply the migration to Preview first.
6. Verify schema and application behavior in Preview.
7. Apply to Production only through an explicitly approved release procedure.
8. Record the migration and deployment in the changelog.

Never edit an already-applied migration to change its historical effect. Add a new numbered migration instead.


## Proposed CMS schema — not implemented

Stage 6 proposed seven additive tables. This is a design proposal only; no CMS migration has been created or applied.

| Proposed table | Responsibility |
| --- | --- |
| `cms_pages` | Stable logical page identity and page type |
| `cms_page_locales` | Independent EN/BN route, title, SEO metadata and legacy page link |
| `cms_sections` | Language-specific section hierarchy, ordering and deletion protection |
| `cms_content_elements` | Element identity, content type, configuration and required/active state |
| `cms_content_values` | Immutable default, editable draft and published values |
| `cms_content_versions` | Element-level change history |
| `cms_page_versions` | Full page/language publication snapshots and version numbers |

### Proposed relationships and safeguards

- Page locale belongs to one logical page and is unique per language.
- Sections belong to a locale; elements belong to a section; values belong to an element.
- Legacy `pages` records are linked without deleting or replacing them.
- Foreign keys use restrictive deletion semantics; CMS deletion is soft-delete.
- Existing `site_content`, `page_styles` and operational tables remain intact during gradual migration.
- Default values are immutable through normal CMS operations.
- Public delivery reads published values only.
- Page publication snapshots and updates one selected page/language in one transaction.
- Historical restoration copies a snapshot into Draft; it does not directly change published content.
- A soft-deleted element remains visible on the public site until the next successful publication of its page/language, when it is excluded from the new snapshot.

### Outstanding schema and environment gates

1. User approval of the Stage 6 schema is still pending.
2. Preview D1 migration history, actual table definitions, record counts and foreign-key checks have not yet been supplied/verified.
3. Confirm SQLite/D1 JSON validation support and all referenced legacy columns before finalizing SQL.
4. Incorporate the confirmed independent global publication model (Option A) and finalize section deletion/restore semantics.
5. Create an additive migration only after the schema is approved and Preview D1 is verified.

Do not add these proposed tables to the applied migration inventory until a migration file exists and its application is verified independently in Preview and Production. Production migration requires separate explicit approval.

See [CMS Admin UI and workflow specification](CMS_ADMIN_UI_WORKFLOW.md) for the editor workflow and [API Reference](API.md) for proposed endpoints.


## Stage 9A schema review

The Stage 6 seven-table proposal has been reviewed against the repository's existing migrations. The seven-table direction is acceptable as a starting point, but the current proposed SQL is **not approved for migration**. The user confirmed Option A: Global English and Bangla each have independent Draft, Preview, Publish and Version History workflows.

Required revisions:
1. Preserve page-builder section types and renderer configuration.
2. Make published structure independent of editable draft structure; public rendering must use an immutable published page snapshot.
3. Add an explicit current published-version reference and atomic optimistic concurrency control.
4. Reuse existing `audit_logs` for structural/admin actions; version tables remain for content recovery.
5. Define safe section soft-delete/restore semantics, including child elements.
6. Preserve existing `textarea` content-type semantics during migration.
7. Implement Global as one logical `cms_pages` record with separate EN/BN locale records and independent publication/version pointers. Global publish affects only the selected Global locale; page publish does not publish Global. Public rendering composes the page's published snapshot with the currently published Global snapshot for the same language. Do not embed Global content in page snapshots; invalidate/revalidate affected public responses after Global publication.

Additional checks include D1 JSON validation support, complete snapshot contents, indexes, route compatibility and source-to-target backfill mapping.

Detailed findings and proposed migration gates: [Stage 9A CMS Schema Review](CMS_SCHEMA_REVIEW_STAGE_9A.md).

**Approval state:** Pending revisions, user decision on global publication, and Preview D1 inspection. No CMS migration has been created or applied.


### Global publication model — confirmed Option A

Global is represented by one logical `cms_pages` record with `page_type='global'` and two `cms_page_locales` records (`en`, `bn`). Each locale has independent editable content, draft state, published-version pointer, publication revision and history.

- Publish Global EN and Global BN separately.
- A page/language publish advances only that page's published version.
- A Global/language publish advances only that Global locale's published version.
- Neither publication operation modifies the other scope.
- Public rendering composes the selected page's published snapshot with the currently published Global snapshot for the same language. Draft Global content is never public.
- Global history restoration creates Draft only; publication remains separate.
- Global publication must invalidate/revalidate public responses that include the changed language. The exact cache mechanism requires implementation-time verification.

This is a design contract, not implemented SQL. See [Stage 9A review](CMS_SCHEMA_REVIEW_STAGE_9A.md).


## Stage 9A.1–9A.2 — revised table-level schema and integrity review

The detailed proposed definitions for all seven CMS tables, columns, nullability, defaults, checks, keys, relationships, indexes, snapshot contents, transaction rules and integrity findings are now recorded in [Stage 9A Revised CMS Table-Level Schema and Integrity Specification](CMS_SCHEMA_TABLE_SPEC_STAGE_9A.md).

The design retains the seven-table additive model and includes the confirmed independent Global EN/BN publication model (Option A). It preserves `textarea`, page-builder section renderer types/configuration, immutable published snapshots, draft/publication revisions, locale-scoped history, soft-delete/restore rules and reuse of `audit_logs`.

**Status:** Design proposal only; not approved for migration. No migration SQL was created, no CMS code was changed and no D1 database was accessed or modified. Stage 9A.2 identified remaining verification gates for the same-locale published-version pointer, deferred/cyclic foreign-key behavior, D1 JSON validation and transaction semantics, route uniqueness, Global pre-first-publication fallback/cache invalidation, and actual legacy data.

**Next:** Stage 9A.3 — read-only verification of the dedicated Preview D1 migration history, schema, row counts and foreign-key integrity. Production must not be accessed.


## Stage 9A.4 — final CMS schema review

The seven-table additive CMS model is conditionally accepted as the design direction. It is **not approved for executable migration SQL**.

The review records mandatory controls for immutable published snapshots, Draft/public isolation, atomic publication and optimistic concurrency, soft-delete/restore, legacy/page-builder compatibility, server-side authorization, reuse of `audit_logs`, and the confirmed independent Global EN/BN publication model.

The four Stage 9A.3 Preview D1 queries were reported as successfully executed, but their result sets have not been reviewed. Actual Preview migration history, table definitions, row counts and foreign-key integrity therefore remain unverified. Successful query execution is not evidence that the database matches the repository migrations.

Outstanding gates:
- Inspect the four Preview query result sets.
- Verify D1 JSON validation and transaction behavior and finalize same-locale published-version pointer enforcement.
- Confirm Worker route uniqueness/redirect behavior.
- Define the safe Global pre-first-publication fallback and matching-locale cache invalidation.
- Obtain explicit user approval in Stage 9A.5 before creating or applying a CMS migration.

See [Stage 9A.4 Final CMS Schema Review](CMS_FINAL_SCHEMA_REVIEW_STAGE_9A4.md). No CMS migration or implementation has been created; no D1 database or Production resource was modified.


## Preview D1 evidence update — 2026-11-18 (partial)

The user supplied read-only Preview query results showing:
- `PRAGMA foreign_keys` returned `1`.
- `PRAGMA foreign_key_check` displayed no violation rows.
- Current row counts: `pages` = 1, `site_content` = 4, `page_styles` = 1.
- All seven CMS table names already exist in Preview D1.

Important discrepancy: the current development-branch `migrations/` directory contains `0001` through `0011` and no CMS migration file, while Preview D1 already contains the seven CMS tables. The `d1_migrations` query output was not included, so the applied migration history and origin of these tables are unknown.

The observed Preview CMS schema is not the same as the proposed Stage 9A schema. Examples: `cms_sections` lacks `section_type` and `config_json`; `cms_content_elements.content_type` does not allow `textarea`; `cms_content_values` contains mutable `published_value`; and `cms_page_locales` lacks the proposed Draft/publication revision fields and current published-version pointer. Do not apply the proposed schema as a fresh-table migration or drop/replace existing CMS tables. Identify their provenance, existing data and Worker/API dependencies first.

See [Stage 9A.4 Final CMS Schema Review](CMS_FINAL_SCHEMA_REVIEW_STAGE_9A4.md) for the full comparison. Stage 9A.3 remains partially verified pending the `d1_migrations` result and CMS data/provenance review.
