

## 2026-11-18 — Stage 9A.8 disposable D1 test progress

- Verified migration 0003 on the disposable D1 target from user-supplied output: all four expected homepage hero seed records and the `site_content` table DDL match committed migration 0003.
- Verified migration 0004's `page_styles` table DDL against the committed migration using user-supplied D1 Console output.
- Verified migration 0005's `pages` table DDL and `idx_pages_status_slug` index against the committed migration.
- Verified migration 0006's `media_assets` table DDL and `idx_media_assets_created` index against the committed migration.
- Verified migration 0007's `chat_conversations` and `chat_messages` table DDL, the `ON DELETE CASCADE` foreign key, and both chat indexes against the committed migration.
- Verified migration 0008's `analytics_events` table DDL and all three indexes (`idx_analytics_events_created`, `idx_analytics_events_page`, `idx_analytics_events_visitor`) against the committed migration from user-supplied D1 Console output.
- Verified migration 0009's `admin_users` table DDL and `idx_admin_users_role_active` index against committed SQL from user-supplied D1 Console output.
- Migrations 0001–0009 have been reconstructed and verified against committed SQL on the disposable target. The manual process did not create or update `d1_migrations` entries.
- Applied and verified migration 0010 from the clean starting schema on the confirmed disposable target. All five expected columns and definitions are present; the course count remained 3; `discount_type` is populated for all three rows; `syllabus_url` is NULL for all three.
- Next: test migration 0011's `syllabus_file_url` addition and Cloudinary PDF URL transfer with synthetic data.
- Next: follow the Stage 9A.7 plan for isolated 0010/0011 compatibility scenarios and CMS schema tests on the disposable target.
- Documentation-only repository changes. No migration 0004 or later, Preview or Production database mutation, application code change, or deployment was performed.

## 2026-11-19 — Bilingual CMS and dual editing workflows

- Implemented the bilingual static-page CMS for 12 English pages, 12 Bangla pages and a separate Global content context.
- Added draft/published content separation, page/language-scoped publishing, authenticated draft preview, content-key inspection, soft archive/restore and version-history recovery.
- Added the on-page editing path to the existing dashboard editor: when the page is opened with `?cmsKeys=1`, clicking an eligible highlighted element opens an inline editor. It saves drafts through the existing authenticated CMS save endpoint; it does not publish automatically.
- Preserved the legacy six-table CMS schema in Preview; the new version history uses `cms_static_content_versions`.
- User-reported Preview D1 results: migration ledger contains 0001–0012; four existing published English homepage values were imported; four published version rows were created; all six legacy CMS tables remain present. The assistant did not directly access D1.
- Development branch commit for the on-page editor and follow-up correction: `754507b0a28290cc972929f61bef891fbe9b880c`.
- Remaining: verify final GitHub Actions validation, confirm Cloudflare Preview has deployed this exact commit, and perform authenticated browser tests for dashboard editing, inline editing, save, preview and publication. The earlier Cloudflare Ready screenshot referred to an earlier deployment and does not verify this commit.
- No Production migration/deployment, merge to `main`, or Production data change was performed or authorized.

## 2026-11-19 — CMS history and publication feedback fix

- Fixed CMS version restore controls by using delegated click handling on the persistent history container. Restore buttons are rendered asynchronously and previously had listeners attached before they existed.
- History now displays a loading state and an explicit empty-history message; errors are shown in the history panel.
- After publishing, the Dashboard now reads the public CMS endpoint with `cache: no-store`, compares the public item count with the publish result, and provides a direct link to the selected public page with a cache-busting query parameter.
- Commit: `d28bd1e21473ea3b3b984b056d7e1404774a154c`.
- Preview deployment and browser verification are still pending. The public API count check verifies stored publication visibility, not that every content key maps to the intended visible DOM element.
- No Production deployment, migration or database change was performed.
