# Bilingual Website CMS – Development Implementation Notes

Status: CMS foundation committed on `current-focus-development`; Preview D1 migration 0012 and initial data checks were reported successful by the user. Final Preview deployment and browser acceptance tests remain pending.

## Scope

The CMS binding layer is added to the existing 24 static pages:

- English: Home, About, Services, Training, Course, Registration, Contact, Case Studies, FAQ, Privacy, Terms and Refund.
- Bangla: the corresponding 12 pages under `/bn/`.
- Shared content: common header and footer elements in a separate `global` content context.

The CMS does not replace the Courses module, Registration workflows, Page Styles, Media Library or the custom Pages builder.

## Data model

Migration `0012_bilingual_static_cms.sql` creates:

- `cms_content`: one row per page, language and stable content key; stores draft and published values separately.
- `cms_static_content_versions`: append-only draft and published snapshots for each content key. This namespaced table avoids colliding with the older, empty `cms_content_versions` table already present in Preview.

The migration copies currently published `site_content` rows into the English homepage CMS context. Existing records are not deleted. The existing custom `pages` and `page_styles` tables are not altered. The older six-table CMS schema already present in Preview is retained unchanged; its tables are not used by this static-page CMS implementation.

## Publication and recovery behavior

- Saving creates or updates a draft and records a draft version.
- Public endpoints return only non-null published values.
- Publishing applies all content rows for one page and one language in a single D1 batch.
- English and Bangla are independent publication contexts.
- Archiving is a soft delete. The current published value remains visible until the next publication of that page/language.
- Restoring an archived item returns it to draft state; it does not publish automatically.
- Historical versions can be restored to draft. A separate publication is required to make the restored value public.
- Draft preview uses an authenticated admin API. Adding `?cmsPreview=1` to a page URL does not expose drafts to unauthenticated visitors.

## Editing workflows

### Dashboard editor

The Admin Dashboard provides page and language selectors, a content-key field, content type/value fields, Save Draft, Publish, Preview Draft, key inspection, archive/restore and version-history controls. The dashboard editor and the on-page editor use the same CMS records and Worker endpoints; they are not separate content stores.

### On-page editor

1. From the CMS Dashboard, select the page and language and use **Inspect content keys**, or open the corresponding Preview page with `?cmsKeys=1` while signed in as an administrator.
2. Eligible static elements are outlined. Click an outlined element to open the fixed inline editing panel.
3. The panel displays the selected content key, page/language context, content type and current visible value.
4. Save Draft calls `POST /api/admin/cms/save` with the selected page, language, key, type and value. The Worker session and `content.manage` permission remain authoritative.
5. Preview Draft opens the same page with `?cmsPreview=1`; the protected preview API supplies draft values to an authenticated administrator.
6. Publishing remains a separate action in the Dashboard. Inline Save Draft never publishes.

For an anchor, the inline panel defaults to editing its visible text; select the URL content type and enter a valid HTTP/HTTPS URL when the link destination itself is to be changed. For an image, the panel edits the image URL. The inline editor currently handles eligible static text, anchor text/URL and image source values only; it is not a general-purpose visual page builder.

## Content key conventions

The browser binding script generates deterministic keys from DOM tag order for eligible static elements:

- `h1.1`, `h2.1`, `p.1`, `a.1`, `li.1`, `small.1`, `span.1`, `button.1`
- Images: `img.1`, `img.2`, etc.
- Direct text nodes in elements containing inline markup: `h1.1.text.1`, `p.2.text.1`
- Inline elements receive their own tag keys, such as `em.1` or `strong.1`.
- Shared header/footer keys are prefixed with `header.` or `footer.`.
- SEO keys: `meta.title` and `meta.description`.
- The existing four homepage keys remain supported: `home.hero.eyebrow`, `home.hero.title`, `home.hero.lead`, and `home.hero.note`.

The generated ordering is based on the existing HTML structure. If a developer changes the order or adds/removes eligible elements, review the key mapping and update affected CMS content keys.

## Security

- All CMS write endpoints require an authenticated admin session and the existing `content.manage` permission.
- CMS read endpoints in the admin require `content.view`.
- Mutations enforce same-origin checks.
- Page, locale, key, content type and URL inputs are validated server-side.
- Public responses expose published values only.
- Content is applied with `textContent`, text-node values, or validated URL assignment; HTML is never injected.
- Draft preview uses the admin session cookie and returns draft values only to an authorized admin.

