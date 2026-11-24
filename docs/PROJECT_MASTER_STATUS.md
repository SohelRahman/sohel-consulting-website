# Project Master Status

**Latest handover update:** 2026-11-24  
**Repository:** `SohelRahman/sohel-consulting-website`  
**Development branch:** `current-focus-development`  
**Latest implementation update:** `e38c8edcaa6401876d8f4b1f72305ddea69dc65e`  
**Latest verified source CI:** [Run #45150713850](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45150713850) passed for the previously validated source commit. CI for the latest documentation-only commits is not yet confirmed.

## Active priority — Preview CMS concurrency acceptance

**Status:** CMS source/SQLite tests pass. Preview D1 migrations 0018 and 0019 are applied and the final remote migration list is clear (Run #11). Preview Worker runtime acceptance remains pending; deployment and browser/API acceptance are separate gates.

### Verified source and CI
- CMS optimistic concurrency uses per-row revision tokens and compare-and-swap updates for draft save, archive, restore and historical restore.
- The Worker/Admin source-contract test and temporary SQLite concurrency/transaction tests passed.
- Implementation commit: `ced2ce5a08bb00f89401b1cc6b1131b0755d4fd3`.
- Documentation/CI-result commit: `fa49d673e44a720221ff27e0de84cc72675fe174`.
- CI runs [#45150564334](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45150564334) and [#45150713850](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45150713850) passed.

### Preview migration audit and application
- Expected Preview D1: `consulting-preview-db`, ID `e0317397-77cb-4f36-9d19-2594ff75b0c2`.
- Read-only workflow: `.github/workflows/audit-preview-d1-migrations.yml`.
- The audit workflow is present on both `main` and `current-focus-development`; the Actions UI default-branch prerequisite is satisfied.
- Read-only audit [Run #5](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45155468446) showed migrations 0018 and 0019 pending.
- Authorized migration execution [Run #11](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/4516057616) completed successfully on `current-focus-development`.
- The migration job verified Preview D1 ID `e0317397-77cb-4f36-9d19-2594ff75b0c2`, applied both migration files, reported success for each, and finished with `No migrations to apply!`.
- No Production database was targeted. The run does not deploy the Worker or prove runtime acceptance.

### Next steps after Preview migration
1. Make the Preview MFA key provisioner available through the authorized deployment workflow. The updated development workflow now checks Worker secret metadata and creates a cryptographically random 32-byte base64url `MFA_ENCRYPTION_KEY` only when absent; it never rotates an existing key or prints the value.
2. Verify Preview Admin/session/Cloudinary secrets are configured without revealing values.
3. The guarded Preview deployment workflow now has a branch-scoped push trigger that runs only for a commit message containing `[deploy-preview]`; ordinary pushes skip the job. This avoids changing `main`. Do not create a marker commit until explicit Preview deployment approval is recorded.
4. Deploy the intended development SHA only after the workflow dispatch prerequisite is resolved; record the deployed SHA.
5. Run two-session CMS concurrency acceptance (competing same-revision saves, stale HTTP 409, archive/restore races, historical restore, revision increments and history/audit consistency).
6. Run MFA enrollment, TOTP login, replay rejection, recovery-code and reset acceptance.
7. Record direct browser/API/D1 evidence. CI and migration-ledger success are not runtime acceptance.

Run #5 was read-only. The later authorized Run #11 applied migrations 0018 and 0019 to Preview D1. No Preview Worker deployment, Production action or `main` modification was performed.

## Completed source priority — Bulk CMS initialization recovery
- Admin preflight blocks more than 400 eligible items before network submission.
- Ambiguous network failures explain safe retry behavior; existing keys are preserved.
- Initialization remains draft-only and content/history/audit writes use one D1 batch.
- Previous development CI run [#45149919998](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45149919998) passed.

## Completed source priority — Admin MFA
MFA source implementation and automated checks passed in [CI run #45149126646](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45149126646). Migration `0019_admin_mfa.sql` is applied to Preview D1 by Run #11. The development Preview deployment workflow provisions `MFA_ENCRYPTION_KEY` if absent without rotating an existing value and runs the CMS/MFA tests. It now has an explicit commit-message-gated push trigger on `current-focus-development`, avoiding changes to `main`. Actual secret provisioning, Preview deployment and browser acceptance remain pending.

## Mandatory operating gates
- Work only on `current-focus-development`; do not modify, merge, rebase or reconcile `main`.
- Never access or expose secret values.
- No migration, D1 write, Cloudflare configuration change or deployment without explicit approval.
- Distinguish source implementation, CI, Preview deployment, Preview runtime acceptance and Production release.
- Update this file, relevant technical documentation and `CHANGELOG.md` in the same implementation commit.


## 2026-11-24 — Preview D1 migrations applied and verified

The authorized Preview migration workflow [Run #11](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/4516057616) completed successfully. Job `migrate-preview` verified the dedicated remote Preview D1 ID `e0317397-77cb-4f36-9d19-2594ff75b0c2` before migration activity. The pre-apply migration list contained `0018_cms_content_revision.sql` and `0019_admin_mfa.sql`. Wrangler reported both migrations with successful status after execution. The final remote migration-list step returned **No migrations to apply!** The job steps `Apply pending migrations to Preview D1 only` and `Verify Preview migration state` both completed successfully.

This is direct GitHub Actions execution evidence for the Preview D1 migration ledger. It confirms the two migrations were applied to the dedicated Preview database. It does not establish that a Worker containing the corresponding source code has been deployed or that runtime/browser acceptance has passed. Production and `main` were not targeted by this workflow.


## Preview deployment trigger gate — 2026-11-24

The guarded Preview deployment workflow now supports a branch-scoped `push` trigger on `current-focus-development` in addition to manual `workflow_dispatch`. The job runs only when the pushed commit message contains the exact marker `[deploy-preview]` or when the event is a manual workflow dispatch. Ordinary pushes to the development branch skip the deployment job. This avoids modifying `main` merely to expose the workflow in the Actions UI, while retaining an explicit deployment gate. The trigger itself does not authorize or execute deployment. No marker commit has been created and no deployment has been run.
