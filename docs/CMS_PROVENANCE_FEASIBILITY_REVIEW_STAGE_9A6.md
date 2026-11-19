# CMS Migration Provenance and Technical Feasibility Review — Stage 9A.6

**Review date:** 2026-11-18  
**Branch reviewed:** `current-focus-development`  
**Observed branch HEAD before this document:** `36124e77d806225a0335af990049f2dcdf9fdbb0`  
**Target environment:** Preview D1 only  
**Status:** Read-only investigation; provenance unresolved; migration execution not approved  
**Production:** Excluded

## 1. Objective

Determine whether the existing seven CMS tables can be reconciled safely with the approved target design, establish their likely provenance from repository evidence, and identify technical and operational blockers before creating executable migration SQL.

This review makes no D1 changes, Worker changes, deployment changes or Production changes.

## 2. Repository provenance findings

### 2.1 Current branch inventory

The recursive Git tree for `current-focus-development` was inspected. The tracked migration directory contains exactly:

- `0001_initial_schema.sql`
- `0002_rate_limits.sql`
- `0003_site_content.sql`
- `0004_page_styles.sql`
- `0005_pages.sql`
- `0006_cloudinary_media.sql`
- `0007_chat.sql`
- `0008_analytics.sql`
- `0009_admin_rbac.sql`
- `0010_course_discounts_syllabus.sql`
- `0011_course_syllabus_file_url.sql`

No dedicated CMS schema migration file is present in the inspected recursive tree.

The inspected recent commit history did not identify a commit that adds the seven CMS table definitions. The commit list available for the branch contained 50 entries; the next page was empty. This is evidence about the visible repository history, not proof about external D1 activity or other repositories/branches.

### 2.2 Workflow review

The tracked `.github/workflows/diagnose-preview-admin-schema.yml` and `.github/workflows/diagnose-preview-admin-login-schema.yml` workflows:
- guard the Preview D1 ID;
- inspect selected table columns;
- run `EXPLAIN` statements;
- do not create CMS tables.

The tracked `.github/workflows/migrate-preview-d1.yml` workflow:
- runs only from `current-focus-development`;
- verifies the configured Preview D1 ID against the expected Preview ID and Cloudflare API;
- generates a temporary configuration with a Preview-only D1 binding;
- runs `wrangler d1 migrations list`;
- then runs `wrangler d1 migrations apply`;
- lists migration state again.

It applies pending migration files from the configured `migrations` directory; it is not a one-file-only execution gate.

### 2.3 Provenance conclusion

The user-supplied Preview schema shows seven CMS tables, but no corresponding CMS migration exists in the inspected repository tree/history. The supplied Preview migration history listed only `0001`–`0009`, while the repository contains `0010` and `0011` as well.

Possible explanations include manual D1 Console SQL, an untracked migration, another branch/repository or another deployment path. Current evidence cannot distinguish these possibilities.

**Provenance status: unresolved.** Do not attribute creation to a person, workflow or deployment process without additional evidence. Do not drop/recreate the CMS tables on the assumption that they were created manually or are disposable.

## 3. Migration-history blocker: migrations 0010 and 0011

The last user-supplied Preview `d1_migrations` output contained rows `0001`–`0009`. It did not show `0010` or `0011`.

Repository definitions inspected:

### 0010 — `0010_course_discounts_syllabus.sql`

Adds to `courses`:
- `discount_type`
- `discount_value`
- `discount_starts_at`
- `discount_ends_at`
- `syllabus_url`

### 0011 — `0011_course_syllabus_file_url.sql`

Adds `syllabus_file_url`, then moves matching Cloudinary PDF URLs from `syllabus_url` into `syllabus_file_url` and sets `syllabus_url` to NULL for those rows.

Because the Preview migration workflow applies all pending migrations, running it may apply 0010 and 0011 before a future CMS migration. This is a release blocker until their Preview application state and intended course-data effects are confirmed.

Do not run the existing migration workflow merely to apply a later CMS migration.

## 4. D1 / SQLite feasibility findings

The following findings are based on Cloudflare's current official D1 documentation, reviewed on 2026-11-18:

- D1 uses sequential SQL migration files and records applied migrations in `d1_migrations`.
- D1 enforces foreign keys by default. D1 runs queries in implicit transactions; callers cannot toggle `PRAGMA foreign_keys` during a query or migration.
- D1 documents `PRAGMA defer_foreign_keys = ON` for temporarily deferring checks until the current transaction ends. All references must be valid by transaction completion.
- D1 supports relevant SQLite PRAGMA inspection, JSON functions and normal SQL schema operations within its supported SQLite subset.
- D1's `batch()` runs its statements sequentially as a SQL transaction; a failed statement rolls back the batch.
- Wrangler's D1 migration command documentation states that a failed migration is rolled back and that a backup is captured after applying migrations.

Official references:
- https://developers.cloudflare.com/d1/reference/migrations/
- https://developers.cloudflare.com/d1/sql-api/foreign-keys/
- https://developers.cloudflare.com/d1/sql-api/sql-statements/
- https://developers.cloudflare.com/workers/wrangler/commands/d1/
- https://developers.cloudflare.com/d1/worker-api/d1-database/

These documented capabilities do not substitute for testing the exact migration against the same schema and foreign-key graph.

## 5. Feasibility by design requirement

