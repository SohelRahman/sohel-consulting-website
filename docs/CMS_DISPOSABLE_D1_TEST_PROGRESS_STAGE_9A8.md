# Stage 9A.8 — Disposable D1 Compatibility Testing Progress

**Status:** In progress. This document records user-reported SQL execution and query output. The assistant does not have direct access to the D1 Console and has not independently executed or inspected the database.

## 1. Scope and safety boundary

- Intended target: disposable D1 database `consulting-cms-test`.
- User-supplied database ID: `0b9edc46-6aaf-44a9-8bab-1bc19a8e98d8` (not independently verified).
- Do not run these tests against Preview or Production.
- Use synthetic data only.
- No Preview or Production migration, deployment, or mutation is part of this stage.

## 2. Migration 0001 — verified baseline

The user reconstructed the six application tables from committed `migrations/0001_initial_schema.sql`:

- `courses`
- `learners`
- `registrations`
- `inquiries`
- `quotations`
- `audit_logs`

The supplied `sqlite_master` output showed the DDL for all six tables. Comparison against the committed migration found the definitions consistent. The `courses` column metadata also matched the migration.

User-supplied foreign-key results:

- `PRAGMA foreign_keys;` returned `1`.
- `PRAGMA foreign_key_check;` executed successfully and returned no violation rows.

The three expected seed records were verified:

| ID | Slug | Title |
|---|---|---|
| `course-ba` | `business-analysis` | Business Analysis |
| `course-pm` | `project-management` | Project Management |
| `course-sap` | `sap-s4hana` | SAP S/4HANA |

The three expected indexes were verified:

- `idx_inquiries_status` on `inquiries`
- `idx_registrations_learner` on `registrations`
- `idx_registrations_status` on `registrations`

**Checkpoint:** Migration 0001 baseline is verified from user-supplied D1 Console outputs.

## 3. Migration 0002 — verified

The user created the `rate_limits` table and `idx_rate_limits_expiry` index using the definitions in committed `migrations/0002_rate_limits.sql`.

The supplied `sqlite_master` output confirmed:

- Table `rate_limits` with `rate_key`, `window_started_at`, `request_count` (default 0), and `expires_at`.
- Index `idx_rate_limits_expiry` on `rate_limits(expires_at)`.

**Checkpoint:** Migration 0002's table and index definitions are verified from user-supplied D1 Console output.

## 4. Next migration — 0003

The next file is `migrations/0003_site_content.sql`. It creates `site_content` with:

- `content_key` TEXT primary key
- `content_value` TEXT not null
- `content_type` default `text`, constrained to `text`, `textarea`, or `url`
- `published` default 1, constrained to 0 or 1
- `updated_at` default `CURRENT_TIMESTAMP`

It then inserts four homepage hero content records using `INSERT OR IGNORE`:

- `home.hero.eyebrow`
- `home.hero.title`
- `home.hero.lead` (type `textarea`)
- `home.hero.note`

Apply only migration 0003's table creation and seed statements to the disposable database. Verify the table DDL and the four expected keys/types before proceeding to migration 0004. Do not use Wrangler's general migration workflow.

## 5. Current checkpoint

- [x] Reconstruct and verify migration 0001's six application tables.
- [x] Compare all six table definitions with committed migration 0001.
- [x] Verify `courses` column metadata.
- [x] Verify `PRAGMA foreign_keys` returns `1`.
- [x] Run `PRAGMA foreign_key_check`; no violation rows were reported.
- [x] Verify all three migration 0001 course seed rows.
- [x] Verify all three migration 0001 indexes.
- [x] Create and verify migration 0002's `rate_limits` table.
- [x] Verify migration 0002's `idx_rate_limits_expiry` index.
- [ ] Apply and verify migration 0003 on the disposable database.
- [ ] Continue with migrations 0004–0009 in controlled, individually verified batches.
- [ ] Only then begin the planned 0010/0011 compatibility scenarios and CMS schema tests.

## 6. Stop conditions

Stop and investigate if a table definition, seed record, or index differs from the committed migration, a foreign-key check fails, or the target database identity is uncertain. Do not proceed to 0010/0011 or CMS tests until migrations 0001–0009 are reconstructed and verified.

## 7. Repository references

- [Migration 0001](../migrations/0001_initial_schema.sql)
- [Migration 0002](../migrations/0002_rate_limits.sql)
- [Migration 0003](../migrations/0003_site_content.sql)

The Stage 9A.7 plan remains the governing test plan. This progress document supplements it; it does not authorize Preview or Production changes.
