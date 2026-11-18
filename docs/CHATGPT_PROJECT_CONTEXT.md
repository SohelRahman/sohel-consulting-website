# Sohel Consulting Website — Master ChatGPT Project Context

> **Purpose:** This is the canonical handover prompt for continuing work on this repository in a new ChatGPT conversation. Read this file and the linked source documents before making project changes. Keep this file current as implementation, decisions, and release status change.
>
> **Last maintained:** 2026-11-18
> **Latest status update:** User reports roadmap workstreams 2–6 (privacy/analytics, security, UI/UX, SEO/performance, business content) complete; full Preview QA and release administration remain open.  
> **Repository:** `SohelRahman/sohel-consulting-website`  
> **Active development branch:** `current-focus-development`

---

## 1. Instructions to the next ChatGPT session

Act as the project's senior full-stack engineer, solution architect, QA lead and security-minded technical adviser.

1. Start by reading this document and checking the actual current GitHub repository state. This document is a handover aid, not proof that the code or cloud configuration has not changed.
2. Work directly in the GitHub repository when repository tools are available. Do not merely provide code for the user to copy unless direct repository work is unavailable or the user asks for instructions.
3. Before editing, inspect the latest file content and SHA from `current-focus-development`. Never overwrite newer work with stale content.
4. Keep changes focused, production-minded, maintainable and consistent with the existing vanilla HTML/CSS/JavaScript + Cloudflare Worker architecture unless an architecture change is approved.
5. Prefer free, first-party or already-configured solutions. Do not add paid APIs, subscriptions, external AI services or new vendors without the user's explicit approval.
6. Keep English and Bangla experiences functionally aligned.
7. Update this master context document whenever project scope, architecture, decisions, feature status, known defects, environment configuration, release controls or priorities change. Update the relevant technical document and `CHANGELOG.md` in the same change.
8. Do not claim a feature, test, migration, CI run, cloud setting or deployment is complete unless it has been verified. Label assumptions and unverified items.
9. Do not expose secrets, passwords, tokens, session cookies, personal registration data or production records in code, logs, commits or chat.
10. Never use the Production D1 database or Production resources for development, testing or experiments.
11. Do not merge a pull request, deploy to Production, run a Production migration, change Production secrets/settings or perform destructive data operations without explicit user approval.
12. Keep the full reusable prompt in this document. Do not paste the entire prompt into the chat unless the user explicitly asks to see it.
13. Before finishing a task, report what changed, the branch/commit, validation performed, outstanding risks and whether any manual/cloud action remains.

## 2. Project objective and business purpose

Build and maintain a professional bilingual (English/Bangla) website for **Sohel Rahman Consulting & Professional Training**.

The website is intended to:
- Present Sohel Rahman's consulting and professional-training profile, services, experience and approved case studies.
- Publish and manage professional training courses.
- Allow prospective learners to submit course registrations.
- Allow prospective clients and visitors to submit consulting/training inquiries.
- Provide a protected administrator dashboard to manage courses, registrations, inquiries, quotations, content, pages, media, chat and analytics.
- Provide a deterministic website chatbot for common questions and a human-support escalation path.
- Support controlled content updates without requiring code edits for every routine content change.
- Provide privacy-conscious, consent-gated first-party analytics.
- Operate in English and Bangla with responsive layouts and accessible navigation.

The website is not currently an online payment platform. Payment gateway integration is intentionally deferred until the core website, operational process, legal content and testing are ready. Registration payment status currently uses `not_configured`.

## 3. Repository and environment facts

| Item | Current recorded value |
|---|---|
| GitHub repository | `SohelRahman/sohel-consulting-website` |
| Development branch | `current-focus-development` |
| Production branch | `main` |
| Cloudflare Worker | `consulting` |
| Worker entry point | `src/worker.js` |
| Browser JavaScript | `assets/site.js` |
| Shared CSS | `assets/site.css` |
| Wrangler | Version 4 |
| CI Node runtime | Node.js 22 |
| Wrangler compatibility date | `2026-11-12` (verify current config) |
| Static assets binding | `ASSETS` |
| D1 binding | `DB` |

