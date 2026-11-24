# Testing and Quality Assurance

## Automated checks

Current CI workflow: `.github/workflows/validate-development.yml`.

| Check | Command | What it verifies |
| --- | --- | --- |
| Worker syntax | `node --input-type=module --check < src/worker.js` | Worker JavaScript parses |
| Shared JS syntax | `node --check assets/site.js` | Browser JavaScript parses |
| Site validation | `node scripts/validate-site.mjs` | HTML, local links and inline scripts per validator |
| RBAC contract | `node scripts/test-rbac-contract.mjs` | Permission catalogue, fail-closed route guard, role boundaries, password/session controls and migration structure |
| Password hashing | `node scripts/test-password-hash.mjs` | Legacy/current hash verification, wrong-password rejection, unique salts and malformed-hash rejection |

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


## Course pricing automated tests

The development workflow runs `node scripts/test-course-pricing.mjs`. It covers no discount, percentage and fixed discounts, percentage rounding, 100% discounts, inclusive date boundaries, invalid calendar dates, reversed date ranges, invalid discount values and consistency contracts across the Worker, English/Bangla course pages and Admin registration fee display. These checks do not replace Preview API and browser acceptance tests.


## Registration workflow tests

The development workflow runs `node scripts/test-registration-workflow.mjs`. It checks the quotation-history insert and read route, atomic registration fee snapshot update, currency propagation, payment-status allowlist and Admin controls. These contract checks do not replace Preview database and browser acceptance tests.


## Registration and quotation lifecycle acceptance

- [ ] Create a custom quotation; confirm its initial status is `draft` and the registration fee snapshot matches.
- [ ] Mark the draft quotation as `sent`; confirm draft-to-sent succeeds.
- [ ] Accept a valid sent quotation; confirm quotation status becomes `accepted`, registration becomes `approved`, payment becomes `pending`, and enrollment remains `awaiting_confirmation`.
- [ ] Confirm a draft quotation cannot be accepted directly and a sent quotation cannot be accepted twice.
- [ ] Decline a sent quotation; confirm registration/payment/enrollment statuses remain unchanged.
- [ ] Expire a sent quotation; confirm it cannot subsequently be accepted.
- [ ] Attempt acceptance for rejected/cancelled registrations and cancelled enrollments; confirm the request is rejected.
- [ ] Verify quotation status changes and linked registration changes are audited.
- [ ] Verify unauthorized users cannot read or change quotation status.



## Learner quotation response links — Preview acceptance

The development workflow runs `node scripts/test-quotation-response.mjs`. These are static contract checks, not end-to-end database tests.

- [ ] Apply migration `0013_quotation_response_tokens.sql` to Preview D1 only; verify the table and indexes exist.
- [ ] Create a draft quotation in Admin and issue its learner response link.
- [ ] Confirm the link is copied/displayed once and can be shared manually; no email is sent automatically.
- [ ] Open the link signed out and confirm only quotation amount, currency, description, course title and registration reference are shown.
- [ ] Accept a valid quotation; verify quote status becomes accepted, registration becomes approved, payment becomes pending and enrollment remains unchanged.
- [ ] Repeat with a separate quote and decline it; verify registration/payment/enrollment statuses remain unchanged.
- [x] Reuse a consumed link and verify it is rejected (Preview replay test, 2026-11-19).
- [x] Test an expired link and a revoked link (Preview expiry and reissue tests, 2026-11-19).
- [ ] Test a non-sent quotation and a cancelled/rejected registration.
- [ ] Verify cross-origin POST is rejected and public response rate limiting applies.
- [ ] Confirm raw tokens do not appear in D1 rows, audit details or application logs.
- [ ] Confirm `/quote-response.html` returns `Cache-Control: no-store, max-age=0`, `Referrer-Policy: no-referrer` and `X-Robots-Tag: noindex, nofollow, noarchive`.
- [ ] Confirm the learner page includes a no-referrer meta policy and no third-party resources that could receive the bearer-token URL.
- [ ] Verify English and Bangla learner pages, keyboard controls and mobile layout.

The seven-day response URL is a bearer credential: anyone possessing it can view and respond to the quotation until it expires or is used. Share it only with the intended learner. Production remains out of scope.


### Admin learner-link copy dialog
- [ ] In Preview Admin, create or select a draft/sent quotation and issue/reissue its learner response link.
- [ ] Confirm a dialog displays the complete URL in a read-only selectable field.
- [ ] Click **Copy link** and paste into a local text field or address bar to verify the full URL was copied; do not paste a live token into chat or tickets.
- [ ] Confirm the dialog can be closed and the link remains one-time and seven-day limited.


### Preview execution record — 2026-11-19

The following normal-path checks were completed from user-supplied Preview browser screenshots and D1 query results:

- [x] Issue and copy a learner response link using the Admin copy dialog; open it signed out and display quotation details.
- [x] Accept quotation `42e60e83-2d96-4c51-b75f-0d519a52c154`: D1 showed `accepted`, registration `approved`, payment `pending`, enrollment `awaiting_confirmation`, and token `used_at` populated.
- [x] Confirm acceptance audit events `quotation_learner_accepted` and `registration_approved_by_learner_quote`.
- [x] Decline separate quotation `cc76844e-89a2-4cbe-9022-474b80303ae1`: D1 showed `declined`, while registration `approved`, payment `pending`, and enrollment `awaiting_confirmation` remained unchanged; token `used_at` was populated and `revoked_at` remained NULL.
- [x] Verify decline audit event `quotation_learner_declined`.
- [x] Verify expired-token rejection: quotation `1b82e740-0f81-4c15-8a5e-ef26251894b1` remained `sent`; token expiry was `2026-11-18 00:00:00`, with `used_at` and `revoked_at` NULL; learner page rejected the link.
- [x] Verify link reissue revokes the previous token for quotation `954d469c-57d0-47b9-9620-404c722c96b4`; D1 showed original token `542c0aa8-6475-4f02-b494-c56d7ecbfc2c` revoked and replacement token `3b2c3d6f-a597-48c9-8ddd-9438f76ed0de` active.
- [x] Verify original revoked link is rejected and replacement link remains accessible.
- [x] Accept the replacement link; D1 showed quote `accepted`, registration `approved`, payment `pending`, enrollment `awaiting_confirmation`, and replacement token `used_at` populated.
- [x] Replay the consumed replacement link; learner page rejected the second use.