## Current limitations requiring QA

- The binding layer targets static text nodes and image sources. It deliberately excludes form controls, form labels, dynamically generated course data, chat UI and other interactive widgets.
- Rich-text content is treated as plain text; arbitrary HTML is never accepted.
- Image editing changes the image source. Alt text is not currently a separate CMS field.
- The generated keys must be reviewed against each page in a browser, especially where scripts inject content after initial page load.
- Verify all 24 pages, both languages, shared header/footer, SEO metadata, mobile layouts, existing forms and course data before considering the CMS complete.
- Preview D1 migration status must be checked before running Wrangler. Do not run migrations against Production as part of this work.

## Preview test checklist

1. Confirm the Preview D1 migration ledger is ready for migration 0012. Resolve any earlier pending migration issue first.
2. Apply migrations only to the Preview database after confirming the target database.
3. Confirm four existing English homepage values were copied into `cms_content` and matching published history records exist.
4. Save a draft for a non-homepage page and confirm the public page remains unchanged.
5. Open the page with `?cmsPreview=1` while authenticated and confirm draft text appears.
6. Open the same URL in a signed-out session and confirm draft text is not exposed.
7. Publish one English page and verify the Bangla version and other pages are unchanged.
8. Archive a published item and confirm it remains public until that page/language is published again.
9. Restore an archived item and confirm it is draft-only.
10. Restore an older version to draft, preview it, then publish it separately.
11. Verify URL validation, permissions, audit log entries and error handling.
12. Regression-test Courses, registration, contact forms, Page Styles, Media Library and custom Pages.

No Production migration, deployment or merge to `main` is authorized by this implementation.

## Current implementation and verification status

- CMS code and the on-page editor are committed on `current-focus-development`; latest known commit for the inline editor follow-up is `754507b0a28290cc972929f61bef891fbe9b880c`.
- The user supplied Preview D1 Console results showing migration ledger entries 0001–0012, four imported `home/en` records, four published history records, and the six legacy CMS tables still present. Treat these as user-reported evidence, not direct database access.
- The Cloudflare screenshot previously supplied showed a Ready deployment for an earlier commit. It does not prove that commit `754507b` or later changes are deployed.
- The on-page editor requires a new Preview deployment and live browser testing. CI for the final follow-up commit has not yet been confirmed.
- No Production migration, deployment, or merge to `main` is authorized.

## History and publication feedback correction — 2026-11-19

- The History UI previously created Restore to Draft buttons asynchronously, but attempted to attach their click listeners before those buttons existed. The handler now uses event delegation on the persistent history container.
- History requests now show loading, empty and error states.
- After a successful publish request, the Dashboard fetches the public `/api/cms-content` endpoint with `cache: no-store`, compares the returned item count with the publish response, and displays a direct public-page link with a cache-busting query parameter.
- This verifies that the public API exposes the expected number of published items. It does not prove every content key maps to the intended visible page element; browser QA is still required.
- Fix committed as `d28bd1e21473ea3b3b984b056d7e1404774a154c`. Preview deployment and live browser testing have not yet been confirmed.


## Custom Page Builder ↔ Content Manager integration

Custom pages created from **Admin → Pages → Create Page** are registered automatically in the bilingual Content Manager.

- The Content Manager loads the custom-page registry from the permission-protected `GET /api/admin/cms/pages` endpoint and adds those pages to a separate **Custom pages** option group.
- Each custom page is registered under its configured language. The selector switches to that language when a custom page is selected.
- On creation, the system seeds draft CMS keys for the page title and SEO metadata. When sections are saved, stable section IDs are used to register heading, body, button label/link, split-column and card fields. Newly registered keys also receive a draft version-history entry.
- Registration uses insert-if-absent semantics. Existing CMS drafts and published values are not overwritten by a later structural save.
- The custom page renderer applies published CMS values on public pages and draft CMS values in authenticated preview. Text is rendered as text, and URLs continue through the page renderer's HTTP/HTTPS URL validation.
- The page builder remains responsible for section structure and visual layout. Use the Content Manager for registered text and link content. Publish the page structure through the Pages editor, and publish its CMS content through the Content Manager.
- Deleting a custom page also deletes its active CMS records and version history for that slug, preventing orphaned records or history from appearing if the slug is reused.

Custom pages have one configured language per page record. To publish a translated counterpart, create a separate page with its own slug and select the other language. Static-page CMS language behavior remains unchanged.
