# Stage 9A.4 — Final CMS Schema Review

**Status:** Conditional design review completed; migration approval is pending.
**Branch:** `current-focus-development`
**Scope:** Review of the seven-table CMS proposal in `docs/CMS_SCHEMA_TABLE_SPEC_STAGE_9A.md` against the existing database reference and recorded project decisions.
**Implementation status:** No CMS migration or application code was created or changed by this review.
**Database status:** No D1 database was accessed or modified during this review.

## 1. Executive decision

The seven-table additive model is accepted as the design direction, subject to the conditions in this document. It is not yet approved for executable migration SQL.

The design correctly separates logical pages, locale workspaces, editable sections/elements, locale-specific values, element history and immutable published snapshots. It also reflects the confirmed independent Global EN/BN publication model.

The Stage 9A.3 SQL statements were reported as successfully executed. Their result sets have not been supplied for inspection. Successful execution alone does not establish the actual Preview migration history, schema definitions, row counts or foreign-key integrity. Those environment facts remain unverified.

## 2. Final design review

| Review area | Finding | Disposition |
|---|---|---|
| Additive seven-table model | Keeps legacy and operational tables in place | Accept as design direction |
| EN/BN separation | Each page/language has its own workspace and publication state | Accept |
| Draft/public separation | Public rendering uses immutable published snapshots, not mutable Draft rows | Required invariant |
| Page-builder compatibility | Section renderer types and configuration are retained | Accept, subject to mapping tests |
| Content type compatibility | Explicitly retains `textarea` and URL semantics | Required mapping invariant |
| Defaults | Baseline values are separate from editable Draft values | Accept; enforce immutability in service and audit controls |
| Element history | Historical values are separate from the general audit log | Accept |
| Page publication | Snapshot insertion and pointer/revision update must be atomic | Conditional on D1 transaction verification |
| Optimistic concurrency | Draft and publication revisions prevent stale writes | Required service invariant |
| Same-locale version pointer | Composite FK is preferred, but cyclic/deferred FK behavior is not verified | Resolve with Preview compatibility test or transactional enforcement |
| Soft-delete/restore | Soft-delete retains history; parent restore does not reactivate deleted children | Accept |
| Global publication | EN and BN publish independently; page and Global publication are isolated | Confirmed user decision; accept |
| Global public composition | Page snapshot is composed with the current published Global snapshot for the same locale | Accept; fallback/cache behavior must be finalized |
| Audit | Reuse existing `audit_logs`; do not add a second generic audit table | Accept; confirm exact actor/key mapping before implementation |
| Page routes | Route uniqueness and redirect behavior depend on Worker routing | Unresolved implementation gate |
| Legacy backfill | Explicit mapping is required for `pages`, `site_content` and builder JSON | Unresolved implementation gate |
| Operational domains | Courses, registrations, inquiries, chat, analytics, media and styles remain separate | Accept |

## 3. Required implementation conditions

These are conditions for the later migration/API design, not reasons to replace the seven-table model.

### 3.1 Database compatibility
- Inspect the actual Preview D1 migration history and table definitions.
- Verify foreign-key enforcement and run the foreign-key integrity check.
- Verify D1/SQLite support and behavior for JSON validation functions before adding database CHECK constraints.
- Test the selected transaction/batch pattern and the same-locale version-pointer integrity strategy in Preview.
- Confirm the exact existing key types and columns for `pages`, `audit_logs` and `admin_users` before adding legacy or actor references.

### 3.2 Publication and version integrity
- A page/language publication must create one complete immutable snapshot and advance its pointer/revision atomically.
- The publication operation must compare both expected Draft and publication revisions; on conflict, it must roll back without changing the previously published snapshot.
- Public rendering must never read mutable Draft rows.
- Global publication must invalidate or revalidate public responses for the matching locale.
- Define the safe baseline used before the first Global publication. Draft content must never be used as a public fallback.

### 3.3 Routing and migration
- Determine route normalization and uniqueness from the current Worker routing implementation.
- Define redirects/aliases before allowing a route change to affect a live URL.
- Produce a source-to-target inventory for legacy pages, static page content, site-content keys and page-builder JSON.
- Preserve existing IDs, slugs, SEO fields, section types, ordering and values where applicable.
- Run a comparison of migrated Preview output against the current public page before switching any page to CMS rendering.
- Retain legacy APIs during gradual page-by-page integration.

### 3.4 Authorization and audit
- Enforce CMS permissions on the server, not only in the Admin UI.
- Reconcile CMS actions with the existing permission catalogue and role assignments.
- Reuse `audit_logs` for create, edit, reorder, Default, delete, restore, publish, history restore, route and permission-sensitive actions.
- Confirm whether a stable admin-user ID can be recorded without breaking the existing audit schema. Keep the actor email snapshot.

## 4. Preview D1 evidence status

The four read-only checks were reported as successfully executed, but their outputs have not yet been reviewed.

| Evidence required | Current status |
|---|---|
| Applied migration history from `d1_migrations` | Execution reported; results not supplied |
| Actual table definitions from `sqlite_master` | Execution reported; results not supplied |
| Counts for `pages`, `site_content`, `page_styles` | Execution reported; results not supplied |
| `PRAGMA foreign_keys` and `PRAGMA foreign_key_check` | Execution reported; results not supplied |

**Conclusion:** Stage 9A.3 is not evidence-complete. No statement is made here that the Preview database matches the repository migration files or that foreign-key integrity is clean.

## 5. Approval checklist

| Item | Decision |
|---|---|
| Seven-table additive model | Accepted as design direction |
| Confirmed Global Option A | Accepted and fixed |
| Draft/published isolation and immutable snapshots | Required |
| Atomic publication and optimistic concurrency | Required; D1 behavior must be tested |
| Soft-delete and restoration rules | Accepted |
| Legacy compatibility and gradual migration | Required |
| Preview D1 evidence review | Pending |
| Final route, cache and Global fallback details | Pending implementation specification |
| Executable migration SQL | Not authorized |
| CMS implementation | Not authorized |
| Production changes | Not authorized |

## 6. Stage 9A.4 outcome and next gate

**Stage 9A.4 design review: conditionally complete.**

The seven-table model can proceed to the next approval gate after the Preview D1 result sets are inspected and the remaining compatibility decisions are recorded.

Next:
1. Review the four Stage 9A.3 query outputs.
2. Record verified Preview schema/migration findings and resolve discrepancies.
3. Finalize the route, Global fallback/cache and D1 transaction/FK decisions.
4. Present the final schema for explicit user approval in Stage 9A.5.

Until then, do not create or apply a CMS migration. Do not modify Production.
