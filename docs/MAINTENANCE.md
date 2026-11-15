# Maintenance Runbook

## Routine maintenance

- Review GitHub Actions failures after each development change.
- Keep Wrangler and workflow dependencies reviewed and updated deliberately.
- Review Cloudflare Worker logs for unexpected errors.
- Monitor D1 storage and query behavior.
- Check Cloudinary upload and media-library behavior.
- Review administrator access and rotate credentials when needed.
- Review analytics retention and consent behavior.
- Keep privacy, terms and refund content aligned with actual operations.

## Troubleshooting sequence

1. Identify whether the issue affects static assets, Worker API, D1, Cloudinary or browser behavior.
2. Reproduce on Preview, not Production, where possible.
3. Capture the page, request path, timestamp and error response. Do not capture passwords, session cookies or sensitive personal data.
4. Inspect Worker logs and relevant GitHub Actions runs.
5. Check the relevant environment's bindings and secrets without exposing secret values.
6. Check D1 migration state and relevant records using read-only queries first.
7. Apply a minimal fix on the development branch.
8. Add a regression test or QA case and update documentation.

## Data protection

- Treat learner, registration, inquiry and chat data as confidential.
- Limit access to the administrator dashboard and Cloudflare/GitHub accounts.
- Do not export or share production records unless necessary and authorized.
- Keep database backups before risky schema or data operations.
- Confirm retention and deletion requirements before changing data lifecycle behavior.

## Analytics retention

The application has implemented cleanup of analytics records older than 90 days during event writes, according to the current project implementation notes. Verify the current Worker logic before changing this policy. This is a technical behavior, not a statement of legal compliance.

## Incident response

If credentials or sensitive data are exposed:
1. Stop further disclosure.
2. Rotate affected credentials/tokens through the relevant provider.
3. Review access logs and recent changes.
4. Determine whether user data was accessed or changed.
5. Record the incident and corrective actions.
6. Do not publish incident details containing secrets or personal data.

## Maintenance log

Record significant maintenance work in `CHANGELOG.md`, including date, scope, affected environment, commit and verification status.
