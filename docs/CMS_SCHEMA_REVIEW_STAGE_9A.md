# Stage 9A — Stage 6 CMS Database Schema Review

**Review status:** Reviewed; changes required before approval.  
**Implementation status:** Not implemented.  
**Database status:** No CMS migration created or applied.  
**Branch reviewed:** `current-focus-development`.

## 1. Review scope and inspected source

Reviewed the Stage 6 seven-table proposal recorded in the project handover and database reference, and inspected these existing repository migrations:

- `migrations/0001_initial_schema.sql` — operational tables and `audit_logs`.
- `migrations/0003_site_content.sql` — current editable site content.
- `migrations/0004_page_styles.sql` — draft/published visual styles.
- `migrations/0005_pages.sql` — existing custom page-builder storage.
- `migrations/0009_admin_rbac.sql` — administrator accounts and permission storage.

The existing schema confirms:
- `pages` stores `slug`, `title`, `language`, `status`, `draft_json`, `published_json`, SEO fields and publication timestamps.
- `site_content` stores one `content_value` and a `published` flag; the existing Admin Panel describes this workflow as immediate publication.
- `page_styles` already has separate draft and published JSON.
- `audit_logs` records `admin_email`, action, entity type, entity ID and details.
- `admin_users.permissions_json` is the current RBAC permission source.

The actual applied Preview D1 schema and migration history have not been verified. Repository migration files do not prove which migrations are applied remotely.

## 2. Proposed seven-table baseline

The Stage 6 proposal contains:

1. `cms_pages`
2. `cms_page_locales`
3. `cms_sections`
4. `cms_content_elements`
5. `cms_content_values`
6. `cms_content_versions`
7. `cms_page_versions`

The separation of logical page identity, language-specific page data, section/element structure, content values and history is appropriate. Keep the additive approach and do not replace the existing `pages`, `site_content` or `page_styles` tables.

## 3. Required schema revisions

### R1 — Preserve page-builder section type and renderer configuration

**Finding:** The proposed `cms_sections` fields include a section key and label, but do not explicitly preserve the existing page-builder section type or its renderer-specific configuration.

The current page builder uses section types including `hero`, `text`, `split`, `cards` and `cta`.

**Required change:**
- Add a constrained `section_type` field or equivalent stable renderer identifier.
- Add validated `config_json` for section-level presentation/layout configuration.
- Define an explicit mapping from existing page-builder JSON into CMS sections/elements.
- Preserve existing page IDs, slugs, section IDs/keys, content and SEO metadata during migration.

Do not treat an element's content type (for example, `rich_text` or `image`) as a replacement for the page-builder section type.

### R2 — Make published structure independent from editable structure

**Finding:** The proposal has one `is_active` / `deleted_at` state on sections and elements. That state alone cannot safely represent both the administrator's current draft structure and the currently published public structure.

This matters because:
- A newly created section must not appear publicly before publication.
- A deleted section/element must remain publicly visible until the next successful publication, as the user approved.
- Reordering or editing a section in Draft must not change the public page before publication.

**Required change:**
Use the complete published page snapshot as the public rendering source of truth. The admin structure tables can represent the current editable working structure; a successful page publication writes a complete immutable snapshot to `cms_page_versions` and updates an explicit current-published-version reference on the locale. Public rendering reads only that published snapshot.

Do not derive public structure directly from the current `is_active` flags in the editable section/element tables.

### R3 — Add an explicit current published version reference and concurrency control

**Finding:** `cms_page_versions` has a sequential version number, but `cms_page_locales` does not explicitly identify the currently published snapshot or maintain a publication revision.

**Required change:**
- Add a nullable `current_published_version_id` (or equivalent version pointer) to `cms_page_locales`.
- Add a publication revision/current version field suitable for optimistic concurrency.
- Define how the first publication works (no prior version).
- Ensure the expected-version check and publication update occur atomically.
- Add an appropriate foreign-key relationship once the chosen key design is finalized.

