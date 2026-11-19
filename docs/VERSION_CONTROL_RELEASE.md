# Version Control and Release Management Policy

## 1. Objectives

This policy controls how source changes are proposed, reviewed, tested, versioned and released. It aims to prevent unreviewed changes, accidental Production deployment, undocumented database changes and unclear rollback decisions.

## 2. Branch model

| Branch | Purpose | Rule |
| --- | --- | --- |
| `main` | Production-ready source | Protected; changes enter through reviewed pull requests |
| `current-focus-development` | Integration and Preview testing | Normal development target |
| `feature/<short-name>` | Optional isolated feature work | Branch from development; merge back through PR |
| `fix/<short-name>` | Optional isolated bug fix | Branch from development; merge back through PR |
| `hotfix/<short-name>` | Urgent Production correction | Requires incident context and expedited review; merge back into development after release |

The current project may continue to use `current-focus-development` directly for small changes. For larger or parallel work, use short-lived feature/fix branches. Do not create long-lived branches without a clear reason.

## 3. Pull request controls

Configure GitHub repository rules/branch protection for `main`:

- Require pull requests before merging.
- Require at least one approval from an authorized reviewer.
- Require the development validation workflow to pass.
- Require approval of the latest push; dismiss stale approvals when new commits are pushed.
- Require conversation resolution.
- Restrict direct pushes and force pushes.
- Restrict branch deletion.
- Use linear history if the team adopts squash/rebase merging consistently.

For `current-focus-development`, protect against force pushes and deletion. Require CI checks where the repository workflow and team process permit.

**Administrative limitation:** These settings are repository-level GitHub controls. Documentation in Git does not activate them. An authorized repository administrator must configure and verify the rules in GitHub Settings.

## 4. Commit conventions

Use short, imperative commit subjects with a clear scope. Recommended pattern:

```
type(scope): concise description
```

Suggested types:
- `feat`: user-visible capability
- `fix`: defect correction
- `docs`: documentation-only change
- `refactor`: internal restructuring without intended behavior change
- `test`: test or validation changes
- `build`: build, workflow or dependency changes
- `security`: security-related correction

Examples:
- `docs(release): add versioning and approval policy`
- `fix(consent): restart analytics after consent is restored`
- `feat(admin): add course archive action`

Avoid vague subjects such as `updates`, `changes` or `final`. Do not include credentials, personal data or secret values in commits.

## 5. Versioning

Use Semantic Versioning for public Production releases:

`MAJOR.MINOR.PATCH`

- **MAJOR:** incompatible change to a public interface or material application behavior.
- **MINOR:** backward-compatible functionality addition.
- **PATCH:** backward-compatible bug/security fix.

Before the first formal release, the application may remain pre-1.0 (for example, `0.x.y`). The exact initial release number must be selected at the first approved release; do not invent a version retroactively.

Create an annotated Git tag for each approved Production release, for example `v1.2.0`. Tags must point to the exact commit deployed to Production. Do not move or reuse a published release tag. If a release needs correction, publish a new patch version.

A Git tag is a source-control marker; it does not itself deploy this Worker. The current deployment workflow is manually triggered from `main`.

## 6. Release lifecycle

A normal release follows this sequence:

1. **Develop:** implement on `current-focus-development` or a short-lived feature branch.
2. **Document:** update relevant docs, migration notes and `CHANGELOG.md`.
3. **Validate:** run CI and review the code diff.
4. **Preview:** deploy/test in the Preview environment, including relevant manual QA.
5. **Prepare release:** update changelog, identify the exact candidate commit, review database migrations, backup/recovery needs and external configuration.
6. **Pull request:** open or update the PR from development to `main`; include summary, risk, test evidence, migration impact and rollback plan.
7. **Approve:** authorized reviewer approves after required checks pass.
8. **Merge:** merge the reviewed PR using the repository's agreed merge strategy.
9. **Tag:** create an annotated version tag on the exact approved `main` commit.
10. **Release approval:** obtain explicit Production release authorization.
11. **Deploy:** run the manual Production workflow from `main`, with GitHub Production environment approval enabled.
12. **Verify:** check Worker health, core pages, API, administrator login and critical business flows.
13. **Record:** record tag, commit SHA, workflow run, deployment time, verification and any follow-up in the changelog/release notes.

Do not skip Preview QA for a routine release. Emergency hotfixes may use an expedited process, but must still have a reviewed change, a controlled deployment and a follow-up merge to development.

## 7. Production release gates

A release must not proceed until all applicable gates are satisfied:

- CI is green for the exact release candidate.
- Pull request is approved and merged.
- Preview functional and responsive QA is complete for affected features.
- No unresolved critical/high severity defects remain.
- Security and privacy impact is reviewed.
- D1 migration status, ordering and compatibility are checked.
- Backup/recovery plan is ready for data-impacting changes.
- Production secrets and bindings are verified without exposing values.
- Content/legal/business approvals are complete where applicable.
- Release owner and explicit Production approval are recorded.
- Rollback decision and responsible person are clear.

## 8. Database release controls

- Add a new sequential migration for every schema change; do not rewrite an applied migration.
- Apply and verify migrations in Preview before Production.
- Confirm the target database ID and environment before executing a migration.
- Prefer backward-compatible expand-and-contract changes when old and new Worker versions may overlap.
- Document data backfills, destructive operations, expected duration and recovery steps.
- Treat Worker rollback and D1 rollback as separate operations. Reverting Worker code does not reverse a schema/data migration.
- Never run destructive Production SQL without a verified backup and explicit approval.

## 9. Rollback and hotfix control

If a release fails:
1. Stop additional rollout and capture the failing release tag, commit and workflow run.
2. Assess whether the issue is application code, configuration, external service or database state.
3. If safe, redeploy the last known-good Worker commit/version using an approved procedure.
4. Do not blindly reverse D1 migrations; restore or forward-fix data/schema using a reviewed recovery plan.
5. Verify critical user journeys after recovery.
6. Open a defect/hotfix record and document root cause and corrective action.

A hotfix must be merged back into `current-focus-development` so the fix is not lost in the next release.

## 10. Release record

For every Production release, retain:
- Version/tag
- Commit SHA
- Pull request link
- CI run link and result
- Preview QA evidence
- Database migrations applied
- Production approval
- Deployment workflow run
- Post-deployment verification
- Rollback reference or reason rollback was not needed

## 11. Current implementation status

The repository currently has:
- A development branch validation workflow.
- A manual Production deployment workflow guarded to run only from `main`.
- A separate Preview secrets workflow restricted to `current-focus-development`.

The repository still requires administrator configuration of branch protection/rulesets and a protected GitHub Environment named `production` with required reviewers. The workflow must reference that environment for the approval gate to apply. These settings cannot be guaranteed by committing this document alone.
