# API Reference

This document is an inventory of routes identified in `src/worker.js`. It is not yet a complete request/response contract. Payload fields, validation rules and response examples should be documented when each endpoint is next modified or tested.

## Public endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Runtime/database health response |
| GET | `/api/courses` | Active course catalogue |
| GET | `/api/page-styles` | Public/published page style data |
| GET | `/api/site-content` | Published editable site content |
| GET | `/api/pages/:slug` | Published custom page data |
| POST | `/api/registrations` | Submit a course registration |
| POST | `/api/inquiries` | Submit an inquiry |
| POST | `/api/chat/session` | Start or resume a chat session |
| POST | `/api/chat/messages` | Submit a chat message |
| POST | `/api/analytics/event` | Submit an analytics event |

## Authentication endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/admin/login` | Authenticate administrator |
| POST | `/api/admin/logout` | End administrator session |
| GET | `/api/admin/me` | Return current account role and effective permissions |
| POST | `/api/admin/password` | Change the authenticated account password after verifying the current password |

Administrator routes require a valid signed session unless explicitly handled otherwise in the Worker.

## Administrator endpoints

### Account and role administration (Admin role only)

| Method | Path | Purpose |
| --- | --- | --- |
| GET, POST | `/api/admin/users` | List dashboard accounts and create an account |
| PATCH, DELETE | `/api/admin/users/:id` | Update role, permissions, status or password; disable an account |

User accounts can be assigned granular module permissions. A manage permission also grants read access for that module. Admin accounts receive all permissions. Public website visitors remain separate from dashboard accounts.


| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/admin/summary` | Dashboard summary |
| GET, POST | `/api/admin/courses` | List and create courses |
| PATCH | `/api/admin/courses/:id/status` | Change course status |
| PATCH, DELETE | `/api/admin/courses/:id` | Edit or delete a course |
| GET | `/api/admin/registrations` | List registrations |
| PATCH | `/api/admin/registrations/:id` | Update registration |
| PATCH | `/api/admin/registrations/:id/quote` | Update quotation |
| PATCH | `/api/admin/registrations/:id/enrollment` | Update enrollment |
| GET | `/api/admin/inquiries` | List inquiries |
| PATCH | `/api/admin/inquiries/:id` | Update inquiry |
| GET, POST | `/api/admin/media` | List media and create media records |
| POST | `/api/admin/media/signature` | Generate signed Cloudinary upload parameters for Media Library images or course syllabus PDFs/images |
| GET, POST | `/api/admin/pages` | List and create custom pages |
| PUT, DELETE | `/api/admin/pages/:slug` | Update or delete custom page |
| GET | `/api/admin/pages/:slug/preview` | Preview a draft page |
| GET, POST | `/api/admin/site-content` | Read and update editable site content |
| DELETE | `/api/admin/site-content/:key` | Delete a content item |
| GET, POST | `/api/admin/page-styles` | Read and update page style drafts/publication |
| GET | `/api/admin/chat/conversations` | List chat conversations |
| GET, POST | `/api/admin/chat/conversations/:id` | Read conversation or perform supported admin action |
| GET | `/api/admin/analytics` | Analytics summary/reporting data |

### Cloudinary syllabus upload

- The authenticated, same-origin `POST /api/admin/media/signature` endpoint accepts `{ "purpose": "syllabus", "resourceType": "raw" }` for PDF files or `{ "purpose": "syllabus", "resourceType": "image" }` for JPG/PNG/WebP images.
- The response contains the Cloudinary cloud name, API key, timestamp, folder, signature, resource type and allowed formats. The browser uploads directly to Cloudinary using that signed response.
- Syllabus files use the existing `sohel-consulting` folder and the Preview API key's folder permission. Both standard PDFs and JPG/PNG/WebP images use Cloudinary `image/upload`; Cloudinary supports PDF files as image assets, allowing browser delivery and PDF transformations. Password-protected PDFs are outside this feature's scope.
- The course reference/share URL is stored in `syllabus_url`; the Cloudinary upload URL is stored separately in `syllabus_file_url`. Migration `0011_course_syllabus_file_url.sql` adds the new field. Both fields are returned by the public course API and displayed separately on English and Bangla course detail pages.
- Syllabus upload limits: 10 MB for PDFs and 3 MB for images in the browser; server-side signing is rate-limited to 10/hour and 40/day per the existing rate-limit mechanism.

## General behavior

- API responses are JSON.
- Worker JSON responses set `Cache-Control: no-store`.
- Administrator mutations are protected by session and same-origin checks.
- Public write endpoints apply rate limiting where implemented.
- Exact request fields and response shapes must be confirmed from the current Worker implementation before integrating a new client.

## API change checklist

When changing an endpoint, document:
- HTTP method and path
- Authentication and authorization requirements
- Request headers and body schema
- Required and optional fields
- Validation and size limits
- Success response and status code
- Error responses and status codes
- Rate-limit behavior
- D1 tables read or changed
- Whether the English and Bangla clients use the endpoint


## Planned CMS API contract (not implemented)

The following API design is a planning specification from Stages 6–7. These routes are **not implemented** and must not be treated as available endpoints. Final route names and payloads must be reconciled with the current Worker before coding.

| Method | Proposed path | Purpose |
| --- | --- | --- |
| GET | `/api/admin/cms/pages` | List CMS page registry and per-language status |
| GET | `/api/admin/cms/pages/:pageKey` | Retrieve page metadata |
| GET | `/api/admin/cms/pages/:pageKey/:language` | Retrieve page structure and admin content values |
| POST | `/api/admin/cms/pages` | Create/register a page |
| PUT | `/api/admin/cms/pages/:pageKey/:language` | Update language-specific page metadata |
| POST / PUT | `/api/admin/cms/sections`, `/api/admin/cms/sections/:id` | Create/update sections |
| POST / PUT | `/api/admin/cms/elements`, `/api/admin/cms/elements/:id` | Create/update content elements |
| PUT | `/api/admin/cms/elements/:id/draft` | Save draft value only |
| POST | `/api/admin/cms/elements/:id/default` | Restore immutable default into draft |
| POST | `/api/admin/cms/elements/:id/delete` | Soft-delete an eligible element |
| POST | `/api/admin/cms/elements/:id/restore` | Restore a soft-deleted element |
| POST | `/api/admin/cms/pages/:pageKey/:language/publish` | Publish one whole page in one language |
| GET | `/api/admin/cms/pages/:pageKey/:language/versions` | List page versions |
| GET | `/api/admin/cms/versions/:id` | Retrieve a version snapshot |
| POST | `/api/admin/cms/versions/:id/restore` | Restore historical snapshot into Draft |
| GET | `/api/admin/cms/audit-log` | Retrieve CMS audit history |
| GET | `/api/admin/cms/pages/:pageKey/:language/preview` | Protected draft preview (proposed) |
| GET | `/api/cms/pages/:pageKey/:language` | Published public content only (proposed) |

### Confirmed CMS behaviour decisions

- Publishing scope: entire selected page in one language.
- Content created through approved CMS/page-builder workflows is automatically registered.
- Historical versions restore into Draft; publishing is a separate action and creates a new version.
- Element deletion is soft-delete. Existing public content remains visible until the next successful publication of that page/language; the deleted element is excluded from that publication.
- Legacy APIs remain available during gradual page-by-page integration.

### Contract and security requirements

- Draft/default/history fields are admin-only; public responses contain published content only.
- Every admin endpoint must authenticate the session and enforce server-side permissions.
- Proposed permission names are `cms.view`, `cms.edit`, `cms.structure.manage`, `cms.publish`, `cms.delete`, `cms.restore` and `cms.history.view`. These are not confirmed as seeded permissions.
- Publication is transactional and isolated to one page/language. A failed publication leaves the prior published version active.
- Use optimistic concurrency/version checks to prevent stale publication.
- Validate and sanitize all content server-side; do not allow executable HTML or scripts.
- The existing page-builder, `site_content` and `page_styles` APIs must remain compatible during migration.

See [CMS Admin UI and workflow specification](CMS_ADMIN_UI_WORKFLOW.md) for the planned Admin Panel experience. The final API contract remains subject to Stage 6 schema approval, Preview D1 inspection and code-level route review.
