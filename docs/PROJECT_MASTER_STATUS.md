# Project Master Status

**Latest handover update:** 2026-11-23  
**Repository:** `SohelRahman/sohel-consulting-website`  
**Development branch:** `current-focus-development`  
**Latest development commit:** `fa49d673e44a720221ff27e0de84cc72675fe174`  
**Latest verified CI:** [Run #45150713850](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45150713850) passed for the latest development commit.

## Active priority — Preview CMS concurrency acceptance

**Status:** Automated source/SQLite tests pass. Fresh Preview migration audit completed; migrations 0018 and 0019 are pending on the dedicated Preview D1 target. Runtime acceptance is blocked pending explicit migration and deployment approvals.

### Verified source and CI
- CMS optimistic concurrency uses per-row revision tokens and compare-and-swap updates for draft save, archive, restore and historical restore.
- The Worker/Admin source-contract test and temporary SQLite concurrency/transaction tests passed.
- Implementation commit: `ced2ce5a08bb00f89401b1cc6b1131b0755d4fd3`.
- Documentation/CI-result commit: `fa49d673e44a720221ff27e0de84cc72675fe174`.
- CI runs [#45150564334](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45150564334) and [#45150713850](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45150713850) passed.

### Preview migration audit
- Expected Preview D1: `consulting-preview-db`, ID `e0317397-77cb-4f36-9d19-2594ff75b0c2`.
- Read-only workflow: `.github/workflows/audit-preview-d1-migrations.yml`.
- The audit workflow is present on both `main` and `current-focus-development`; the Actions UI default-branch prerequisite is satisfied.
- Fresh audit evidence: [Run #5](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45155468446), job `audit-preview`, completed successfully on `current-focus-development`. The supplied job-log screenshot shows Wrangler 4.160.1 listing `0018_cms_content_revision.sql` and `0019_admin_mfa.sql` under **Migrations to be applied**.
- The workflow verifies the Cloudflare token, checks the expected Preview D1 ID, and runs `wrangler d1 migrations list PREVIEW_DB --remote`. It is read-only.
- Both migrations are pending on the dedicated Preview target. Run #5 did not apply either migration.

### Next steps after the fresh audit
1. Review the SQL and recovery plan for migrations 0018 and 0019.
2. Obtain explicit approval before applying either migration to Preview D1. No migration-apply workflow has been dispatched.
3. Apply and verify migration 0018 before deploying Worker code that depends on `cms_content.revision`.
4. Configure the Preview-only `MFA_ENCRYPTION_KEY` through the approved secret process; never expose its value. Apply migration 0019 only after the required approval.
5. Obtain separate explicit approval for Preview Worker deployment. Its workflow is on `current-focus-development` but absent from `main`; do not modify `main` to expose it without separate approval.
6. After deployment, test two independent Admin sessions for CMS concurrency and verify MFA enrollment, login and recovery.
7. Record deployed SHA and direct browser/API/D1 evidence. SQLite tests are not live D1 acceptance.

Run #5 was read-only. No migration, Preview deployment, D1 write, secret/configuration change, Production action or `main` modification was performed.

## Completed source priority — Bulk CMS initialization recovery
- Admin preflight blocks more than 400 eligible items before network submission.
- Ambiguous network failures explain safe retry behavior; existing keys are preserved.
- Initialization remains draft-only and content/history/audit writes use one D1 batch.
- Previous development CI run [#45149919998](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45149919998) passed.

## Completed source priority — Admin MFA
MFA source implementation and automated checks passed in [CI run #45149126646](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45149126646). Preview-only `MFA_ENCRYPTION_KEY`, migration `0019_admin_mfa.sql`, Preview deployment and browser acceptance remain pending and require explicit approval.

## Mandatory operating gates
- Work only on `current-focus-development`; do not modify, merge, rebase or reconcile `main`.
- Never access or expose secret values.
- No migration, D1 write, Cloudflare configuration change or deployment without explicit approval.
- Distinguish source implementation, CI, Preview deployment, Preview runtime acceptance and Production release.
- Update this file, relevant technical documentation and `CHANGELOG.md` in the same implementation commit.
