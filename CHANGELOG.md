## 2026-11-22 — Cloudinary upload lifecycle journal
- Added migration 0016 to track pending, uploaded, registered, attached, failed, needs-review and deleted asset lifecycle states.
- The Worker records an upload before contacting Cloudinary, flags uncertain outcomes and Media Library registration failures, and marks syllabus uploads attached when their URL is saved to a course.
- The read-only Admin audit now reports upload lifecycle counts and up to 100 unresolved/reviewable upload records. No automatic asset deletion was added.
- Preview migration 0016, Worker deployment and runtime acceptance tests remain pending. Production resources and data were not changed.

## 2026-11-22 — Read-only Cloudinary asset audit
- Added a permission-protected, rate-limited Admin report for registered Media Library assets, database reference findings, attached course syllabus URLs and deletion-journal status counts.
- Added bounded pagination and labels unreferenced registered assets as potential orphan candidates only; the report does not delete assets or claim Cloudinary remote existence.
- Documented reference-scan limits, unsupported external/hard-coded references, the rate-limit counter write and Preview acceptance checks.
- Preview migrations and deployment remain pending. No Preview or Production resources or data were changed.

## 2026-11-22 — Cloudinary upload security review
- Documented browser-only upload size checks, one-hour signature replay window, and client-supplied media metadata limitations. Remediation design remains pending.

## 2026-11-22 — Admin API mutation security audit
- Audited all declared API mutation handlers for same-origin enforcement and added RBAC source-contract regression checks for mutation coverage and Admin API permission boundaries.

## 2026-11-22 — Administrator password hashing upgrade
- Added a shared password-hashing helper using PBKDF2-HMAC-SHA-256 with a 600,000-iteration current work factor and a fresh 16-byte random salt for each hash.
- Retained verification support for existing 100,000-iteration hashes. After successful login, legacy hashes are upgraded using a conditional database update so a concurrent password change is not overwritten.
- New bootstrap, account-creation, password-reset and self-service password-change hashes use the current work factor.
- Added password-hash compatibility tests and included them in the development CI workflow; updated the RBAC source-contract checks and testing documentation.
- Source changes are limited to `current-focus-development`. No password values, stored hashes, Preview/Production data or secrets were accessed or changed. Functional and Preview runtime testing remain pending.

## 2026-11-22 — Branch divergence and Preview workflow review
- Recompared `current-focus-development` with `main`: development is 575 commits ahead and 14 commits behind; the branches remain diverged at merge base `5260b56751f2e1d1a946d619b2d8f68dd633c2fd`.
- Reviewed the 14-commit main-side difference. The changed-file comparison identifies six Preview/Cloudflare workflow files; five are byte-identical on both branches. The remaining file, `.github/workflows/migrate-preview-d1.yml`, differs: `main` retains the invalid single-bracket Preview D1 parser, while development contains the reviewed double-bracket parser fix.
- Draft PR #1 remains open, unmerged and based on `main`; its description contains initial-project setup and test statements that are stale relative to the current development branch.
- No branch reconciliation, merge, deployment, migration, secret access or Production change was performed. A release reconciliation strategy still requires separate review and approval.

## 2026-11-22 — Preview migration 0013 review
- Reviewed migration 0013 SQL, the Worker token issuance/response logic, the learner response page, and the existing quotation-response contract test.
- No blocking SQL/application incompatibility was identified by static review. The migration is additive and stores only SHA-256 token hashes; the Worker uses one-time, expiring, revocable bearer tokens with same-origin and rate-limit checks.
- Runtime integration, concurrent-request, and full learner-journey tests against Preview remain outstanding. Migration 0013 is still pending and was not applied. Production remains untouched.

## 2026-11-22
- Fixed the Preview D1 migration workflow parser to read Wrangler's `[[previews.d1_databases]]` array-of-table declaration and fail closed when the Preview database ID cannot be parsed.
- Verified the parser against the current `wrangler.toml`; it resolves the configured Preview D1 ID and rejects the Production ID. No database migration was executed.



## 2026-11-18 — Stage 9A.8 disposable D1 test progress

