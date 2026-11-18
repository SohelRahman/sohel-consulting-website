

### Stage 9A.8 — disposable D1 compatibility testing (2026-11-18)

- The user reports that the disposable D1 target `consulting-cms-test` initially contained only the Cloudflare-managed `_cf_KV` table. The target name and ID are user-supplied and have not been independently verified.
- Reconstructed all six application tables from migration 0001; supplied `sqlite_master` DDL was compared with the committed migration and found consistent. Supplied `courses` column metadata also matches.
- User-supplied checks: `PRAGMA foreign_keys` returned `1`; `PRAGMA foreign_key_check` executed with no violation rows reported.
- Verified the three migration 0001 course seed rows by SELECT: `course-ba`, `course-pm`, and `course-sap`, with their expected slugs and titles.
- Verified all three migration 0001 indexes: `idx_inquiries_status`, `idx_registrations_learner`, and `idx_registrations_status` on their expected tables. The migration 0001 disposable baseline is now verified from user-supplied D1 Console outputs.
- The next controlled test is migration 0002 (`rate_limits` and `idx_rate_limits_expiry`) on the disposable database only. Do not use the general Wrangler migration workflow.
- Added/updated `docs/CMS_DISPOSABLE_D1_TEST_PROGRESS_STAGE_9A8.md`. No Preview or Production database was accessed or changed. No migration 0002 onward has yet been executed, and no CMS test, application code change, or deployment has been performed in this checkpoint.