A stale editor must receive a conflict response rather than overwrite a newer published version.

### R4 — Reuse the existing audit log for structural and administrative events

**Finding:** `cms_content_versions` captures element value changes and `cms_page_versions` captures page snapshots. Neither alone provides a complete record of page/section/element creation, metadata changes, reordering, deletion, restoration and permission-sensitive actions.

**Required change:**
Use the existing `audit_logs` for CMS structural and administrative events, with consistent entity types and structured details. Keep version snapshots for recovery. Do not add a second general audit table unless a demonstrated retention/query requirement justifies it.

Review whether `admin_email` is sufficient for actor attribution or whether a stable admin user ID should also be recorded. Preserve the email as a readable audit snapshot.

### R5 — Clarify section deletion and restoration semantics

**Finding:** Element deletion rules are confirmed, but section deletion with child elements is not fully defined. Foreign-key RESTRICT prevents physical deletion but does not define safe soft-delete behaviour.

**Required change:**
- Required sections cannot be deleted.
- A section containing required elements cannot be deleted.
- Optional section deletion should be soft-delete and should not physically delete child records or history.
- The next successful page publication excludes that section and its descendants from the published snapshot.
- Restoring a section reactivates it in the editable structure only; it does not publish it automatically.
- Define how child element active/deleted states are preserved and restored without unexpectedly reactivating individually deleted elements.

### R6 — Preserve existing content type semantics during migration

**Finding:** Existing `site_content.content_type` values include `text`, `textarea` and `url`. The proposed CMS content type check uses `text`, `rich_text`, `url`, `image`, `list`, `option_list`, `seo_text` and `system_text`, but omits `textarea`.

**Required change:**
- Explicitly support `textarea` or document and test a lossless mapping to the chosen CMS type.
- Keep the original value and content meaning during backfill.
- Define content-type mappings for all existing site-content keys and page-builder fields before migration.
- Do not silently coerce URL, rich text, list or system content into plain text.

**User decision confirmed (2026-11-18): Option A — independent global publication.** Global English and Bangla content each have their own Draft, Preview, Publish and Version History. Global publication is independent from page publication in both directions.

### R7 — Define independent global content publication (decision confirmed)

**Required schema and service behaviour:**
- Represent Global as one logical `cms_pages` record with `page_type='global'` and two independent `cms_page_locales` records (`en` and `bn`).
- Each global locale has its own editable structure, draft revision, current published version pointer, publication revision and version history, following the same snapshot/version model as ordinary page locales.
- Global EN and BN are published independently. Publishing EN must not publish BN, and vice versa.
- Provide a dedicated global-locale publish operation. It snapshots and atomically advances only the selected global locale.
- Publishing an ordinary page must not publish or modify Global.
- Publishing Global must not publish or modify any ordinary page.
- Public rendering composes the requested page's current published snapshot with the currently published Global snapshot for the matching language. If a global locale has never been published, use the defined safe baseline/fallback; never expose its draft.
- Page snapshots must not copy or freeze global content. This avoids requiring every page to be republished after a global update.
- Global changes become visible on all matching-language pages after the successful global publication, subject to the site's cache invalidation/revalidation policy.
- Global history and restore are locale-scoped. Historical restore creates a Draft for that global language; publication remains a separate action.
- Keep page and global publication transactions and concurrency checks independent.

The user selected Option A. The decision is no longer pending. The revised schema remains subject to review and explicit approval; Preview D1 verification is still outstanding.

## 4. Additional technical safeguards

These should be incorporated into the final schema and implementation specification:

