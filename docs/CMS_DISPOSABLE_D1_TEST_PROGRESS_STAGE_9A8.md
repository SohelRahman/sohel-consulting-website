# Stage 9A.8 — Disposable D1 Compatibility Testing Progress

**Status:** In progress. This document records user-reported SQL execution and query output. The assistant does not have direct access to the D1 Console and has not independently executed or inspected the database.

## 1. Scope and safety boundary

- Intended target: disposable D1 database `consulting-cms-test`.
- User-supplied database ID: `0b9edc46-6aaf-44a9-8bab-1bc19a8e98d8` (not independently verified).
- Do not run these tests against Preview or Production.
- Use synthetic data only.
- No Preview or Production migration, deployment, or mutation is part of this stage.

## 2. Baseline setup evidence

The user initially queried `sqlite_master` and reported that the disposable database contained only the Cloudflare-managed `_cf_KV` table. No application baseline schema was present at that point.

The user created the `courses` table and supplied `PRAGMA table_info(courses)` output showing 15 columns matching the `courses` definition in committed migration 0001.

The user subsequently created `learners`, `registrations`, `inquiries`, `quotations`, and `audit_logs`. The user-supplied `sqlite_master` output showed all six application tables and their DDL. Comparison against committed `migrations/0001_initial_schema.sql` found the six table definitions consistent with the migration.

## 3. Foreign-key evidence

The user reported:

- `PRAGMA foreign_keys;` returned `1`.
- `PRAGMA foreign_key_check;` executed successfully and returned no violation rows.

This is evidence that foreign-key enforcement is enabled in the tested D1 Console session and that the current database has no reported foreign-key violations.

## 4. Seed-data insertion

The user executed the three-course `INSERT OR IGNORE` statement from migration 0001. The D1 Console reported: “This query successfully executed.”

The follow-up `SELECT id, slug, title_en FROM courses ORDER BY id;` has not yet been supplied. Therefore the presence and exact contents of all three seed rows remain pending verification; successful execution alone is not treated as proof of the final row set.

## 5. Current checkpoint

- [x] Confirm initial disposable database had no application tables (user-reported).
- [x] Create `courses`.
- [x] Inspect `courses` columns with `PRAGMA table_info(courses)`; reported columns match migration 0001.
- [x] Create `learners`, `registrations`, `inquiries`, `quotations`, and `audit_logs`.
- [x] Confirm existence of all six tables and compare their reported DDL with migration 0001.
- [x] Verify `PRAGMA foreign_keys` returns `1`.
- [x] Run `PRAGMA foreign_key_check`; no violation rows were reported.
- [x] Execute the three-course seed INSERT statement.
- [ ] Verify the exact three seeded course rows with a SELECT query.
- [ ] Verify the three indexes from migration 0001.
- [ ] Continue with migrations 0002–0009 in controlled, individually verified batches.
- [ ] Only then begin the planned 0010/0011 compatibility scenarios and CMS schema tests.

## 6. Stop conditions

Stop and investigate if any expected seed record is missing, any expected index is missing or malformed, a foreign-key check fails, or the target database identity is uncertain. Do not proceed to migrations 0010/0011 or CMS tests until the 0001–0009 baseline is reconstructed and verified.

## 7. Repository reference

Baseline migration: [migrations/0001_initial_schema.sql](../migrations/0001_initial_schema.sql)

The Stage 9A.7 plan remains the governing test plan. This progress document supplements it; it does not authorize Preview or Production changes.