Cross-origin rejection, rate limiting, response headers, raw-token exposure review, non-sent/cancelled-registration cases and full bilingual/accessibility acceptance remain open.



### Quotation bearer-token URL exposure reduction — Preview acceptance
- [ ] Issue a fresh learner response link and confirm the token appears after `#token=`, not after `?token=`.
- [ ] Open the link and confirm the page immediately removes the fragment/query token from the address bar using history replacement.
- [ ] Confirm the quotation details load through a same-origin POST request to `/api/quotation-response`; inspect the request payload only in a controlled local Preview session and do not copy the token into chat or tickets.
- [ ] Confirm no token-bearing GET request is made to `/api/quotation-response`.
- [ ] Accept and decline separate test quotations and verify the expected state changes and audit events.
- [ ] Confirm expiry, reissue revocation and replay rejection still work with newly issued fragment-based links.
- [ ] Confirm legacy query-string links are cleaned from the address bar and still load through the POST details path during the compatibility period.

The fragment prevents the browser from including the bearer token in the initial HTML request URL. The page then removes the fragment from the current history entry. This does not guarantee that the token is absent from browser memory, screenshots, clipboard contents or the administrator's original issuance response. Treat the link as a bearer credential.


### Stage 17 automated contract follow-up
- The quotation response contract test now checks that the POST details action returns before the accept/decline branch and that the latter performs its own sent-quotation/token/registration lookup.
- This is a source-contract assertion only. Run the full development workflow and complete the Preview browser acceptance checklist above before marking the feature verified.

- CI history for Stage 17: runs `44588560410` and `44588687993` failed because the contract test retained old GET/query-string expectations after the API change. The assertions were corrected in commit `42d58e24ff59fe728dd59b043c879783b7b948b8`. A passing workflow run for that corrected commit is still pending confirmation.

- [x] Development CI run `44588832549` passed all checks for commit `42d58e24ff59fe728dd59b043c879783b7b948b8`, including Worker syntax, site validation, RBAC, pricing, registration workflow and quotation response contracts. This is automated verification only; Preview browser acceptance remains pending.


### Admin account session revocation hardening — Preview acceptance
- [ ] Create a test User account and sign in in a separate browser profile.
- [ ] As Admin, disable that account, then re-enable it before the original session expires.
- [ ] Confirm the original session cookie is still rejected after re-enablement and the user must sign in again.
- [ ] Change a test user's role or permissions and confirm the old session is rejected; sign in again and verify the new permissions apply.
- [ ] Reset a test user's password and confirm their old session is rejected.
- [ ] Confirm an unrelated Admin's session remains valid when another user's account is edited.

Static RBAC contract assertions were added for session-version increments on Admin account PATCH and disable operations. These are source checks only; the live Preview tests above remain pending.

- [x] Development CI run `44638857897` passed all checks for the Admin session-revocation contract commit `7f40889ac5f053a16b8fb8320dc67a4d5f96b0b6`. Live Preview session invalidation tests remain unchecked.


## Administrator password hashing upgrade

- New password hashes use PBKDF2-HMAC-SHA-256 with 600,000 iterations and a unique 16-byte random salt. This meets the PBKDF2 iteration threshold specified by OWASP ASVS 5.0.0; OWASP's Password Storage Cheat Sheet generally prefers Argon2id and gives the 600,000-iteration PBKDF2 threshold for FIPS-140 use cases.
- Existing `pbkdf2$100000$...` hashes remain verifiable. On successful login, the Worker creates a current-strength hash and updates the row only when the stored hash still matches the value that was verified. This avoids overwriting a concurrent password change.
- New bootstrap, account creation, administrator password reset and self-service password change operations use the current-strength helper.
- Automated source/unit checks: `node scripts/test-password-hash.mjs` and `node scripts/test-rbac-contract.mjs`.
- These checks are included in development CI. They do not establish Preview deployment status, login latency, or end-to-end session behavior. Run those checks in Preview during the later user-approved functional QA phase.


## Authentication and session source review — 2026-11-22

Static review of `src/worker.js` and `wrangler.toml` on `current-focus-development` confirmed:

- Admin login refuses to issue a session when `SESSION_SECRET` is missing.
- The session cookie is `HttpOnly`, `Secure`, `SameSite=Strict`, path-scoped to `/`, and has an eight-hour maximum age.
- Each Admin API request verifies the signed session and checks the current database account, active state, email and `session_version`.
- Password changes and Admin account edits/disable operations increment `session_version`, invalidating previously issued sessions.
- Bootstrap credentials are considered only when no database user exists for the submitted email. Existing accounts, including disabled accounts, follow the database-account verification path.
- User-role API authorization rejects routes without a mapped permission; Admin-only account-management routes have a separate role check.

This was a source review, not a penetration test or live Preview validation. Cookie/session expiry, CSRF rejection, role boundaries and revocation after reactivation remain Preview acceptance checks. The Preview Worker has not been redeployed for the password-hashing change, and functional testing remains deferred until explicitly requested.


## Admin API mutation and authorization source audit — 2026-11-22

