

### Stage 9A.7 — Preview migration recovery and compatibility test plan (2026-11-18)

- User confirmed CMS table creation provenance is unknown / cannot be confirmed.
- Complete Preview migration history now supplied: only migrations `0001`–`0009` are recorded. Preview `courses` schema contains all columns expected from repository migrations `0010` and `0011`, but neither is recorded in `d1_migrations`.
- Preview `courses` has 3 rows; `syllabus_url IS NOT NULL` count is 0; matching Cloudinary PDF URL count in that column is 0. These results do not establish whether migration 0011's data transformation ran in the past.
- Confirmed schema/history discrepancy. Do not run the current migration workflow; it applies all pending migration files and may attempt to add columns that already exist.
- Added `docs/CMS_MIGRATION_RECOVERY_COMPATIBILITY_TEST_PLAN_STAGE_9A7.md`. It defines read-only Preview fingerprinting, cross-environment migration reconciliation, disposable D1 test cases, recovery acceptance criteria and stop conditions.
- CMS table provenance remains unknown. No migration execution, D1 mutation, application code change, Preview deployment or Production change was performed. Production remains excluded.
