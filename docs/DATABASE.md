

## Stage 9A.8 — disposable D1 test progress

See [CMS Disposable D1 Test Progress — Stage 9A.8](CMS_DISPOSABLE_D1_TEST_PROGRESS_STAGE_9A8.md).

The disposable migration 0001 baseline is verified from user-supplied D1 Console outputs: six application table definitions, three starter course rows, three expected indexes, `PRAGMA foreign_keys = 1`, and no reported `foreign_key_check` violations. Migration 0002 is also verified: the `rate_limits` table and `idx_rate_limits_expiry` index match the committed migration based on supplied `sqlite_master` output.

The next isolated test is migration 0003 (`site_content` and its four homepage hero seed records) on the disposable database only. Verify its schema and seed records before migration 0004. Do not use the general Wrangler migration workflow. Preview and Production remain out of scope.
