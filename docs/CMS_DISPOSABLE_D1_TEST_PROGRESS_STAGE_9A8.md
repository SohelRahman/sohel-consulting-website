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

The user then created the `courses` table using the DDL for that table from `migrations/0001_initial_schema.sql`. The subsequent user-supplied `PRAGMA table_info(courses)` output showed 15 columns:

`id`, `slug`, `title_en`, `title_bn`, `summary_en`, `summary_bn`, `level`, `delivery_modes`, `languages`, `pricing_type`, `fixed_fee_minor`, `currency`, `active`, `created_at`, `updated_at`.

The reported types, nullability and defaults match the corresponding `courses` definition in the inspected migration 0001.

The user subsequently executed the supplied DDL for five additional tables: `learners`, `registrations`, `inquiries`, `quotations`, and `audit_logs`.

The user's verification query returned exactly these six application tables:

- `audit_logs`
- `courses`
- `inquiries`
- `learners`
- `quotations`
- `registrations`

This confirms table existence according to the supplied query output. It does not yet verify all table definitions, indexes, foreign-key enforcement, seed rows, or the complete migration 0001 baseline.

## 3. Important qualification

The table DDL supplied for the five additional tables was transcribed from migration 0001 and should be checked against the committed migration before treating the baseline as complete. The committed migration also creates three indexes and inserts three course seed records. Those indexes and seed records have not yet been verified in the disposable database.

The initial migration begins with `PRAGMA foreign_keys = ON;`. Foreign-key enforcement in the disposable database has not yet been demonstrated by a test or a reported `PRAGMA foreign_keys` result.

## 4. Current checkpoint

- [x] Confirm initial disposable database had no application tables (user-reported).
- [x] Create `courses`.
- [x] Inspect `courses` columns with `PRAGMA table_info(courses)`.
- [x] Create `learners`, `registrations`, `inquiries`, `quotations`, and `audit_logs`.
- [x] Confirm existence of all six tables.
- [ ] Compare all six table definitions with migration 0001.
- [ ] Verify the three indexes from migration 0001.
- [ ] Verify the three seeded course records without exposing unnecessary personal data.
- [ ] Verify foreign-key enforcement and run `PRAGMA foreign_key_check`.
- [ ] Continue with migrations 0002–0009 in controlled, individually verified batches.
- [ ] Only then begin the planned 0010/0011 compatibility scenarios and CMS schema tests.

## 5. Stop conditions

Stop and investigate if any table definition differs from the committed migration, any expected index or seed record is missing, foreign-key checks fail, or the target database identity is uncertain. Do not proceed to migrations 0010/0011 or CMS tests until the 0001–0009 baseline is reconstructed and verified.

## 6. Repository reference

Baseline migration: [migrations/0001_initial_schema.sql](../migrations/0001_initial_schema.sql)

The Stage 9A.7 plan remains the governing test plan. This progress document supplements it; it does not authorize Preview or Production changes.