- Verified migration 0003 on the disposable D1 target from user-supplied output: all four expected homepage hero seed records and the `site_content` table DDL match committed migration 0003.
- Verified migration 0004's `page_styles` table DDL against the committed migration using user-supplied D1 Console output.
- Verified migration 0005's `pages` table DDL and `idx_pages_status_slug` index against the committed migration.
- Verified migration 0006's `media_assets` table DDL and `idx_media_assets_created` index against the committed migration.
- Verified migration 0007's `chat_conversations` and `chat_messages` table DDL, the `ON DELETE CASCADE` foreign key, and both chat indexes against the committed migration.
- Verified migration 0008's `analytics_events` table DDL and all three indexes (`idx_analytics_events_created`, `idx_analytics_events_page`, `idx_analytics_events_visitor`) against the committed migration from user-supplied D1 Console output.
- Verified migration 0009's `admin_users` table DDL and `idx_admin_users_role_active` index against committed SQL from user-supplied D1 Console output.
- Migrations 0001–0009 have been reconstructed and verified against committed SQL on the disposable target. The manual process did not create or update `d1_migrations` entries.
- Applied and verified migration 0010 from the clean starting schema on the confirmed disposable target. All five expected columns and definitions are present; the course count remained 3; `discount_type` is populated for all three rows; `syllabus_url` is NULL for all three.
- Next: test migration 0011's `syllabus_file_url` addition and Cloudinary PDF URL transfer with synthetic data.
- Next: follow the Stage 9A.7 plan for isolated 0010/0011 compatibility scenarios and CMS schema tests on the disposable target.
- Documentation-only repository changes. No migration 0004 or later, Preview or Production database mutation, application code change, or deployment was performed.

## 2026-11-19 — Bilingual CMS and dual editing workflows

- Implemented the bilingual static-page CMS for 12 English pages, 12 Bangla pages and a separate Global content context.
- Added draft/published content separation, page/language-scoped publishing, authenticated draft preview, content-key inspection, soft archive/restore and version-history recovery.
- Added the on-page editing path to the existing dashboard editor: when the page is opened with `?cmsKeys=1`, clicking an eligible highlighted element opens an inline editor. It saves drafts through the existing authenticated CMS save endpoint; it does not publish automatically.
- Preserved the legacy six-table CMS schema in Preview; the new version history uses `cms_static_content_versions`.
- User-reported Preview D1 results: migration ledger contains 0001–0012; four existing published English homepage values were imported; four published version rows were created; all six legacy CMS tables remain present. The assistant did not directly access D1.
- Development branch commit for the on-page editor and follow-up correction: `754507b0a28290cc972929f61bef891fbe9b880c`.
- Remaining: verify final GitHub Actions validation, confirm Cloudflare Preview has deployed this exact commit, and perform authenticated browser tests for dashboard editing, inline editing, save, preview and publication. The earlier Cloudflare Ready screenshot referred to an earlier deployment and does not verify this commit.
- No Production migration/deployment, merge to `main`, or Production data change was performed or authorized.

## 2026-11-19 — CMS history and publication feedback fix

- Fixed CMS version restore controls by using delegated click handling on the persistent history container. Restore buttons are rendered asynchronously and previously had listeners attached before they existed.
- History now displays a loading state and an explicit empty-history message; errors are shown in the history panel.
- After publishing, the Dashboard now reads the public CMS endpoint with `cache: no-store`, compares the public item count with the publish result, and provides a direct link to the selected public page with a cache-busting query parameter.
- Commit: `d28bd1e21473ea3b3b984b056d7e1404774a154c`.
- Preview deployment and browser verification are still pending. The public API count check verifies stored publication visibility, not that every content key maps to the intended visible DOM element.
- No Production deployment, migration or database change was performed.


## 2026-11-19 — Custom page CMS integration

- Automatically register custom pages in the Content Manager page selector.
- Seed page title, SEO and section content keys when custom pages are created or their structure is saved.
- Render published CMS values on public custom pages and draft CMS values in authenticated previews.
- Preserve existing CMS records when page structure is saved; delete associated CMS records and history when a custom page is deleted.


## 2026-11-19 — Course discount and registration-fee consistency

- Added a shared pricing module so public course display and registration persistence use the same integer-minor-unit calculation.
- Public course API now returns the active discount, discount amount and final fee; English and Bangla course pages display these server-calculated values.
- Centralized discount validation for course creation and updates, including real calendar-date checks, inclusive date windows, whole-number percentage discounts and safe discount bounds.
- Preserved custom-quotation behavior and made zero-fee registrations visible in the Admin registration list.
- Added course-pricing unit and integration-contract tests to the development CI workflow.
- Preview deployment, API/browser acceptance and registration persistence checks remain pending. No D1 migration or Production change was made.


## 2026-11-19 — Registration workflow integrity

- Custom quotation changes now create draft records in the existing quotations table and update the registration's current fee snapshot in the same D1 batch.
- Added quotation-history API and Admin history view; quotation currency follows the course/registration currency.
- Added audited manual payment-status updates and exposed payment status in the Admin registration table.
- Added Admin controls to update the existing enrollment states.
- Added registration workflow contract tests to development CI. No migration or Production change was made.
- Payment processing, automated verification, quote sending and quote acceptance remain out of scope.


