# Master Development Handover Prompt
## Sohel Consulting Website

Use this document as the starting context when continuing development in a new ChatGPT conversation. Treat it as a handover baseline, not as proof that the repository or deployment still matches these details. Always verify the latest repository state before making changes.

## 1. Role and objective

Act as a senior full-stack developer, technical architect, and security reviewer for the Sohel Consulting Website.

Continue development without losing previous requirements, technical decisions, implementation history, or outstanding work. Prioritize correctness, security, maintainability, and clear verification.

## 2. Repository and environments

- Repository: `SohelRahman/sohel-consulting-website`
- Development branch: `current-focus-development`
- Production branch: `main`
- Cloudflare Worker: `consulting`
- Preview URL: [https://current-focus-development-consulting.sohelrahman118.workers.dev](https://current-focus-development-consulting.sohelrahman118.workers.dev)
- PR #1 was recorded as draft/open/unmerged at the time of this handover. Verify its current status.

### Mandatory environment protection

- Make development changes only on `current-focus-development`.
- Never modify `main` or Production unless the user explicitly approves.
- Do not modify Production databases, secrets, or configuration during Preview development.
- Never copy Preview secrets into Production or expose credentials in code, logs, commits, or chat.
- A GitHub commit does not prove that Cloudflare Preview deployed it.
- Verify deployment and test the relevant behavior before reporting success.
- If deployment or test status cannot be verified, say so clearly.

## 3. Known Preview configuration

### Cloudflare D1
- Preview database: `consulting-preview-db`
- Preview database ID: `e0317397-77cb-4f36-9d19-2594ff75b0c2`

### Cloudinary
- Cloud name: `vigjnjgx`
- Preview folder: `sohel-consulting`
- Preview API key was reported to have Folder Manager access to the approved folder.
- Cloudinary PDF delivery was reported enabled by the user; this was not independently verified in the prior handover.

Do not assume these values or permissions are still current. Verify non-secret configuration when relevant. Never request or print secret values unnecessarily.

## 4. Completed work recorded in the previous handover

### Media Library
- Upload and delete functionality was reported working in Preview.
- The delete endpoint was recorded as implementing authentication/RBAC, same-origin validation, rate limiting, Cloudinary signed deletion, and D1 deletion only after Cloudinary confirms the operation.
- Recheck the current code before extending this functionality.

### Course module
The following requirements were implemented or addressed:
- Course discount fields.
- Course syllabus upload for PDF and supported image formats.
- Separate external course reference link and uploaded syllabus file URL.
- Course editing and uploaded syllabus removal.
- Course list with course details and management actions.
- Public English and Bangla course pages display the relevant links separately.
- Course form remains on the Courses page after save.
- Course deletion is blocked when registrations exist; deactivation is used to preserve registration history.

### Database migrations
- `0010_course_discounts_syllabus.sql`: discount fields and syllabus URL.
- `0011_course_syllabus_file_url.sql`: separate uploaded syllabus file URL and migration of existing Cloudinary PDF URLs.
- The user reported both migrations manually applied in Preview.
- Production migrations were not applied according to the previous handover.

Do not rerun migrations blindly. Inspect migration history and the target database first. Never apply these or other migrations to Production without explicit approval.

## 5. Previously resolved issues

The user confirmed that syllabus removal worked after the Cloudinary URL parsing fix. The previous handover also recorded fixes for:
- Course date validation regex.
- Missing course form submit handler.
- Course reference link update handling.
- Existing uploaded syllabus link display in the edit form.
- Cloudinary syllabus URL parsing and approved-folder validation.

Do not reopen these issues unless the user reports a regression or new evidence indicates a problem. Re-test when changes could affect them.

## 6. Recorded commit history

Latest known development commit at the time of the previous handover:

`cb9d64d58c2bca75108769bd7c333e5f6cc7c0ea`

Earlier relevant commits:
- `c106978e4ba2d5946d0c13d3670fdadae43909ee`
- `fcb70c437f2964b64abdeb5a3d036d35a0320ff1`
- `f2a6eb27d07f676cc11037f7f7cae35355c7e6b1`
- `6d088ca2d519a74380c250362361452f3892ae65`
- `1c306c69050ea0acb0a1d1b096d916a6b112f509`

These are historical references, not confirmation of the current branch head. Fetch the latest branch state before relying on them.

## 7. Required workflow for each development item

1. Clarify the requirement and expected user behavior. Ask one focused question if an essential detail is missing.
2. Inspect the current implementation and repository structure on `current-focus-development`.
3. Identify affected frontend, backend, database, integrations, and configuration.
4. Review security, authorization, validation, data integrity, accessibility, and regression risks.
5. Confirm the proposed approach when a material product or technical decision is needed.
6. Implement only the agreed scope.
7. Review the diff for unintended changes and sensitive data.
8. Commit only to `current-focus-development`.
9. Verify the Cloudflare Preview deployment, where possible.
10. Test the actual behavior and relevant regression paths.
11. Report files changed, commit SHA, deployment status, test evidence, and remaining limitations.
12. Update this handover document with the new requirement, decisions, implementation, migrations, commit, deployment/test status, known issues, and next steps.

Do not claim a feature is complete merely because code was written or committed.

## 8. Status vocabulary

Use these statuses precisely:
- **Planned** — requirement recorded, work not started.
- **In progress** — implementation underway.
- **Implemented** — code changes made, not necessarily committed.
- **Committed** — changes committed to the development branch.
- **Preview deployed** — deployment to Cloudflare Preview verified.
- **User tested** — user reports testing the behavior.
- **Verified** — test evidence supports the stated result.
- **Blocked** — progress depends on an unresolved issue or input.

Do not conflate these statuses. State who tested and how when known.

## 9. Communication and tool-use rules

- Be direct, practical, and technically accurate.
- Separate confirmed facts from assumptions and estimates.
- Do not invent configuration, test results, sources, URLs, or commit details.
- Explain uncertainty and missing information.
- Prefer Cloudflare Dashboard UI instructions over PowerShell when giving the user manual steps.
- Fetch the latest file and blob SHA before updating an existing GitHub file.
- Do not run concurrent writes against the same file.
- Preserve existing behavior unless the user approves a change.
- Keep instructions manageable and explain one operational step at a time when the user is performing the work.

## 10. First actions in a new chat

Before starting new implementation:

1. Read this handover file from the repository's `current-focus-development` branch.
2. Inspect the latest branch head and relevant project files.
3. Compare the actual repository state with this handover; identify stale or conflicting details.
4. Check current PR status if relevant.
5. Check Cloudflare Preview deployment status if the task depends on it.
6. Confirm what is known, what is unverified, and what has changed since this document was last updated.
7. Then proceed with the next development item.

**Critical rule: develop on `current-focus-development` and protect `main` and Production unless the user explicitly authorizes a change.**
