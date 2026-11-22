# Database migration inventory and verification status — 2026-11-22

The development branch contains migration files 0001–0017. File presence is not proof that a migration has been applied to a remote database.

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
| 0014 | `0014_cloudinary_delete_operations.sql` |
| 0015 | `0015_cloudinary_reference_locks.sql` |
| 0016 | `0016_cloudinary_upload_operations.sql` |
| 0017 | `0017_cloudinary_inventory_snapshots.sql` |

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

## Read-only Preview migration audit workflow

A dedicated GitHub Actions workflow is available at
`.github/workflows/audit-preview-d1-migrations.yml`.

- It can be started manually from the `current-focus-development` branch in GitHub Actions.
- It verifies the Cloudflare API token and checks the configured Preview D1 ID against the expected Preview ID.
- It retrieves the remote migration list with `wrangler d1 migrations list --remote`.
- It contains no migration apply command and does not alter the database.
- Its successful completion and output are required before recording the live Preview migration ledger as verified.

The read-only Preview audit completed successfully on 2026-11-22 (GitHub Actions run 3, commit `b74761d0abaa740c51bd072f0918b795872e513d`). It verified the Cloudflare API token and the dedicated Preview database `consulting-preview-db` (ID `e0317397-77cb-4f36-9d19-2594ff75b0c2`), then ran Wrangler 4.160.1 `d1 migrations list --remote`. Wrangler reported only `0013_quotation_response_tokens.sql` under “Migrations to be applied”; migrations 0001–0012 were not listed as pending. The workflow's read-only safety guard also passed. Earlier runs failed because the original guard matched its own literal search text; the guard was corrected on both `current-focus-development` and `main`. No migration was applied. Production remains out of scope.

## Migration 0013 SQL and application compatibility review

Reviewed `migrations/0013_quotation_response_tokens.sql`, the quotation response handlers in `src/worker.js`, `quote-response.html`, and the existing `scripts/test-quotation-response.mjs` contract test.

- The migration is additive: it creates `quotation_response_tokens` and two lookup/expiry indexes; it does not alter or backfill existing quotation or registration rows.
- `quote_id` is required and references `quotations(id)` with `ON DELETE CASCADE`; `token_hash` is required and unique. The expiry, used, revoked, and created timestamps support the lifecycle used by the Worker.
- The Worker creates a 32-byte cryptographically random bearer token, stores only its SHA-256 hash, and sends the raw token in the URL fragment. The response page removes the fragment from browser history before making same-origin POST requests.
- The endpoint checks same-origin requests, rate-limits attempts, checks token expiry/revocation/use and quotation status, and batches token consumption with quotation/registration state changes. Acceptance sets registration approval and payment pending; it does not confirm enrollment or payment.
- Re-issuing a response link revokes prior unused tokens before inserting the new token in a D1 batch.
- The existing contract test checks these code-level invariants, including token handling, origin checks, rate limiting, response-page behavior, and migration structure.

**Review outcome:** no blocking SQL/application incompatibility was identified by static review. This is not a live integration test. It does not prove the migration has been applied, nor does it test real concurrent requests, token expiry at runtime, or the complete learner journey against Preview. Migration 0013 remains pending on Preview. Do not apply it until the separate migration-application approval is obtained. Production remains out of scope.


## 2026-11-22 — Admin diagnostics and Preview verification follow-up

The three Admin diagnostic workflows were inspected on `current-focus-development`:

- `.github/workflows/diagnose-preview-admin-login.yml`
- `.github/workflows/diagnose-preview-admin-login-schema.yml`
- `.github/workflows/diagnose-preview-admin-schema.yml`

All three normalize `CLOUDFLARE_API_TOKEN` with the JavaScript regex literal `/\\\\s+/g`, which matches a literal backslash followed by `s`, rather than whitespace. The intended expression is `/\\s+/g`. These workflows should not be relied on until corrected and revalidated. No workflow files were changed in this follow-up.

Their database inspection steps use table metadata, read-only SELECTs and SQL `EXPLAIN` statements. The workflows are guarded to `current-focus-development` and construct a dedicated Preview D1 binding. Their execution has not been confirmed in this follow-up.

The Preview migration audit remains the authoritative live ledger evidence: run `45024256326` verified Preview D1 identity and reported only `0013_quotation_response_tokens.sql` as pending. Migration 0013 has not been applied. Production and `main` remain untouched.


## 2026-11-22 — Preview Admin diagnostic workflow corrections

The token normalization expression was corrected in all three Preview Admin diagnostic workflows on `current-focus-development`:

- `.github/workflows/diagnose-preview-admin-login.yml`
- `.github/workflows/diagnose-preview-admin-login-schema.yml`
- `.github/workflows/diagnose-preview-admin-schema.yml`

Each now uses `replace(/\\s+/g, "")`, which removes whitespace as intended. All three files were fetched again after their commits and checked for the corrected expression and absence of the malformed expression.

The migration workflow was re-inspected before any application attempt. It has a manual `workflow_dispatch` trigger, a development-branch guard, an exact Preview D1 ID check, an explicit Production D1 ID exclusion, and pre-/post-application migration listings. Its apply command targets only `PREVIEW_DB`. The workflow was not dispatched in this session because the connected GitHub interface does not provide a workflow-dispatch operation. Therefore migration 0013 remains pending; the previous read-only audit remains the latest verified ledger evidence.


## 2026-11-22 — Preview D1 migration and Admin schema diagnostics

**Environment:** Preview D1, `consulting-preview-db`, ID `e0317397-77cb-4f36-9d19-2594ff75b0c2`.

- The guarded migration workflow completed successfully on `current-focus-development` (run #8). The visible verification output stated `No migrations to apply!`, indicating no migrations remained pending at that check.
- The screenshots provided did not expose the complete post-application migration ledger. Do not claim a specific migration filename as independently ledger-verified from that output alone.
- The corrected read-only Admin diagnostics successfully queried the Preview database.
- `sqlite_master` returned all three required tables: `admin_users`, `audit_logs`, and `rate_limits`.
- `SELECT COUNT(*) AS admin_user_count FROM admin_users` returned `1`.
- `PRAGMA table_info` succeeded for all three tables. The observed columns were:
  - `rate_limits`: `rate_key`, `window_started_at`, `request_count`, `expires_at`.
  - `admin_users`: `id`, `email`, `full_name`, `role`, `password_hash`, `permissions_json`, `is_active`, `session_version`, `created_at`, `updated_at`, `last_login_at`.
  - `audit_logs`: `id`, `admin_email`, `action`, `entity_type`, `entity_id`, `details`, `created_at`.
- The read-only diagnostic commands reported `changed_db: false` and `rows_written: 0`.
- Preview identity verification passed and the workflow explicitly excluded the known Production D1 ID.

These results establish that the inspected tables and columns exist in Preview. They do not establish that every application query or workflow is correct. Further functional testing has been deferred at the user's request.


## Cloudinary inventory snapshot migration 0017

Migration 0017 creates `cloudinary_inventory_scans` and `cloudinary_inventory_assets`. It stores independent image/raw cursors, completion states, page counters, processing leases and remote asset metadata. It does not alter existing business records or Cloudinary assets.

The migration file's presence on `current-focus-development` does not prove it has been applied to Preview. Preview migration and Worker deployment are not authorized by the source implementation and must be handled as a separately approved operation. Production and `main` remain untouched.
