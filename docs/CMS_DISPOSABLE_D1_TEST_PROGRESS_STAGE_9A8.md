# Stage 9A.8 — Disposable D1 Compatibility Testing Progress

**Status:** In progress. This document records user-reported SQL execution and query output. The assistant does not have direct access to the D1 Console and has not independently executed or inspected the database.

## 1. Scope and safety boundary

- Intended target: disposable D1 database `consulting-cms-test`.
- User-supplied database ID: `0b9edc46-6aaf-44a9-8bab-1bc19a8e98d8` (not independently verified).
- Do not run these tests against Preview or Production.
- Use synthetic data only.
- No Preview or Production migration, deployment, or mutation is part of this stage.

## 2. Migration 0001 — verified baseline

The user reconstructed the six application tables from committed `migrations/0001_initial_schema.sql`:

- `courses`
- `learners`
- `registrations`
- `inquiries`
- `quotations`
- `audit_logs`

The supplied `sqlite_master` output showed the DDL for all six tables. Comparison against the committed migration found the definitions consistent. The `courses` column metadata also matched the migration.

User-supplied foreign-key results:

- `PRAGMA foreign_keys;` returned `1`.
- `PRAGMA foreign_key_check;` executed successfully and returned no violation rows.

The three expected seed records were verified:

| ID | Slug | Title |
|---|---|---|
| `course-ba` | `business-analysis` | Business Analysis |
| `course-pm` | `project-management` | Project Management |
| `course-sap` | `sap-s4hana` | SAP S/4HANA |

The three expected indexes were verified:

- `idx_inquiries_status` on `inquiries`
- `idx_registrations_learner` on `registrations`
- `idx_registrations_status` on `registrations`

**Checkpoint:** Migration 0001 baseline is verified from user-supplied D1 Console outputs.

## 3. Migration 0002 — verified

The user created the `rate_limits` table and `idx_rate_limits_expiry` index using the definitions in committed `migrations/0002_rate_limits.sql`.

The supplied `sqlite_master` output confirmed:

- Table `rate_limits` with `rate_key`, `window_started_at`, `request_count` (default 0), and `expires_at`.
- Index `idx_rate_limits_expiry` on `rate_limits(expires_at)`.

**Checkpoint:** Migration 0002's table and index definitions are verified from user-supplied D1 Console output.

## 4. Migration 0003 — verified

The user applied the table creation and seed statements from committed `migrations/0003_site_content.sql`.

The supplied SELECT returned all four expected records, with `published = 1`:

- `home.hero.eyebrow` — `text`
- `home.hero.lead` — `textarea`
- `home.hero.note` — `text`
- `home.hero.title` — `text`

This confirms the four seed keys, content types, and published flags. The user then supplied the `sqlite_master` table definition. It matches the committed migration 0003 definition: primary key `content_key`; required `content_value`; `content_type` default `text` constrained to `text`, `textarea`, and `url`; `published` default `1` constrained to `0` or `1`; and `updated_at` default `CURRENT_TIMESTAMP.

**Checkpoint:** Migration 0003 table DDL and seed records are verified from user-supplied D1 Console outputs.

## 5. Migration 0004 — verified

The user created `page_styles` on the disposable D1 target using the statement in committed `migrations/0004_page_styles.sql`. The supplied `sqlite_master` output matches the migration definition: `element_key` primary key; required `draft_json`; nullable `published_json`; `updated_at` defaulting to `CURRENT_TIMESTAMP`; and nullable `published_at`.

**Checkpoint:** Migration 0004 table DDL is verified from user-supplied D1 Console output.

## 6. Migration 0005 — verified

The user created the `pages` table on the disposable D1 target. The supplied `sqlite_master` DDL matches committed `migrations/0005_pages.sql`, including the primary key, unique slug, EN/BN language constraint, draft/published status constraint, required `draft_json`, nullable `published_json`, SEO defaults, timestamps, and nullable `published_at`.

**Checkpoint:** Migration 0005 table DDL and `idx_pages_status_slug` index are verified from user-supplied D1 Console outputs. The index definition is `CREATE INDEX idx_pages_status_slug ON pages(status,slug)`.

## 7. Migration 0006 — verified

The user created `media_assets` on the disposable D1 target. The supplied `sqlite_master` DDL matches committed `migrations/0006_cloudinary_media.sql`: `public_id` primary key; required `secure_url` and `bytes`; `format` defaulting to an empty string; nullable `width` and `height`; and `created_at` defaulting to `CURRENT_TIMESTAMP`.

**Checkpoint:** Migration 0006 table DDL and `idx_media_assets_created` index are verified from user-supplied D1 Console outputs. The index is on `media_assets(created_at DESC)`.

## 8. Migration 0007 — first table verified; remaining objects pending

The user created `chat_conversations` on the disposable D1 target. The supplied `sqlite_master` DDL matches the first table definition in committed `migrations/0007_chat.sql`: `id` primary key; unique required `visitor_token_hash`; `status` default `open` constrained to `open`, `needs_human`, or `closed`; `language` default `en` constrained to `en` or `bn`; and both timestamps defaulting to `CURRENT_TIMESTAMP`.

**Checkpoint:** `chat_conversations` table DDL is verified from user-supplied D1 Console output. Migration 0007's `chat_messages` table DDL has also been supplied and matches the committed definition: `id` primary key; required `conversation_id` referencing `chat_conversations(id)` with `ON DELETE CASCADE`; `sender` constrained to `visitor`, `bot`, or `admin`; required `message`; and `created_at` defaulting to `CURRENT_TIMESTAMP. The user supplied the `idx_chat_conversations_status` definition, which matches the committed SQL (`chat_conversations(status, updated_at)`). The user supplied the `idx_chat_messages_conversation` definition, matching the committed SQL (`chat_messages(conversation_id, created_at)`). Both migration 0007 indexes are now verified.