A static review of `src/worker.js` enumerated the declared POST, PUT, PATCH and DELETE handlers. Every enumerated handler contains a same-origin request check. Admin API authentication is applied before route dispatch; User-role requests require a mapped permission, while unknown/unmapped Admin API routes fail closed for User accounts. Account-management endpoints retain a separate Admin-only role check.

Added RBAC source-contract assertions to guard these properties against regression. These assertions inspect source structure; they do not replace live cross-origin, role-boundary or CSRF testing. Functional Preview testing remains deferred until explicitly requested.


## Cloudinary upload security source review — 2026-11-22

Reviewed the Admin upload form and Worker handlers for media and course syllabus uploads/deletions.

### Existing controls observed

- Upload-signature issuance requires an authenticated Admin API session, same-origin request and the relevant media/course management permission.
- Upload signatures bind the Cloudinary folder, allowed formats and timestamp.
- The Worker applies hourly and daily limits to signature-issuance requests.
- The Admin UI checks image size at 3 MB, PDF size at 10 MB, and allowed MIME types before uploading.
- Media registration checks the Cloudinary host, configured cloud name, approved folder prefix, format allowlist, and basic metadata ranges.
- Deletion is restricted to the approved folder and requires a matching media-library record for Media Library deletion.

### Limitations requiring remediation

1. The 3 MB image and 10 MB PDF checks exist in browser code only. The Worker does not enforce those file-size limits. A caller can bypass browser validation and request an upload signature directly.
2. Cloudinary documents timestamp-based upload signatures as valid for one hour. The same signed parameter set can therefore be replayed during that validity period; rate-limiting signature issuance does not guarantee the same limit on actual uploads.
3. Cloudinary documents that upload presets do not provide a per-preset file-size limit. A true server-side size policy needs a different enforcement design, such as routing uploads through a server that validates the byte stream, or an applicable account-level Cloudinary upload limit. Verify Cloudinary account capabilities and operational cost before choosing.
4. Media registration accepts client-supplied metadata after structural checks. The source review did not establish cryptographic verification that the submitted metadata corresponds to the uploaded Cloudinary asset.

### Status

These are source-review findings, not observed exploitation or live upload tests. Do not treat the browser's file-size checks or signature-request quotas as server-enforced upload limits. Remediation and live Preview verification are pending. Production resources and data were not changed.


## Cloudinary upload remediation — 2026-11-22

The development branch now routes Media Library and course syllabus uploads through `POST /api/admin/media/upload`.

- The Worker requires an authenticated Admin API session and same-origin request; the existing `media.manage` / `courses.manage` permission mapping applies.
- The Worker parses multipart form data and enforces a 3 MiB image limit and 10 MiB PDF limit independently of browser checks.
- The Worker checks declared MIME type against file-signature bytes for JPEG, PNG, WebP, GIF and PDF.
- Cloudinary upload parameters and signature are generated and used inside the Worker. The browser no longer receives an upload signature or Cloudinary API key.
- The Worker assigns a UUID-based public ID in the approved folder and checks Cloudinary's returned public ID, resource type, format and byte count before returning an asset URL or creating a Media Library record.
- Hourly and daily upload-signature request quotas were replaced by hourly and daily upload-request quotas applied to the proxied upload itself.
- The former browser-facing signature endpoint and client-supplied Media Library metadata registration endpoint were removed.

### Verification status

These are implementation and source-contract changes only. CI must pass, then the Preview Worker must be deployed and the Admin upload workflows manually tested. Verify boundary sizes, MIME/content mismatches, upload errors, Media Library registration, syllabus save/edit/delete, and quota behavior. Do not treat source checks as proof of Cloudinary account behavior or live upload success. Production remains unchanged.


## Cloudinary deletion journal and recovery — 2026-11-22

Migration `0014_cloudinary_delete_operations.sql` adds a durable journal for Media Library and course syllabus deletion requests.

- Each deletion is recorded in D1 as `pending` before calling Cloudinary.
- Cloudinary deletion accepts both `ok` and `not found` as successful outcomes, making retries safe when the remote deletion succeeded but the Worker did not receive/retain the response.
- Database finalization happens only after Cloudinary confirms deletion.
- Failed remote calls or failed D1 finalization remain in the journal with attempt count and last error.
- The Admin Media Library has a permission-protected recovery action that retries up to 20 pending/failed operations per request.
- Course syllabus recovery stores the original URL and clears the course field conditionally, so a newer syllabus URL is not overwritten.
- The recovery action is rate-limited and audited.

### Preview acceptance required

- [ ] Apply migration 0014 to Preview D1 before deploying the updated Worker.
- [ ] Delete a Media Library image normally; verify both Cloudinary asset and D1 record are removed.
- [ ] Simulate/induce a Cloudinary failure and verify a failed journal row is retained.
- [ ] Retry recovery after a failed or ambiguous Cloudinary response; verify `not found` is treated idempotently and the D1 record is finalized.
- [ ] Verify the recovery action is unavailable to accounts without `media.manage`.
- [ ] Verify course syllabus deletion journals the prior URL and only clears the matching course field.
- [ ] Verify a newer syllabus URL is not cleared by recovery of an older deletion.
- [ ] Verify recovery processes no more than 20 rows per request and rate limits repeated attempts.

These changes are source-level implementation only. Runtime recovery behavior is not yet verified. Do not deploy until migration 0014 is applied to Preview.


## Cloudinary asset ownership and reference protection — 2026-11-22

The Worker now checks database-managed website content before deleting a Media Library asset or course syllabus file.

