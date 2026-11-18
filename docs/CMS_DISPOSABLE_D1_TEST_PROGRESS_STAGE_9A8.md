# Stage 9A.8 — Disposable D1 Compatibility Testing Progress

**Status:** In progress. This document records user-reported SQL execution and query output. The assistant does not have direct access to the D1 Console and has not independently executed or inspected the database.

## 1. Scope and safety boundary

- Intended target: disposable D1 database `consulting-cms-test`.
- User-supplied database ID: `0b9edc46-6aaf-44a9-8bab-1bc19a8e98d8` (not independently verified).
- Do not run these tests against Preview or Production.
- Use synthetic data only.
- No Preview or Production migration, deployment, or mutation is part of this stage.

## 2. Migration 0001 — verified baseline

The user initially reported that the disposable database contained only the Cloudflare-managed `_cf_KV` table. The user then reconstructed the six application tables from committed `migrations/0001_initial_schema.sql`:

- `courses`
- `learners`
- `registrations`
- `inquiries`
- `quotations`
- `audit_logs`

The supplied `sqlite_master` output showed the DDL for all six tables. Comparison against the committed migration found the definitions consistent. The `courses` column metadata also matched the migration.

### Foreign keys

User-supplied results:

- `PRAGMA foreign_keys;` returned `1`.
- `PRAGMA foreign_key_check;` executed successfully and returned no violation rows.

### Seed records

The user executed migration 0001's three-course `INSERT OR IGNORE` statement. The subsequent SELECT returned exactly:

| ID | Slug | Title |
|---|---|---|
| `course-ba` | `business-analysis` | Business Analysis |
| `course-pm` | `project-management` | Project Management |
| `course-sap` | `sap-s4hana` | SAP S/4HANA |

### Indexes

The user created the three indexes defined in migration 0001. The subsequent `sqlite_master` query returned exactly:

- `idx_inquiries_status` on `inquiries`
- `idx_registrations_learner` on `registrations`
- `idx_registrations_status` on `registrations`

**Checkpoint result:** The migration 0001 baseline is reconstructed and its six table definitions, three seed rows, three expected indexes, and reported foreign-key checks have been verified from user-supplied D1 Console outputs.

## 3. Next migration — 0002

The next file in repository order is `migrations/0002_rate_limits.sql`. Its committed SQL creates:

- Table `rate_limits` with `rate_key`, `window_started_at`, `request_count`, and `expires_at`.
- Index `idx_rate_limits_expiry` on `rate_limits(expires_at)`.

Apply only this migration's two statements to the disposable database, then verify the table definition and index before moving to migration 0003. Do not use Wrangler's general migration workflow.

## 4. Current checkpoint

- [x] Reconstruct all six migration 0001 application tables.
- [x] Compare the six table definitions with committed migration 0001.
- [x] Verify `courses` column metadata.
- [x] Verify `PRAGMA foreign_keys` returns `1`.
- [x] Run `PRAGMA foreign_key_check`; no violation rows were reported.
- [x] Verify all three migration 0001 course seed rows.
- [x] Verify all three migration 0001 indexes.
- [ ] Apply and verify migration 0002 on the disposable database.
- [ ] Continue with migrations 0003–0009 in controlled, individually verified batches.
- [ ] Only then begin the planned 0010/0011 compatibility scenarios and CMS schema tests.

## 5. Stop conditions

Stop and investigate if a table definition, seed record, or index differs from the committed migration, a foreign-key check fails, or the target database identity is uncertain. Do not proceed to 0010/0011 or CMS tests until migrations 0001–0009 are reconstructed and verified.

## 6. Repository references

- [Migration 0001](../migrations/0001_initial_schema.sql)
- [Migration 0002](../migrations/0002_rate_limits.sql)

The Stage 9A.7 plan remains the governing test plan. This progress document supplements it; it does not authorize Preview or Production changes.
