

## Stage 9A.7 — migration recovery and compatibility test plan

See [CMS Migration Recovery and Compatibility Test Plan — Stage 9A.7](CMS_MIGRATION_RECOVERY_COMPATIBILITY_TEST_PLAN_STAGE_9A7.md).

The user supplied the complete Preview `d1_migrations` result: only `0001`–`0009` are recorded. Preview `courses` nevertheless contains all columns expected from repository migrations `0010` and `0011`. The table has 3 rows; `syllabus_url IS NOT NULL` and matching Cloudinary PDF URL counts are both zero. This confirms a migration-history/schema discrepancy, but not how or when the columns were created or whether the historical data transformation ran.

CMS table creation provenance is unknown. The current Preview migration workflow applies all pending migration files; do not run it while 0010/0011 remain pending in the ledger and their columns already exist. Do not manually edit `d1_migrations` or drop/recreate tables as a shortcut.

Stage 9A.7 is a planning document only. It requires a verified Preview backup/fingerprint, cross-environment migration-state inventory, and disposable D1 tests for migration reconciliation, foreign-key-safe table rebuilds, same-locale pointer integrity and atomic publication. No migration or database change is authorized.
