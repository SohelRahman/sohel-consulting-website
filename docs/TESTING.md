# Testing and Quality Assurance

## Automated checks

Current CI workflow: `.github/workflows/validate-development.yml`.

| Check | Command | What it verifies |
| --- | --- | --- |
| Worker syntax | `node --input-type=module --check < src/worker.js` | Worker JavaScript parses |
| Shared JS syntax | `node --check assets/site.js` | Browser JavaScript parses |
| Site validation | `node scripts/validate-site.mjs` | HTML, local links and inline scripts per validator |\n| RBAC contract | `node scripts/test-rbac-contract.mjs` | Permission catalogue, fail-closed route guard, role boundaries, password/session controls and migration structure |

These checks do not execute the application in a real browser.

## Manual Preview QA

### Public website
- [ ] Open every English page and every Bangla page.
- [ ] Verify navigation, language switching, footer links and skip links.
- [ ] Check images, fonts, page titles, metadata and canonical links.
- [ ] Confirm no console errors or failed network requests.

### Responsive and browser compatibility
- [ ] Test narrow mobile, large mobile, tablet and desktop widths.
- [ ] Test current Chrome, Edge, Firefox and Safari where available.
- [ ] Check mobile menu open/close behavior and keyboard operation.
- [ ] Check focus visibility and page zoom.

### Consent and analytics
- [ ] First visit: optional analytics does not run before consent.
- [ ] Accept optional analytics and confirm expected events.
- [ ] Reject optional analytics and confirm no analytics events are sent.
- [ ] Reopen settings and withdraw consent.
- [ ] Re-enable consent in the same tab and confirm analytics restarts correctly.
- [ ] Confirm essential site functions continue without optional analytics.
- [ ] Review browser storage behavior and privacy-policy wording.

### Forms and chat
- [ ] Submit valid and invalid registration data.
- [ ] Submit valid and invalid inquiry data.
- [ ] Verify success/error states and duplicate-submit prevention.
- [ ] Start a chat, send messages, reload and verify expected continuity.
- [ ] Test request for human support and conversation status handling.

### Administrator and role-based access
- [ ] Verify bootstrap Admin provisioning after migration 0009 is applied to Preview.
- [ ] Verify Admin has full access and only Admin can access User Access management.
- [ ] Create User accounts with different permission combinations; verify navigation and controls match the assigned permissions.
- [ ] Attempt unauthorized API reads and writes directly; verify server-side 403 responses (including unknown admin routes).
- [ ] Verify a manage permission includes read access for its module and chat.reply includes chat.view. Verify account password resets invalidate other active sessions and self-service password changes renew the current session.
- [ ] Verify disabling a user revokes access on the next request; verify password reset and self-service password change.
- [ ] Verify an Admin cannot disable/demote their own account and the last active Admin cannot be disabled/demoted.
- [ ] Verify login, invalid login, session expiry and logout.
- [ ] Test course create/edit/activate/deactivate/delete as supported.
- [ ] Upload a PDF syllabus (maximum 10 MB) and JPG/PNG/WebP syllabus image (maximum 3 MB); save the course and verify both the reference URL and uploaded file link in English and Bangla course detail pages.
- [ ] Verify invalid file types, oversized files, upload errors and course-save failures leave a clear recovery path.
- [ ] Verify existing Media Library image uploads still work after signed allowed-format validation was added.
- [ ] Test registration review, quotation and enrollment updates.
- [ ] Test inquiry status updates.
- [ ] Test site content and page-style draft/publish behavior.
- [ ] Test custom page create/edit/preview/publish/delete.
- [ ] Test media library and Cloudinary upload/access.
- [ ] Test chat inbox and administrator replies.
- [ ] Test analytics dashboard and consent-dependent event data.

### Security and performance
- [ ] Verify unauthenticated administrator requests are rejected.
- [ ] Verify cross-origin administrator mutations are rejected.
- [ ] Check rate limiting on public write endpoints.
- [ ] Check response headers and caching behavior.
- [ ] Run accessibility and performance audits on Preview.
- [ ] Check for exposed secrets, internal source paths and unintended public data.

## Test evidence

For each QA cycle, record:
- Date and Preview deployment/commit SHA
- Browser and device/viewport
- Test case and expected result
- Actual result: pass/fail/blocked
- Reproduction steps and evidence for failures
- Owner and resolution commit

Do not mark a manual test as passed based only on static analysis or CI success.


## CMS acceptance tests

