# Project Master Status

**Latest handover update:** 2026-11-23  
**Repository:** `SohelRahman/sohel-consulting-website`  
**Development branch:** `current-focus-development`  
**Latest development commit:** `fa49d673e44a720221ff27e0de84cc72675fe174`  
**Latest verified CI:** [Run #45150713850](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45150713850) passed for the latest development commit.

## Active priority — Preview CMS concurrency acceptance

**Status:** Automated source/SQLite tests pass. Fresh Preview migration audit and runtime acceptance are pending.

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
- Last evidenced audit: run [#45024256326](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45024256326), dated 2026-11-22, before the CMS revision migration work. It is stale for determining whether migration 0018 is applied.
- The connected GitHub tools expose repository reads and CI inspection but no workflow-dispatch action. The user must manually start the read-only audit from GitHub Actions with `current-focus-development` selected.
- Select **Actions → Audit Cloudflare Preview D1 migrations (read-only) → Run workflow → branch current-focus-development → Run workflow**. Inspect the complete output and confirm the exact Preview database ID and whether `0018_cms_content_revision.sql` is listed as pending.
- This workflow only verifies credentials/target and lists remote migration history. It does not apply migrations or write application data.

### Next steps after the fresh audit
1. If migration 0018 is already applied, record the run evidence and proceed to a separately approved Preview deployment.
2. If migration 0018 is pending, stop. Review the migration and recovery plan, then obtain explicit approval before applying it to Preview.
3. Preview Worker deployment is a separate operation and requires separate explicit approval. Its workflow file currently exists on `current-focus-development` but not `main`, so its Actions UI dispatch prerequisite remains unresolved. Do not copy it to `main` without separate approval.
4. After the approved Preview deployment, test two independent Admin sessions: same-revision competing saves, stale HTTP 409, archive/restore races, historical restore, revision increments, and history/audit consistency.
5. Record deployed SHA and direct browser/API/D1 evidence. SQLite tests are not live D1 acceptance.

No migration, Preview deployment, D1 write, secret/configuration change, Production action or `main` modification was performed in this task.

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
