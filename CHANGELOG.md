

## 2026-11-18 — Stage 9A.7 Preview migration recovery and compatibility plan

- Added `docs/CMS_MIGRATION_RECOVERY_COMPATIBILITY_TEST_PLAN_STAGE_9A7.md` covering Preview preservation, migration-history reconciliation, disposable D1 compatibility tests, acceptance criteria and stop conditions.
- Recorded user-supplied Preview evidence: `d1_migrations` contains only `0001`–`0009`; the `courses` table already contains columns expected from repository migrations `0010` and `0011`; course count is 3; non-null `syllabus_url` and matching Cloudinary PDF URL counts are both 0.
- Recorded the resulting schema/history discrepancy and unknown CMS table provenance. The existing migration workflow must not be run until recovery is resolved because it applies all pending migration files.
- Documentation-only update on `current-focus-development`. No SQL migration, D1 data, application code, Preview deployment or Production resource was changed.