- Keep foreign keys restrictive; use soft-delete for CMS-managed content.
- Keep stable keys unique within their parent scope, including when a record is soft-deleted, to prevent accidental duplicate identities.
- Validate `config_json` and snapshot JSON on the server as well as with database constraints where supported.
- Confirm D1/SQLite JSON function availability with a Preview-only compatibility check before relying on `json_valid()`.
- Add indexes for locale/page lookup, section ordering, active element listing and version history.
- Define whether version snapshots include SEO metadata, route, section types/configuration, element types/configuration, values and deleted-state decisions. The full published snapshot should contain everything required to render that version without consulting mutable draft records.
- Keep immutable defaults separate from drafts and published snapshots.
- Treat route changes as a separate compatibility concern; do not allow a route change to break existing public URLs without a redirect/alias plan.
- Keep page styles in `page_styles` unless a separately approved design explicitly brings them into CMS publication.
- Do not duplicate courses, course discounts, syllabus files, registrations, inquiries, chat, analytics or media binaries in CMS tables.

## 5. Migration and backfill approach

The migration must remain additive.

1. Verify actual Preview D1 migration state and schema.
2. Finalize the revised schema and obtain explicit approval.
3. Add a new sequential migration; never edit an already-applied migration.
4. Create CMS registry records for approved pages and locales.
5. Map existing custom `pages` records through `legacy_page_id` where appropriate.
6. Map eligible `site_content` keys and existing static-page content using a documented key/source inventory.
7. Map existing page-builder JSON while preserving section types, ordering, IDs/keys and SEO metadata.
8. Compare CMS snapshots against current public content before switching any page.
9. Test one page/language at a time in Preview.
10. Retain legacy APIs and existing tables during gradual integration.

No data backfill should run until the source-to-target mapping is reviewed.

## 6. Approval checklist

| Review item | Result |
|---|---|
| Seven-table separation | Accept as design direction |
| Existing tables preserved | Required |
| Existing page-builder section types/configuration | Revision required |
| Published structure isolated from draft structure | Revision required |
| Current published version pointer/concurrency | Revision required |
| Structural audit coverage | Revision required; reuse `audit_logs` |
| Section delete/restore semantics | Revision required |
| `textarea` compatibility | Revision required |
| Global publication contract | Option A confirmed; schema/service rules documented |
| Preview D1 state verified | Pending |
| Migration SQL ready | No |

## 7. Stage 9A outcome

**Do not approve the current Stage 6 SQL for migration yet.**

The seven-table model can be retained, subject to revisions R1–R6, the confirmed R7 global-publication rules and the additional safeguards above. This is a schema design review only; no SQL migration was created or applied, no database was modified and no deployment was performed.

### Confirmed user decision

The user selected **Option A — independent global publication**. The schema and service contract must follow the R7 rules above. The next step is to produce the revised table-level schema definition and review it for explicit approval. Preview D1 inspection remains a separate mandatory gate before implementation.


## 8. Revised schema contract — global scope (Option A)

The seven-table design remains. Global content is not an eighth table and is not embedded into ordinary page snapshots.

| Object | Revised responsibility |
|---|---|
| `cms_pages` | Includes one logical Global record with `page_type='global'`, alongside route pages |
| `cms_page_locales` | Holds separate EN and BN Global locale records, each with independent draft and published version pointers/revisions |
| `cms_sections` | Stores each global locale's editable shared sections using the same section model |
| `cms_content_elements` | Stores shared element definitions and constraints |
| `cms_content_values` | Stores defaults and locale-scoped editable values |
| `cms_content_versions` | Stores element history, including global-locale changes |
| `cms_page_versions` | Stores complete immutable snapshots for both ordinary page locales and each Global locale |

**Public composition rule:** Resolve the published page snapshot for the requested page/language and independently resolve the currently published Global snapshot for the same language. Compose them at read/render time. Never read Global Draft values publicly. Do not embed Global content in a page snapshot.

**Publication isolation:** A page publish advances only that page/language pointer. A Global publish advances only the selected Global language pointer. Neither operation changes the other scope. Global EN and BN are independently publishable.

**Caching:** A successful Global publish must invalidate/revalidate cached public responses that include that Global language. Exact cache mechanism must be confirmed against the current Worker/Cloudflare delivery path before implementation.

This is a schema contract revision, not final SQL. Key types, composite uniqueness, foreign-key shape and transaction statements still require the final table-level design review.