### Environment separation — critical

| Environment | D1 database | Database ID |
|---|---|---|
| Preview / development | Dedicated Preview D1 | `e0317397-77cb-4f36-9d19-2594ff75b0c2` |
| Production | `consulting-db` | `3a4f765a-46c2-4040-9753-36e9483893a4` |

The IDs above are configuration references, not permission to access or modify the databases. Re-read `wrangler.toml` before any operation. Preview must use only the Preview D1 database. Never test against Production.

The Cloudflare account and GitHub secrets are configured outside source control. Never request that the user paste secret values into chat.

## 4. Product scope and website capabilities

### Public website
- English pages at repository root, including `index.html`, `services.html`, `training.html`, `about.html`, `case-studies.html`, `contact.html`, `register.html`, `faq.html`, `privacy.html`, `terms.html` and `refund.html`.
- Bangla equivalents under `/bn/`.
- `404.html` for not-found handling.
- `admin.html` for the protected administrator interface.
- Dynamic published custom pages can be served through the Worker.
- Shared navigation, language-aware content, accessibility skip link and responsive behavior.

### Course registration and inquiries
- Public course catalogue reads active courses from the API.
- Registration form submits learner and course registration data.
- Inquiry form submits general consulting/training inquiries.
- Administrator workflows support registration review, quotation and enrollment status, plus inquiry status.
- Payment gateway is not integrated. Do not imply that payment can be collected online.

### Administrator dashboard
The admin experience includes management capabilities for:
- Courses.
- Registrations, quotations and enrollment.
- Inquiries.
- Editable site content.
- Page style drafts/publication.
- Custom pages and draft preview.
- Cloudinary-backed media library.
- Chat conversations and administrator support replies/actions.
- First-party analytics reporting.

Always inspect current UI and Worker route implementation before assuming a particular action or field exists.

### Website chatbot
- Deterministic, rule-based responses based on published website information.
- No external AI model/API or paid chatbot service is currently used.
- Visitors can request human support.
- Chat sessions/messages are stored in D1; browser token is stored locally and server-side token hash is used.
- Chat content is confidential operational data. Do not put message contents into analytics.

### Privacy and analytics
- Bilingual privacy-preference interface provides Accept All, Reject Optional and Cookie Settings/preferences.
- Essential storage supports core website features/chat.
- Optional first-party analytics should run only after opt-in.
- Analytics event types include `page_view`, `chat_open`, `chat_message` and `human_support_request`.
- Analytics deliberately excludes chat message contents, names, emails, phone numbers and full referrer URLs; referrer hostname only is sent.
- Analytics visitor identifiers are intended to be removed when optional consent is rejected/withdrawn.
- Analytics records older than 90 days are deleted during analytics event writes according to the recorded Worker implementation. Verify code before relying on or changing this behavior.
- **Project status update (2026-11-16):** The user reports that the privacy/analytics workstream is now complete. The prior consent re-enable concern is considered resolved by the user; do not continue listing it as an active defect. Verify current code and QA evidence before making a technical assurance or reopening the issue.

## 5. Technical architecture

### High-level design

```text
Browser (English / Bangla)
  |
  +-- Static HTML, CSS and vanilla JavaScript
  |     +-- Public pages and forms
  |     +-- Admin interface
  |     +-- Chat widget
  |     +-- Consent preferences and analytics client
  |
  +-- HTTPS requests to /api/*
          |
          v
     Cloudflare Worker: src/worker.js
          |
          +-- Authentication / authorization / validation
          +-- Rate limiting and same-origin checks
          +-- Business logic
          |
          +-- D1 binding: DB
          |     +-- courses / learners / registrations
          |     +-- inquiries / quotations / audit_logs
          |     +-- site_content / page_styles / pages
          |     +-- media_assets
          |     +-- chat_conversations / chat_messages
          |     +-- analytics_events / rate_limits
          |
          +-- Cloudinary integration for media storage
          
Static files are delivered through Cloudflare Workers Static Assets (ASSETS).
GitHub Actions provides validation, Preview secret configuration and manual Production deployment.
```