## 2026-11-19 — Registration lifecycle and quotation acceptance

- Added guarded quotation transitions: draft to sent, then sent to accepted, declined or expired.
- Accepting a valid sent quotation approves the registration and sets payment to pending; enrollment remains unchanged for manual confirmation.
- Prevented acceptance for rejected/cancelled registrations or cancelled enrollments and rejected expired quotations.
- Added Admin controls to advance quotation status and audit events for quotation and linked registration changes.
- Added registration lifecycle contract tests and Preview acceptance cases. No schema migration or Production change was made.


## 2026-11-19 — Learner-facing quotation response

- Added one-time, 32-byte random learner response tokens; only SHA-256 hashes are stored in D1.
- Added a seven-day response window and a bilingual learner-facing quotation response page.
- Admin can issue a secure response link for a draft quote and manually share the returned URL. No email delivery provider is configured, so no automatic email is sent.
- Learners can accept or decline; acceptance approves the registration and sets payment to pending while leaving enrollment unchanged. Decline leaves registration/payment/enrollment statuses unchanged.
- Added token expiry, single-use, revocation, same-origin POST and rate-limit checks plus learner decision audit events.
- Added migration 0013 and development CI contract tests. Preview D1 migration and browser/API acceptance remain pending; Production and `main` were not changed.


## 2026-11-19 — Quotation response bearer-link security hardening

- Added no-store, no-referrer and noindex response headers to the learner quotation response page.
- Added a no-referrer meta policy as defense in depth.
- Extended the learner quotation response contract test to check the security headers.
- Preview header and browser verification remain pending. No D1 migration, Production deployment or `main` change was made.

## 2026-11-19 — Admin quotation link copy dialog

- Replaced the browser alert/prompt link handoff with an accessible dialog containing a read-only, selectable URL field and a dedicated Copy link button.
- Added clipboard API support with a legacy copy fallback and a manual-selection fallback.
- Added a contract assertion for the Admin copy dialog. Preview browser verification remains pending; no D1 migration, Production deployment or `main` change was made.


## 2026-11-19 — Preview quotation response workflow verification

- Verified learner acceptance against Preview D1: quote accepted, registration approved, payment pending, enrollment unchanged, token consumed, and both acceptance audit events present.
- Verified learner decline against Preview D1 using a separate quotation: quote declined, registration/payment/enrollment unchanged, and token consumed.
- Verified the Admin copy dialog could copy a link that opened the learner response page.
- Decline audit event and security edge cases (expiry, revocation, replay, origin checks, rate limiting, response headers and bilingual/accessibility checks) remain pending. No Production or `main` changes were made.


## 2026-11-19 — Preview quotation response security verification

- Verified expired-token rejection: the learner page rejected an expired response link; D1 confirmed the token remained unused and unrevoked and the quotation remained sent.
- Verified link reissue revocation: the original link was rejected after reissue, while the replacement link remained accessible.
- Accepted the replacement link and verified the quotation became accepted, registration approved, payment pending, enrollment unchanged and token consumed.
- Reopened the consumed replacement link and confirmed replay was rejected.
- Confirmed the decline audit event `quotation_learner_declined`.
- Cross-origin rejection, rate limiting, response-header checks, raw-token exposure review and full bilingual/accessibility checks remain pending. No Production or `main` changes were made.


## 2026-11-20 — Learner quotation bearer-token URL exposure reduction

- Changed newly issued learner response links to carry the token in the URL fragment rather than the query string.
- The learner page reads the fragment and immediately removes the token from the current browser history entry.
- Moved quotation detail retrieval from a token-bearing GET query to a same-origin POST request body; removed the token-bearing GET API handler.
- Retained a temporary page-side fallback for previously issued query-string links; the page cleans the URL and retrieves details through POST.
- Extended the quotation response contract test for fragment issuance, history cleanup and POST details retrieval.
- CI and Preview browser acceptance remain pending. No migration, D1 operation, deployment, Production change or `main` change was made.

- Follow-up source review restored the separate quotation lookup required by accept/decline after the POST details branch; contract coverage now checks that path. Preview and CI verification remain pending.

- Corrected two stale quotation-response contract assertions that still expected the former GET/query-string implementation. The latest CI result for the corrected assertions is pending; no passing result is claimed.

- Development CI run `44588832549` passed all automated checks for commit `42d58e24ff59fe728dd59b043c879783b7b948b8`; Preview deployment and browser acceptance remain pending.


