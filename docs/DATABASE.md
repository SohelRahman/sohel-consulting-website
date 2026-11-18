

## Stage 9A.8 — disposable D1 test progress

See [CMS Disposable D1 Test Progress — Stage 9A.8](CMS_DISPOSABLE_D1_TEST_PROGRESS_STAGE_9A8.md).

The disposable migration 0001 and 0002 baselines are verified from user-supplied D1 Console outputs. Migration 0003's four homepage hero seed keys, content types, and published flags are also verified. The actual `site_content` table DDL still needs comparison with committed migration 0003 before proceeding to migration 0004. Do not use the general Wrangler migration workflow. Preview and Production remain out of scope.
