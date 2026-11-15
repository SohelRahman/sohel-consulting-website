# Changelog

All notable project changes should be recorded here. Entries describe repository changes and verification status; they do not imply Production deployment.

## 2026-11-15

### Development branch documentation baseline
- Added architecture, development, database, API, configuration, deployment, testing and maintenance documentation.
- Documented current Worker/D1/Cloudflare architecture and environment separation.
- Recorded the migration inventory through `0008_analytics.sql`.
- Recorded the current API route inventory from `src/worker.js`.
- Added a documentation maintenance rule for future code and configuration changes.

### Previously completed development work
- Added bilingual cookie-consent preferences and gated optional first-party analytics.
- Improved responsive navigation across English and Bangla pages.
- Improved chat accessibility and keyboard behavior.
- Added accessibility, metadata and performance-related frontend improvements.
- Standardized the refund policy navigation.
- Development validation workflow passed on commit `16f4cbb7dc0d440b99d17c5c6a831a79ad576293` according to the project handover record.

### Known verification gaps
- Full browser-based Preview QA has not been completed.
- Consent reject/withdraw/re-accept behavior needs manual verification; a possible analytics re-consent restart issue was identified for follow-up.
- Cross-browser, responsive, form, chat, admin and Cloudinary end-to-end checks remain outstanding.
- Production deployment has not been authorized.
