> **Preview deployment preparation — 2026-11-24:** Commit `4d81d4c99f9a5c9c89340bfd29b185f1db36ae6e` updates the development-only Preview deployment workflow to verify the Preview D1 target, run CMS revision and MFA tests, and provision a cryptographically random 32-byte base64url `MFA_ENCRYPTION_KEY` only when the Worker secret is absent (never rotate an existing key; never log the value). This workflow remains absent from `main`, so its GitHub Actions UI dispatch prerequisite is unresolved. Do not change `main` to expose it without separate approval. No secret was provisioned and no Worker was deployed by this source change.

> **Current Preview migration status — 2026-11-24:** Authorized migration workflow [Run #11](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/4516057616) successfully applied `0018_cms_content_revision.sql` and `0019_admin_mfa.sql` to Preview D1 `consulting-preview-db` (`e0317397-77cb-4f36-9d19-2594ff75b0c2`). Both show successful execution and the final remote migration list reports `No migrations to apply!`. Worker deployment and runtime acceptance remain separate gates. Configure/verify the Preview-only MFA encryption secret securely; obtain separate approval before Preview deployment. Never modify `main` or Production without authorization.

# Master Development Handover Prompt

> **Audit baseline — 2026-11-22:** Start with [Master Project History](MASTER_PROJECT_HISTORY.md) for the consolidated Website 1–4 requirements, decisions, current repository evidence, known gaps and prioritized work. The development branch is reported as diverged from `main` (558 ahead, 12 behind); do not merge, rebase, force-push or reconcile branches without a separately reviewed plan and explicit approval. Preview deployment and full browser acceptance are not independently confirmed by the audit. No Production changes are authorized by this handover update.

> **Current CMS status — 2026-11-19**
>
> The bilingual static-page CMS is implemented on `current-focus-development`. Preview D1 migration 0012 was applied manually by the user and the user-reported verification showed four imported English homepage records, four published history rows, all six legacy CMS tables preserved, and migration ledger entries 0001–0012. These are user-supplied D1 Console results, not a direct database inspection by the repository maintainer.
>
> The CMS supports 12 English and 12 Bangla static pages plus a separate Global context. The Admin Dashboard supports page/language selection, draft save, page/language publish, authenticated draft preview, key inspection, soft archive/restore, version history and restore-to-draft. The public binding layer targets eligible static text nodes, image sources, links and SEO metadata; it deliberately excludes forms, dynamically generated course data, chat and other interactive controls.
>
> **Two editing paths:** (1) Dashboard editing by selecting or entering a content key; (2) on-page editing from the `?cmsKeys=1` inspector by clicking a highlighted element and using the inline editor panel. Both save drafts through the same authenticated `POST /api/admin/cms/save` endpoint. Inline editing was committed in `assets/cms.js` at commit `754507b0a28290cc972929f61bef891fbe9b880c`; it still requires a fresh Preview deployment and live browser acceptance testing. A successful CI run for the final follow-up commit and live inline-editor behavior have not yet been confirmed.
>
> Do not treat the earlier Cloudflare “Ready” screenshot as deployment evidence for commit `754507b`; it showed an earlier commit. No Production deployment, migration, merge to `main`, or Production data change is authorized.

## Sohel Consulting Website

Use this document as the starting context when continuing development in a new ChatGPT conversation. Treat it as a handover baseline, not as proof that the repository or deployment still matches these details. Always verify the latest repository state before making changes.

## 1. Role and objective

Act as a senior full-stack developer, technical architect, and security reviewer for the Sohel Consulting Website.

Continue development without losing previous requirements, technical decisions, implementation history, or outstanding work. Prioritize correctness, security, maintainability, and clear verification.

## 2. Repository and environments

- Repository: `SohelRahman/sohel-consulting-website`
- Development branch: `current-focus-development`
- Production branch: `main`
- Cloudflare Worker: `consulting`
- Preview URL: [https://current-focus-development-consulting.sohelrahman118.workers.dev](https://current-focus-development-consulting.sohelrahman118.workers.dev)
- PR #1 was recorded as draft/open/unmerged at the time of this handover. Verify its current status.

### Mandatory environment protection

- Make development changes only on `current-focus-development`.
- Never modify `main` or Production unless the user explicitly approves.
- Do not modify Production databases, secrets, or configuration during Preview development.
- Never copy Preview secrets into Production or expose credentials in code, logs, commits, or chat.
- A GitHub commit does not prove that Cloudflare Preview deployed it.
- Verify deployment and test the relevant behavior before reporting success.
- If deployment or test status cannot be verified, say so clearly.

## 3. Known Preview configuration

### Cloudflare D1
- Preview database: `consulting-preview-db`
- Preview database ID: `e0317397-77cb-4f36-9d19-2594ff75b0c2`

### Cloudinary
- Cloud name: `vigjnjgx`
- Preview folder: `sohel-consulting`
- Preview API key was reported to have Folder Manager access to the approved folder.
- Cloudinary PDF delivery was reported enabled by the user; this was not independently verified in the prior handover.

Do not assume these values or permissions are still current. Verify non-secret configuration when relevant. Never request or print secret values unnecessarily.

## 4. Completed work recorded in the previous handover

### Media Library
- Upload and delete functionality was reported working in Preview.
- The delete endpoint was recorded as implementing authentication/RBAC, same-origin validation, rate limiting, Cloudinary signed deletion, and D1 deletion only after Cloudinary confirms the operation.
- Recheck the current code before extending this functionality.

### Course module
The following requirements were implemented or addressed:
- Course discount fields.
- Course syllabus upload for PDF and supported image formats.
- Separate external course reference link and uploaded syllabus file URL.
- Course editing and uploaded syllabus removal.
- Course list with course details and management actions.
- Public English and Bangla course pages display the relevant links separately.
- Course form remains on the Courses page after save.
- Course deletion is blocked when registrations exist; deactivation is used to preserve registration history.

### Database migrations
- `0010_course_discounts_syllabus.sql`: discount fields and syllabus URL.
- `0011_course_syllabus_file_url.sql`: separate uploaded syllabus file URL and migration of existing Cloudinary PDF URLs.
- The user reported both migrations manually applied in Preview.
- Production migrations were not applied according to the previous handover.

Do not rerun migrations blindly. Inspect migration history and the target database first. Never apply these or other migrations to Production without explicit approval.

## 5. Previously resolved issues

The user confirmed that syllabus removal worked after the Cloudinary URL parsing fix. The previous handover also recorded fixes for:
- Course date validation regex.
- Missing course form submit handler.
- Course reference link update handling.
- Existing uploaded syllabus link display in the edit form.
- Cloudinary syllabus URL parsing and approved-folder validation.

Do not reopen these issues unless the user reports a regression or new evidence indicates a problem. Re-test when changes could affect them.

## 6. Recorded commit history

Latest known development commit at the time of the previous handover:

`cb9d64d58c2bca75108769bd7c333e5f6cc7c0ea`

Earlier relevant commits:
- `c106978e4ba2d5946d0c13d3670fdadae43909ee`
- `fcb70c437f2964b64abdeb5a3d036d35a0320ff1`
- `f2a6eb27d07f676cc11037f7f7cae35355c7e6b1`
- `6d088ca2d519a74380c250362361452f3892ae65`
- `1c306c69050ea0acb0a1d1b096d916a6b112f509`

These are historical references, not confirmation of the current branch head. Fetch the latest branch state before relying on them.

## 7. Required workflow for each development item

1. Clarify the requirement and expected user behavior. Ask one focused question if an essential detail is missing.
2. Inspect the current implementation and repository structure on `current-focus-development`.
3. Identify affected frontend, backend, database, integrations, and configuration.
4. Review security, authorization, validation, data integrity, accessibility, and regression risks.
5. Confirm the proposed approach when a material product or technical decision is needed.
6. Implement only the agreed scope.
7. Review the diff for unintended changes and sensitive data.
8. Commit only to `current-focus-development`.
9. Verify the Cloudflare Preview deployment, where possible.
10. Test the actual behavior and relevant regression paths.
11. Report files changed, commit SHA, deployment status, test evidence, and remaining limitations.
12. Update this handover document with the new requirement, decisions, implementation, migrations, commit, deployment/test status, known issues, and next steps.

Do not claim a feature is complete merely because code was written or committed.

## 8. Status vocabulary

Use these statuses precisely:
- **Planned** — requirement recorded, work not started.
- **In progress** — implementation underway.
- **Implemented** — code changes made, not necessarily committed.
- **Committed** — changes committed to the development branch.
- **Preview deployed** — deployment to Cloudflare Preview verified.
- **User tested** — user reports testing the behavior.
- **Verified** — test evidence supports the stated result.
- **Blocked** — progress depends on an unresolved issue or input.

Do not conflate these statuses. State who tested and how when known.

## 9. Communication and tool-use rules

- Be direct, practical, and technically accurate.
- Separate confirmed facts from assumptions and estimates.
- Do not invent configuration, test results, sources, URLs, or commit details.
- Explain uncertainty and missing information.
- Prefer Cloudflare Dashboard UI instructions over PowerShell when giving the user manual steps.
- Fetch the latest file and blob SHA before updating an existing GitHub file.
- Do not run concurrent writes against the same file.
- Preserve existing behavior unless the user approves a change.
- Keep instructions manageable and explain one operational step at a time when the user is performing the work.

## 10. First actions in a new chat

Before starting new implementation:

1. Read this handover file from the repository's `current-focus-development` branch.
2. Inspect the latest branch head and relevant project files.
3. Compare the actual repository state with this handover; identify stale or conflicting details.
4. Check current PR status if relevant.
5. Check Cloudflare Preview deployment status if the task depends on it.
6. Confirm what is known, what is unverified, and what has changed since this document was last updated.
7. Then proceed with the next development item.

**Critical rule: develop on `current-focus-development` and protect `main` and Production unless the user explicitly authorizes a change.**


## 11. Next development item — course discount and registration fee consistency

**Status: Implemented and committed on development; automated CI and Preview acceptance pending.**

User identified this item for the next development cycle:
- Test discount calculation, display, and registration fee consistency.

### Scope to investigate
1. Identify the supported discount model(s) from the existing schema and UI. Do not assume fixed-amount or percentage discounts are both supported.
2. Trace the price calculation from course creation/editing through public course listing and detail pages.
3. Trace registration submission and backend persistence to determine which amount is charged/stored.
4. Check that the displayed original price, discount, discounted price, and registration fee are consistent wherever shown.
5. Check server-side validation and ensure clients cannot manipulate the payable amount.
6. Test boundary cases supported by the existing design: no discount, zero discount, valid discount, maximum allowed discount, invalid/negative discount, and rounding/currency formatting.
7. Check existing registrations and historical fee records are not unintentionally changed by course price edits.

### Acceptance criteria
- One authoritative server-side calculation determines the payable course fee.
- Public display and registration use the same documented calculation and currency/rounding rules.
- Invalid discounts are rejected safely; payable fee cannot become negative.
- Registration records store the correct amount according to the existing business rules.
- Tests cover calculation, display data, registration persistence, and relevant edge cases.
- No Production resources or data are changed.

### Investigation findings and implementation
- Existing schema supports `none`, `percentage` and `fixed` discounts. Fixed discounts are stored in minor currency units; percentages are whole numbers.
- The former registration API calculated the fee server-side, but English and Bangla course pages independently calculated the display amount. Percentage rounding could differ.
- Added `src/course-pricing.js` as the shared price-calculation and discount-validation module.
- Public `GET /api/courses` now returns `discount_active`, `discount_amount_minor` and `final_fee_minor`. Both course detail pages display these server-calculated values.
- Registration submission uses the same helper before persisting `quoted_fee_minor`. Custom-quotation registrations continue to store NULL.
- Create/update validation rejects impossible calendar dates, reversed date ranges, fractional percentage values, percentages above 100 and fixed discounts greater than or equal to the base fee. A 100% discount is allowed and results in a zero fee.
- Admin now displays a zero quoted fee as `0.00` rather than hiding it.
- Added unit and integration-contract tests to development CI.

### Calculation and verification notes
- Percentage discounts round to the nearest minor currency unit using `Math.round(baseFeeMinor * percentage / 100)`. Date boundaries are inclusive. Public display and registration use the same server UTC date.
- No database migration is expected. No D1 SQL was executed by the assistant.
- Pending: CI result, exact Preview deployment verification, and live tests for no discount, percentage discount, fixed discount, date boundaries, zero final fee and registration persistence.

### Next actions
1. Confirm CI passes for the pricing implementation.
2. Verify Preview deploys the exact development commit.
3. Test English and Bangla course detail pages against `/api/courses`.
4. Submit fixed-fee registrations with and without discounts and compare stored `quoted_fee_minor` with `final_fee_minor`.
5. Test custom quotation and confirm its stored fee remains NULL.
6. Test discount date boundaries and invalid discount rejection.
7. Record browser test evidence before marking the stage verified.
- Do not change the pricing model or database schema unless the inspection shows it is necessary and the user approves any material business-rule decision.
- Update this section with affected files, test cases/results, commits, Preview deployment status, and user verification as work progresses.


### 11.1 Public course listing visibility — implementation update

**Status: Committed; Preview deployment and user testing not yet verified.**

User confirmed the newly created course is visible and Active in Admin, but could not find it on the public website.

Repository inspection found:
- `GET /api/courses` returns database courses where `active=1`.
- The English `training.html` page showed only three hardcoded training-area cards and did not render the database course list.
- The Bangla `bn/training.html` page also showed only three hardcoded cards and did not render database courses.
- Registration pages already load their course options from `/api/courses`.

Changes committed:
- `training.html` now loads active courses from `/api/courses` and renders a dynamic “Current courses” section.
- `bn/training.html` now loads the same active courses and renders localized titles, summaries, and detail links.
- Existing hardcoded training-area sections were retained as general topic/category content.
- Dynamic text is inserted with DOM `textContent`, and course slugs are URL-encoded in detail links.
- Empty and API-error states are handled.

Commits:
- English page: `1de2aa4ed8608d2e73f6fac4797ac138a8f7178f`
- Bangla page: `c8f7a20e6f26d8cfd7e143936fb0a1bfab468f3d`

Validation at handover update:
- GitHub Actions validation for the English commit was observed queued (run 364); no passing result was confirmed.
- No workflow run or CI status was returned for the Bangla commit at the time checked.
- Cloudflare Preview deployment and live API/page behavior have not yet been verified.
- No database migration or Production change was made.

Next actions:
1. Wait for and inspect the GitHub validation run.
2. Verify Cloudflare Preview has deployed both commits.
3. Open the English and Bangla Training pages and confirm the newly created active course appears.
4. Open its course detail link and confirm the correct course loads.
5. Confirm the registration page still lists the course and preselects it when arriving from the course detail page.
6. Record user testing and final status here.


## 12. Registration workflow integrity

**Status: Committed on development; CI and Preview acceptance pending.**

### Repository findings
- Registration, payment and enrollment statuses are separate fields with SQLite CHECK constraints.
- Existing registration status endpoint accepts the four schema-defined registration states and writes an audit log.
- Existing enrollment endpoint accepts the three schema-defined enrollment states and writes an audit log.
- The custom quote endpoint previously overwrote the current registration fee and forced currency to BDT without writing a quotation record, despite the existing `quotations` table.
- The Admin screen did not expose payment status, even though `payment_status` exists in the registration schema.

### Implementation
- Custom quote updates now create a new `quotations` record with status `draft`, amount, course currency and optional description, and update the registration's current fee snapshot in one D1 batch.
- Prior quotation records remain in the `quotations` table. Added an authorized quotation-history API and Admin action to view the history.
- Quote currency is taken from the course/registration instead of being hardcoded to BDT.
- Added a manual payment-status endpoint for the existing values: `not_configured`, `pending`, `paid`, `failed`, `refunded`. It writes an audit event. This records an administrator's status entry only; it does not verify or process a payment.
- Admin now displays payment status and provides controls to update payment and enrollment states.
- Added registration workflow contract tests to the development CI workflow.

### Limitations and acceptance
- No payment gateway, automated payment verification, quote email delivery, quote acceptance flow or invoice generation was added.
- Existing registrations are not rewritten and no quote-history backfill is attempted.
- No schema migration is expected because the existing `quotations` table and registration payment field are reused.
- Pending: CI result, Preview deployment, authenticated API tests, quotation history persistence, currency verification and Admin browser tests.
- Test custom quote creation twice and confirm two quotation rows are retained while the registration shows the latest quote. Test invalid amounts and unauthorized access. Test each permitted payment state and confirm audit entries.



## 13. Registration lifecycle and quotation acceptance

**Status: Implemented on development; automated CI and Preview acceptance pending.**

- Quotation lifecycle transitions are constrained to draft → sent, then sent → accepted/declined/expired.
- Acceptance is allowed only from sent status and only while the quotation is valid. If valid_until is set and is before the current UTC date, acceptance is rejected and the quote is marked expired.
- Accepting a sent quote approves the linked registration and sets payment status to pending. Enrollment status is deliberately left unchanged; it requires manual Admin confirmation.
- Rejected/cancelled registrations and cancelled enrollments cannot accept a quote.
- Quote status and registration updates are batched; audit events record the accepted quotation and registration transition.
- Admin quote history allows an operator to select a quote and advance it through an allowed transition.
- No migration is required. No D1 SQL, Preview deployment or Production change was performed by the assistant.
- Preview tests must cover valid acceptance, invalid transitions, decline, expiry, cancelled/rejected registrations, audit records and authorization.


## 14. Learner-facing quotation response links

Implemented on `current-focus-development`; not yet deployed or verified against Preview D1.

- Migration: `0013_quotation_response_tokens.sql` creates one-time response-token storage with unique SHA-256 hashes, expiry, used and revoked timestamps. No plaintext token is stored.
- Admin issues a seven-day response link from a draft or sent quotation. Reissuing a link revokes prior unused links for that quotation. The link is returned once to Admin for manual sharing; no email provider is configured and no email is sent automatically.
- Public `GET /api/quotation-response` returns only quote details, course title, language and registration reference. Public `POST /api/quotation-response` accepts `accepted` or `declined`, applies one-time/expiry/status checks, same-origin validation and rate limiting.
- Acceptance approves registration and sets payment to pending; enrollment remains unchanged. Decline does not change registration/payment/enrollment statuses.
- Learner page: `quote-response.html` supports English and Bangla.
- CI contract test: `scripts/test-quotation-response.mjs`.
- Apply migration 0013 manually to Preview D1 only after reviewing the SQL. Then perform the Preview tests in `docs/TESTING.md`. Do not use Wrangler migration commands. No Production/main changes are authorized.
- Security note: the URL is a bearer credential. Anyone possessing it can view/respond to the quote until expiry or use. Share it only with the intended learner.


### Stage 14 Preview database verification update

**Status: Preview D1 schema verified from user-supplied SQL output; application workflow remains unverified.**

- User confirmed `quotation_response_tokens` exists in Preview D1.
- `PRAGMA table_info` confirmed the seven expected columns and `created_at DEFAULT CURRENT_TIMESTAMP`.
- `PRAGMA foreign_key_list` confirmed `quote_id` references `quotations.id` with `ON DELETE CASCADE`.
- `PRAGMA index_list` confirmed the expiry and quote lookup indexes, unique token-hash index, and primary-key index.
- These results verify the table structure only. They do not verify link issuance, public token lookup, learner acceptance/decline, expiry, revocation, rate limiting or browser behavior.
- Preview application acceptance remains pending. Do not mark Stage 14 complete until the checklist in `docs/TESTING.md` has been executed.

## 15. Quotation response bearer-link security hardening

**Status: Implemented and committed on development; CI and Preview response-header verification pending.**

- The Worker now wraps the `/quote-response.html` asset response with `Cache-Control: no-store, max-age=0`, `Referrer-Policy: no-referrer` and `X-Robots-Tag: noindex, nofollow, noarchive`.
- The learner page also declares a no-referrer meta policy as defense in depth.
- The existing quotation-response JSON helper already sets `Cache-Control: no-store`.
- Extended the learner quotation response contract test to assert these protections.
- No D1 migration or SQL change was required. No Production deployment or `main` change was made.
- Preview verification must inspect the response headers and confirm the page has no third-party resources that could receive the bearer-token URL.
- Stage 14's accept/decline workflow remains unverified until the learner journey is tested in Preview.


## 16. Admin quotation response link copy dialog

**Status: Implemented on `current-focus-development`; Preview verification pending.**

- Replaced the browser alert/prompt that displayed the learner response URL with an accessible in-page dialog.
- The dialog displays the full URL in a read-only selectable text area and provides a dedicated **Copy link** button.
- Copy uses the Clipboard API, then a legacy document copy fallback; if both are blocked, the URL remains selected for manual Ctrl+C / Cmd+C.
- Added contract assertions in `scripts/test-quotation-response.mjs`.
- No D1 schema change or SQL is required. Do not deploy to Production or merge to `main` without explicit approval.
- After deploying Preview, issue/reissue a test link, verify the dialog, click Copy link, paste locally to verify, and then test the learner response separately. Treat generated URLs as bearer credentials; never share live tokens in screenshots or chat.


### Stage 14 Preview learner workflow verification update — 2026-11-19

**Status: Learner acceptance, decline, expiry, revocation and replay paths verified in Preview using user-supplied browser screenshots and Preview D1 query results. Origin, rate-limit, response-header and bilingual/accessibility checks remain pending.**

- Acceptance test quotation `42e60e83-2d96-4c51-b75f-0d519a52c154`: quotation became `accepted`; registration became `approved`; payment became `pending`; enrollment remained `awaiting_confirmation`; the active response token received `used_at`; previous issued tokens were revoked. Audit records `quotation_learner_accepted` and `registration_approved_by_learner_quote` were confirmed at 2026-11-19 11:53:34.
- Decline test quotation `cc76844e-89a2-4cbe-9022-474b80303ae1`: quotation became `declined`; registration remained `approved`; payment remained `pending`; enrollment remained `awaiting_confirmation`; the active token received `used_at` and `revoked_at` remained NULL.
- The learner page displayed the expected success messages for both decisions.
- The decline audit event `quotation_learner_declined` was confirmed in Preview D1 for the decline quotation.
- The Preview Admin link-copy dialog was exercised: user confirmed the link was copied and opened successfully.
- Additional Preview security tests completed on 2026-11-19:
  - Expired-link test quotation `1b82e740-0f81-4c15-8a5e-ef26251894b1`: token expiry was set to `2026-11-18 00:00:00`; the learner page rejected the link. D1 showed quotation remained `sent`, token `used_at` NULL and `revoked_at` NULL.
  - Revocation test quotation `954d469c-57d0-47b9-9620-404c722c96b4`: reissuing revoked original token `542c0aa8-6475-4f02-b494-c56d7ecbfc2c`; its old link was rejected. Replacement token `3b2c3d6f-a597-48c9-8ddd-9438f76ed0de` remained active, loaded successfully and was then accepted.
  - After acceptance, D1 showed quotation `accepted`, registration `approved`, payment `pending`, enrollment `awaiting_confirmation`, and replacement token `used_at` populated. Reopening the same replacement link produced the expected used-link rejection, verifying replay protection.
- Remaining: cross-origin POST rejection, rate limiting, response-header checks, raw-token exposure review, and English/Bangla, keyboard and mobile accessibility checks. Do not claim complete security acceptance or Production readiness.



## Stage 17 — quotation bearer-token URL exposure reduction (2026-11-20)

**Status: Implemented and committed to `current-focus-development`; automated CI and Preview browser verification pending.**

### Security concern and change
- Previous learner response links placed the bearer token in the page query string, and the page then sent it to the details API in a GET query string. This exposed the token to URL-based handling and made it more likely to remain in browser history or edge request logs.
- New response links place the token in the URL fragment (`#token=...`). Browsers do not send fragments in the HTTP request for the HTML page.
- The learner page reads the fragment token and immediately replaces the current history entry with the clean page path. Legacy query-string links remain accepted by the page as a compatibility fallback, then are cleaned from the visible history entry.
- Quotation details are now retrieved by a same-origin POST to `/api/quotation-response` with `{token, action:"details"}` in the request body. The previous token-bearing GET API route was removed.
- Decision submissions continue to use the same same-origin POST endpoint and request-body token. The existing rate limit applies to both details and decision requests.
- No raw token is written to D1 by this change; the existing SHA-256 token-hash storage remains unchanged.

### Files and commits
- `src/worker.js`: fragment URL issuance and POST details action. Commit `ced592547cfa6ceca6638c148282bfa369bb22ca`.
- `quote-response.html`: fragment parsing, immediate history cleanup, POST details retrieval. Commit `48a585b9d7ca1b8f02c8282958d85f10c7132dfe`.
- `scripts/test-quotation-response.mjs`: contract assertions for fragment links, history cleanup, POST details and removal of the token-bearing GET route. Commit `fffae938770bf6b7bea4839ffa2d9c0afcc24729`.

### Verification and limitations
- Source inspection confirms the new code path is implemented; this is not yet evidence of a passing CI run or a deployed Preview.
- Pending: confirm CI passes; deploy the exact development commit to Preview; issue a fresh response link; confirm the URL contains a fragment, the address bar is cleaned after page load, details load successfully, accept/decline still work, and replay/expiry/revocation remain rejected.
- Existing previously issued query-string links remain supported by the page fallback, but should be reissued to obtain fragment-based links.
- No migration or D1 SQL is required. No deployment, Production change or merge to `main` was performed.


### Stage 17 follow-up source-review correction
- A subsequent source review found that the first POST-details refactor had omitted the quotation lookup used by the accept/decline path. This was corrected before CI verification.
- Restored the sent-quotation/token/registration lookup after the action:"details" branch and added contract assertions that the decision lookup is present and ordered after the details branch.
- Worker correction commit: `d13b9547bf16d42c2e3c879dd17a1ffae3fe307`.
- Test commit: `15310cdf55fb857a5339ba7d55a3c5e5129b5df0`.
- This correction was identified by static source review; it has not yet been exercised in Preview. CI status is not yet confirmed.


### Stage 17 CI follow-up
- GitHub Actions run `44588560410` failed in the quotation response contract step because an earlier test assertion still expected the removed token-bearing GET endpoint. Worker syntax, site validation, RBAC, pricing and registration workflow steps passed in that run.
- After updating the stale GET assertion, run `44588687993` failed on a second stale assertion that still expected `?token=` in the issued URL. The test was corrected to expect `#token=` in commit `42d58e24ff59fe728dd59b043c879783b7b948b8`.
- The CI failure was in outdated test expectations, not a confirmed runtime test. A passing run for the corrected test commit has not yet been observed. Do not mark Stage 17 CI-passed until the latest workflow run is confirmed.


### Stage 17 CI result — passed
- GitHub Actions run `44588832549` completed successfully for test commit `42d58e24ff59fe728dd59b043c879783b7b948b8`.
- All workflow steps passed: Worker syntax, shared JS syntax, HTML/local-link/inline-script validation, RBAC contract, course pricing tests, registration workflow contract and learner quotation response contract.
- This verifies automated checks for the tested commit only. Later documentation-only commits do not change the application code; Preview deployment and browser acceptance remain pending.


## Stage 18 — Admin account session revocation hardening (2026-11-20)

**Status: Implemented and committed to `current-focus-development`; CI and Preview acceptance pending.**

- Source review found that an Admin disabling a user set `is_active=0`, which rejected that user's sessions while disabled, but did not increment `session_version`. If the account was later re-enabled before the old signed session expired, that old session could become valid again.
- Admin account PATCH operations now increment `session_version` on every successful account edit, including role, permission, active-state and password changes. This deliberately revokes the target account's existing sessions; the affected user must sign in again.
- Admin account DELETE/disable now sets `is_active=0` and increments `session_version` in the same SQL update, preventing old sessions from becoming valid if the account is later re-enabled.
- Self-service password changes continue to increment the version and issue a replacement session to the current user.
- Worker commit: `d6d3d55b591e0b09ecdfc742264b1357005cd3e5`.
- RBAC contract test commit: `7f40889ac5f053a16b8fb8320dc67a4d5f96b0b6`.
- Added static contract assertions for both Admin account update and disable SQL. These assertions do not replace a live session-revocation test.
- No migration or D1 SQL is required. No deployment, merge to `main` or Production change was made.
- Pending: confirm CI, then test in Preview by logging in as a test user, disabling the account, re-enabling it, and confirming the old cookie remains rejected; also test permission/role changes invalidate existing sessions.


### Stage 18 CI result — passed
- GitHub Actions run `44638857897` completed successfully for RBAC test commit `7f40889ac5f053a16b8fb8320dc67a4d5f96b0b6`.
- All workflow checks passed, including Worker syntax, site validation, RBAC contract, course pricing, registration workflow and quotation response tests.
- This confirms automated source-contract and syntax checks only. Live Preview account disable/re-enable and session invalidation tests remain pending.


---

## Stage 19 — Preview migration and Admin diagnostics checkpoint (2026-11-22)

**Status: Read-only Preview migration audit passed; migration 0013 pending; Admin diagnostic workflow correction and live execution pending.**

### Verified Preview D1 state
- GitHub Actions audit run: `45024256326`.
- Branch/commit: `current-focus-development` / `b74761d0abaa740c51bd072f0918b795872e513d`.
- Preview database: `consulting-preview-db`.
- Preview database ID: `e0317397-77cb-4f36-9d19-2594ff75b0c2`.
- Cloudflare API token validation and Preview identity check passed.
- Wrangler remote migration listing reported only `0013_quotation_response_tokens.sql` as pending.
- No migration was applied. The separate Production database was excluded by the audit workflow's identity checks.

### Admin diagnostics
- Inspected `.github/workflows/diagnose-preview-admin-login.yml`, `diagnose-preview-admin-login-schema.yml` and `diagnose-preview-admin-schema.yml`.
- All three use an incorrectly escaped JavaScript regex for removing whitespace from the Cloudflare API token. Correct form: `replace(/\\s+/g, "")`.
- The workflow files remain unchanged. Their live runs have not been verified.
- Static schema comparison found Worker references compatible with committed migrations 0001, 0002 and 0009. This is not proof that the Preview database has the expected live schema or that Admin login works.

### Next actions and safety boundary
1. Obtain explicit approval before correcting the three Admin diagnostic workflows.
2. Obtain explicit approval before applying migration 0013 to the verified Preview D1 database.
3. After an authorized migration, rerun the read-only migration audit and confirm no pending migrations.
4. Run read-only Admin schema diagnostics after fixing and validating their token parsing.
5. Verify the deployed Preview Worker version and complete browser-based functional acceptance.
6. Update this handover and changelog with run IDs, commit SHAs and environment-specific evidence.

No Production deployment, Production migration, `main` change, branch reconciliation or PR merge is authorized by this checkpoint.


### Stage 19 follow-up — Admin diagnostic workflow correction (2026-11-22)

**Completed on `current-focus-development`:**
- Fixed token whitespace normalization in:
  - `.github/workflows/diagnose-preview-admin-login.yml`
  - `.github/workflows/diagnose-preview-admin-login-schema.yml`
  - `.github/workflows/diagnose-preview-admin-schema.yml`
- Each file was fetched again after its update; the intended regex `/\\s+/g` is present and the malformed regex is absent.
- Re-inspected `.github/workflows/migrate-preview-d1.yml`: manual dispatch, development-branch guard, exact Preview D1 ID check, Production D1 ID exclusion, and apply/list operations scoped to `PREVIEW_DB`.

**Still pending:**
- Dispatch the guarded migration workflow manually from GitHub Actions on branch `current-focus-development`. The connected GitHub tool interface has no workflow-dispatch operation, so this action could not be initiated from this session.
- After the workflow completes, inspect its run and post-apply migration listing. Do not claim migration 0013 is applied until that evidence exists.
- Run the corrected Admin diagnostic workflows and inspect their read-only output.
- Confirm the automatic development CI runs triggered by the documentation/workflow commits.
- Verify the deployed Preview Worker commit and finish browser acceptance.

Migration 0013 remains pending. No Production or `main` operation has been performed.


---

## 2026-11-22 — Preview Admin operational checkpoint and deferred testing

**Current status:** Preview Admin login, dashboard access and Website Content are user-reported working. Further functional testing is paused at the user's request; documentation has been updated to preserve the current evidence and outstanding checklist.

### Preview D1 diagnostics
- Guarded migration workflow run #8 completed successfully on `current-focus-development`. The visible verification step reported `No migrations to apply!`. The provided screenshots did not include the full post-application migration ledger; do not claim an individual migration filename is ledger-verified solely from this evidence.
- All three corrected read-only Admin diagnostic workflows completed successfully.
- Preview database: `consulting-preview-db`; ID `e0317397-77cb-4f36-9d19-2594ff75b0c2`.
- Confirmed tables: `admin_users`, `audit_logs`, `rate_limits`.
- Admin account count: 1.
- PRAGMA inspection succeeded. Observed columns:
  - `rate_limits`: `rate_key`, `window_started_at`, `request_count`, `expires_at`.
  - `admin_users`: `id`, `email`, `full_name`, `role`, `password_hash`, `permissions_json`, `is_active`, `session_version`, `created_at`, `updated_at`, `last_login_at`.
  - `audit_logs`: `id`, `admin_email`, `action`, `entity_type`, `entity_id`, `details`, `created_at`.
- Diagnostic SQL was read-only: no database changes and zero rows written. Preview identity guards passed; Production was excluded.

### Browser acceptance reported by the user
- Preview Admin page opened.
- Admin login succeeded.
- Dashboard opened fully and all menu items were visible.
- Website Content worked perfectly.

These browser results are user-reported. They are not a complete acceptance test of every Admin module.

### Deferred functional testing checklist
Resume only when the user asks to test:
1. Courses: create/edit, discount handling, syllabus file/link upload and removal.
2. Quotations: create/update, accept/decline, expiry, revocation, replay and audit behavior.
3. Registrations and inquiry workflows.
4. User roles/permissions and live session revocation.
5. Payment and email integrations, if/when configured.
6. Public site rendering, bilingual content and CMS publication/history behavior.
7. Security review and documented OWASP ASVS Level 2 verification.

### Operating instructions
- Do not continue asking the user to test modules now; the user explicitly wants testing later.
- Keep documentation current when material work occurs.
- Do not claim all development or release readiness is complete.
- Keep `main`, Production resources and PR/branch history untouched unless the user separately authorizes a specific operation.


## Current project handover — 2026-11-23

**Start here:** [Project Master Status](PROJECT_MASTER_STATUS.md). The latest verified development branch head is `f4cadf992879052d9ee8fd76cf143613c4361610`; CI run [#45140128176](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45140128176) passed for that commit. The next active task is implementation of Admin MFA and login security. The source audit confirmed password-only login and no MFA flow. Read [Administrator Authentication and MFA Security Assessment](ADMIN_AUTH_MFA_SECURITY_ASSESSMENT.md) before coding.

Update `docs/PROJECT_MASTER_STATUS.md`, the relevant technical docs and `CHANGELOG.md` in every task commit. Verify the branch and CI at the start of each new chat. Continue from the next pending action; do not repeat completed work. No migration, deployment, Preview configuration change, Production change, merge/rebase or branch reconciliation is authorized without separate explicit approval. Migration 0018 is present in source but its remote application state is not independently verified.


## Current handover — Admin MFA implementation (2026-11-23)

The first Admin MFA source implementation is on `current-focus-development`:
- MFA feature commit: `bad4a5904617047abe256bd416ed5a2b513238b0`.
- Follow-up security commit: `8ba829c633f4a4ed5cf0caeecc94c61087e87382`.
- Migration: `0019_admin_mfa.sql` (not applied).
- New module: `src/admin-mfa.js`.
- New unit/source-contract test: `scripts/test-admin-mfa.mjs`.

The Worker requires password + TOTP enrollment/verification before issuing a full Admin session. It uses encrypted TOTP seeds, short-lived signed challenge cookies, replay-safe counters, single-use hashed recovery codes and account/IP throttling. The Admin UI includes English/Bangla MFA setup and verification instructions.

**Mandatory prerequisites before Preview deployment:** configure a unique Preview-only `MFA_ENCRYPTION_KEY` (32 random bytes, base64url) and obtain explicit approval to apply migration 0019 and deploy. No Preview or Production resource was changed. Check `docs/PROJECT_MASTER_STATUS.md` and latest CI before continuing.


**CI verification update — 2026-11-23:** Development CI run [#45148706139](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45148706139) passed for commit `432a59fc62c3b80f68948fa62db13a6e88ef0cff`. This includes Worker syntax, HTML/inline-script validation, existing RBAC/CMS checks, password hashing and the new Admin MFA cryptographic/source-contract test. It does not establish Preview deployment or runtime acceptance.


**Final MFA CI update — 2026-11-23:** Latest development CI run [#45149004614](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45149004614) passed for `c6a72eae839c6fcec3310fc26ff6806291798e87`. It includes MFA cryptographic and source-contract tests, account/IP throttling assertions and failed-attempt audit assertions. Preview migration, secret configuration, deployment and browser acceptance remain pending.


## 2026-11-23 — Bulk CMS initialization recovery handover

The Admin initializer now rejects more than 400 collected items before sending, explains safe retry after ambiguous network failure, and confirms that initialization creates drafts only. The Worker validates the full request before a single D1 batch with insert-if-absent content writes, conditional draft history and audit.

New CI test: `scripts/test-cms-initialization-recovery.mjs`; the existing atomicity contract test remains. Check the latest Actions run before continuing. Source tests do not prove real D1 rollback under failure or Preview browser acceptance.

Next priority after green CI: CMS revision/concurrency runtime test planning. Do not deploy or apply migrations without explicit approval.


**Bulk CMS initialization CI result — 2026-11-23:** Development CI run [#45149785654](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45149785654) passed for implementation commit `5deeadf5a574d4a603c9f631821d86ef4599012d`. All existing validation jobs and the new initialization recovery source-contract test passed. This does not prove live D1 rollback behavior or Preview browser acceptance.


## 2026-11-23 — CMS revision and concurrency test handover

The existing CMS optimistic concurrency implementation uses migration 0018 and compare-and-swap revision updates for draft save, archive, restore and historical restore. This source work adds two automated verification layers:

- `scripts/test-cms-revision-contract.mjs` checks Worker route and Admin revision-token contracts.
- `scripts/test-cms-revision-sqlite.py` applies migration 0018 to a temporary SQLite database and tests competing editor writes, stale archive/restore, historical restore and transaction rollback after an injected history insert failure.

The SQLite model is not a live Cloudflare D1 test. CI must pass before the source-test stage is marked complete. Preview acceptance remains separately gated: inspect the Preview D1 migration ledger read-only, obtain explicit approval for migration/deployment, then test two independent Admin sessions and verify content, revision, history and audit results.

Do not change `main`, Production, Cloudflare secrets/configuration or remote databases without separate explicit approval. Next priority after CI: prepare the Preview-only acceptance request and record any required migration/deployment approvals.


**CMS revision/concurrency CI result — 2026-11-23:** Development CI run [#45150564334](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45150564334) passed for commit `ced2ce5a08bb00f89401b1cc6b1131b0755d4fd3`. The Worker/Admin contract checks and SQLite test passed, including two concurrent editor requests with the same revision, stale archive/restore, historical restore and injected history-write rollback. This is not a live Cloudflare D1 or Preview browser test. No migration, deployment or remote database operation was performed.


## 2026-11-23 — Preview CMS concurrency acceptance handover

Development source and SQLite transaction-model tests passed in CI. The next prerequisite is a fresh read-only Preview D1 migration audit because the previous successful audit (#45024256326, 2026-11-22) predates migration 0018.

The read-only audit workflow exists on both `main` and `current-focus-development`. Start it manually in GitHub Actions, selecting `current-focus-development`. Verify the complete output names Preview D1 `consulting-preview-db` / `e0317397-77cb-4f36-9d19-2594ff75b0c2` and states whether `0018_cms_content_revision.sql` is pending. The GitHub connector cannot dispatch workflows. This audit is read-only.

If 0018 is pending, stop and request explicit migration approval. If already applied, record evidence and request separate Preview deployment approval. The Preview deployment workflow is absent from `main`; adding it to `main` requires separate approval. Never deploy or migrate Production. After deployment, perform the two-session CMS concurrency acceptance checklist in `docs/TESTING.md`.


## 2026-11-24 — Preview D1 migrations applied and verified

The authorized Preview migration workflow [Run #11](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/4516057616) completed successfully. Job `migrate-preview` verified the dedicated remote Preview D1 ID `e0317397-77cb-4f36-9d19-2594ff75b0c2` before migration activity. The pre-apply migration list contained `0018_cms_content_revision.sql` and `0019_admin_mfa.sql`. Wrangler reported both migrations with successful status after execution. The final remote migration-list step returned **No migrations to apply!** The job steps `Apply pending migrations to Preview D1 only` and `Verify Preview migration state` both completed successfully.

This is direct GitHub Actions execution evidence for the Preview D1 migration ledger. It confirms the two migrations were applied to the dedicated Preview database. It does not establish that a Worker containing the corresponding source code has been deployed or that runtime/browser acceptance has passed. Production and `main` were not targeted by this workflow.
