

> **Current development status — 2026-11-19**
>
> Registration workflow integrity has now been implemented on `current-focus-development`: custom quotes are recorded as draft quotation history, payment status can be updated manually with audit logging, and Admin exposes quote history/payment/enrollment controls. CI and Preview acceptance are pending; see Section 12 of `DEVELOPMENT_HANDOVER_PROMPT.md`.
>
> Course discount and registration-fee consistency is implemented on `current-focus-development`: shared server-side pricing calculation, API-derived price breakdown, aligned English/Bangla course display, stricter discount validation and zero-fee visibility in Admin. CI and Preview acceptance remain pending; see Section 11 of `DEVELOPMENT_HANDOVER_PROMPT.md`.
>
> **Current CMS status — 2026-11-19**
>
> The bilingual static-page CMS is implemented on `current-focus-development`. Preview D1 migration 0012 was applied manually by the user and the user-reported verification showed four imported English homepage records, four published history rows, all six legacy CMS tables preserved, and migration ledger entries 0001–0012. These are user-supplied D1 Console results, not a direct database inspection by the repository maintainer.
>
> The CMS supports 12 English and 12 Bangla static pages plus a separate Global context. The Admin Dashboard supports page/language selection, draft save, page/language publish, authenticated draft preview, key inspection, soft archive/restore, version history and restore-to-draft. The public binding layer targets eligible static text nodes, image sources, links and SEO metadata; it deliberately excludes forms, dynamically generated course data, chat and other interactive controls.
>
> **Two editing paths:** (1) Dashboard editing by selecting or entering a content key; (2) on-page editing from the `?cmsKeys=1` inspector by clicking a highlighted element and using the inline editor panel. Both save drafts through the same authenticated `POST /api/admin/cms/save` endpoint. Inline editing was committed in `assets/cms.js` at commit `754507b0a28290cc972929f61bef891fbe9b880c`; it still requires a fresh Preview deployment and live browser acceptance testing. A successful CI run for the final follow-up commit and live inline-editor behavior have not yet been confirmed.
>
> Do not treat the earlier Cloudflare “Ready” screenshot as deployment evidence for commit `754507b`; it showed an earlier commit. No Production deployment, migration, merge to `main`, or Production data change is authorized.


### Stage 9A.8 — disposable D1 compatibility testing (2026-11-18)

- Disposable target `consulting-cms-test` and its ID are user-supplied and have not been independently verified. All SQL evidence is user-reported from the D1 Console.
- Migration 0001 verified: six application table definitions match the committed migration; three starter course rows match; all three expected indexes exist; `PRAGMA foreign_keys` returned `1`; `PRAGMA foreign_key_check` returned no violation rows.
- Migration 0002 verified: `rate_limits` table definition and `idx_rate_limits_expiry` index match committed migration 0002 based on supplied `sqlite_master` output.
- Migration 0003 fully verified: four expected homepage hero seed keys, content types (including `home.hero.lead` as `textarea`), and `published = 1` were returned; supplied `sqlite_master` DDL matches the committed table definition.
- Migration 0004 verified: user-created `page_styles` table DDL matches committed migration 0004.
- Migration 0005 verified: supplied `pages` table DDL and `idx_pages_status_slug` index match committed migration 0005.
- Migration 0006 verified: supplied `media_assets` table DDL and `idx_media_assets_created` index match committed migration 0006.
- Migration 0007 first table verified: supplied `chat_conversations` DDL matches committed migration 0007. The `chat_messages` table DDL is verified, including its `ON DELETE CASCADE` foreign key. `idx_chat_conversations_status` is verified; both `idx_chat_conversations_status` and `idx_chat_messages_conversation` are verified against the committed migration.
- Migration 0008 fully verified: supplied `analytics_events` table DDL and all three indexes (`idx_analytics_events_created`, `idx_analytics_events_page`, `idx_analytics_events_visitor`) match committed migration 0008. Migration 0009 fully verified: supplied `admin_users` table DDL and `idx_admin_users_role_active` index match committed migration 0009. Migrations 0001–0009 have been reconstructed and verified on the disposable target from user-supplied output. This manual reconstruction did not create or update `d1_migrations` entries. Migration 0010 clean-start compatibility test passed on the confirmed disposable target: five expected columns match committed SQL; course count remained 3; `discount_type` is non-null for all three; `syllabus_url` is NULL for all three. Next, test migration 0011's new column and data transfer using synthetic data. The 0010 CHECK-constraint behavior test and CMS schema tests remain outstanding. Do not use the general Wrangler migration workflow.
- Progress is tracked in `docs/CMS_DISPOSABLE_D1_TEST_PROGRESS_STAGE_9A8.md`. Preview and Production remain out of scope. These activities are limited to reconstructing and verifying the baseline on the disposable target; no CMS schema tests, application code change, or deployment has been performed.


> **Learner quotation response — 2026-11-19**
>
> Implemented on `current-focus-development`: one-time high-entropy response tokens with SHA-256-only storage, seven-day expiry, bilingual learner response page, Admin issuance for draft quotations, and learner accept/decline API. No email provider is configured; Admin must share the generated URL manually. Acceptance approves registration and sets payment pending while leaving enrollment unchanged; decline leaves those statuses unchanged. Migration 0013 must be applied manually to Preview D1. CI and Preview acceptance are pending; Production and `main` untouched. See Section 14 of `DEVELOPMENT_HANDOVER_PROMPT.md`.
