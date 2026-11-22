# Testing and Quality Assurance

## Automated checks

Current CI workflow: `.github/workflows/validate-development.yml`.

| Check | Command | What it verifies |
| --- | --- | --- |
| Worker syntax | `node --input-type=module --check < src/worker.js` | Worker JavaScript parses |
| Shared JS syntax | `node --check assets/site.js` | Browser JavaScript parses |
| Site validation | `node scripts/validate-site.mjs` | HTML, local links and inline scripts per validator |
| RBAC contract | `node scripts/test-rbac-contract.mjs` | Permission catalogue, fail-closed route guard, role boundaries, password/session controls and migration structure |\n| Password hashing | `node scripts/test-password-hash.mjs` | Legacy/current hash verification, wrong-password rejection, unique salts and malformed-hash rejection |

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
