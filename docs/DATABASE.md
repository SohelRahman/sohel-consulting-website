

## Stage 9A.8 — disposable D1 test progress

See [CMS Disposable D1 Test Progress — Stage 9A.8](CMS_DISPOSABLE_D1_TEST_PROGRESS_STAGE_9A8.md).

The disposable migration 0001 and 0002 baselines are verified from user-supplied D1 Console outputs. Migration 0003's four homepage hero seed keys, content types, published flags, and `site_content` table DDL match committed migration 0003. Migrations 0004 and 0005 are verified from user-supplied D1 Console outputs, including the `pages` table and `idx_pages_status_slug` index. Next, inspect and apply migration 0006 on the disposable database only. Do not use the general Wrangler migration workflow. Preview and Production remain out of scope.
