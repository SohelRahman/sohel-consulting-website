# Testing and Quality Assurance

## Automated checks

Current CI workflow: `.github/workflows/validate-development.yml`.

| Check | Command | What it verifies |
| --- | --- | --- |
| Worker syntax | `node --input-type=module --check < src/worker.js` | Worker JavaScript parses |
| Shared JS syntax | `node --check assets/site.js` | Browser JavaScript parses |
| Site validation | `node scripts/validate-site.mjs` | HTML, local links and inline scripts per validator |

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

### Administrator
- [ ] Verify login, invalid login, session expiry and logout.
- [ ] Test course create/edit/activate/deactivate/delete as supported.
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