Reference lookup checks:
- Legacy published `site_content`.
- CMS draft and published values, including archived records whose published value may still be served.
- CMS content version history, because an older version may be restored.
- Custom page draft and published JSON.
- Homepage style draft and published JSON.
- Other courses' syllabus file URLs (excluding the current course when removing its own syllabus).

Media deletion returns HTTP 409 and lists the matching source/record labels when references exist. Course syllabus deletion follows the same protection but excludes its own course field. The recovery endpoint repeats the reference check before retrying a pending or failed deletion. The Admin recovery summary now distinguishes completed, failed and reference-blocked operations.

### Scope and limitations

- The check searches database-managed content for the Cloudinary public ID. It does not yet prove absence of references in arbitrary hard-coded HTML/CSS/JavaScript, third-party embeds, external systems, browser caches or copies of the URL outside this application.
- A concurrent content publication could race with the final reference check and Cloudinary deletion. A fully race-free guarantee would require pending-deletion checks in every content-writing path or a centralized asset-reference registry.
- These are source-level controls. Preview migration, deployment and runtime tests remain pending. Do not delete assets in Production based solely on these checks.

### Preview acceptance

- [ ] Confirm an image referenced by published CMS content is blocked from deletion.
- [ ] Confirm an image referenced only by a CMS draft is blocked.
- [ ] Confirm a historical CMS version containing the image blocks deletion.
- [ ] Confirm custom page draft/published JSON and homepage style references block deletion.
- [ ] Confirm another course's syllabus reference blocks deletion.
- [ ] Confirm the current course's own syllabus field does not block its syllabus removal.
- [ ] Confirm the Admin recovery action reports blocked items separately from failed and completed items.
- [ ] Review repository static files and external embeds for references not represented in D1.


## Cloudinary deletion reservations and database write guards — 2026-11-22

Migration `0015_cloudinary_reference_locks.sql` adds database triggers across all database-managed content stores:
- `site_content`
- `cms_content`
- `cms_static_content_versions`
- `pages`
- `page_styles`
- `courses`

While a Cloudinary deletion journal row is `pending` or `failed`, these triggers reject inserts/updates that would introduce the reserved public ID into the corresponding content fields. This prevents content from newly referencing an asset while deletion recovery is outstanding. The reservation is released when the journal row is marked `completed` or safely removed before Cloudinary deletion begins.

Media and syllabus deletion now insert the pending journal row, then repeat the full reference scan before contacting Cloudinary. If the second scan finds a reference or cannot complete, the pending journal row is removed and the remote deletion is cancelled. This closes the prior check-then-delete window for application-managed writes once migration 0015 is applied.

### Limitations and operational dependency

- Apply migration 0015 to Preview before deploying the Worker code that relies on its database triggers.
- Existing references are still discovered by the Worker scan; the triggers prevent new references during a pending/failed deletion. This is a database write-guard, not a fully normalized asset-reference registry.
- Direct external database writes that bypass D1 triggers are not covered. Hard-coded source references and third-party systems remain outside the D1 content model.
- Preview acceptance and concurrency tests remain pending. Production remains untouched.

### Additional Preview acceptance
- [ ] Apply migration 0015 and confirm all 11 Cloudinary lock triggers exist.
- [ ] Create a pending deletion journal row in a disposable Preview test case, then verify inserts/updates containing its public ID are rejected in each protected table.
- [ ] Verify ordinary content saves without a reserved public ID still succeed.
- [ ] Verify a completed deletion journal row no longer blocks content writes.
- [ ] Verify a failed deletion journal row continues to block new references until recovery completes or the row is safely cleared.
- [ ] Exercise concurrent content save and deletion requests; confirm the database trigger prevents a new reference from being committed after the reservation is established.


## Cloudinary asset audit report — 2026-11-22

The development branch adds a read-only Admin endpoint, `GET /api/admin/media/audit`, and a report panel in the Media Library.

- Requires an authenticated session and the `media.view` permission; Admin users retain access through their full permission set.
- Rate-limited to 20 requests per hour. Media results use bounded pagination (1–10 rows per page; page numbers 1–200), with an explicit truncation flag if more than 2,000 registered media assets exist.
- Each returned registered Media Library asset is checked against the database reference sources used by deletion protection. Records with references are labelled `reference_found`; records with no discovered references are labelled `potential_orphan_candidate`.
- Includes attached course syllabus URLs (up to 100 records) and counts of pending, failed and completed deletion-journal rows.
- Cloudinary remote existence is explicitly unknown. The report does not call Cloudinary's Admin API, delete assets, or mutate D1.
- Reference results are samples capped by the existing per-source query limits; the displayed match count is a sample count, not a guaranteed total. The endpoint reads the complete syllabus count but returns at most 100 syllabus rows. A potential orphan is not proof that an asset is unused; hard-coded source references, external uses, unregistered uploads and other copies are outside the report.

### Preview acceptance required

- [ ] Apply migrations 0014 and 0015 to Preview before deploying the corresponding Worker.
- [ ] Verify the endpoint is available to Admin and accounts with `media.view`, but unavailable to accounts without that permission.
- [ ] Verify session enforcement and the 20-per-hour rate limit.
- [ ] Verify page-size/page-number bounds, empty inventory and multiple-page inventory.
- [ ] Verify references in supported database sources classify an asset as `reference_found`.
- [ ] Verify an unreferenced registered asset is labelled only as a potential orphan candidate.
- [ ] Verify course syllabus rows and deletion-journal counts are accurate.
- [ ] Confirm the report makes no writes to asset, content, course or deletion-journal records and makes no Cloudinary deletion or remote-existence claim. The existing rate limiter updates its separate rate_limits table.

Source-contract checks do not establish live Preview behavior. No Preview migration or deployment is authorized by this implementation.


## Cloudinary upload lifecycle journal — 2026-11-22

