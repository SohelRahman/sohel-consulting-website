

### Stage 9A.8 — disposable D1 compatibility testing (2026-11-18)

- Disposable target `consulting-cms-test` and its ID are user-supplied and have not been independently verified. All SQL evidence is user-reported from the D1 Console.
- Migration 0001 baseline verified: six application table definitions match the committed migration; three starter course rows match; all three expected indexes exist; `PRAGMA foreign_keys` returned `1`; `PRAGMA foreign_key_check` returned no violation rows.
- Migration 0002 verified: `rate_limits` table definition and `idx_rate_limits_expiry` index match the committed `migrations/0002_rate_limits.sql` based on supplied `sqlite_master` output.
- Next controlled test: migration 0003 (`site_content` table and four homepage hero seed records) on the disposable database only. Verify table DDL and seed keys/types before migration 0004.
- Do not use the general Wrangler migration workflow. Preview and Production remain out of scope; no migration 0003 onward, CMS test, application code change, or deployment has yet been performed.
- Progress is tracked in `docs/CMS_DISPOSABLE_D1_TEST_PROGRESS_STAGE_9A8.md`.
