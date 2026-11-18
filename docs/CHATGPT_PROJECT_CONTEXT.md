

### Stage 9A.8 — disposable D1 compatibility testing (2026-11-18)

- The user reports that the disposable D1 target `consulting-cms-test` initially contained only the Cloudflare-managed `_cf_KV` table. The target name and ID are user-supplied and have not been independently verified.
- The user created the `courses` table; supplied `PRAGMA table_info(courses)` output matches its 15-column definition in committed migration 0001.
- The user created `learners`, `registrations`, `inquiries`, `quotations`, and `audit_logs`. Supplied `sqlite_master` DDL for all six application tables was compared with migration 0001 and found consistent.
- User-supplied checks: `PRAGMA foreign_keys` returned `1`; `PRAGMA foreign_key_check` executed with no violation rows reported.
- The user executed migration 0001's three-course `INSERT OR IGNORE` statement successfully. The follow-up SELECT has not yet confirmed the exact three rows. The three migration 0001 indexes also remain unverified.
- Added/updated `docs/CMS_DISPOSABLE_D1_TEST_PROGRESS_STAGE_9A8.md` to record evidence and remaining checks. Continue only on the disposable database with synthetic data.
- No Preview or Production database was accessed or changed. No migration 0002–0011, CMS test, application code change, or deployment has been performed in this checkpoint.