Migration `0016_cloudinary_upload_operations.sql` adds a durable upload journal.

- The Worker creates a `pending` row before making the Cloudinary upload request.
- Successful Cloudinary responses are recorded as `uploaded`.
- Media Library uploads advance to `registered` after the `media_assets` row is saved.
- Syllabus uploads remain `uploaded` until a course create/update stores the corresponding Cloudinary URL; then they advance to `attached`.
- A remote response with unexpected metadata, an uncertain network outcome, or a successful remote upload whose Media Library registration fails is marked `needs_review`.
- Confirmed Cloudinary deletion marks matching upload journal rows `deleted`.
- The read-only Admin asset audit now includes counts and up to 100 recent pending, uploaded, failed or needs-review operations. This helps identify unregistered media uploads and uploaded-but-not-attached syllabus files without deleting them.
- The audit is not a complete Cloudinary inventory. Older uploads made before migration 0016 are not represented, and upload rows marked `uploaded` may be legitimate files awaiting course save.

### Preview acceptance required

- [ ] Apply migration 0016 after migrations 0014 and 0015 and before deploying the updated Worker.
- [ ] Verify an image upload creates a pending row, then a registered row and a Media Library record.
- [ ] Verify a syllabus upload remains uploaded until a course is created or updated with its URL, then becomes attached.
- [ ] Verify a failed or uncertain Cloudinary response remains visible as failed or needs-review.
- [ ] Verify a Media Library D1 registration failure leaves a needs-review row.
- [ ] Verify confirmed media and syllabus deletion marks matching upload rows deleted.
- [ ] Verify audit upload counts and the 100-row recent-operations limit.
- [ ] Confirm the report remains read-only and no upload lifecycle row triggers automatic Cloudinary deletion.

These are source-level changes. Preview migration, deployment and runtime tests remain pending. Production remains untouched.


## Cloudinary remote inventory comparison — 2026-11-22

The development branch adds a read-only Admin endpoint, `GET /api/admin/media/inventory`, and image/raw inventory controls in the Media Library.

- Requires an authenticated session and `media.view`; rate-limited to 10 requests per hour.
- Uses the Cloudinary Admin API with the existing Worker-held Cloudinary cloud name, API key and API secret. Credentials are sent as HTTP Basic authentication and are never returned to the browser.
- Queries one resource type per request (`image` or `raw`), filters public IDs by the `sohel-consulting/` prefix, requests at most 100 assets and returns Cloudinary's cursor for the next page.
- Compares each returned page with `media_assets`, `cloudinary_upload_operations` and up to 500 course syllabus records.
- Labels matches as registered media, attached syllabus, upload-journal-only or unregistered remote candidate. Candidate is not proof of an orphan.
- The response explicitly sets `scan_complete:false`. A page with no next cursor means only that the selected resource-type page sequence ended; the combined image/raw inventory is not certified complete.
- This first version cannot reliably identify D1 records missing remotely because it does not persist a complete remote inventory snapshot. It also cannot find external/hard-coded references or assets outside the selected public-ID prefix.
- No Cloudinary assets or D1 business records are changed. The existing rate limiter writes only to its rate_limits table.

### Preview acceptance required

- [ ] Confirm Cloudinary Admin API credentials exist as Worker secrets in Preview; do not paste credentials into chat or browser code.
- [ ] Verify image and raw pagination, including cursor continuation and empty results.
- [ ] Verify media, syllabus and upload-journal classifications against known test assets.
- [ ] Verify the endpoint rejects invalid resource types/cursors and users without `media.view`.
- [ ] Confirm no asset deletion or D1 business-record mutation occurs.
- [ ] Confirm the report does not claim a complete combined inventory or infer missing remote assets.


## Persistent Cloudinary inventory snapshots — 2026-11-22

Migration `0017_cloudinary_inventory_snapshots.sql` adds durable scan metadata and remote asset snapshots.

- Admin starts a scan and advances one bounded Cloudinary page per request. Image and raw resources have independent cursors, page counters, completion flags and short-lived processing leases.
- Scan state survives browser reloads. A scan left running for more than 24 hours is marked stale when a new scan is started. Failed page retrieval marks the scan failed; start a new scan after correcting the cause.
- Each resource type is capped at 500 pages (up to 50,000 remote records). A scan is marked complete only after both image and raw page sequences return no next cursor.
- After completion, D1 media records, non-deleted upload journal records and course syllabus URLs are compared against the persisted snapshot. The local comparison is withheld if a local source exceeds 10,000 rows or the remote snapshot exceeds 50,000 rows.
- Missing-remote counts are limited to records under the `sohel-consulting/` prefix. Resource type is inferred from the stored Cloudinary URL. The displayed list is capped at 500 records; counts remain available when the list is truncated.
- This is not proof that every business reference is captured: hard-coded source references, external copies, assets outside the prefix, malformed/non-Cloudinary URLs and unsupported Cloudinary resource types remain outside scope.
- The scan is read-only with respect to Cloudinary and D1 business records. Rate-limit counters and scan/snapshot tables are updated. No remote asset is deleted.

### Preview acceptance required

- [ ] Apply migration 0017 to Preview only after reviewing the target identity and migration ledger.
- [ ] Confirm the Admin API requires an authenticated `media.view` user and rejects cross-origin scan-start/step requests.
- [ ] Start a scan, process image and raw pages, reload Admin, and resume the same scan.
- [ ] Verify cursors advance independently and a resource type is not marked complete while a next cursor exists.
- [ ] Verify a scan becomes complete only after both image and raw sequences finish.
- [ ] Verify Cloudinary errors mark the scan failed and a 24-hour-old running scan becomes stale when a new scan is started.
- [ ] Verify 500-page, 10,000-local-row and 50,000-snapshot safety caps prevent a false complete/missing-remote conclusion.
- [ ] Verify missing-remote counts against known synthetic records with image and raw URLs.
- [ ] Confirm no Cloudinary deletion or D1 business-record mutation occurs.

