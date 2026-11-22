# Database migration inventory and verification status — 2026-11-22

The development branch contains migration files 0001–0013. File presence is not proof that a migration has been applied to a remote database.

| Migration | File |
|---|---|
| 0001 | `0001_initial_schema.sql` |
| 0002 | `0002_rate_limits.sql` |
| 0003 | `0003_site_content.sql` |
| 0004 | `0004_page_styles.sql` |
| 0005 | `0005_pages.sql` |
| 0006 | `0006_cloudinary_media.sql` |
| 0007 | `0007_chat.sql` |
| 0008 | `0008_analytics.sql` |
| 0009 | `0009_admin_rbac.sql` |
| 0010 | `0010_course_discounts_syllabus.sql` |
| 0011 | `0011_course_syllabus_file_url.sql` |
| 0012 | `0012_bilingual_static_cms.sql` |
| 0013 | `0013_quotation_response_tokens.sql` |

## Evidence qualification

- The repository's historical notes record user-supplied D1 Console output for a disposable database and for Preview migration work.
- Those records are not direct, live database inspection by the repository maintainer.
- The Stage 9A.8 disposable-target notes explicitly state that manually reconstructed migration checks did not create or update the D1 migration ledger.
- The user-reported Preview ledger through 0012 and later migration 0013 status must be rechecked read-only before any deployment or migration decision.
- Production migration state has not been independently verified in this audit.

Before applying any migration, identify the exact target by database name and ID, verify it is not the other environment, inspect the migration ledger, review the SQL and recovery plan, and obtain explicit approval. Never run the general migration workflow against an unverified target.

---



## Stage 9A.8 — disposable D1 test progress

See [CMS Disposable D1 Test Progress — Stage 9A.8](CMS_DISPOSABLE_D1_TEST_PROGRESS_STAGE_9A8.md).

The disposable migration 0001 and 0002 baselines are verified from user-supplied D1 Console outputs. Migration 0003's four homepage hero seed keys, content types, published flags, and `site_content` table DDL match committed migration 0003. Migrations 0004 and 0005 are verified from user-supplied D1 Console outputs, including the `pages` table and `idx_pages_status_slug` index. Migration 0006 is verified from user-supplied D1 Console outputs, including the `media_assets` table and `idx_media_assets_created` index. Migration 0007's `chat_conversations` table DDL is verified from user-supplied D1 Console output. The `chat_messages` table DDL, including its `ON DELETE CASCADE` foreign key, is verified from user-supplied D1 Console output. Migration 0007 is fully verified from user-supplied D1 Console outputs: both chat tables, the `ON DELETE CASCADE` foreign key, and both indexes. Migration 0008's `analytics_events` table DDL and all three indexes (`idx_analytics_events_created`, `idx_analytics_events_page`, `idx_analytics_events_visitor`) are verified from user-supplied D1 Console outputs. Migration 0009's `admin_users` table DDL and `idx_admin_users_role_active` index are verified from user-supplied D1 Console outputs. Migrations 0001–0009 are now reconstructed and verified against committed SQL on the disposable target. This manual process did not update the D1 migration ledger. Migration 0010 clean-start compatibility test passed on the confirmed disposable target based on user-supplied output: all five expected columns and definitions are present, course count remained 3, `discount_type` is populated for all three rows, and `syllabus_url` is NULL for all three. Next, test migration 0011's column addition and Cloudinary PDF URL transfer with synthetic data. CMS schema tests remain outstanding. Do not use the general Wrangler migration workflow. Preview and Production remain out of scope.
