

## Stage 9A.8 — disposable D1 test progress

See [CMS Disposable D1 Test Progress — Stage 9A.8](CMS_DISPOSABLE_D1_TEST_PROGRESS_STAGE_9A8.md).

The user reports that all six application tables from migration 0001 exist in the disposable test database and that their supplied DDL matches the committed migration. The reported `courses` column metadata also matches. User-supplied checks show `PRAGMA foreign_keys = 1` and no rows from `PRAGMA foreign_key_check`. The three expected starter course rows and all three migration 0001 indexes were subsequently verified by SELECT/`sqlite_master` output.

The migration 0001 baseline is therefore verified from user-supplied D1 Console outputs. The next isolated test is migration 0002 on the disposable database only. Do not use the general Wrangler migration workflow. Preview and Production remain out of scope.