### Main design choices
- Frontend is static HTML, shared CSS and vanilla browser JavaScript; no frontend framework is currently the baseline.
- Cloudflare Worker owns API routing and server-side validation.
- Cloudflare D1 is the relational database.
- Cloudinary stores media binaries; D1 stores media metadata.
- Worker static assets binding is `ASSETS`; D1 binding is `DB`.
- API JSON responses are configured as no-store.
- Worker blocks direct public access to internal `/src/`, `/migrations/` and `/wrangler.toml` paths.
- Custom published pages can be resolved by slug through D1 and served using the page template.
- GitHub Actions handles automated validation and controlled deployment workflows.

### Security controls recorded in the implementation
- Admin endpoints use a signed session cookie.
- Admin mutations use same-origin validation.
- Public write endpoints apply rate limiting where implemented.
- Rate-limit keys are hashed; raw client IPs are not stored in the rate-limit table.
- Chat visitor tokens and analytics visitor identifiers are hashed before database storage.
- Secrets are external encrypted runtime/CI secrets, not repository configuration.
- These controls are implementation notes, not a completed independent security audit. Verify the current Worker code when changing security-sensitive paths.

## 6. Database and migration inventory

D1 migration files recorded in the development branch:

| Migration | Objects / purpose |
|---|---|
| `0001_initial_schema.sql` | `courses`, `learners`, `registrations`, `inquiries`, `quotations`, `audit_logs`; initial course records |
| `0002_rate_limits.sql` | `rate_limits` and expiry index |
| `0003_site_content.sql` | `site_content` and initial homepage content |
| `0004_page_styles.sql` | `page_styles` |
| `0005_pages.sql` | `pages` and status/slug index |
| `0006_cloudinary_media.sql` | `media_assets` and creation-date index |
| `0007_chat.sql` | `chat_conversations`, `chat_messages` and indexes |
| `0008_analytics.sql` | `analytics_events` and reporting indexes |
| `0009_admin_rbac.sql` | `admin_users`, account roles, password hashes and per-user permission assignments |

The files present in Git do not prove that all migrations have been applied in either D1 environment. Check each environment independently before deployment.

Rules:
- Never edit an already-applied migration to change its historical effect; add a new sequential migration.
- Apply and verify Preview migrations first.
- Confirm exact database target before every migration command.
- Production migrations require explicit approval, backup/recovery planning and the release process.
- Worker rollback does not automatically reverse D1 schema/data changes.

## 7. API surface inventory

The route inventory below is based on the maintained API documentation. Always verify the latest `src/worker.js` before changing or integrating an endpoint. `docs/API.md` is currently an inventory, not a complete request/response schema.

### Public endpoints
- `GET /api/health`
- `GET /api/courses`
- `GET /api/page-styles`
- `GET /api/site-content`
- `GET /api/pages/:slug`
- `POST /api/registrations`
- `POST /api/inquiries`
- `POST /api/chat/session`
- `POST /api/chat/messages`
- `POST /api/analytics/event`

### Authentication
- `POST /api/admin/login`
- `POST /api/admin/logout`

### Administrator endpoints
- `GET /api/admin/summary`
- `GET, POST /api/admin/courses`
- `PATCH /api/admin/courses/:id/status`
- `PATCH, DELETE /api/admin/courses/:id`
- `GET /api/admin/registrations`
- `PATCH /api/admin/registrations/:id`
- `PATCH /api/admin/registrations/:id/quote`
- `PATCH /api/admin/registrations/:id/enrollment`
- `GET /api/admin/inquiries`
- `PATCH /api/admin/inquiries/:id`
- `GET, POST /api/admin/media`
- `POST /api/admin/media/signature`
- `GET, POST /api/admin/pages`
- `PUT, DELETE /api/admin/pages/:slug`
- `GET /api/admin/pages/:slug/preview`
- `GET, POST /api/admin/site-content`
- `DELETE /api/admin/site-content/:key`
- `GET, POST /api/admin/page-styles`
- `GET /api/admin/chat/conversations`
- `GET, POST /api/admin/chat/conversations/:id`
- `GET /api/admin/analytics`

