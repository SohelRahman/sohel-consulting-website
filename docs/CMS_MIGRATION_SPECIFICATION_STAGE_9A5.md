# CMS Migration Specification — Stage 9A.5

**Status:** Design specification; not approved for execution  
**Branch:** `current-focus-development`  
**Target environment:** Preview D1 only  
**Production:** Explicitly excluded  
**Last reviewed:** 2026-11-18

## 1. Purpose and scope

This document defines the proposed compatibility migration from the CMS schema currently observed in Preview D1 to the approved seven-table CMS design direction. It also defines the legacy content import boundary, execution preconditions, recovery controls and acceptance tests.

This is a documentation artifact. It does not authorize creation or application of a migration file, execution against D1, application-code changes, Preview deployment or any Production operation.

## 2. Evidence classification

### 2.1 Verified from user-supplied Preview D1 output

- Preview database ID: `e0317397-77cb-4f36-9d19-2594ff75b0c2`.
- Legacy row counts: `pages=1`, `site_content=4`, `page_styles=1`.
- CMS row counts: all seven CMS tables have zero rows.
- All seven CMS table definitions and the four named non-auto indexes were supplied.
- Individual foreign-key outputs were supplied for `cms_page_locales`, `cms_sections`, `cms_content_elements`, `cms_content_values`, `cms_content_versions` and `cms_page_versions`.
- `PRAGMA foreign_keys` previously returned `1`; `PRAGMA foreign_key_check` displayed no violation rows.
- Legacy page `corporate-training` is English, has `status='draft'`, `draft_json={"sections":[]}` and `published_json=NULL`.
- Four `home.hero.*` rows in `site_content` have `published=1`; `home.hero.lead` uses `textarea`.
- `page_styles` contains `home.hero.note` with draft and published JSON values.

### 2.2 Verified repository observations

- Current development branch: `current-focus-development`.
- Branch HEAD at the time of this review: `8dc8820b206457e52b8c055849c780497610018c`.
- Repository migration directory contains `0001` through `0011`; no dedicated CMS migration file was present in that directory listing.
- The supplied Preview `d1_migrations` history listed only `0001` through `0009`.

### 2.3 Unresolved facts

- The process that created the seven CMS tables in Preview is unknown.
- The supplied combined PRAGMA output for `cms_pages` was empty; its DDL declares no foreign keys.
- No individual `PRAGMA foreign_key_list(cms_pages)` result is necessary because the supplied DDL declares no references.
- D1 SQLite feature/version and transaction behavior for the exact proposed migration have not yet been tested.
- The full Worker/API dependency scan for every file and deployment path has not been completed.
- Production schema and data have not been inspected and are out of scope.

Do not infer migration provenance from table existence or assume that repository migration files fully describe the deployed Preview schema.

## 3. Current Preview CMS schema

The existing seven tables are empty. Their relevant current structure is:

| Table | Current structure and constraints |
| --- | --- |
| `cms_pages` | `id`, unique `page_key`, constrained `page_type` (`static`, `system`, `builder`, `global`), `is_active`, timestamps |
| `cms_page_locales` | `page_id`, `language` (`en`/`bn`), `route`, title/SEO fields, unique optional `legacy_page_id`, `published_at`, timestamps; unique page/language |
| `cms_sections` | `locale_id`, `section_key`, label, `sort_order`, required/active/deleted state, timestamps; unique locale/key |
| `cms_content_elements` | `section_id`, `element_key`, label, content type CHECK, `config_json`, required/active/deleted state, timestamps; unique section/key |
| `cms_content_values` | element primary key, `default_value`, `draft_value`, mutable `published_value`, updater and timestamp |
| `cms_content_versions` | element, constrained action, old/new Draft and published values, admin email and timestamp |
| `cms_page_versions` | locale, `version_number`, JSON snapshot, admin email and timestamp; unique locale/version |

### 3.1 Existing named indexes

- `idx_cms_elements_section_order`: `cms_content_elements(section_id, is_active)`
- `idx_cms_content_versions_element`: `cms_content_versions(element_id, created_at DESC)`
- `idx_cms_locale_route`: unique `cms_page_locales(route)` where route is not NULL
- `idx_cms_sections_locale_order`: `cms_sections(locale_id, sort_order)`

SQLite autoindexes also exist for primary-key and unique constraints. Preserve those constraints during any rebuild.

### 3.2 Verified foreign-key relationships

All supplied foreign keys use `ON DELETE RESTRICT` and `ON UPDATE NO ACTION`.