## 2026-11-20 — Admin account session revocation hardening

- Admin account edits now increment `session_version`, revoking the target account's existing sessions after role, permission, active-state or password changes.
- Account disable now increments `session_version` together with setting `is_active=0`, so re-enabling an account does not revive a previously issued session.
- Added RBAC source-contract assertions for both paths. CI and Preview live-session acceptance remain pending. No migration or Production change was made.

- Development CI run `44638857897` passed all automated checks for the Admin session-revocation contract commit `7f40889ac5f053a16b8fb8320dc67a4d5f96b0b6`; live Preview session tests remain pending.


## 2026-11-22 — Consolidated project history and audit baseline

- Added `docs/MASTER_PROJECT_HISTORY.md`, consolidating available Website 1–4 conversation summaries, standing decisions, repository evidence, feature acceptance gaps, security review items and prioritized next steps.
- Linked the master history from `README.md`.
- Added the current audit baseline to `docs/CHATGPT_PROJECT_CONTEXT.md`, retaining dated historical notes and clarifying that the current Preview deployment and browser acceptance have not been independently confirmed.
- Updated `docs/DATABASE.md` with the development branch's 13 migration files and explicit evidence limitations; prior user-reported D1 observations remain labeled as such.
- Updated the operational handover to point to the master history and preserve the release blockers.
- Audit only: no branch reconciliation, merge, deployment, migration, secret access or Production change.
- GitHub compare at audit time reported `current-focus-development` diverged from `main` (558 ahead, 12 behind). This requires a separate reviewed release plan.


## 2026-11-22 — Preview D1 and Admin diagnostics follow-up

- Reconfirmed the successful read-only Preview D1 migration audit (GitHub Actions run `45024256326`): Preview database identity matched the expected ID and migration `0013_quotation_response_tokens.sql` was the only pending migration.
- Re-inspected all three Admin diagnostic workflows and found an incorrectly escaped token whitespace-normalization regex in each. The intended JavaScript expression is `replace(/\\s+/g, "")`; the current workflows use `replace(/\\\\s+/g, "")`. They remain unmodified pending authorization.
- Admin diagnostic workflow execution remains pending. No migration was applied; no Preview deployment, Production change, `main` change or PR merge was performed.


## 2026-11-22 — Preview Admin diagnostic workflow corrections

- Corrected the Cloudflare API token whitespace-normalization regex in all three Preview Admin diagnostic workflows to use JavaScript `/\\s+/g`.
- Updated only `current-focus-development`; no changes were made to `main`.
- Re-fetched all three workflow files after the commits and verified that the malformed regex no longer appears.
- Re-inspected the Preview migration workflow: it is manually dispatched, guarded to `current-focus-development`, checks the expected Preview D1 ID and excludes the known Production D1 ID, lists migrations before and after applying, and targets only the `PREVIEW_DB` binding.
- The workflow was not dispatched in this session because the available GitHub connection does not expose a workflow-dispatch action. Migration 0013 remains pending until the guarded workflow is manually started and its successful run is verified.
- No Production migration, deployment, `main` change or PR merge was performed.


## 2026-11-22 — Preview Admin diagnostics and user-reported acceptance

