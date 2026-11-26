## 2026-11-26 — Argon2id WASM source-level security review

- Added `docs/ARGON2ID_WASM_SECURITY_REVIEW.md` covering the Rust implementation, JavaScript adapter, temporary Worker harness and CI workflows.
- Positive controls include fixed Argon2id costs, bounded inputs, Web Crypto salt generation, owned working-memory wiping, mutable-buffer cleanup and full-tag comparison.
- Release blockers remain: Cloudflare runtime acceptance, actual invocation CPU-time evidence, concurrency/memory testing and broader interoperability/fuzz coverage.
- The review is source-level only, not an external audit. The prototype remains isolated; no application authentication, stored hashes, D1, existing Preview or Production resources changed.

## 2026-11-26 — Argon2id WASM adapter integration CI passed

- CI Run #45818799624 passed Rust formatting, host tests, Clippy, release WebAssembly compilation, wasm-bindgen web/Node binding generation, JavaScript adapter integration and explicit memory-growth tests.
- Uploaded the precompiled WebAssembly package as a CI artifact (seven-day retention).
- Updated prototype documentation to separate verified source/CI evidence from pending Wrangler and Cloudflare Workers runtime acceptance.
- No application authentication, D1, existing Preview, Production or `main` changes.

## 2026-11-26 — Follow-up Argon2id ABI formatting correction

- A second dedicated CI run found one remaining rustfmt line-wrap difference in the PHC export. Corrected it; tests and compilation remain pending a successful run.

## 2026-11-26 — Argon2id ABI CI formatting correction

- Corrected Rust formatting after dedicated prototype CI Run #13 failed at the formatting check. The log showed no compilation or test failure because later steps were skipped.
- A fresh dedicated CI run is required to verify formatting, host tests, Clippy and WASM compilation.
- No application authentication, Preview or Production resources changed.

## 2026-11-26 — Bounded wasm-bindgen ABI source

- Added wasm32-only typed-array exports for derivation and PHC operations with pre-copy length guards and zeroizing password copies.
- Added host boundary tests; CI pending. No deployment or app auth changes.

## 2026-11-26 — Argon2id working-memory zeroization test

- Added an explicit matrix-wipe method and a unit test that verifies every 64-bit word in a multi-block matrix is zero after wiping.
- `Drop` now delegates to the same wipe method. CI pending; no app auth or deployment changes.
## 2026-11-26 — Independent Argon2id PHC interoperability fixture
- Generated a fixed Argon2id v=19 / m=19,456 KiB / t=2 / p=1 PHC fixture using Python argon2-cffi 25.1.0, independent of the RustCrypto implementation.
- Added a cross-implementation test for fixture verification, wrong-password rejection and exact Rust-generated PHC output.
- CI verification is pending. Remaining: bounded WASM ABI, precompiled Worker module, JS adapter, boundary/memory-growth tests, explicit matrix-wipe tests, isolated Worker benchmarks, security review and release gates.
- No application authentication, stored hashes, Preview or Production resources changed.

