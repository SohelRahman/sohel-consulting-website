# Development and launch checklist

This project runs as a Cloudflare Worker with static assets and a D1 database. Use the `current-focus-development` Preview for development and acceptance testing. Do not deploy Production from this checklist.

## Development validation

- [x] Keep development work on `current-focus-development`
- [x] Add automated Worker JavaScript syntax validation
- [x] Add HTML inline-script and local-link validation
- [x] Exclude GitHub workflows, scripts and internal deployment notes from public Worker assets
- [ ] Confirm the latest GitHub Actions validation run passes after the final change
- [ ] Confirm the Preview Worker is reachable and serves all public pages

## Version control and release controls

- [ ] Protect `main` with PR-only changes; block direct and force pushes
- [ ] Require at least one approval and dismiss stale approvals
- [ ] Require the development validation workflow before merging to `main`
- [ ] Require conversation resolution and restrict branch deletion
- [ ] Protect `current-focus-development` against force pushes and deletion
- [ ] Create GitHub Environment `production` and configure required reviewers
- [ ] Verify Production deployment workflow uses the protected environment
- [ ] Agree on commit message convention and release owner
- [ ] Select a release version and create an annotated tag for each approved Production release
- [ ] Retain PR, CI, Preview QA, migration, approval and deployment evidence

See [Version Control and Release Management Policy](docs/VERSION_CONTROL_RELEASE.md).

## Preview environment

- [ ] Confirm Preview D1 binding points to `consulting-preview-db`, not Production
- [x] User-reported Preview D1 migration ledger contains migrations `0001` through `0012`; user also reported four imported homepage records and four published history records. Verify target identity and ledger again before any future migration
- [ ] Confirm Preview admin email, password and session secret are configured
- [ ] Sign in to the Preview administrator dashboard
- [ ] Test course creation, editing, activation and deactivation
- [ ] Test registration submission and administrator status updates
- [ ] Test inquiry submission and administrator status updates
- [ ] Test static CMS Dashboard editing and page/language draft/publish workflows
- [ ] Test `?cmsKeys=1` on-page editing for text, link destinations and image sources
- [ ] Verify inline and Dashboard editing update the same content key
- [ ] Verify authenticated draft preview and signed-out draft isolation
- [ ] Test page creation, editing, draft preview, publishing and deletion
- [ ] Test English and Bangla pages and course-language switching
- [ ] Test mobile navigation and responsive layouts
- [ ] Test API health endpoint and expected authentication failures

## Deliberately excluded from this completion

- [ ] Cloudinary image upload, folder permissions and media-library end-to-end testing

## Business and content approval

- [ ] Confirm biography, exact degree titles, employment history and career dates
- [ ] Replace the LinkedIn placeholder with the correct profile URL
- [ ] Approve case-study client descriptions, project scope and measurable results
- [ ] Confirm course titles, summaries, delivery options, languages and fees
- [ ] Review privacy, terms and refund policy against the actual business and applicable law
- [ ] Confirm Calendly booking destination and availability

## Public launch preparation (requires explicit approval)

- [ ] Confirm final domain and update canonical URLs, alternate-language URLs and sitemap
- [ ] Configure analytics and review privacy requirements
- [ ] Complete accessibility and performance checks on the deployed Preview
- [ ] Complete final end-to-end acceptance testing
- [ ] Review and approve the Production deployment plan
- [ ] Deploy Production only after explicit approval

## Later phase

- [ ] Select and onboard a payment provider
- [ ] Implement payment initiation, server-side verification, reconciliation and refund handling
- [ ] Publish final payment and refund terms before accepting payments

## Current CMS Preview deployment gate

- [ ] Confirm Cloudflare has deployed commit `754507b0a28290cc972929f61bef891fbe9b880c` or a later development commit containing the on-page editor.
- [ ] Confirm the deployed Preview is bound to the Preview D1 database, not Production.
- [ ] Sign in to Preview Admin and verify the Dashboard editor.
- [ ] Open an English and a Bangla page with `?cmsKeys=1`; test click-to-edit and draft save.
- [ ] Verify draft preview, public-content isolation and explicit publication.
- [ ] Complete the CMS acceptance checklist in [Testing and QA](docs/TESTING.md).

A prior Cloudflare screenshot showing a Ready deployment for an earlier commit is not evidence that the on-page editor commit is deployed. Production remains excluded.
