

### Stage 9A.8 — disposable D1 compatibility testing (2026-11-18)

- Disposable target `consulting-cms-test` and its ID are user-supplied and have not been independently verified. All SQL evidence is user-reported from the D1 Console.
- Migration 0001 verified: six application table definitions match the committed migration; three starter course rows match; all three expected indexes exist; `PRAGMA foreign_keys` returned `1`; `PRAGMA foreign_key_check` returned no violation rows.
- Migration 0002 verified: `rate_limits` table definition and `idx_rate_limits_expiry` index match committed migration 0002 based on supplied `sqlite_master` output.
- Migration 0003 seed data verified: four expected homepage hero keys, content types (including `home.hero.lead` as `textarea`), and `published = 1` were returned. The `site_content` table DDL has not yet been checked against migration 0003.
- Next action: verify the `site_content` DDL from `sqlite_master`; only then proceed to migration 0004. Do not use the general Wrangler migration workflow.
- Progress is tracked in `docs/CMS_DISPOSABLE_D1_TEST_PROGRESS_STAGE_9A8.md`. Preview and Production remain out of scope; no migration 0004 onward, CMS test, application code change, or deployment has been performed.
