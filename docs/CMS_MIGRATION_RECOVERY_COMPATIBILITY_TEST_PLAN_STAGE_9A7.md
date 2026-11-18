# Stage 9A.7 — Preview Migration Recovery and Compatibility Test Plan

**Status:** Planning only. No migration, SQL execution, deployment, or database modification is authorized by this document.

## 1. Purpose

Define a controlled method to resolve the Preview D1 migration-history/schema discrepancy and test the CMS schema changes without risking existing Preview data or Production.

## 2. Verified evidence

Preview D1 evidence supplied by the project owner:

- `d1_migrations` records migrations `0001_initial_schema.sql` through `0009_admin_rbac.sql`, and no later migration.
- `courses` contains the columns expected from repository migrations `0010_course_discounts_syllabus.sql` and `0011_course_syllabus_file_url.sql`.
- `courses` contains 3 rows.
- `syllabus_url IS NOT NULL` count is 0.
- Cloudinary PDF URL count in `syllabus_url` is 0.
- The seven CMS tables exist and were empty in the earlier inspection.
- CMS table creation provenance is unknown / cannot be confirmed.
- The inspected repository migration workflow applies all pending migration files in its migration directory. It must therefore not be run against Preview until the pending 0010/0011 discrepancy is resolved.

These facts establish a schema/history mismatch. They do not establish who or what created the existing columns or CMS tables, nor whether migration 0011's data transformation was previously run.

## 3. Safety boundaries

1. Work only on `current-focus-development` and the Preview D1 database.
2. Production D1, Production Worker, and `main` are out of scope.
3. Do not run `wrangler d1 migrations apply`, a deployment workflow, or any CMS migration while the discrepancy remains unresolved.
4. Do not manually insert, delete, or edit rows in `d1_migrations` as a shortcut.
5. Do not drop, recreate, or rebuild existing CMS or course tables during investigation.
6. Do not change historical migration files until all environments and their migration states have been inventoried.
7. Any disposable test database must be separate from Preview and Production, and must contain synthetic data only unless a separately approved sanitized copy process is defined.
8. Every database operation must be classified as read-only or mutating before execution. Mutating tests require explicit approval and a verified disposable target.

## 4. Phase A — Preserve and fingerprint Preview

Read-only work:

- Capture a fresh Preview D1 backup using an approved Cloudflare-supported backup/export procedure. Verify the resulting artifact is readable and restorable before relying on it.
- Record the current branch HEAD and the exact migration directory contents.
- Record `d1_migrations` in full.
- Capture `PRAGMA table_info(courses)`, relevant `sqlite_master` DDL for `courses`, and the three course counts already requested.
- Capture DDL, columns, indexes, foreign keys, row counts, and triggers for all seven CMS tables.
- Run `PRAGMA foreign_key_check`.
- Record the existing legacy table counts and CMS table counts.
- Do not export or expose course/customer personal data in project documentation.

Acceptance: a timestamped, access-controlled baseline exists and its database target is unambiguously Preview.

## 5. Phase B — Reconcile migrations 0010 and 0011

Before choosing a recovery method:

1. Read the exact committed contents of migrations 0010 and 0011 from the active development branch.
2. Compare every expected column definition, constraint, default, and data transformation against Preview's actual `sqlite_master` DDL and column metadata.
3. Inspect migration history and schema in every relevant environment that may receive these migrations. Do not assume Preview is the only environment.
4. Establish whether any environment still requires either migration.
5. Establish whether the migration runner can be safely prevented from applying unrelated pending migrations during a targeted recovery. Do not assume it can.

Recovery approaches to evaluate on paper and then in a disposable database:

- **Controlled migration-ledger reconciliation:** only consider if Cloudflare's documented migration semantics support it and exact schema/data equivalence is proven. Never update the ledger manually as an ad hoc fix.
- **Migration-file compatibility adjustment:** assess whether the existing migration files can be made safe across all supported environment states without skipping required schema or data work. Do not edit historical files until this is proven.
- **Environment-specific recovery procedure:** if Preview is an exceptional drifted environment, document a controlled one-time reconciliation that does not compromise clean installations or other environments.

No approach is selected or approved yet.

Required test cases:

- Clean database with neither 0010 nor 0011 applied.
- Database with 0010 applied but 0011 not applied.
- Database with both schema changes already present but neither migration recorded.
- Re-run / retry behavior after an interrupted or failed migration.
- Verification that the 0011 data transformation is correct and does not overwrite an existing `syllabus_file_url`.
- Verification that no unrelated pending migration is accidentally applied.

Acceptance: one recovery method is demonstrated to work in every supported starting state, with an auditable migration ledger and no unintended data loss.

## 6. Phase C — CMS schema compatibility tests

Use a separate disposable D1 database with synthetic fixtures. Recreate the verified current CMS schema there before testing changes.

Required tests:

1. Additive locale revision and publication-pointer design.
2. Same-locale integrity for the current published-version pointer, enforced by the database.
3. Atomic publication: snapshot creation, version increment, pointer update, and revision check either all succeed or all roll back.
4. Stale-draft / optimistic concurrency rejection.
5. Section type and renderer configuration preservation, including existing page-builder types: `hero`, `text`, `split`, `cards`, and `cta`.
6. `textarea` compatibility. Existing element type CHECK constraints do not include `textarea`; test a controlled table-rebuild approach under D1 foreign-key enforcement, including dependent `cms_content_values` and `cms_content_versions`.
7. Foreign-key enforcement and `PRAGMA foreign_key_check` after every rebuild scenario.
8. Soft-delete and restore semantics for sections and elements, including required structural elements and independently deleted children.
9. Snapshot immutability and public rendering exclusively from published snapshots.
10. Global EN/BN publication isolation and separation from page publication.
11. Legacy `pages`, `site_content`, and `page_styles` compatibility.
12. Rollback behavior when any statement in a publication transaction fails.

Do not assume SQLite table rebuild recipes that disable foreign keys are valid for D1. Test the exact D1-supported sequence. Confirm D1 transaction and batch semantics for the actual statements used.

Acceptance: all tests pass on the disposable database, with captured SQL, outputs, and schema checks. A failed test must leave the disposable database in a known recoverable state.

## 7. Phase D — Preview change proposal

Only after Phases A–C pass:

- Prepare a migration-by-migration execution plan with exact file names and order.
- Identify whether any Preview-only reconciliation is required and how it will be audited.
- Include a pre-change backup, post-change schema fingerprint, foreign-key check, migration ledger check, course row/count checks, legacy table checks, and CMS table checks.
- Define a stop condition for any unexpected schema, migration-history, row-count, or foreign-key result.
- Present the complete plan for explicit approval before any Preview mutation.

Production remains excluded and requires a separate future review and explicit authorization.

## 8. Stop conditions

Stop without applying changes if:

- The exact 0010/0011 definitions cannot be reconciled with Preview.
- Any supported environment has an incompatible migration state.
- A safe, repeatable ledger-reconciliation method is not established.
- The disposable D1 tests cannot demonstrate the required foreign-key, rebuild, and transaction behavior.
- A backup cannot be verified.
- The migration workflow would apply unrelated pending migrations unexpectedly.
- Any data discrepancy appears.

## 9. Current decision

**Migration execution is not approved.**

The next permitted work is read-only repository/environment inventory and disposable-database test design. No Preview or Production mutation is authorized by this plan.
