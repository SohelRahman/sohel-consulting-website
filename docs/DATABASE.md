# Database Reference

## D1 environments

The Worker accesses D1 through the `DB` binding. The repository's Wrangler configuration defines separate Production and Preview database bindings.

| Environment | Database name | Database ID |
| --- | --- | --- |
| Production | `consulting-db` | `3a4f765a-46c2-4040-9753-36e9483893a4` |
| Preview | Dedicated Preview D1 | `e0317397-77cb-4f36-9d19-2594ff75b0c2` |

**Safety:** Never use the Production database for development, Preview testing or experiments. Verify the target before every migration command.

## Migration history

Apply migrations in ascending order using Wrangler D1 migration commands with the correct environment/configuration.

| Migration | Main objects |
| --- | --- |
| `0001_initial_schema.sql` | `courses`, `learners`, `registrations`, `inquiries`, `quotations`, `audit_logs`; initial course records |
| `0002_rate_limits.sql` | `rate_limits` and expiry index |
| `0003_site_content.sql` | `site_content` and initial homepage content |
| `0004_page_styles.sql` | `page_styles` |
| `0005_pages.sql` | `pages` and status/slug index |
| `0006_cloudinary_media.sql` | `media_assets` and creation-date index |
| `0007_chat.sql` | `chat_conversations`, `chat_messages` and indexes |
| `0008_analytics.sql` | `analytics_events` and reporting indexes |
| `0009_admin_rbac.sql` | `admin_users`, account roles, PBKDF2 password hashes, per-user permission assignments and session revocation version |

This list reflects migration files present in the development branch. The actual applied migration state must be checked independently in each D1 environment before deployment.

## Table responsibilities

- **courses:** Course catalogue, bilingual titles/summaries, delivery modes, languages, pricing configuration and active state.
- **learners:** Contact details for people registering for courses.
- **registrations:** Course registration, reference code, preferences, review status, payment status and enrollment status.
- **inquiries:** General consulting/training inquiries and workflow status.
- **quotations:** Draft and issued fee quotations associated with registrations or inquiries.
- **audit_logs:** Administrator action history.
- **rate_limits:** Hashed rate-limit keys, counters and expiry timestamps.
- **site_content:** Editable site text and publication state.
- **page_styles:** Draft and published style configuration.
- **pages:** Custom page metadata and draft/published page content.
- **media_assets:** Cloudinary asset metadata; binary media is not stored in D1.
- **chat_conversations:** Conversation token hash, language and support status.
- **chat_messages:** Visitor, bot and administrator messages.
- **analytics_events:** Limited analytics event metadata and visitor hash.
- **admin_users:** Dashboard accounts, role, salted password hash, assigned permissions, account status and session version used to revoke existing sessions after credential resets.

## Important status constraints

The schema constrains registration, payment, enrollment, inquiry, quotation, page, chat and analytics status values. Review the SQL migration before changing any status value in Worker code or the admin interface.

Payments are not integrated. The initial schema uses `not_configured` as the payment status for new registrations.

## Preview migration workflow

The repository workflow `.github/workflows/migrate-preview-d1.yml` is manually triggered from `current-focus-development`. It verifies the Preview D1 UUID in the `[previews.d1_databases]` section, lists pending migrations, applies pending migrations using Wrangler's Preview D1 mode, and lists migration state again. The workflow requires the GitHub Actions secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.

The workflow is restricted to the development branch and targets the configured Preview binding only. Do not run it from `main`. A successful workflow run is the evidence that migrations were applied; merely committing this workflow does not apply any migration.

## Migration procedure

1. Review the SQL file and its compatibility with the current schema.
2. Confirm the target environment and D1 database ID.
3. Check which migrations have already been applied.
4. Back up/export data when the change warrants it.
5. Apply the migration to Preview first.
6. Verify schema and application behavior in Preview.
7. Apply to Production only through an explicitly approved release procedure.
8. Record the migration and deployment in the changelog.

Never edit an already-applied migration to change its historical effect. Add a new numbered migration instead.