## 2026-11-26 — Argon2id prototype validation passed
- Dedicated CI run [#45777843556](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45777843556) passed formatting, three host tests including the Argon2id v=19 KAT, Clippy with warnings denied, and optimized wasm32 compilation.
- Initial formatting and Clippy failures were fixed before the passing run.
- Broader development validation [#45777849748](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45777849748) passed. Preview deployment and the isolated runtime benchmark were skipped; no Worker was deployed and no app authentication or stored hashes changed.
- Remaining: bounded ABI, PHC interoperability, memory-wipe test coverage, Cloudflare runtime/CPU/memory benchmark.

## 2026-11-26 — RustCrypto Argon2id prototype source stage
- Added an isolated Rust crate pinned to RustCrypto Argon2 0.6.0 at commit `dc7e0c25cda9a8421d2604debf548d663886b431`.
- Fixed candidate parameters to Argon2id v=19, 19,456 KiB, two passes, one lane and a 32-byte tag; bounded password input and required a 16-byte caller-supplied salt.
- Added an owned working-matrix wrapper that zeroizes every block in `Drop`, upstream Argon2id v=19 KAT coverage, deterministic/differentiation/input-bound tests, and CI for host tests, formatting, Clippy and wasm32 compilation.
- CI outcome is pending. No ABI, PHC layer, Worker integration or benchmark is implemented yet. No application authentication, stored hashes, Preview or Production resources changed.

## 2026-11-26 — Select maintained RustCrypto Argon2 prototype candidate
- Reassessed the PHC reference C repository: latest release shown as 2019-07-02 and inspected master commit dated 2021-06-25. Its maintenance gap makes it a weaker choice for a new security-critical integration.
- Selected RustCrypto Argon2 0.6.0 as the preferred isolated prototype candidate, pinned to signed commit `dc7e0c25cda9a8421d2604debf548d663886b431` dated 2026-11-05. The crate is pure Rust, no_std, Argon2id-capable, single-thread by default, PHC-capable, and dual MIT/Apache-2.0 licensed.
- Identified a critical memory-clearing caveat: the optional zeroize feature wipes selected intermediates but the inspected Argon2 block-buffer Drop implementation deallocates without wiping the full matrix. A wrapper must explicitly zeroize its owned matrix on every exit path and test it.
- Next: prototype a bounded single-thread wasm32-unknown-unknown wrapper, enforce fixed Argon2id v=19 OWASP parameters, PHC compatibility, pre-allocation parameter bounds and RAII memory wiping; then run KAT, malformed-input, ABI and isolated Cloudflare Free-plan benchmarks.
- No application dependency, authentication code, stored hash, Preview or Production resource changed.

## 2026-11-26 — PHC reference Argon2 fallback source review
- Inspected the official PHC reference C implementation and its dual CC0 1.0 / Apache-2.0 licence.
- Confirmed source-level support for Argon2id, PHC encoded hash handling, reference block-filling code, memory clearing, known-answer tests and a `NO_THREADS=1` build option.
- This is source inspection only. The upstream branch was not pinned to an immutable commit and no Emscripten/Wasm build or Cloudflare runtime test was performed.
- Rejected the unverified `@hallaxius/argon2w` candidate pending exact tarball, registry signature/provenance and source-to-artifact verification.
- Next: pin upstream commit and source manifest, create a minimal single-thread C ABI wrapper, compile a prebuilt Wasm module, run upstream vectors and PHC interoperability tests, then benchmark on the isolated Workers Free environment.
- No package was added; no app authentication, password hashes, database, Preview or Production resources changed.

## 2026-11-26 — Precompiled-Wasm Argon2id candidate review
- Evaluated the public claims for `@hallaxius/argon2w`: it documents a standalone SIMD Wasm asset, a Cloudflare Workers compiled-module import and PHC-compatible Argon2id output.
- The package remains unapproved: source, exact published artifact, npm provenance, release-to-commit correspondence, maintainer identity and tests could not be independently verified through the available GitHub connection. A third-party health listing reports version 0.0.1, Apache-2.0, zero dependencies, zero weekly downloads and an incomplete health report; treat this as a weak adoption signal, not a security verdict.
- The documented `m16t2` profile is below OWASP's 19 MiB / 2-pass baseline. The `standard` profile is documented as 19,456 KiB / 3 passes. Neither should be accepted based on its name; a custom 19,456 KiB / 2-pass / p=1 profile requires direct verification and benchmark.
- No package was added, no application password hashing or Admin authentication changed, and no Preview/Production resources were touched.
- Next: independently verify the published tarball and provenance, inspect source/build/licences/tests, then run known-answer and isolated Workers benchmark gates. Reject the package if evidence cannot be established.

## 2026-11-26 — Authenticated Preview Admin dashboard confirmed
- User explicitly confirmed access to the authenticated Preview Admin dashboard with management navigation.
- Recorded as user-confirmed authenticated access in `docs/PROJECT_MASTER_STATUS.md`; this does not independently verify every MFA recovery, replay or RBAC control.
- Next: verify Admin/limited-User API permission boundaries and management workflows; resolve the 100,000-iteration PBKDF2 security limitation; harden Production deployment preflight; complete Production DB/backup/secret/environment checks and required PR review.
- No Production resource was changed.

## 2026-11-26 — Preview acceptance and Production release gate audit
- Confirmed Preview deployment Run #45758679816 succeeded, development validation Run #45759504101 passed, and Preview runtime/browser smoke Run #45759498860 passed.
- User reports the Preview Admin link opens; authenticated dashboard access and completed MFA are not yet independently evidenced.
- Audited PR #1: open/draft, 856 commits ahead of main, 0 behind, 110 changed files, no recorded reviews or review threads.
- Audited the current Production deployment workflow: it runs `wrangler deploy` from `main` but does not run validation, confirm the exact Production D1 identity, or verify the remote migration ledger.
- Production D1 live identity, backup/restore readiness, remote migration ledger, runtime secrets and GitHub production environment protections remain unverified. No Production resource was changed.
- PBKDF2 100,000 iterations remains a documented Workers-compatibility compromise below OWASP's 600,000 recommendation; stronger password hashing remains a security task.

## 2026-11-26 — Preview smoke verification trigger
- The PBKDF2 runtime fix is deployed to the isolated Preview Worker (deployment Run #45758679816 succeeded).
- Triggering the existing unauthenticated Preview HTTP/security-boundary and responsive-browser smoke suite against that deployed Worker. This docs-only commit does not redeploy application code.

## 2026-11-26 — Preview Admin PBKDF2 runtime fix
- The deployed Preview diagnostic identified a Cloudflare Workers production PBKDF2 ceiling of 100,000 iterations; the previous 600,000-iteration setting caused the sign-in HTTP 500.
- Updated password hashing and compatibility tests to use the Workers-supported 100,000-iteration value. Development validation passed on commit `90a47a50f3d052eceda82d97a67d6095ec1bb2d6`.
- Security qualification: this runtime-compatible PBKDF2 setting is below OWASP's current 600,000 PBKDF2-SHA-256 recommendation. A stronger production design remains a separate security priority.
- Trigger the guarded Preview deployment for runtime verification. No Production resources or `main` changes are included.

## 2026-11-26 — Fix Preview Admin PBKDF2 runtime incompatibility
- Production Preview diagnostics identified Cloudflare Workers rejecting the password-hash implementation's 600,000 PBKDF2 iterations; the runtime ceiling is 100,000.
- Updated password hashing to use the maximum iteration count accepted by the Workers runtime and updated tests to reject unsupported stored iteration counts.
- This is a platform compatibility compromise: 100,000 PBKDF2-SHA-256 iterations are below OWASP's current 600,000 recommendation. A stronger production-grade password hashing design needs a runtime-supported memory-hard KDF or a dedicated authentication service. Do not describe this as meeting the OWASP recommendation.
- Automated validation and Preview deployment are required before sign-in can be retested. No Production change was made.

## 2026-11-26 — Preview Admin API diagnostic visibility
- The Admin API client now displays the Worker-provided `diagnostic` field when Preview returns an internal error; Production responses do not include this field.
- This is a temporary Preview troubleshooting aid. It does not reveal credentials or change authentication behavior.
- Automated validation and a Preview deployment are required before using the updated diagnostic display.

## 2026-11-26 — Preview Admin session-secret remediation
- Updated the guarded Preview deployment workflow to verify whether `SESSION_SECRET` exists on the Preview Worker.
- If absent, it generates and stores a cryptographically random 32-byte base64url value; an existing secret is preserved and never displayed.
- This addresses the Worker login endpoint's explicit missing-session-secret configuration failure, alongside the existing `MFA_ENCRYPTION_KEY` provisioning.
- The workflow change is committed, but deployment and login verification are pending. No credentials, Production resources or `main` changes are included.

## 2026-11-24 — Add gated Preview deployment trigger
- Added a push trigger restricted to `current-focus-development`.
- Deployment job runs only for explicit `[deploy-preview]` commit messages or manual workflow dispatch; ordinary branch pushes skip deployment.
- Avoids modifying `main` to expose the workflow. No marker commit or Preview deployment was executed.

## 2026-11-24 — Preview deployment readiness hardening
- Updated the development Preview deployment workflow to verify the existing Worker secret-name metadata and generate/store a cryptographically random 32-byte base64url `MFA_ENCRYPTION_KEY` only when absent; existing keys are never rotated and values are never logged.
- Added CMS revision source/SQLite and Admin MFA cryptographic/source-contract checks to the guarded deployment workflow.
- Documented the remaining dispatch blocker: the workflow is not present on `main`, so it cannot currently be launched through the standard Actions UI without a separately approved default-branch change.
- No secret provisioning, Worker deployment, Production action or `main` modification was performed.



## 2026-11-24 — Preview D1 migrations applied and verified

The authorized Preview migration workflow [Run #11](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/4516057616) completed successfully. Job `migrate-preview` verified the dedicated remote Preview D1 ID `e0317397-77cb-4f36-9d19-2594ff75b0c2` before migration activity. The pre-apply migration list contained `0018_cms_content_revision.sql` and `0019_admin_mfa.sql`. Wrangler reported both migrations with successful status after execution. The final remote migration-list step returned **No migrations to apply!** The job steps `Apply pending migrations to Preview D1 only` and `Verify Preview migration state` both completed successfully.

This is direct GitHub Actions execution evidence for the Preview D1 migration ledger. It confirms the two migrations were applied to the dedicated Preview database. It does not establish that a Worker containing the corresponding source code has been deployed or that runtime/browser acceptance has passed. Production and `main` were not targeted by this workflow.

## 2026-11-23 — Preview D1 read-only migration audit Run #5
- Read-only audit [Run #5](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45155468446) completed successfully on `current-focus-development`.
- The remote Preview D1 migration list reported `0018_cms_content_revision.sql` and `0019_admin_mfa.sql` under **Migrations to be applied**.
- Recorded the audit evidence and approval gates in the master status, database, Preview deployment and handover documentation.
- No migration, D1 write, Preview deployment, secret/configuration change, Production action or `main` modification was performed.

## 2026-11-23 — Preview CMS concurrency audit gate clarified
- Rechecked the repository's default branch: the read-only Preview D1 migration audit workflow is present on both `main` and `current-focus-development`, so its Actions UI dispatch prerequisite is satisfied.
- The last successful audit (#45024256326) predates migration 0018 and cannot establish its current Preview application status. A fresh read-only audit is required.
- The Preview deployment workflow remains absent from `main`; its Actions UI dispatch prerequisite is still unresolved and must not be addressed by modifying `main` without separate approval.
- Documented the manual read-only audit steps and the separate approval gates for migration and deployment. No workflow was dispatched, no migration/database write or deployment occurred, and no `main` change was made.

## 2026-11-23 — CMS revision/concurrency CI pass
- Development CI run `45150564334` passed for commit `ced2ce5a08bb00f89401b1cc6b1131b0755d4fd3`.
- Worker/Admin source-contract checks passed for draft save, archive, restore and historical restore revision handling.
- SQLite transaction tests passed for competing editor writes, stale state changes, history/audit consistency and injected rollback.
- This is not live Cloudflare D1 or Preview browser acceptance. No migration, deployment or remote database write was performed.

## 2026-11-23 — CMS revision and concurrency test coverage
- Added a Worker/Admin source-contract test for revision checks, stale HTTP 409 responses, conditional history/audit writes and Admin revision-token submission.
- Added a temporary SQLite test that applies migration 0018 and races two editor requests with the same revision; exactly one must succeed.
- Added stale/successful archive and restore checks, historical-version restore checks and injected history-write failure to verify transaction rollback.
- Added both tests to development CI. SQLite model coverage is not live Cloudflare D1 or Preview acceptance.
- No migration, database write, deployment, Production change or `main` change was performed.

## 2026-11-23 — Bulk CMS initialization recovery CI pass
- Development CI run `45149785654` passed for commit `5deeadf5a574d4a603c9f631821d86ef4599012d`.
- The run passed the new recovery-path contract test and all existing validation steps.
- Real D1 failure injection and Preview browser acceptance remain pending. No migration or deployment was performed.

## 2026-11-23 — Bulk CMS initialization recovery hardening
- Added a client-side 400-item preflight to stop oversized requests before network submission.
- Improved Admin UI messaging for atomic draft initialization, preservation of existing drafts and safe retry after ambiguous network failures.
- Added a CI recovery-path test for validation-before-write, insert-if-absent retry behavior, conditional draft history, one-batch content/history/audit writes, no auto-publish and UI recovery.
- No migration, Preview operation or Production change was performed. Real D1 failure-injection and Preview acceptance remain pending.

## 2026-11-23 — Admin MFA final development CI pass
- Latest development CI run `45149004614` passed for commit `c6a72eae839c6fcec3310fc26ff6806291798e87`.
- The run includes TOTP/encryption/recovery unit tests, source-contract assertions, separate IP/account throttling and failed MFA attempt audit coverage.
- This verifies source and automated checks only. Migration 0019, Preview encryption-secret configuration, Preview deployment and end-to-end browser acceptance remain pending.

## 2026-11-23 — MFA rate-limit and audit hardening
- Added independent IP-keyed and account-keyed rate limits to MFA enrollment, login verification and MFA reset operations.
- Added audit events for rejected enrollment codes, rejected second-factor codes and rejected MFA reset verification. Submitted codes and secrets are not included in audit details.
- Extended the MFA source-contract test to require the throttles and failed-attempt audit coverage.

## 2026-11-23 — Admin MFA CI verification
- Development CI run `45148706139` passed for commit `432a59fc62c3b80f68948fa62db13a6e88ef0cff`.
- The run included the new Admin MFA cryptographic and source-contract tests along with the existing development validation suite.
- Preview D1 migration 0019, Preview-only `MFA_ENCRYPTION_KEY` configuration, Worker deployment and browser/runtime acceptance remain pending and require separate approval.

## 2026-11-23 — Admin MFA source implementation
- Added mandatory password-plus-TOTP enrollment/verification for Admin and User dashboard accounts. Existing password-only sessions are rejected by the Admin API session guard.
- Added AES-256-GCM account-bound TOTP seed encryption, five-minute signed purpose-bound challenge cookies, replay-safe TOTP counter updates, ten one-time salted recovery-code hashes, account/IP login throttling and a verified MFA reset flow.
- Added bilingual MFA enrollment, verification and recovery instructions to the Admin login page.
- Added D1 migration 0019 and cryptographic/source-contract tests. The new `MFA_ENCRYPTION_KEY` must be configured as a separate encrypted Preview runtime secret.
- Source commits: `bad4a5904617047abe256bd416ed5a2b513238b0` and `8ba829c633f4a4ed5cf0caeecc94c61087e87382`.
- Migration 0019 has not been applied, Preview encryption key has not been configured, and no Preview or Production deployment/configuration was changed. CI and runtime acceptance remain pending.

## 2026-11-23 — Admin authentication security assessment and project handover baseline
- Verified the current development branch head and its successful CI run.
- Reviewed Worker login/session/RBAC controls and Admin login UI. Confirmed that administrator authentication is password-only and no MFA enrollment, challenge or recovery flow is implemented.
- Added an evidence-based MFA/security assessment, including TOTP, encrypted secret storage, replay prevention, one-time recovery codes, rate limiting and session hardening requirements.
- Added a concise Project Master Status handover document and linked it from the development handover instructions.
- Documentation-only change. No application source, migration, secrets, database, Cloudflare configuration, deployment, Production resource or `main` branch was changed.
- Next task: implement and test Admin MFA on `current-focus-development` after reviewing the documented design.

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

## 2026-11-23 — Cloudinary inventory RBAC correction

- Restricted persistent Cloudinary inventory scan-start and scan-step POST operations to administrators with `media.manage`; GET status and result reads remain available with `media.view`.
- Updated the RBAC contract test to assert the read/write permission split and prevent regression.
- Source-level change only. CI and Preview verification are pending; no deployment or database operation was performed.

## 2026-11-23 — RBAC regression-test scanner correction

- The first CI run after the Cloudinary inventory permission fix exposed a false positive in the RBAC contract test: its mutation-handler scanner also matched HTTP-method comparisons inside the `requiredPermission` helper, which is not a request handler.
- Scoped the scanner to `handleApi` so it checks actual API route handlers rather than permission-mapping expressions.
- The first run failed at the RBAC contract check; syntax and HTML validation passed. Re-run CI is required before treating the correction as verified.


## 2026-11-23 — Custom Page Builder transaction consistency
- Batched page creation with initial CMS registration and audit logging.
- Batched page structure updates with conditional CMS key registration, draft version snapshots and audit logging.
- Batched page deletion with associated CMS content/history cleanup and audit logging.
- Added a Page Builder atomicity source-contract test to development CI.
- Runtime D1 integration and Preview browser acceptance remain pending. No migration, deployment, Production change or main update was performed.

- Capped generated Page Builder CMS fields at 400 per save to stay within D1 Worker binding limits while preserving transaction atomicity.


## 2026-11-23 — Bulk CMS initialization transaction safety

- Validated the full initialization payload before any database write.
- Batched insert-if-absent CMS rows, conditional draft history snapshots and the audit event in one D1 transaction.
- Preserved existing drafts and published values; duplicate submitted keys are counted as skipped after the first successful insert.
- Capped requests at 400 items to bound D1 statement and binding usage, and derive created/skipped counts from batch results.
- Added a dedicated source-contract test to development CI. Runtime D1 failure-injection and Preview acceptance remain pending; no deployment or migration was performed.


## 2026-11-23 — CMS optimistic concurrency control

- Added migration 0018 for a per-content revision counter.
- CMS reads expose the revision; draft save, archive, restore and historical restore use compare-and-swap updates and reject stale changes with HTTP 409.
- Kept content, history and audit writes in D1 batches; history and audit rows are conditional on a successful revision update.
- Updated the Admin Content Manager to carry revision tokens and documented the API contract.
- Added migration/source contract coverage to CI. Migration 0018 must be applied before deploying the Worker change. No migration or deployment was performed.

## 2026-11-24 — Authorized isolated Preview deployment
- Explicit user authorization received to deploy `current-focus-development` to the isolated Cloudflare Preview Worker.
- Scope: Worker `current-focus-development`, Preview D1 `consulting-preview-db` (`e0317397-77cb-4f36-9d19-2594ff75b0c2`), Preview-only MFA key provisioning if absent.
- Production and `main` are excluded. Deployment workflow performs token/target checks and source/CMS/MFA preflight before deploy.


## 2026-11-24 — Preview deployment retry authorization

- Recorded the Run #7 fail-closed Preview D1 preflight result and added sanitized API-response diagnostics to the Preview deployment workflow.
- Retrying the isolated Preview deployment from `current-focus-development` only; Production and `main` remain excluded.


- Corrected Preview D1 preflight to use the D1-read credential while retaining the dedicated Worker deployment credential. Retrying the authorized isolated Preview deployment.

- Corrected first-time Preview provisioning order: run validations, bootstrap the isolated Worker, provision the Preview-only MFA key without rotation, then deploy the final Worker bundle.


## 2026-11-24 — Isolated Preview deployment completed

- Successfully deployed the development Worker and static assets to the isolated Cloudflare Preview environment via Actions Run #16.
- Verified the Preview D1 identity before deployment; source, CMS revision/SQLite, and Admin MFA checks passed.
- Bootstrapped Worker `current-focus-development`, provisioned its Preview-only MFA encryption key, and completed the final deployment.
- Preview URL: https://current-focus-development.sohelrahman118.workers.dev
- Worker version: `bd3a71ff-a09c-46f1-897c-8b9a07a6d214`.
- Browser/runtime acceptance remains pending; Production and `main` were not modified.


## 2026-11-24 — Preview runtime smoke cycle

- Added guarded HTTP smoke checks for the deployed Preview origin.
- Updated the master status, Preview deployment notes and QA checklist.
- Triggering the smoke workflow only; this commit does not trigger deployment.


## 2026-11-24 — Preview runtime smoke diagnostic rerun

- Preserved the successful page/API/path-boundary observations from the first smoke cycle.
- Improved parsing and diagnostics for the quotation-response privacy headers.
- Updated Preview deployment, QA and master status documentation.
- Triggering the Preview smoke workflow only; no Worker deployment or D1 mutation.


## 2026-11-24 — Preview quotation-response privacy routing fix

- Added `/quote-response.html` to the Preview Worker's `run_worker_first` asset routes so the Worker enforces no-store, no-referrer and noindex response headers.
- Updated the Preview deployment, QA and master status documentation.
- Redeploying the isolated Preview Worker only; Production and `main` remain excluded.


## 2026-11-24 — Preview runtime smoke rerun after privacy routing deployment

- Preview deployment Run #34 applied the Worker-first route for `/quote-response.html`.
- Worker version `8f6489b1-7ef9-4423-a01a-6bdf63a48755` is deployed on the isolated Preview Worker.
- QA, Preview deployment and master status documentation updated.
- Triggering the HTTP smoke workflow only; no deployment or D1 mutation.


## 2026-11-24 — Responsive Preview browser smoke execution

- Added Playwright/Chromium checks at mobile and desktop viewport widths for key English/Bangla and Admin/quotation pages.
- Checks page load, title/body presence, uncaught browser errors and horizontal overflow.
- Updated Preview deployment, QA and master status documentation.
- Triggering Preview smoke only; no deployment or D1 changes.


## 2026-11-24 — Responsive browser smoke runner correction

- Pinned the Playwright/Chromium Preview smoke job to `ubuntu-24.04` because the latest Ubuntu runner image is not supported by the pinned Playwright release.
- Updated Preview deployment, QA and master status documentation.
- Triggering the responsive Preview smoke suite only; no deployment or D1 mutation.


## 2026-11-24 — Preview browser smoke checkout fix

- Added repository checkout to the Preview runtime smoke job so its Playwright test script is available on the runner.
- Kept the smoke runner pinned to Ubuntu 24.04 for Playwright compatibility.
- Updated Preview deployment, QA and master status documentation.
- Triggering the Preview smoke workflow only; no Worker deployment or D1 mutation.


## 2026-11-24 — Responsive Preview acceptance and Admin UI smoke

- Recorded passing responsive Chromium smoke across four pages at mobile and desktop widths (Run #39).
- Extended the read-only browser suite to assert unauthenticated Admin login visibility, hidden dashboard/MFA panels, required login inputs and bilingual MFA guidance.
- Updated QA, Preview deployment and master status documentation.
- Triggering guarded Preview smoke only; no Worker deployment, D1 mutation or authenticated Admin action.


## 2026-11-24 — Admin MFA browser smoke assertion fix

- Diagnosed Run #44: all HTTP/security and responsive page checks passed; two MFA copy assertions failed because the test searched visible text inside intentionally hidden pre-authentication panels.
- Updated Playwright checks to inspect hidden enrollment/recovery panel DOM text directly and validate English/Bangla copy.
- Recorded diagnosis and pending rerun in QA, Preview deployment and master status documentation.
- Test-only change; no Worker deployment, D1 mutation, authenticated Admin action or main-branch change.


## 2026-11-24 — Admin MFA entry-state smoke accepted

- Corrected hidden-panel DOM text assertions after Run #44 exposed a Playwright visible-text assumption.
- Preview smoke Run #45 passed HTTP/security checks and all eight page/viewport checks (four pages at 390px and 1440px).
- Verified unauthenticated Admin login visibility, email/password fields, hidden dashboard/MFA panels and bilingual enrollment/recovery copy in the DOM.
- No authenticated Admin action, Worker deployment, D1 mutation or main-branch change.


## 2026-11-26 — Website 8 repository status reconciliation
- Reconciled current development/default-branch heads, open PR #1, repository tree and recent development/Preview workflow evidence.
- Updated `docs/PROJECT_MASTER_STATUS.md` with branch/PR baseline, CI and Preview smoke evidence, unresolved runtime acceptance and next execution sequence.
- No application source, production branch, remote database, Cloudflare configuration, secret or deployment was changed.


## 2026-11-26 — Reconcile Preview deployment against development head
- Identified the last confirmed successful Preview deployment as workflow Run #34 at commit `55585c4`; later inspected deployment runs were skipped by the deployment gate.
- Compared that deployed source commit with development head `45fed5a`: only workflow, documentation, changelog and browser-test files changed; no application/runtime or migration files changed.
- Recorded that live Worker availability/version could not be independently rechecked. No deployment, D1 operation, secret operation, Production action or `main` change was performed.


## 2026-11-26 — Production release preflight
- Recorded the owner's authorization for Production release subject to release gates.
- Audited PR #1, branch divergence, overlapping workflows, Production deployment workflow and current acceptance gaps.
- Release is blocked pending branch conflict reconciliation, Production D1/secret/environment verification, authenticated workflow acceptance and final content approval.
- No merge, Production database mutation, secret change or deployment was performed.


## 2026-11-26 — Branch ancestry reconciliation
- Added a two-parent merge commit on `current-focus-development` to incorporate current `main` ancestry without rewriting history.
- Audited six overlapping workflow files; retained the development versions where they contained the verified fixes.
- GitHub now reports PR #1 mergeable and the development branch 0 commits behind `main`; PR remains draft and validation Run #1076 was still in progress at documentation time.
- Production release gates remain open; no Production or `main` mutation was performed.


## 2026-11-26 — Admin MFA acceptance checkpoint
- Clarified that the 2026-11-23 security assessment is a historical snapshot; MFA source implementation and cryptographic/source-contract tests now exist.
- Recorded successful Development validation Run #1076, including the Admin MFA test step.
- Added an explicit authenticated Preview acceptance matrix for enrollment, challenge, replay, recovery-code single use, session revocation, throttling and RBAC.
- Authenticated Preview acceptance and Production readiness remain pending; no Production resource was changed.
## 2026-11-26 — RBAC acceptance documentation

- Documented the user-confirmed authenticated Preview Admin dashboard access separately from pending live limited-User authorization tests.
- Recorded the Worker source-review findings for session/account validation, MFA enrollment enforcement, permission mapping and fail-closed handling of unknown Admin API routes.
- Clarified that source-contract tests do not substitute for direct Preview API read/write denial tests using an authorized limited-User account.
- No Preview account, database, Production resource or `main` branch was changed.
## 2026-11-26 — Production workflow validation gate

- Added a validation job to the manual Production deployment workflow, running the repository's syntax, site, RBAC, CMS, MFA, password-hash, pricing and registration contract checks.
- Made the Production deployment job depend on successful validation and added a Wrangler deployment dry-run before the deploy command.
- Kept Production deployment restricted to `main` and the GitHub `production` environment.
- Workflow execution, remote D1 migration/backup preflight, secret presence, and environment protection remain unverified. No Production resource was changed.
## 2026-11-26 — Password-storage design assessment

- Added `docs/PASSWORD_STORAGE_DESIGN_ASSESSMENT.md` with current OWASP and Cloudflare Workers constraints, an Argon2id/WebAssembly candidate assessment, and a controlled Preview benchmark acceptance list.
- Confirmed that the current 100,000-iteration PBKDF2-HMAC-SHA-256 setting is below OWASP's recommended 600,000 iterations.
- Recorded that a pepper is supplementary and cannot replace a suitable password KDF.
- No hash implementation, Preview Worker, database, secret or Production resource was changed.
## 2026-11-26 — Isolated Argon2id benchmark harness

- Added a separate Cloudflare Worker benchmark using pinned `hash-wasm` 4.12.0 and OWASP's 19,456 KiB / 2-pass / parallelism-1 Argon2id baseline.
- Added sequential hash/verify and two-operation concurrency checks, with an ephemeral bearer token and no D1 binding or Admin endpoints.
- Added automatic benchmark Worker deletion on workflow exit and a 10 ms CPU budget to test the Workers Free constraint.
- The harness reports wall-clock timing only; it does not claim to measure Cloudflare CPU-time or isolate memory.
- No existing password hash, Admin account, database, or Production resource was changed.
## 2026-11-26 — Cloudflare Free plan confirmed; benchmark config corrected

- The first isolated KDF benchmark deploy was rejected with Cloudflare API error 100328 because the Free plan does not support setting a custom CPU limit.
- Confirmed the linked account is on Workers Free; the benchmark had not yet executed.
- Removed the explicit CPU limit from the benchmark Worker config so it uses the plan's default limit.
- No existing Worker, Admin password hash, D1 database or Production resource was changed.
## 2026-11-26 — Benchmark request propagation retry

- Verified that the isolated benchmark Worker can be deployed on the Free plan without a custom CPU setting.
- The first request immediately after secret upload returned HTTP 401; the benchmark did not run.
- Added bounded retry handling for temporary 401 responses after ephemeral secret creation.
- The workflow retains automatic deletion of the isolated benchmark Worker on exit.
## 2026-11-26 — KDF benchmark diagnostic

- Isolated Worker deployment and ephemeral-token authentication succeeded on Workers Free.
- Argon2id request returned HTTP 500; no timing results were recorded.
- Added sanitized error name/message output to the benchmark-only Worker to identify the failure cause on retry.
- No existing Admin password hash or application authentication code was modified.
## 2026-11-26 — Argon2id WebAssembly compatibility finding

- The isolated Workers Free benchmark reached the Worker but failed before hashing: `WebAssembly.compile(): Wasm code generation disallowed by embedder`.
- Cloudflare Workers supports precompiled Wasm module imports; `hash-wasm` embeds and compiles Wasm at runtime, making this package unsuitable for the current runtime.
- Documented a precompiled-Wasm Argon2id implementation as the next candidate, subject to source/license/release/API/test review before benchmark.
- Updated the benchmark workflow to report whether the temporary Worker deletion succeeded instead of silently suppressing cleanup errors.
- No Admin authentication code or stored password hashes were changed.

## 2026-11-26 — Isolated Argon2id PHC prototype CI milestone

- Added bounded PHC-style hash generation and fixed-profile verification to the isolated Rust Argon2id prototype.
- Corrected the Clippy `manual_div_ceil` finding.
- CI Run [#9](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45781931534) passed formatting, five host tests, Clippy with warnings denied, and release compilation for `wasm32-unknown-unknown`.
- Updated the prototype README and password-storage assessment to distinguish implemented functionality from remaining independent interoperability, ABI, memory-wipe verification and Worker runtime gates.
- No application authentication, stored hashes, Preview Worker, D1 database, secret or Production resource was changed. No deployment was performed.
