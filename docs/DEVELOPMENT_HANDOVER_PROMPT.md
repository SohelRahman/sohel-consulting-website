# Master Development Handover Prompt

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
- Admin issues a seven-day response link only from a draft quotation. The link is returned once to Admin for manual sharing; no email provider is configured and no email is sent automatically.
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
