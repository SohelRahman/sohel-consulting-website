# Bilingual Website CMS – Development Implementation Notes

Status: Development implementation prepared on `current-focus-development`. It is not production-ready until migration and Preview verification are completed.

## Scope

The CMS binding layer is added to the existing 24 static pages:

- English: Home, About, Services, Training, Course, Registration, Contact, Case Studies, FAQ, Privacy, Terms and Refund.
- Bangla: the corresponding 12 pages under `/bn/`.
- Shared content: common header and footer elements in a separate `global` content context.

The CMS does not replace the Courses module, Registration workflows, Page Styles, Media Library or the custom Pages builder.

## Data model

Migration `0012_bilingual_static_cms.sql` creates:

- `cms_content`: one row per page, language and stable content key; stores draft and published values separately.
- `cms_content_versions`: append-only draft and published snapshots for each content key.

The migration copies currently published `site_content` rows into the English homepage CMS context. Existing records are not deleted. The existing custom `pages` and `page_styles` tables are not altered.

## Publication and recovery behavior

- Saving creates or updates a draft and records a draft version.
- Public endpoints return only non-null published values.
- Publishing applies all content rows for one page and one language in a single D1 batch.
- English and Bangla are independent publication contexts.
- Archiving is a soft delete. The current published value remains visible until the next publication of that page/language.
- Restoring an archived item returns it to draft state; it does not publish automatically.
- Historical versions can be restored to draft. A separate publication is required to make the restored value public.
- Draft preview uses an authenticated admin API. Adding `?cmsPreview=1` to a page URL does not expose drafts to unauthenticated visitors.

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