| Child | Column | Parent |
| --- | --- | --- |
| `cms_page_locales` | `page_id` | `cms_pages.id` |
| `cms_page_locales` | `legacy_page_id` | `pages.id` |
| `cms_sections` | `locale_id` | `cms_page_locales.id` |
| `cms_content_elements` | `section_id` | `cms_sections.id` |
| `cms_content_values` | `element_id` | `cms_content_elements.id` |
| `cms_content_versions` | `element_id` | `cms_content_elements.id` |
| `cms_page_versions` | `locale_id` | `cms_page_locales.id` |

Retain restrictive deletion semantics. Content, locale, page and version history must not be physically removed as part of normal CMS delete operations.

## 4. Target design requirements

The seven-table model remains the target design direction. This section is a specification, not an executable DDL script.

### 4.1 Page and locale publication control

`cms_page_locales` needs:
- a monotonically increasing Draft revision;
- a publication revision recording the Draft revision used for the latest successful publication;
- a nullable pointer to the current published page version;
- a clear rule for the initial state where no published version exists.

A publication operation must validate the expected Draft revision, create an immutable snapshot, and update the publication revision and current-version pointer atomically. A stale publication attempt must fail without changing the public pointer.

### 4.2 Same-locale current-version integrity

A simple foreign key from `current_published_version_id` to `cms_page_versions.id` would not prove that the referenced version belongs to the same locale.

The implementation must enforce same-locale ownership. Candidate approaches are:
1. a composite foreign key backed by a matching unique parent key; or
2. database triggers that validate the referenced version's locale on insert/update.

Choose one only after a D1 SQLite compatibility test. Document the exact constraint/trigger and test cross-locale rejection. Do not rely only on application-level validation.

### 4.3 Sections and renderer compatibility

Add section renderer type and section configuration to `cms_sections`. Preserve existing page-builder section types:
- `hero`
- `text`
- `split`
- `cards`
- `cta`

The renderer must validate supported types and their configuration. Unknown section types must fail safely rather than silently render arbitrary markup.

### 4.4 Content elements and values

- Add element ordering/position if required by the renderer.
- Preserve current `config_json` and its JSON validity check.
- Expand supported content types to include all current types plus `textarea`.
- Do not silently coerce `textarea` to `text`.
- Preserve `default_value`, `draft_value` and historical `published_value` during transition.
- The immutable page snapshot becomes the authoritative public CMS content source. Mutable `published_value` must not be a second public source.

The immutable default policy must be explicit. A current legacy published value is not proof of the original historical default. For imported legacy content, the current value may be designated as the migration baseline only as a documented baseline decision.

### 4.5 Version history

- Preserve existing action values and historical fields.
- Add monotonic per-element version numbering if retained as part of the final design.
- Preserve actor attribution and timestamps.
- Page snapshots must be immutable after insertion.
- Historical restoration copies content into Draft; it does not overwrite a historical snapshot or publish automatically.

### 4.6 Global content

Global is one logical page with independent EN and BN locale records and independent publication histories. Page publication and Global publication are separate operations. Public rendering composes the selected page's published snapshot with the matching locale's published Global snapshot. Global Draft must never be public.

Homepage hero content is not Global content. Shared header, footer and genuinely site-wide content belong in Global.

### 4.7 Styles

Keep `page_styles` separate from CMS content publication. Do not duplicate style configuration in `cms_content_values` or make page content publication implicitly publish styles.

## 5. Legacy import specification

Legacy records remain unchanged during import. Import must be idempotent, use stable deterministic mapping keys, and stop on unexpected collisions rather than overwrite records.

### 5.1 Corporate Training page

Source:
- `pages.id = 63c60e01-f4ca-40b5-9a2a-ab0723d57d62`
- `slug = corporate-training`
- `title = Corporate Training Solutions`
- `language = en`
- `status = draft`
- `draft_json = {"sections":[]}`
- `published_json = NULL`
- `seo_title = Corporate Training`
- `seo_description = Corporate Training lsdjfe`

Proposed mapping:
- `cms_pages.page_key = corporate-training`
- `cms_pages.page_type = builder`
- locale language = `en`
- locale route = `corporate-training`
- locale title/SEO copied exactly
- `legacy_page_id` references the original `pages.id`
- Draft structure reflects the empty legacy sections array
- no published page snapshot is created because legacy `published_json` is NULL

The legacy `status` field alone must not be treated as proof of publication.

### 5.2 Homepage content

Source keys:
- `home.hero.eyebrow` — `text`
- `home.hero.lead` — `textarea`
- `home.hero.note` — `text`
- `home.hero.title` — `text`