For endpoint changes, update `docs/API.md` with method, path, authorization, request/response schema, validation, status/error behavior, rate limits and D1 effects.

## 8. External services, configuration and secrets

### Cloudflare
- Worker name: `consulting`.
- Static assets served by Workers Static Assets.
- D1 provides application data.
- Worker Previews must use the dedicated Preview D1 binding.
- Worker Preview setup in the Cloudflare dashboard is a one-time administrative task; verify current dashboard state rather than assuming it has been completed.

### Cloudinary
- Used for administrator-managed media.
- Preview workflow references Cloudinary secrets including cloud name, API key and API secret.
- Exact secret names and workflow behavior must be confirmed from current workflow YAML and GitHub secret configuration.
- Never display or log secret values.

### Worker runtime secrets
Recorded Worker secrets:
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `SESSION_SECRET`

Preview secret configuration also includes Cloudinary credentials. Production and Preview credentials must be separate.

### GitHub Actions secrets
Deployment workflow requires:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Preview configuration workflow uses additional Preview-specific administrator and Cloudinary values. Read the workflow file for exact current names; do not guess them.

## 9. Version control and release governance

### Branch model
- `main`: Production-ready source.
- `current-focus-development`: normal development and Preview integration branch.
- Optional short-lived `feature/*`, `fix/*`, `hotfix/*` branches for larger changes.

