# Stage 8 — CMS Admin Panel UI and User Workflow Specification

**Status:** Planning specification. Not implemented.  
**Applies to:** `current-focus-development` and Preview only during future implementation.  
**Production:** No Production change is authorized by this document.

## 1. Purpose and design constraints

Define the Admin Panel experience for managing website pages, sections and content in English and Bangla.

The CMS must preserve the current public website design and functionality. It is a content-management layer, not a redesign or replacement of the existing page builder.

Implementation must:
- Follow the existing Admin Panel visual language, navigation and interaction patterns.
- Preserve current courses, registrations, inquiries, media, chat, analytics, user access and page-style modules.
- Keep English and Bangla content independently editable and publishable.
- Use the existing vanilla HTML/CSS/JavaScript approach unless an architecture change is separately approved.
- Make permissions visible in the UI while enforcing them again in the Worker.
- Keep public content unchanged until the relevant page/language is successfully published.

## 2. CMS navigation and entry point

Add a Website Content / CMS entry to the existing Admin Panel navigation. Do not remove or rename existing modules.

The CMS landing screen should show a page registry with:
- Page name and page key.
- Page type (static, system, builder or global).
- English and Bangla availability.
- Draft-change indicator for each language.
- Last published timestamp where available.
- Available actions based on the administrator's permissions.

Initial registry scope:
- Home
- About
- Services
- Training
- Contact
- Case Studies
- FAQ
- Course
- Registration
- Privacy Policy
- Terms and Conditions
- Refund Policy
- Global/shared content

The page registry is a planning baseline from the earlier CMS inventory. Exact page keys, routes and source mappings must be checked against the current branch before implementation. Course and registration operational data remain managed by their existing modules; CMS controls only their approved page-level website content.

## 3. Page and language workflow

Selecting a page opens its content workspace. English and Bangla must be separate language contexts, not a translation field in a single shared editor.

Recommended workspace header:
- Page title and route.
- Language selector: English | বাংলা.
- Page publication state.
- Last published time and publisher, if available.
- Preview action.
- Save Draft action.
- Publish action, shown only with publish permission.

Changing the language must load that language's own sections, values, draft state and publication history. It must not copy, overwrite or publish the other language.

A language with no registered content should show an explicit empty/setup state. Do not silently substitute the other language's content.

## 4. Page content hierarchy

Use this hierarchy in the editor:

```text
Page
  ├── Page metadata
  ├── Section
  │     ├── Content element
  │     ├── Content element
  │     └── Content element
  └── Section
        └── Content element
```

### Page metadata
Manage only approved metadata fields:
- Page title.
- Route/slug where route editing is permitted.
- SEO title.
- SEO description.

Route changes require duplicate-route validation and must preserve existing public links through an explicitly designed redirect/compatibility rule. Do not expose route editing until that rule is implemented.

### Sections
Each section should display:
- Section label and stable key.
- Ordering controls.
- Required/optional status.
- Active/deleted status.
- Its content elements.

Section creation, editing, ordering, deletion and restoration are restricted to users with structure-management permission. Required sections cannot be deleted. Deleting a section must not physically delete its page or historical content. Parent-child deletion semantics must be validated before implementation; a section containing required elements must not be deletable.

### Content elements
Each element row/card should display:
- Human-readable label.
- Stable element key (read-only in ordinary editing).
- Content type.
- Required indicator.
- Draft/published difference indicator.
- Available actions: Edit | Default | Delete, subject to permission and required-item rules.

Content editors must match the configured type:
- Text: plain text input or textarea.
- Rich text: constrained editor with a strict allowlist; no arbitrary scripts or event handlers.
- URL: URL input and protocol validation.
- Image: existing approved media-library selection/upload workflow.
- List and option list: structured item editor with validation.
- SEO text: bounded text editor using configured limits.
- System text: restricted to authorized system-content workflows.

Do not treat operational course records, registration records, chat messages, analytics events or media binaries as ordinary CMS content elements.

## 5. Draft, default and publish controls

### Save Draft
- Save only the current page/language's draft changes.
- Show a clear saved/unsaved state and save error.
- Do not update published values or public rendering.
- Prevent accidental navigation loss when unsaved edits exist, using the existing site's interaction conventions.

### Default
- Each eligible element has a Default action.
- Ask for confirmation before replacing its current draft value.
- Restore only that element's immutable baseline value in the selected language.
- Do not change its published value.
- Show the resulting draft state and require normal publication to make it public.
- If no valid baseline exists, disable the action and explain why.

### Publish
- Publish the entire selected page in the selected language as one atomic operation.
- Show a confirmation summary identifying the page and language.
- Warn when draft changes exist and explain that all eligible draft and structural changes for that page/language will be published together.
- Do not publish the other language, another page, global content or page styles as a side effect.
- Show success only after the backend confirms commit.
- On failure, preserve the prior published page and show a recoverable error.
- Use the backend's expected-version/concurrency mechanism where finalized in Stage 7.

## 6. Delete and restore workflow

Delete is a soft-delete operation.

- Hide the element from the active editor list after the backend confirms deletion, or show a clearly marked deleted state if the history view is open.
- Ask for confirmation and identify the item by label and parent section.
- Explain that the currently published website remains unchanged until the next successful publication of this page and language.
- Do not allow deletion of required elements.
- Do not delete the parent page.
- Do not physically remove history or values.

The next successful publication of the selected page/language excludes the soft-deleted element from the new published snapshot. Before that publication, the currently published version remains visible publicly.

