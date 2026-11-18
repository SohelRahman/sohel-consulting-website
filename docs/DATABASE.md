

## Stage 9A.8 — disposable D1 test progress

See [CMS Disposable D1 Test Progress — Stage 9A.8](CMS_DISPOSABLE_D1_TEST_PROGRESS_STAGE_9A8.md).

The user reports that all six application tables from migration 0001 exist in the disposable test database and that their supplied DDL matches the committed migration. The reported `courses` column metadata also matches. User-supplied checks show `PRAGMA foreign_keys = 1` and no rows from `PRAGMA foreign_key_check`.

The three-course seed INSERT statement executed successfully, but a SELECT is still required to verify the exact resulting rows. The three indexes from migration 0001 also remain unverified. Do not proceed to later migrations or CMS compatibility tests before those checks pass. Preview and Production remain out of scope.