Automated source-contract checks are not runtime acceptance. Preview migration, deployment and browser testing remain pending. Production and `main` remain untouched.


## Cloudinary inventory reconciliation hardening — 2026-11-22

A follow-up source review tightened the persistent inventory endpoint and its comparison rules:

- The endpoint explicitly rejects methods other than GET and POST. Scan mutations require same-origin POST.
- Local media and upload-journal records use literal prefix matching with SQLite `instr(...)=1`; SQL `LIKE` is not used for the underscore-containing folder prefix.
- The missing-remote comparison is withheld if any in-scope local media/upload record or recognized syllabus asset cannot be assigned to image/raw resource type. This avoids silently dropping uncertain local records.
- A remote snapshot cap or unknown resource type retains its specific reason in the API response and Admin UI.
- Automated contract checks cover these conditions.

### Preview rollout sequence (not yet authorized or executed)

1. **Preflight identity:** confirm the intended Cloudflare account, Preview Worker name, Preview D1 database name and exact Preview database ID. Confirm the Production D1 ID is different. Do not use a production binding or production credentials.
2. **Migration ledger:** inspect `d1_migrations` read-only on Preview. Confirm all prerequisite migrations 0001–0016 are recorded. If any are missing, stop and prepare a separate ordered migration review; do not apply 0017 out of sequence.
3. **Review migration:** inspect `0017_cloudinary_inventory_snapshots.sql`; confirm it creates only the two inventory tables and index definitions, with no existing business-table mutation.
4. **Apply migration 0017:** use only the guarded Preview migration workflow after explicit approval. Capture the run URL and confirm its post-migration ledger output.
5. **Deploy Preview Worker:** deploy only the reviewed development commit to the Preview Worker, after confirming the workflow cannot target Production. Do not invoke the Production-only workflow.
6. **Read-only Admin verification:** sign in with an account authorized for `media.view`; verify scan status can be read and unsupported methods are rejected.
7. **Synthetic scan acceptance:** start a scan and process image/raw pages independently. Reload the Admin page and confirm the same scan resumes. Verify no Cloudinary delete endpoint is called and no business record is modified.
8. **Reconciliation acceptance:** verify known image and raw D1 records against the completed snapshot. Include a record with an unknown resource type and confirm the comparison is withheld rather than reporting a false zero.
9. **Failure acceptance:** verify Cloudinary errors, stale scans, page caps, local-row caps and remote-snapshot caps produce explicit incomplete/withheld states.
10. **Evidence and rollback:** save workflow URLs, migration ledger output and sanitized test results. If acceptance fails, stop the scan and revert the Preview Worker to the previously accepted development version; do not drop migration tables or alter Production as an ad hoc rollback.

### Release gates

- [ ] Explicit user approval for Preview migration and deployment.
- [ ] Preview identity and migration ledger independently confirmed immediately before migration.
- [ ] CI green for the exact commit to be deployed.
- [ ] Cloudinary Admin API secrets already configured in Preview; do not paste secrets into chat or workflow logs.
- [ ] Migration 0017 recorded in Preview D1.
- [ ] Preview Worker deployment points to the reviewed commit.
- [ ] Browser acceptance evidence recorded.
- [ ] Production and `main` remain unchanged.

This is a source-level review and release plan only. No Preview migration, deployment, live Cloudinary request, or browser test was performed.


### Additional consistency and concurrency notes

- Migration 0017 now installs a partial unique index allowing at most one row with `status='running'`. The Worker handles a concurrent start collision by returning the active scan ID.
- Cloudinary pagination is not a transactional point-in-time snapshot. Assets can be added, removed or changed while image/raw pages are being collected. Treat missing-remote rows as reconciliation leads, not proof of deletion; rerun the scan before taking corrective action.
- The 500-page limit applies separately to image and raw resources. The comparison query has a combined 50,000-row cap; a larger combined snapshot is retained but its missing-remote comparison is withheld.


### Repository workflow boundary review

The current development branch contains these relevant workflows:

- `.github/workflows/audit-preview-d1-migrations.yml` — manually dispatched, read-only Preview migration listing. It verifies the configured Preview D1 ID against the expected Preview ID and excludes the known Production ID.
- `.github/workflows/migrate-preview-d1.yml` — manually dispatched Preview migration workflow. It has a development-branch guard, verifies the exact Preview D1 ID, lists migrations before and after applying, and targets only the `PREVIEW_DB` binding.
- `.github/workflows/deploy-cloudflare.yml` — Production deployment workflow, guarded to `main` and the `production` environment. It must not be used for this Preview rollout.
- No dedicated Preview Worker deployment workflow is present in the repository tree at this review. The Preview Worker deployment method and its exact target must therefore be verified separately before deployment; do not substitute the Production workflow or guess a Wrangler command.

The correct first operational step, after explicit approval, is to run the read-only Preview migration audit and inspect its full output. Only then may the separate migration workflow be considered. Migration approval does not imply deployment approval.


## Administrator MFA acceptance tests — planned, not yet implemented

The current Admin login is password-only. Do not mark MFA tests as passed until the feature and its test suite exist. After implementation, verify:

