

### Stage 9A.8 — disposable D1 compatibility testing (2026-11-18)

- The user reports that the disposable D1 target `consulting-cms-test` initially contained only the Cloudflare-managed `_cf_KV` table. The target name and ID are user-supplied and have not been independently verified.
- The user created the `courses` table and supplied `PRAGMA table_info(courses)` output showing 15 columns matching the `courses` definition in committed migration 0001.
- The user then created `learners`, `registrations`, `inquiries`, `quotations`, and `audit_logs`. A subsequent `sqlite_master` query returned all six application tables.
- Table existence is confirmed only by user-supplied query output. Full schema comparison, migration 0001 indexes, three course seed rows, and foreign-key enforcement/checks remain outstanding. Do not treat the 0001 baseline as complete yet.
- Added `docs/CMS_DISPOSABLE_D1_TEST_PROGRESS_STAGE_9A8.md` to record the evidence, qualifications, checkpoint and stop conditions. Continue only on the disposable database with synthetic data.
- No Preview or Production database was accessed or changed. No migration 0002–0011, CMS test, application code change, or deployment has been performed in this checkpoint.