Restore should reactivate the element in CMS management without automatically publishing it. The editor must make its draft value reviewable; publication remains a separate action.

## 7. Preview

Provide a Preview action for the selected page and language.

Preview requirements:
- Render the draft version, not the public version.
- Preserve the current public page layout, styles and responsive behaviour.
- Clearly mark the view as an administrator preview.
- Require an authenticated administrator and appropriate read permission.
- Never expose draft content through public endpoints or guessable unauthenticated preview URLs.
- Preview must not save, publish or mutate content.
- Support previewing each language independently.

## 8. Version history and recovery

Provide a Version History view for the selected page/language.

Display:
- Version number.
- Publication timestamp.
- Administrator identity.
- Available snapshot details.
- Restore action when authorized.

Restore flow:
1. Administrator selects a version.
2. UI shows the selected version metadata and, where practical, a comparison with current published content.
3. Administrator confirms restoration.
4. Backend copies the snapshot into Draft.
5. UI returns to the editor with a restored-draft indicator.
6. Administrator reviews and publishes separately.

Never overwrite or delete the historical version being restored. The subsequent publication creates a new version.

Element-level history may be shown from the element editor or a history panel. Do not expose audit history to users lacking the relevant history permission.

## 9. Global/shared content

Global content should have its own CMS workspace and independent English/Bangla contexts. It must not be silently bundled into an individual page publication.

Until a separate global publication contract is approved, global content should be managed and published through a dedicated global scope. Page publishing must not publish global content.

## 10. Permissions and UI visibility

The UI should use the effective server-provided permissions to decide which controls to display. The backend remains authoritative.

Proposed permission mapping from Stage 7:
- `cms.view`: view page registry and content.
- `cms.edit`: edit and save drafts; restore defaults into drafts.
- `cms.structure.manage`: create/update pages, sections and elements and manage ordering.
- `cms.publish`: publish the selected page/language.
- `cms.delete`: soft-delete eligible items.
- `cms.restore`: restore deleted items and historical snapshots.
- `cms.history.view`: view version and audit history.

These are proposed CMS permission names, not confirmed existing permission records. They must be reconciled with the current RBAC permission catalogue and seeded/assigned deliberately. A hidden button is not a security boundary; direct API calls must still be denied server-side.

## 11. Interaction states and feedback

Every CMS screen must define:
- Initial loading state.
- Empty state.
- Read-only state when edit permission is absent.
- Unsaved changes state.
- Saving state.
- Saved state.
- Validation error state.
- Network/server error state.
- Publish confirmation and publishing state.
- Publish success/failure state.
- Deleted/restored state.
- Version conflict state requiring refresh/review.

Use clear, specific messages. Do not report success before the Worker confirms the operation. Avoid losing unsaved work after an API failure.

## 12. Accessibility and responsive behaviour

- Preserve keyboard navigation and visible focus indicators.
- Provide programmatic labels for inputs and controls.
- Ensure dialogs can be operated by keyboard and have a clear focus order.
- Announce save/publish/error status to assistive technology.
- Do not rely on colour alone for draft, published, deleted or error states.
- Keep the editor usable on mobile and tablet; wide page registry tables may use responsive cards or controlled horizontal scrolling.
- Maintain adequate contrast and respect reduced-motion preferences.
- Keep English and Bangla labels, validation messages and confirmation text aligned.

## 13. Integration with existing Admin Panel modules

- Do not replace the existing page builder. Integrate its supported sections and preserve IDs, slugs, JSON and SEO data.
- Keep Page Styles separate from content values and preserve its current draft/published workflow.
- Keep Courses and syllabus management in the existing Courses module.
- Keep Media Library as the media asset source; CMS image fields should reference approved media records/URLs.
- Keep registrations, inquiries, chat and analytics in their existing operational modules.
- Existing APIs remain compatible during gradual page-by-page migration.

## 14. Acceptance criteria

- [ ] CMS entry appears without removing existing Admin Panel modules.
- [ ] All approved page records are discoverable.
- [ ] English and Bangla can be edited independently.
- [ ] Page and element hierarchy is clear and stable.
- [ ] Content editor is appropriate to each content type.
- [ ] Save Draft never changes public content.
- [ ] Default changes only the selected element's draft value.
- [ ] Publish affects only the selected page and language.
- [ ] Deleted elements remain public until the next successful publication.
- [ ] Deleted elements are excluded from the next published snapshot.
- [ ] Required structural items cannot be deleted.
- [ ] Restore reactivates an item without automatic publication.
- [ ] Preview shows draft content and is protected.
- [ ] Historical restore creates a draft; publishing creates a new version.
- [ ] Unauthorized actions are rejected by the Worker.
- [ ] Existing Admin Panel modules continue to work.
- [ ] Existing public appearance and functionality remain unchanged.
- [ ] Responsive and accessibility checks pass in English and Bangla.
- [ ] Failure and concurrency states do not lose saved or published content.

## 15. Dependencies and unresolved items

Before implementation:
1. User review/approval of the Stage 6 database schema.
2. Preview D1 inspection results: migration history, actual table schema, row counts and foreign-key checks.
3. Re-inspection of current `admin.html`, admin JavaScript, Worker routes and page-builder JSON on the active branch.
4. Reconcile proposed CMS permissions with the actual RBAC catalogue.
5. Finalize global-content publication semantics and section deletion/restore rules.
6. Confirm page registry keys/routes against actual source files and existing page records.

No CMS UI, backend, migration or database change is implemented by this specification. Production remains untouched.
