# Development and launch checklist

This project runs as a Cloudflare Worker with static assets and a D1 database. Use the `current-focus-development` Preview for development and acceptance testing. Do not deploy Production from this checklist.

## Development validation

- [x] Keep development work on `current-focus-development`
- [x] Add automated Worker JavaScript syntax validation
- [x] Add HTML inline-script and local-link validation
- [x] Exclude GitHub workflows, scripts and internal deployment notes from public Worker assets
- [ ] Confirm the latest GitHub Actions validation run passes after the final change
- [ ] Confirm the Preview Worker is reachable and serves all public pages

## Preview environment

- [ ] Confirm Preview D1 binding points to `consulting-preview-db`, not Production
- [ ] Confirm migrations `0001` through `0005` are applied to the Preview D1 database
- [ ] Confirm Preview admin email, password and session secret are configured
- [ ] Sign in to the Preview administrator dashboard
- [ ] Test course creation, editing, activation and deactivation
- [ ] Test registration submission and administrator status updates
- [ ] Test inquiry submission and administrator status updates
- [ ] Test website content and homepage style draft/publish workflows
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
