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