- [ ] Password-only login cannot access protected Admin routes.
- [ ] First-time enrollment requires password authentication and confirmation of a valid TOTP code.
- [ ] TOTP seed encryption at rest; no plaintext seed in API responses, D1 values, logs or audit details.
- [ ] RFC 6238 test vectors, six-digit formatting, 30-second time step and narrow clock-skew handling.
- [ ] A TOTP time-step counter cannot be accepted twice, including concurrent requests.
- [ ] Expired, malformed, replayed and wrong-purpose challenge cookies are rejected.
- [ ] One-time recovery codes are hashed at rest and atomically consumed once.
- [ ] MFA disable/reset requires fresh verification and revokes prior sessions.
- [ ] Password and MFA rate limits are independently enforced with generic errors.
- [ ] Challenge cookies and full-session cookies have the required Secure, HttpOnly, SameSite and path attributes.
- [ ] Admin and permission-limited User accounts complete the required MFA flow.
- [ ] English and Bangla login, enrollment, challenge and recovery messages are accessible and usable.
- [ ] Preview end-to-end tests cover setup, login, logout, recovery, revocation and failure cases on the exact deployed commit.

See [Administrator Authentication and MFA Security Assessment](ADMIN_AUTH_MFA_SECURITY_ASSESSMENT.md) for the design and security requirements.

## Administrator MFA implementation tests

Development CI now runs `node scripts/test-admin-mfa.mjs`. It covers RFC-compatible TOTP vectors, current-step verification, replay rejection, malformed-code rejection, random secret format, AES-GCM encryption/decryption with account-bound associated data, and recovery-code hashing/salting. The same script checks key source-level security invariants and migration structure. These are unit/source-contract checks, not Preview runtime acceptance.

Preview acceptance remains pending:
- [ ] Add a unique 32-byte base64url `MFA_ENCRYPTION_KEY` to the development Preview runtime secrets.
- [ ] Apply migration `0019_admin_mfa.sql` to the Preview D1 database only after explicit approval and verify both new tables/indexes.
- [ ] Deploy the exact approved development commit to Preview only after the key and migration are ready.
- [ ] Verify password-only login never receives an Admin session and old password-only sessions are rejected.
- [ ] Complete first-login enrollment in an authenticator app and save the one-time recovery codes.
- [ ] Sign out and verify a new login requires a fresh TOTP code.
- [ ] Verify a recovery code works once and is rejected on reuse.
- [ ] Verify a TOTP time-step code cannot be replayed.
- [ ] Verify wrong/expired challenge cookies and cross-origin requests are rejected.
- [ ] Verify MFA reset requires current password plus fresh TOTP/recovery code and forces re-enrollment.
- [ ] Verify both Admin and permission-limited User accounts and bilingual instructions.
- [ ] Record exact Preview deployment SHA, browser/device and test evidence.

Never mark MFA as Preview-verified based only on CI success. Production remains out of scope.

- [ ] Confirm failed enrollment, login verification and MFA reset attempts are audited without storing the submitted code.
- [ ] Confirm both IP-keyed and account-keyed throttles apply to enrollment, verification and reset endpoints.


## Bulk CMS initialization recovery checks

Development CI runs `node scripts/test-cms-initialization-atomicity.mjs` and `node scripts/test-cms-initialization-recovery.mjs`. The recovery test verifies server/client 400-item limits, validation-before-write, insert-if-absent retry behavior, conditional draft history, one D1 batch for content/history/audit, draft-only behavior, retry guidance and button restoration.

These are source-contract checks. They do not inject a real D1 statement failure or prove Preview browser behavior. Runtime failure-injection and Preview acceptance remain pending and require separately approved Preview access/deployment.


## CMS revision and concurrency tests

Development CI runs both:
- `node scripts/test-cms-revision-contract.mjs` — verifies the Worker routes, HTTP conflict behavior, revision tokens in the Admin UI and conditional history/audit statements.
- `python3 scripts/test-cms-revision-sqlite.py` — applies migration 0018 to a temporary SQLite database and exercises two competing editor requests, stale-write rejection, archive/restore, historical restore and a simulated history-insert failure.

Expected model results:
- Exactly one of two writes using the same starting revision succeeds.
- The stale write does not change content, append version history or create an audit event.
- Successful archive, restore and historical restore each advance the revision.
- Stale archive/restore operations do not reverse a newer state.
- A history insert failure rolls back the content update and audit write in the transaction.

**Verification boundary:** The SQLite test executes SQLite SQL and transaction behavior in CI. It is not a Cloudflare D1 remote integration test and does not prove Preview deployment or browser behavior.

### Preview acceptance checklist — pending separate approval

- [ ] Verify Preview D1 identity and read-only migration ledger; confirm migration 0018 is applied before deploying dependent Worker code.
- [ ] Deploy the exact approved development commit to Preview only after separate deployment approval.
- [ ] Open the same CMS item in two independent Admin sessions. Save from session A, then attempt to save the stale copy from session B; expect HTTP 409 and no overwritten value.
- [ ] Repeat with archive versus save, restore versus archive, and historical restore versus a newer draft.
- [ ] Confirm revision increments exactly once per successful mutation.
- [ ] Confirm stale requests create no version-history or audit rows.
- [ ] Confirm a fresh reload obtains the current revision and allows the next save.
- [ ] Check English and Bangla contexts independently and verify publication behavior is unchanged.
- [ ] Record deployed SHA, browser/device, API status and database evidence.

No Preview migration, deployment or database operation is authorized by these source-level tests. Production and `main` remain out of scope.