| Requirement | Feasibility assessment | Gate |
| --- | --- | --- |
| Add nullable/defaulted revision columns | Suitable for additive migration | Confirm defaults and application rollout order |
| Add section type/configuration | Suitable for additive migration | Validate renderer contract and JSON |
| Permit `textarea` in element type | Existing CHECK must be changed; ordinary ADD COLUMN does not change it | Test exact table rebuild or approved compatibility alternative |
| Preserve child FKs during element table rebuild | Possible but sensitive because values and element versions reference elements | Disposable D1 test with FK enforcement and defer behavior |
| Current published-version pointer | Feasible | Enforce same-locale ownership at database level |
| Immutable snapshots | Feasible through insert-only version records and application permissions/constraints | Test update/delete protection and authorized maintenance path |
| Atomic publication | Feasible using D1 transactional batch or one migration/query transaction as appropriate | Test rollback and stale-revision race |
| Migration tracking | Supported | Reconcile 0010/0011 before any migration workflow execution |
| Legacy import | Low data volume in current Preview baseline | Idempotency and exact source comparison |

## 6. Technical design decisions and cautions

### 6.1 CHECK constraint and table rebuild

The existing `cms_content_elements.content_type` CHECK excludes `textarea`. A new column cannot modify that existing CHECK expression.

A table rebuild may be needed. The table has dependent child tables:
- `cms_content_values`
- `cms_content_versions`

A rebuild must preserve all existing columns, primary/unique constraints, indexes, triggers and foreign-key references. The current CMS tables have zero rows according to user-supplied Preview counts, but their schema and relationships must still be preserved deliberately.

Do not use a generic SQLite recipe that toggles `PRAGMA foreign_keys=OFF`; D1 documents that foreign-key enforcement cannot be toggled inside a query/migration transaction. Test a D1-compatible rebuild using deferred foreign-key checks or choose a non-rebuild compatibility design. Do not execute either approach against the actual Preview database until tested separately.

### 6.2 Same-locale current-version pointer

A pointer FK to `cms_page_versions.id` alone would not prove the target version belongs to the same locale.

Candidate database-enforced designs:
- composite foreign key backed by a unique parent key such as `(locale_id, id)`; or
- insert/update triggers that reject a pointer whose referenced version has a different `locale_id`.

The composite-FK design may require rebuilding `cms_page_locales` to add a table-level constraint. Trigger enforcement may be less invasive but must be verified against D1's supported SQL and transaction behavior. Select neither without a disposable D1 test. Application-only validation is not sufficient.

### 6.3 Atomic publication

The publication transaction must:
1. verify the expected Draft revision;
2. validate the complete page structure and values;
3. insert the immutable page snapshot;
4. update the locale's current published-version pointer and publication revision;
5. commit all operations together.

A failed step must leave the previous public pointer unchanged. Concurrent publication attempts must be rejected when their expected Draft revision is stale.

### 6.4 Snapshot immutability

Published snapshots should be append-only in ordinary application behavior. The Worker must not expose update/delete operations for historical snapshots. If database triggers are used to block updates/deletes, include a documented administrative maintenance/recovery strategy and test that normal publication still works.

## 7. Operational workflow risks

The current Preview migration workflow automatically applies all pending files in `migrations/`. The user-supplied migration history suggests that 0010 and 0011 may be pending. Therefore:
- do not trigger the workflow yet;
- refresh the actual `d1_migrations` state;
- inspect `courses` columns and existing syllabus values;
- explicitly decide whether 0010 and 0011 should be applied to Preview;
- only then design a safe migration release sequence.

Do not alter the existing workflow or migration files as part of this review.

## 8. Required next read-only evidence

Before approving a migration plan, obtain current Preview output for:

1. `SELECT id, name, applied_at FROM d1_migrations ORDER BY id;`
2. `PRAGMA table_info(courses);`
3. `SELECT COUNT(*) AS course_count FROM courses;`
4. `SELECT COUNT(*) AS legacy_syllabus_urls FROM courses WHERE syllabus_url IS NOT NULL;`
5. `SELECT COUNT(*) AS cloudinary_pdf_urls FROM courses WHERE syllabus_url LIKE 'https://res.cloudinary.com/%/image/upload/%.pdf';`

These queries are read-only. Do not share sensitive course/customer details; counts and schema metadata are sufficient.

Also confirm whether any CMS schema SQL was run manually in the D1 Console or through a workflow outside the inspected repository. If unknown, retain provenance as unresolved.

## 9. Decision and exit criteria

### Findings

- Repository-tracked CMS migration: not found.
- CMS table provenance: unresolved.
- CMS tables: empty in the supplied Preview baseline.
- CMS foreign-key graph: verified from user-supplied DDL and individual PRAGMA results.
- D1 supports foreign-key deferral and transactional batches according to current documentation.
- Existing content-type CHECK requires a deliberate schema strategy to add `textarea`.
- Migrations 0010 and 0011 require reconciliation before using the current migration workflow.

### Exit criteria

Stage 9A.6 is complete only when:
- the migration history discrepancy is reconciled;
- 0010/0011 effects are understood and intentionally handled;
- migration provenance is either established or explicitly recorded as unknown with an approved preflight strategy;
- a disposable D1 test proves the element-table compatibility approach;
- a disposable D1 test proves same-locale pointer enforcement;
- atomic publication and rollback behavior are tested;
- a revised executable migration plan is reviewed and separately approved.

**Current outcome:** technical feasibility is promising but conditional. No executable CMS migration SQL is approved or created by this review. No Preview D1 changes, application changes, deployments or Production changes were performed.
