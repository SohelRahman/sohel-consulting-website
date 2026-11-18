

### Stage 9A.8 — disposable D1 compatibility testing (2026-11-18)

- Disposable target `consulting-cms-test` and its ID are user-supplied and have not been independently verified. All SQL evidence is user-reported from the D1 Console.
- Migration 0001 verified: six application table definitions match the committed migration; three starter course rows match; all three expected indexes exist; `PRAGMA foreign_keys` returned `1`; `PRAGMA foreign_key_check` returned no violation rows.
- Migration 0002 verified: `rate_limits` table definition and `idx_rate_limits_expiry` index match committed migration 0002 based on supplied `sqlite_master` output.
- Migration 0003 fully verified: four expected homepage hero seed keys, content types (including `home.hero.lead` as `textarea`), and `published = 1` were returned; supplied `sqlite_master` DDL matches the committed table definition.
- Migration 0004 verified: user-created `page_styles` table DDL matches committed migration 0004.
- Migration 0005 verified: supplied `pages` table DDL and `idx_pages_status_slug` index match committed migration 0005.
- Migration 0006 verified: supplied `media_assets` table DDL and `idx_media_assets_created` index match committed migration 0006.
- Migration 0007 first table verified: supplied `chat_conversations` DDL matches committed migration 0007. The `chat_messages` table DDL is verified, including its `ON DELETE CASCADE` foreign key. `idx_chat_conversations_status` is verified; both `idx_chat_conversations_status` and `idx_chat_messages_conversation` are verified against the committed migration.
- Migration 0008 table verified: supplied `analytics_events` DDL matches committed migration 0008. Three indexes remain pending. Next, create and verify `idx_analytics_events_created`, then proceed with the other two indexes. Do not use the general Wrangler migration workflow. Do not use the general Wrangler migration workflow.
- Progress is tracked in `docs/CMS_DISPOSABLE_D1_TEST_PROGRESS_STAGE_9A8.md`. Preview and Production remain out of scope; no migration 0004 onward, CMS test, application code change, or deployment has been performed.