The development branch is the normal target for assistant implementation. Do not commit to `main) unless explicitly instructed and authorized.

### Pull request and CI controls
The repository has a development validation workflow. The intended governance includes:
- PR-only changes to `main`.
- At least one authorized reviewer.
- Required CI checks.
- Latest-push approval/stale approval dismissal.
- Conversation resolution.
- Restrictions on direct pushes, force pushes and branch deletion.
- Development branch protected from force-push and deletion.

These repository settings must be verified in GitHub Settings; documentation does not activate branch protection.

### Production release workflow
- Production deployment is manually triggered.
- Workflow contains a branch guard requiring `main`.
- Workflow references GitHub Environment `production`.
- A real human approval gate requires an administrator to create/configure that environment with required reviewers and deployment restrictions.
- Git tags follow Semantic Versioning for approved Production releases.
- A tag does not itself deploy the Worker.
- Explicit user approval is required before merge/deployment/Production operations.

### Current recorded governance status
- Branch protection/rulesets: administrator configuration and verification still required.
- GitHub `production` Environment with required reviewers: administrator configuration and verification still required.
- PR #1 from development to `main` was recorded as open and unmerged in the prior handover. Recheck its live status before making any statement or action.
- Production deployment has not been authorized in the project handover. Recheck live release history if needed.

## 10. Work completed and current implementation baseline

The following work is recorded as implemented in the development branch. Verify the live branch before relying on any detail.

### Product and technical capabilities recorded as implemented
- Bilingual English/Bangla website pages and shared assets.
- Public course catalogue, registration and inquiry intake.
- Protected administrator dashboard and operational workflows.
- Editable site content and page styles.
- Custom pages with draft/publish/preview capability.
- Cloudinary-backed media management.
- Deterministic chatbot, persistent chat conversations and human-support workflow.
- First-party analytics event collection and dashboard.
- Role-based dashboard access with Admin and User roles, granular per-module permissions, account activation/deactivation and administrator-managed password resets.
- Bilingual cookie/privacy preferences with optional analytics consent gating.
- Responsive navigation and accessibility improvements.
- SEO metadata and frontend performance-related improvements.
- Technical documentation baseline.
- Version control/release governance documentation.
- Manual Production deployment workflow referencing the `production` GitHub Environment.
- Preview secrets workflow restricted to the development branch.

### Documentation created
- `docs/ARCHITECTURE.md`
- `docs/DEVELOPMENT.md`
- `docs/DATABASE.md`
- `docs/API.md`
- `docs/CONFIGURATION.md`
- `docs/DEPLOYMENT.md`
- `docs/TESTING.md`
- `docs/MAINTENANCE.md`
- `docs/VERSION_CONTROL_RELEASE.md`
- `CHANGELOG.md`

## 11. Current status, known issues and pending work

### Workstreams reported complete by the user (2026-11-16)
The user has confirmed that the following workstreams from the project roadmap are complete:
- Privacy preferences and consent-gated analytics (including the previously noted re-consent concern).
- Security review/hardening.
- UI/UX and accessibility improvements.
- SEO and frontend performance work.
- Business content and branding review/finalization.

This is a user-provided project status update. The assistant has not independently re-audited every implementation, external setting, business claim or browser test in this update. Do not misrepresent this status as an independently verified security audit or complete cross-browser QA. If a future code change affects one of these areas, inspect the implementation and relevant test evidence.

### Remaining verification and development work

### Priority 1 — Course syllabus upload Preview verification\n- Course administration now supports direct signed Cloudinary upload of PDF syllabus files and JPG/PNG/WebP syllabus images (both uploaded as Cloudinary `image` assets) into the existing `sohel-consulting` folder.\n- Upload limits are 10 MB for PDF and 3 MB for images in the browser; signature issuance is rate-limited to 10/hour and 40/day.\n- The uploaded Cloudinary `secure_url` is stored in the existing `courses.syllabus_url` field when the course is saved; no new migration is required.\n- English and Bangla course detail pages display the syllabus link; the Bangla course detail page also displays active discounts.\n- Existing Media Library image uploads now submit the signed `allowed_formats` field.\n- Source-contract checks and Preview browser upload tests remain to be verified after CI and deployment.\n\n### Priority 2 — RBAC migration and role-based access verification
- Apply migration `0009_admin_rbac.sql` to the dedicated Preview D1 database only.
- Sign in using the configured bootstrap `ADMIN_EMAIL` / `ADMIN_PASSWORD`; first successful login provisions the initial Admin account in `admin_users`.
- Create a restricted User account and test every granted and denied module/action at both UI and API levels.
- Verify disabling an account revokes access on the next request, administrator password reset revokes existing sessions, self-service password change renews the current session, and the last active Admin cannot be disabled or demoted.
- Verify Admin accounts receive full permissions and only Admin accounts can manage users/roles.
- Existing signed-in sessions from the previous email-only session format must sign in again after this change.

### Priority 3 — full Preview browser QA
Full browser-based Preview QA has not been confirmed complete. Execute and record:
- English and Bangla public pages.
- Navigation, language switching, links, page metadata and images.
- Responsive mobile/tablet/desktop layouts.
- Current Chrome, Edge, Firefox and Safari where available.
- Keyboard navigation, focus visibility, skip link and zoom.
- Registration and inquiry success/error/validation paths.
- Chat persistence, message flow and human-support request.
- Admin login/logout/session expiry and every supported dashboard workflow.
- Cloudinary media upload and display.
- Content/page-style/page publishing and preview.
- Analytics consent and dashboard behavior.
- API authorization, same-origin validation, rate limiting and response headers.
- Browser console and network errors.

Record actual evidence, browser/device, commit SHA, result and defects in the QA record. Do not mark manual tests passed because syntax CI is green.

### Priority 4 — test automation depth
Current CI checks:
```sh
node --input-type=module --check < src/worker.js
node --check assets/site.js
node scripts/validate-site.mjs
```
These checks syntax and static site structure. They do not execute Worker routes or real browser flows. Assess and add practical tests for API payload validation, Worker route behavior, consent state transitions and core user journeys without introducing paid services.

### Priority 5 — API documentation
`docs/API.md` is only a route inventory. Gradually document exact request and response contracts from the actual Worker implementation, especially for registration, inquiry, admin, chat, analytics, media and custom-page routes.

### Priority 6 — payments (deferred)
No payment gateway is connected. Do not implement a gateway or imply payment functionality without explicit scope approval. Future payment work requires provider selection, merchant onboarding, payment initiation, server-side verification, reconciliation, failure/refund handling, security review and updated policies.

### Priority 7 — release administration
An authorized repository administrator still needs to verify/configure:
- `main` branch protection/ruleset.
- Development branch force-push/deletion protection.
- Required validation status checks and reviewer approvals.
- GitHub Environment `production` with required reviewers and branch restrictions.
- Cloudflare Worker Preview setup and Preview secrets as applicable.
These are external administrative settings, not source-code changes. Do not claim they are active without verification.

## 12. Recommended next sequence

1. Check current branch head, open PRs, workflow runs and repository status.
2. Apply and verify migration `0009_admin_rbac.sql` in Preview, then test Admin/User permission enforcement end to end.
3. Complete full Preview browser QA and record evidence for public pages, responsive layouts, forms, chat, admin, media and consent flows.
4. Expand automated tests for core frontend behavior and Worker routes.
5. Improve API contract documentation.
6. Complete remaining release administration with an authorized administrator.
7. Prepare a reviewed release candidate only after all applicable gates pass. Obtain explicit Production authorization before any Production action.

## 13. Definition of done for every project change

A change is complete only when applicable items are satisfied:
- [ ] Latest code and relevant dependencies were inspected first.
- [ ] Change is on the correct development branch.
- [ ] No Production resource was touched without explicit approval.
- [ ] English and Bangla behavior considered and tested where relevant.
- [ ] Server-side validation and security implications reviewed.
- [ ] Automated checks/tests run and results recorded.
- [ ] Manual QA needs and limitations stated honestly.
- [ ] Relevant technical docs updated.
- [ ] This master context document updated if scope/status/architecture/decisions changed.
- [ ] `CHANGELOG.md` updated.
- [ ] Commit and CI status checked.
- [ ] Remaining work and next step clearly reported.

---

## 14. Canonical project references

Read the relevant documents alongside this prompt:

- [README](../README.md) — project overview and setup notes.
- [Architecture](ARCHITECTURE.md) — system components and security boundaries.
- [Development](DEVELOPMENT.md) — repository layout and development workflow.
- [Database](DATABASE.md) — D1 schema and migration inventory.
- [API](API.md) — API route inventory and documentation gaps.
- [Configuration](CONFIGURATION.md) — bindings and secret names.
- [Deployment](DEPLOYMENT.md) — Preview and Production deployment controls.
- [Testing](TESTING.md) — automated checks and manual QA checklist.
- [Maintenance](MAINTENANCE.md) — troubleshooting and operational controls.
- [Version control and release](VERSION_CONTROL_RELEASE.md) — branch policy, release gates and rollback.
- [Changelog](../CHANGELOG.md) — chronological repository changes.

**Source-of-truth rule:** Current repository code, current workflow YAML, current Wrangler configuration and verified Cloudflare/GitHub environment state take precedence over this handover document. Update this document whenever those sources materially change.


## CMS planning status — Stages 6–8 (2026-11-18)

The user requested a website-wide, page-wise CMS for all public pages, including Privacy Policy, Terms and Conditions and Refund Policy. English and Bangla are independently managed. The existing public design and functionality must be preserved.

### Confirmed user decisions
1. Publishing scope: publish the entire selected page in one language.
2. New content registration: automatically register content created through approved CMS/page-builder workflows.
3. Historical version restoration: restore into Draft first; publishing is separate.
4. Deleted element visibility: keep current published content visible until the next successful publication of that page/language; exclude the deleted element from that publication.
5. Legacy integration: gradual page-by-page integration, retaining existing APIs during transition.
6. CMS implementation scope: preserve the current design and functionality.

### Planning documents
- `docs/CMS_ADMIN_UI_WORKFLOW.md` — Stage 8 Admin Panel UI and workflow specification.
- `docs/API.md` — proposed Stage 7 CMS API contract, clearly marked not implemented.
- `docs/DATABASE.md` — proposed Stage 6 schema, clearly marked not implemented.
- `docs/TESTING.md` — planned CMS acceptance test matrix, not executed.
- `CHANGELOG.md` — documentation-only planning update.

### Proposed Stage 6 schema
Seven proposed tables: `cms_pages`, `cms_page_locales`, `cms_sections`, `cms_content_elements`, `cms_content_values`, `cms_content_versions`, `cms_page_versions`. This schema has not been approved or migrated. No CMS migration file exists as part of this planning work.

### Stage 5 audit findings carried forward
Existing repository objects include `pages`, `site_content`, `page_styles`, course/registration data, media, chat, analytics and RBAC. Existing page-builder and public APIs must be preserved during gradual integration. Existing `site_content` currently has immediate-save/publish behaviour and will need a compatible draft workflow before it can safely serve as the CMS editor. Page styles remain a separate concern. Course syllabus/discount fields and operational data must not be duplicated in CMS.

### Outstanding gates — do not start implementation yet
- User review and explicit approval of the Stage 6 database schema.
- Preview D1 read-only verification results: `d1_migrations`, actual tables/schema, row counts for `pages`, `site_content`, `page_styles`, and foreign-key checks.
- Re-inspect current `current-focus-development` branch files and exact route/page-builder behavior before implementation.
- Apply confirmed Option A global publication semantics; finalize section deletion/restore rules and exact page registry mappings.
- Reconcile proposed CMS permissions with the current RBAC permission catalogue.
- Stage 7 API routes are proposals, not live endpoints.
- Stage 8 is a planning specification, not an implemented Admin Panel.

No CMS code, schema migration, D1 data change, Preview deployment or Production change was performed during Stages 6–8 planning/documentation. Production remains untouched.

### Recommended next action
Obtain the Preview D1 inspection results and user approval of Stage 6. Then finalize schema and API contracts before any CMS implementation. Do not infer database migration status from migration files committed in Git.


### Stage 9A schema review outcome (2026-11-18)

Stage 6's seven-table CMS schema was reviewed against the current repository migrations. The model is acceptable as a starting direction but the proposed SQL is **not approved for migration**.

Detailed review: `docs/CMS_SCHEMA_REVIEW_STAGE_9A.md`.

Required revisions:
- Preserve existing page-builder section types and renderer configuration.
- Make immutable published page snapshots the public rendering source of truth; separate editable draft structure from published structure.
- Add an explicit current-published-version pointer and atomic optimistic concurrency control.
- Reuse existing `audit_logs` for structural/admin actions.
- Define section soft-delete/restore semantics and child-state preservation.
- Preserve existing `textarea` content type during backfill.
- Global publication scope is confirmed as Option A: independent EN/BN Draft, Preview, Publish and Version History. Page and Global publication are isolated; public rendering composes their published snapshots.

The user selected Option A: Global EN and BN have independent Draft, Preview, Publish and Version History. Global is one logical page with two locale records; each locale publishes independently. Page publishing never publishes Global, and Global publishing never publishes a page. Public rendering composes the published page snapshot with the currently published Global snapshot for the same language; Global drafts are never public. Preview D1 migration history/schema/record checks are still outstanding. No CMS migration or database change has been made.


### Stage 9A global publication decision (2026-11-18)

The user explicitly selected **Option A — independent global publication**.

Schema/service implications:
- One `cms_pages` Global registry record, `page_type='global'`.
- Separate `cms_page_locales` records for English and Bangla.
- Independent draft and published-version pointers, publication revisions and history per Global locale.
- Dedicated Global publish operation, scoped to one language.
- Page publication and Global publication never publish or mutate each other.
- Public rendering composes the page's published snapshot with the currently published Global snapshot for the same language. Global Draft is never public; Global content is not copied into page snapshots.
- Global restore returns content to Draft; publishing is separate.
- Successful Global publication must invalidate/revalidate affected public responses.

Detailed contract: `docs/CMS_SCHEMA_REVIEW_STAGE_9A.md`. The schema remains unapproved for migration pending the complete revised table-level definition and Preview D1 verification.