All four source rows have `published=1`. Preserve each key, value and content type exactly. Proposed destination:
- logical page key: `home`
- page type: `static`
- locale: `en`
- section key: `hero`
- element keys retain the complete original `home.hero.*` key or use a separately documented lossless key mapping.

The first Home EN published snapshot must reproduce the four existing published values. The initial Draft must be initialized consistently with the migration baseline so an immediate post-import edit does not unexpectedly revert or erase content.

Do not create a Global record from these homepage keys.

### 5.3 Homepage style

Source:
- `page_styles.element_key = home.hero.note`
- draft and published style JSON are present and equal in the supplied output.

Keep this record in `page_styles` unchanged. Its publication lifecycle remains separate.

### 5.4 Legacy import invariants

- No source legacy row is deleted or modified.
- The existing public renderer remains active until CMS rendering passes Preview QA.
- Import can be retried without duplicate page, locale, section or element records.
- Import conflicts are reported and halt the import; do not overwrite.
- Imported content and snapshots are compared byte-for-byte or by a documented canonical JSON comparison.
- No Global content is inferred from homepage-specific keys.

## 6. Migration approach

The migration must be a new numbered migration after the actual applied history has been reconciled. Never edit an already-applied migration.

### Phase 0 — Provenance and preflight (blocking)

1. Reconfirm Preview database ID and target environment.
2. Query `d1_migrations` and compare with repository migration files.
3. Determine whether the seven CMS tables were created by manual SQL, an untracked migration, another branch or another deployment path. If origin cannot be established, record it as unknown.
4. Capture exact `sqlite_master` DDL and indexes.
5. Record row counts and relevant source-row hashes/exports.
6. Confirm no CMS tables contain data immediately before migration.
7. Verify foreign-key enforcement and run `PRAGMA foreign_key_check`.
8. Test required SQLite features and D1 transaction behavior on a disposable Preview test database or isolated test fixture before using the real Preview database.

**Stop condition:** If table definitions, migration history, database identity or data counts differ from the reviewed evidence, do not proceed. Reassess the plan.

### Phase 1 — Additive schema changes

Prefer additive nullable/defaulted columns where safe. Candidate additions include:
- locale Draft revision;
- locale publication revision;
- current published-version pointer;
- section type and section configuration;
- element position;
- version source Draft revision;
- structured history metadata where needed.

Do not add a current-version pointer until same-locale integrity enforcement has been selected and tested.

### Phase 2 — Constraint changes

The current content-element CHECK constraint does not allow `textarea`. SQLite generally requires a table rebuild to change an existing CHECK constraint.

If a rebuild is required:
1. create a replacement table with the approved complete definition;
2. copy every existing column and value explicitly;
3. verify row counts and key uniqueness;
4. replace the old table using a tested D1-compatible procedure;
5. recreate named indexes and triggers;
6. verify all foreign keys and dependent references.

Do not use `DROP TABLE` as a shortcut. Test the exact procedure with foreign-key enforcement enabled. If the tested rebuild requires changing foreign-key enforcement, do not improvise in a live migration; redesign the procedure or use a safe staged migration.

### Phase 3 — Legacy import

1. Create Home page identity and EN locale.
2. Create Home hero section and four content elements.
3. Import values and preserve `textarea`.
4. Create the initial immutable Home EN snapshot from the currently published legacy values.
5. Create Corporate Training page identity and EN locale linked to the legacy page.
6. Import its Draft metadata and empty structure; do not create a published snapshot.
7. Leave `page_styles` untouched.
8. Record audit events and import provenance.

### Phase 4 — Application compatibility (separate approval)

No Worker/API changes are part of this schema specification. Before application cutover:
- add CMS APIs with server-side RBAC;
- keep legacy APIs compatible during gradual page-by-page integration;
- adapt `site_content` immediate-publish behavior so CMS Save Draft cannot change public content;
- keep `page_styles` independent;
- implement snapshot-only public rendering;
- test cache invalidation and Global/page composition;
- preserve existing URLs and route behavior.

### Phase 5 — Validation and controlled cutover

Run the acceptance tests in Section 9. Keep the legacy renderer active until all relevant page/language tests pass. Enable CMS rendering page-by-page in Preview. Do not remove legacy tables or APIs during initial rollout.

## 7. Recovery and rollback

Before any migration:
- create and verify a recoverable Preview backup/export;
- record the exact database ID, migration history, schema fingerprint and row counts;
- identify the available D1 recovery mechanism and its retention/limitations;
- retain the legacy source records and renderer.