The static-page CMS is implemented on the development branch. The following tests are required for Preview acceptance; unchecked items have not been verified unless test evidence is recorded.

### Page registry and bilingual editing
- [ ] Confirm all approved page records are listed.
- [ ] Confirm English and Bangla load independent content, drafts and publication states.
- [ ] Confirm an absent locale shows an explicit setup state rather than silently copying the other language.
- [ ] Confirm page/section/element ordering and stable identifiers are preserved.

### Draft, default and publication
- [ ] Save Draft and verify public content remains unchanged.
- [ ] Restore Default and verify only the selected element's draft value changes.
- [ ] Publish one page/language and verify no other page, locale, global content or page style changes.
- [ ] Simulate validation/database failure and verify the transaction rolls back.
- [ ] Simulate stale version publication and verify a conflict is returned without overwriting newer work.

### Delete, restore and history
- [ ] Soft-delete an optional element and verify current public content remains visible before publication.
- [ ] Publish the page and verify the deleted element is excluded from the new public snapshot.
- [ ] Verify required elements and protected sections cannot be deleted.
- [ ] Restore a deleted item and verify it is not automatically published.
- [ ] Restore a historical page version into Draft and verify public content remains unchanged.
- [ ] Publish the restored draft and verify a new version is created while old versions remain available.

### Security and public data isolation
- [ ] Verify each CMS operation enforces its server-side permission.
- [ ] Verify unauthorized direct API requests are rejected even if the UI control is hidden.
- [ ] Verify public APIs never return default, draft, audit or private version data.
- [ ] Verify draft preview requires an authenticated authorized administrator.
- [ ] Verify rich text sanitization and URL/media validation.

### Compatibility and visual regression
- [ ] Verify existing page-builder IDs, slugs, section JSON, SEO metadata and preview behavior are preserved.
- [ ] Verify legacy APIs continue working during page-by-page migration.
- [ ] Compare each migrated page with its pre-CMS public appearance and functionality.
- [ ] Verify Courses, registrations, inquiries, page styles, media, chat and analytics modules remain operational.
- [ ] Run responsive, keyboard and accessibility checks for English and Bangla CMS screens.

Record test evidence using the existing Test evidence format above. Do not mark any CMS test as passed before implementation and execution in Preview.

### Dashboard and on-page editing — Preview acceptance

- [ ] Confirm the CMS Dashboard shows all 13 contexts: Home, About, Services, Training, Course, Register, Contact, Case Studies, FAQ, Privacy, Terms, Refund and Global.
- [ ] Confirm each page can be selected independently in English and Bangla.
- [ ] In the Dashboard editor, save a draft for one non-homepage text key; reload and confirm the draft persists.
- [ ] Confirm the public page remains unchanged before publication.
- [ ] Open the selected page with `?cmsKeys=1` while authenticated; confirm eligible elements are highlighted.
- [ ] Click a highlighted heading and confirm the inline editor opens with the correct key and visible text.
- [ ] Edit text inline, save draft, reload the Dashboard editor and confirm the same key/value appears there.
- [ ] Edit an anchor's visible text; confirm its destination remains unchanged.
- [ ] Change an anchor destination using content type `url`; verify only HTTP/HTTPS URLs are accepted and the draft preview points to the new destination.
- [ ] Change an image source using content type `image`; verify URL validation and draft preview.
- [ ] Confirm Save Draft never publishes.
- [ ] Use Preview Draft and confirm the saved draft appears for an authenticated administrator.
- [ ] Open the same preview URL signed out and confirm draft content is not disclosed.
- [ ] Publish one English page and confirm the Bangla page and other pages remain unchanged.
- [ ] Confirm Dashboard editing and inline editing update the same CMS record.
- [ ] Click History for a key with versions; confirm the version list loads and Restore to Draft works after the list is rendered.
- [ ] Click History for a key with no versions; confirm an explicit empty-history message appears.
- [ ] Publish a page/language; confirm the Dashboard public API count matches the published count and use its direct link to verify the rendered page after refresh.
- [ ] Confirm the published value is present in the public API and the intended DOM element displays it. A matching API count alone is not sufficient.
- [ ] Test missing permission, expired session, cross-origin request and invalid content key/type/value handling.
- [ ] Test keyboard access, focus order, close action, status announcements and narrow mobile viewport for the inline panel.

Record browser, viewport, Preview deployment commit SHA and screenshots/results. These tests are currently pending; a commit or CI pass is not a substitute for browser verification.