- Successfully ran the guarded Preview D1 migration workflow on `current-focus-development` (run #8). Its migration check reported `No migrations to apply!`. The available screenshot evidence did not expose the full post-apply migration ledger, so the exact applied migration record is not independently transcribed here.
- Successfully ran all three corrected, read-only Preview Admin diagnostic workflows. The required tables `admin_users`, `audit_logs` and `rate_limits` were found in Preview D1 `e0317397-77cb-4f36-9d19-2594ff75b0c2`; the Admin account count was 1.
- Preview schema inspection returned the expected columns for `rate_limits`, `admin_users` and `audit_logs`. Diagnostic SQL reported zero database changes and zero rows written.
- User-reported browser acceptance: Preview Admin login succeeded, the dashboard opened with all menu items visible, and Website Content worked correctly.
- Further functional testing is intentionally deferred at the user's request. Course, quotation, registration, permissions/session, payment, email and full security acceptance remain untested or not fully evidenced. No Production deployment or `main` change was performed.


## 2026-11-22 — Cloudinary upload remediation
- Routed Admin media and syllabus uploads through the Worker.
- Added server-side file-size and file-signature validation, server-held Cloudinary signing, UUID public IDs, Cloudinary response checks, and upload-request quotas.
- Removed browser-facing upload signatures and client-supplied media metadata registration. Preview runtime verification remains pending.


## 2026-11-22 — Cloudinary deletion recovery
- Added D1 deletion journal and retry endpoint for Media Library and course syllabus assets.
- Added Admin recovery action, idempotent handling of Cloudinary `not found`, and conditional course syllabus finalization.
- Preview migration and runtime acceptance checks remain pending.


## 2026-11-22 — Cloudinary asset reference protection
- Blocked deletion of assets referenced by database-managed site content, CMS drafts/publications/history, custom pages, page styles or other course syllabus records.
- Added reference rechecks during deletion recovery and clearer Admin status reporting.
- Hard-coded source references, external copies and concurrency races remain outside the current guarantee; Preview acceptance remains pending.


## 2026-11-22 — Cloudinary deletion reservations
- Added migration 0015 with 11 D1 triggers protecting legacy content, CMS values and history, custom pages, homepage styles and course syllabus fields from referencing assets with pending/failed deletion operations.
- Media and syllabus deletion repeat reference scans after reserving the asset and before contacting Cloudinary.
- Migration 0015 must be applied to Preview before deploying the Worker changes. Runtime and concurrency acceptance remain pending.


## 2026-11-22 — Read-only Cloudinary remote inventory comparison

- Added a permission-gated, rate-limited Admin endpoint that lists Cloudinary image/raw assets under the `sohel-consulting/` public-ID prefix using bounded cursor pagination and server-held Basic Auth credentials.
- Compares each returned page with Media Library records, upload lifecycle rows and up to 500 syllabus references; unmatched remote assets are explicitly candidates, not confirmed orphans.
- Added Admin controls for image/raw page scans and cursor continuation.
- The endpoint does not delete Cloudinary assets or mutate D1 business records. Full-inventory completion and missing-remote detection are not claimed because this first version does not persist a complete cross-page inventory snapshot.
- Source-contract checks and Preview acceptance are pending; no Preview migration/deployment, Production change, `main` change or PR merge was performed.


## 2026-11-22 — Persistent Cloudinary inventory snapshots

- Added migration 0017 for durable Cloudinary inventory scan metadata and per-resource remote asset snapshots.
- Replaced browser-only cursor pagination with resumable image/raw scans, per-resource leases, stale-scan handling and bounded page limits.
- A scan is complete only after both Cloudinary resource types finish. Missing-remote comparison is withheld when local or snapshot safety caps are exceeded.
- Compares supported D1 media, upload-journal and syllabus records against the completed snapshot. Results are limited to the `sohel-consulting/` prefix and are not proof of complete external-reference coverage.
- Added Admin controls to start, resume, refresh and advance persistent scans.
- Added contract checks and Preview acceptance documentation. CI and Preview migration/deployment/runtime acceptance remain pending. No Production or `main` change was made.


## 2026-11-22 — Cloudinary inventory reconciliation hardening

- Explicitly rejects unsupported HTTP methods on the inventory route and retains same-origin checks for scan POST requests.
- Replaced SQL LIKE prefix filters with literal SQLite prefix matching to avoid underscore wildcard behavior.
- Withholds missing-remote comparison when in-scope local assets cannot be classified as image or raw.
- Preserves specific comparison-withheld reasons in API output and Admin UI.
- Added regression contract checks and documented the Preview-only rollout sequence and release gates. No migration, deployment, live Cloudinary scan or Production change was performed.


- Added a partial unique D1 index to prevent concurrent scan starts from creating multiple active scans; concurrent starts return the already active scan ID.
- Documented that paginated Cloudinary inventory is not an atomic point-in-time snapshot and missing-remote rows are reconciliation leads, not proof of deletion.

## 2026-11-23 — Isolated Preview Worker deployment preparation

- Added `wrangler.preview.toml` with the dedicated Preview Worker name and exact Preview D1 database ID; the Production D1 binding is not included.
- Added `.github/workflows/deploy-cloudflare-preview.yml` with a development-branch guard, Preview target checks, Cloudflare token/database verification, source validation and a Preview-only Wrangler deploy command.
- Added `docs/PREVIEW_DEPLOYMENT.md` describing required secrets, branch restrictions and post-deployment acceptance boundaries.
- Development CI passed for the workflow/configuration changes (runs `45047751169`, `45047779916`, `45047850957`, and `45047891708`).
- GitHub Actions UI did not expose the workflow because it is present only on `current-focus-development`. GitHub documentation confirms a `workflow_dispatch` workflow must also exist on the default branch to be manually triggered in the UI. The default branch currently does not contain this workflow.
- No change was made to `main`, no workflow was dispatched, and no Cloudflare Worker deployment was performed. Adding the workflow file to `main` remains a separately authorized action.
