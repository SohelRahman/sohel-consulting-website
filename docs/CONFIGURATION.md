# Configuration and Secrets

## Wrangler configuration

Configuration is stored in `wrangler.toml`.

- Worker name: `consulting`
- Entry point: `src/worker.js`
- Compatibility date: `2026-11-12`
- Static asset directory: repository root
- Static asset binding: `ASSETS`
- D1 binding: `DB`
- Preview environment marker: `ENVIRONMENT=preview`

Review the current file before relying on these values; configuration can change.

## Runtime secrets

The Worker expects these administrator secrets:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `SESSION_SECRET`

The Preview secret workflow also configures Cloudinary credentials:

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

The Preview GitHub Actions workflow requires repository secrets for Cloudflare access and Preview-specific credentials. Its current YAML is the source of truth for exact secret names, including the Cloudinary folder-access setup.

## Secret handling rules

- Store secrets only in Cloudflare encrypted secrets or GitHub Actions secret storage as appropriate.
- Use separate Preview and Production administrator credentials.
- Never commit secret values, paste them into chat, place them in `wrangler.toml`, or print them in workflow logs.
- Do not reuse a Production password in Preview.
- Rotate credentials if they are exposed or access changes.
- Grant the minimum Cloudflare permissions needed for the specific task.

## Environment isolation

Preview D1 and Production D1 are separate resources. Preview secrets and Production secrets are also configured separately. Do not change Production configuration as part of routine development.

## Configuration changes

Update this document and the deployment checklist whenever a binding, secret name, environment variable, Worker name, compatibility date or external integration changes.