**CI result — 2026-11-23:** Run [#45150564334](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45150564334) passed for commit `ced2ce5a08bb00f89401b1cc6b1131b0755d4fd3`. Both CMS revision checks passed. Preview runtime acceptance remains pending.


### Preview CMS concurrency acceptance — current gate

The next operational prerequisite is a fresh read-only Preview D1 migration audit. The previous successful audit [#45024256326](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45024256326) predates migration 0018 and is not sufficient evidence of its current status.

The audit workflow is present on `main` and `current-focus-development`. In GitHub Actions, select **Audit Cloudflare Preview D1 migrations (read-only)**, choose `current-focus-development`, and run it. Confirm the exact Preview D1 ID and whether migration 0018 is pending. The workflow only lists remote migrations; it does not apply them. The connected GitHub integration cannot dispatch workflows.

Do not apply migration 0018 or deploy the Preview Worker without separate explicit approval. The Preview deployment workflow is still absent from `main`; do not copy it there without approval. After these gates, use the CMS concurrency checklist above for two-session browser acceptance.


## Preview CMS concurrency and Admin MFA release gates — 2026-11-23

The read-only Preview D1 migration audit [Run #5](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45155468446) reported `0018_cms_content_revision.sql` and `0019_admin_mfa.sql` as pending. Do not run the Preview Worker deployment or attempt live CMS/MFA acceptance until the required Preview migrations have been separately approved, applied and verified. Migration 0018 is required before testing CMS revision-token compare-and-swap behavior against Preview. Migration 0019 and a Preview-only `MFA_ENCRYPTION_KEY` are prerequisites for MFA runtime acceptance. Migration application and Worker deployment each require explicit approval. No Production or `main` action is included.


## 2026-11-24 — Preview D1 migrations applied and verified

The authorized Preview migration workflow [Run #11](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/4516057616) completed successfully. Job `migrate-preview` verified the dedicated remote Preview D1 ID `e0317397-77cb-4f36-9d19-2594ff75b0c2` before migration activity. The pre-apply migration list contained `0018_cms_content_revision.sql` and `0019_admin_mfa.sql`. Wrangler reported both migrations with successful status after execution. The final remote migration-list step returned **No migrations to apply!** The job steps `Apply pending migrations to Preview D1 only` and `Verify Preview migration state` both completed successfully.

This is direct GitHub Actions execution evidence for the Preview D1 migration ledger. It confirms the two migrations were applied to the dedicated Preview database. It does not establish that a Worker containing the corresponding source code has been deployed or that runtime/browser acceptance has passed. Production and `main` were not targeted by this workflow.

## Remaining Preview runtime acceptance

- [ ] Confirm Preview-only `MFA_ENCRYPTION_KEY` is configured securely on the Preview Worker; do not print or share its value.
- [ ] Obtain separate authorization and deploy the intended development SHA with the guarded Preview workflow.
- [ ] Verify deployed Worker SHA and Preview environment marker.
- [ ] Run two-session CMS concurrency tests against Preview D1, including stale-write HTTP 409 and history/audit atomicity.
- [ ] Run MFA enrollment, valid/invalid TOTP, replay prevention, recovery-code single-use and reset/session invalidation tests.
- [ ] Record browser, API and database evidence. Migration workflow success alone does not complete runtime acceptance.


## Preview deployment preflight added — 2026-11-24

The guarded Preview deployment workflow now runs the CMS revision source contract, SQLite concurrency/transaction tests, and Admin MFA cryptographic/source-contract tests before deployment. It also checks the Preview Worker secret-name list and creates a random 32-byte base64url `MFA_ENCRYPTION_KEY` only if missing; an existing key is never rotated. These are workflow steps, not evidence that the workflow has run. Live CMS and MFA browser/API acceptance remain pending until a verified Preview deployment is available.


## Preview deployment trigger gate — 2026-11-24

The guarded Preview deployment workflow now supports a branch-scoped `push` trigger on `current-focus-development` in addition to manual `workflow_dispatch`. The job runs only when the pushed commit message contains the exact marker `[deploy-preview]` or when the event is a manual workflow dispatch. Ordinary pushes to the development branch skip the deployment job. This avoids modifying `main` merely to expose the workflow in the Actions UI, while retaining an explicit deployment gate. The trigger itself does not authorize or execute deployment. No marker commit has been created and no deployment has been run.


## Preview runtime HTTP smoke tests — 2026-11-24

A guarded workflow `.github/workflows/preview-runtime-smoke.yml` was added. It runs only on `current-focus-development` commits whose message contains `[preview-smoke]`; ordinary pushes do not execute it. The workflow checks HTTP 200 and HTML responses for the English homepage, Admin page, Bangla homepage and quotation-response page; verifies unauthenticated Admin summary returns HTTP 401; verifies Worker source, migration SQL and Wrangler configuration paths return HTTP 404; and checks the quotation-response page's no-store, no-referrer and noindex response headers. These checks validate public HTTP behavior and selected security boundaries, but do not replace browser interaction, responsive, accessibility, form lifecycle, CMS, Cloudinary or authenticated Admin acceptance.


### Runtime smoke execution record — 2026-11-24

Initial smoke workflow [Run #5](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45320166771) confirmed HTTP 200 for `/`, `/admin.html`, `/bn/index.html` and `/quote-response.html`; HTTP 401 for unauthenticated `/api/admin/summary`; and HTTP 404 for `/src/worker.js`, `/migrations/0019_admin_mfa.sql` and `/wrangler.toml`. The run failed at the quotation-response privacy-header assertion. The assertion was revised to parse the final HTTP header block and print only the three relevant response headers for diagnosis. Privacy-header acceptance remains pending until a subsequent run passes.


### Quotation-response routing diagnosis — 2026-11-24

The second smoke run confirmed that the quotation-response HTML was being served directly by the static-assets layer: it returned generic cache/referrer headers and omitted the Worker-enforced `no-store`, `no-referrer` and `X-Robots-Tag` policies. The Preview asset configuration's `run_worker_first` list covered the homepage, APIs, Admin and protected source paths, but omitted `/quote-response.html`. The Preview configuration now routes that exact path through the Worker so its dedicated privacy-header wrapper executes. Redeployment and a passing smoke rerun are required before acceptance.