Recovery rules:
- A failed migration must not be followed by speculative manual SQL.
- If the migration is not safely reversible, restore Preview from the verified pre-migration recovery point and rerun only after correcting the migration.
- A failed import must leave legacy source rows unchanged and be safely retryable.
- A failed publication must leave the previous published-version pointer unchanged.
- Never use Production data as a test or recovery source.

A D1 bookmark is not assumed to be a complete substitute for a verified export/backup. Confirm current Cloudflare recovery behavior before relying on it.

## 8. Required validation SQL

Run each query separately in Preview D1. These are validation examples; adjust only after the final migration schema is approved.

### 8.1 Foreign-key integrity

```sql
PRAGMA foreign_keys;
PRAGMA foreign_key_check;
```

Expected: enforcement enabled; no rows returned by `foreign_key_check`.

### 8.2 Row counts

```sql
SELECT
  (SELECT COUNT(*) FROM pages) AS legacy_pages,
  (SELECT COUNT(*) FROM site_content) AS legacy_site_content,
  (SELECT COUNT(*) FROM page_styles) AS legacy_page_styles,
  (SELECT COUNT(*) FROM cms_pages) AS cms_pages,
  (SELECT COUNT(*) FROM cms_page_locales) AS cms_page_locales,
  (SELECT COUNT(*) FROM cms_sections) AS cms_sections,
  (SELECT COUNT(*) FROM cms_content_elements) AS cms_content_elements,
  (SELECT COUNT(*) FROM cms_content_values) AS cms_content_values,
  (SELECT COUNT(*) FROM cms_content_versions) AS cms_content_versions,
  (SELECT COUNT(*) FROM cms_page_versions) AS cms_page_versions;
```

Expected after import: legacy counts remain unchanged; CMS counts match the approved import manifest.

### 8.3 Homepage import comparison

```sql
SELECT content_key, content_value, content_type, published
FROM site_content
WHERE content_key IN (
  'home.hero.eyebrow',
  'home.hero.lead',
  'home.hero.note',
  'home.hero.title'
)
ORDER BY content_key;
```

Compare every source value/type against the imported CMS Draft and published snapshot.

### 8.4 Corporate Training source remains intact

```sql
SELECT id, slug, language, status, draft_json, published_json
FROM pages
WHERE id = '63c60e01-f4ca-40b5-9a2a-ab0723d57d62';
```

Expected: source row remains unchanged and published JSON remains NULL.

### 8.5 Route uniqueness

```sql
SELECT route, COUNT(*) AS route_count
FROM cms_page_locales
WHERE route IS NOT NULL
GROUP BY route
HAVING COUNT(*) > 1;
```

Expected: no duplicate routes under the current global route uniqueness policy.

### 8.6 Snapshot validity

```sql
SELECT id
FROM cms_page_versions
WHERE json_valid(snapshot_json) = 0;
```

Expected: no rows.

### 8.7 Same-locale pointer validation

The exact query depends on the approved pointer column name. The final implementation must include a test that attempts to point one locale at another locale's version and confirms the database rejects it.

## 9. Acceptance criteria

- [ ] Migration history and schema fingerprint are reconciled.
- [ ] Preview database identity is verified before execution.
- [ ] A verified recovery point exists.
- [ ] Seven CMS tables match the approved schema.
- [ ] All existing legacy rows remain unchanged.
- [ ] CMS import is idempotent.
- [ ] Home EN snapshot contains the four published homepage values.
- [ ] `textarea` remains `textarea`.
- [ ] Corporate Training remains Draft and has no published snapshot.
- [ ] `page_styles` remains independent and unchanged.
- [ ] Foreign-key check returns no violations.
- [ ] Required indexes and uniqueness constraints exist.
- [ ] Same-locale current-version integrity is enforced by the database.
- [ ] Draft changes do not affect public snapshots.
- [ ] Publication is atomic and rejects stale revisions.
- [ ] Historical snapshots are immutable.
- [ ] Global EN and BN publish independently from page content.
- [ ] Legacy renderer/API compatibility is verified.
- [ ] Server-side authorization and input validation pass.
- [ ] Preview browser QA passes before any cutover.

## 10. Approval gates and exclusions

This document does not approve:
- creating or applying a D1 migration;
- modifying Worker, admin or browser code;
- changing Preview configuration or deploying Preview;
- deleting legacy tables, rows, APIs or renderers;
- running any Production migration or deployment.

Required approvals are separate:
1. approve the final target schema and migration SQL;
2. approve a Preview-only migration execution;
3. approve application/API integration and Preview deployment;
4. separately approve any Production release.

**Current decision:** design specification only. Migration provenance remains unresolved. Exact executable migration SQL is intentionally withheld until the preflight/provenance gate and D1 compatibility tests are complete.