## 9. Migration 0008 — table and all indexes verified

The user supplied the `analytics_events` table DDL from the disposable D1 target. It matches committed `migrations/0008_analytics.sql` in columns, primary key, required fields, event-name CHECK values, `referrer_host` default, device-type CHECK values/default, and `created_at` default. Formatting/whitespace differs only.

**Checkpoint:** Migration 0008 table DDL is verified from user-supplied D1 Console output. The user supplied the `idx_analytics_events_created` definition, matching the committed SQL (`analytics_events(created_at)`). The user supplied the `idx_analytics_events_page` definition, matching committed SQL (`analytics_events(event_name,page_path,created_at)`). The user supplied the `idx_analytics_events_visitor` definition, matching committed SQL (`analytics_events(visitor_hash,created_at)`). All three indexes are verified.

## 10. Current checkpoint

- [x] Reconstruct and verify migration 0001's six application tables.
- [x] Compare all six table definitions with committed migration 0001.
- [x] Verify `courses` column metadata.
- [x] Verify `PRAGMA foreign_keys` returns `1`.
- [x] Run `PRAGMA foreign_key_check`; no violation rows were reported.
- [x] Verify all three migration 0001 course seed rows.
- [x] Verify all three migration 0001 indexes.
- [x] Create and verify migration 0002's `rate_limits` table.
- [x] Verify migration 0002's `idx_rate_limits_expiry` index.
- [x] Verify the four migration 0003 seed keys, content types, and published flags.
- [x] Compare `site_content` table DDL with migration 0003.
- [x] Apply and verify migration 0004 on the disposable database.
- [x] Create and verify migration 0005's `pages` table.
- [x] Create and verify migration 0005's `idx_pages_status_slug` index.
- [x] Create and verify migration 0006's `idx_media_assets_created` index.
- [x] Create and verify migration 0007's `chat_conversations` table.
- [x] Create and verify migration 0007's `chat_messages` table and foreign key.
- [x] Create and verify `idx_chat_conversations_status`.
- [x] Create and verify `idx_chat_messages_conversation`.
- [x] Create and verify migration 0008's `analytics_events` table.
- [x] Create and verify `idx_analytics_events_created`.
- [x] Create and verify `idx_analytics_events_page`.
- [x] Create and verify `idx_analytics_events_visitor`.
- [ ] Continue with migration 0009 in a controlled, individually verified batch.
- [ ] Only then begin the planned 0010/0011 compatibility scenarios and CMS schema tests.

## 11. Next step — migration 0009

Migration 0008 is complete on the disposable target based on user-supplied table and index definitions. Before creating migration 0009 objects, inspect the committed `migrations/0009_admin_rbac.sql` and execute its table and index statements individually on the disposable target. Verify each definition against the committed SQL. This instruction is limited to the disposable test database; it is not approval to mutate Preview or Production.

## 12. Stop conditions

Stop and investigate if a table definition, seed record, or index differs from the committed migration, a foreign-key check fails, or the target database identity is uncertain. Do not proceed to 0010/0011 or CMS tests until migrations 0001–0009 are reconstructed and verified.

## 13. Repository references

- [Migration 0001](../migrations/0001_initial_schema.sql)
- [Migration 0002](../migrations/0002_rate_limits.sql)
- [Migration 0003](../migrations/0003_site_content.sql)
- [Migration 0004](../migrations/0004_page_styles.sql)

The Stage 9A.7 plan remains the governing test plan. This progress document supplements it; it does not authorize Preview or Production changes.
