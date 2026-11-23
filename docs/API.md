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

## Static-page CMS

The implemented static CMS uses the following routes. The Worker remains authoritative for authentication, permission checks, validation and publication behavior.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/cms-content?page=...&lang=...` | Public published values for one page/language |
| GET | `/api/admin/cms?page=...&lang=...` | Admin draft/published content list; requires `content.view` |
| POST | `/api/admin/cms/initialize` | Initialize up to 400 CMS draft items without overwriting existing keys; requires `content.manage` |\n| POST | `/api/admin/cms/save` | Save one draft value and append a draft version; requires `content.manage` |
| POST | `/api/admin/cms/publish` | Publish the selected page/language; requires `content.manage` |
| POST | `/api/admin/cms/delete` | Soft-delete a content key; requires `content.manage` |
| POST | `/api/admin/cms/restore` | Restore an archived key to draft; requires `content.manage` |
| GET | `/api/admin/cms/history` | Read version history; requires `content.view` |
| GET | `/api/admin/cms/preview?page=...&lang=...` | Authenticated draft preview; requires `content.view` |
| POST | `/api/admin/cms/restore-version` | Restore a historical value to draft; requires `content.manage` |

The Dashboard editor and on-page editor share `POST /api/admin/cms/save`. Draft content, its version snapshot and its audit record are written in one D1 batch. Bulk initialization validates the full request before writing, then batches insert-if-absent content rows, conditional draft snapshots and one audit record; the response reports created and skipped item counts. Publishing updates the selected page/language, writes published snapshots from the current draft rows and records the audit event in one D1 batch. Archive, restore and restore-version operations also batch their state/history/audit writes. The on-page editor is opened from a page URL containing `?cmsKeys=1`; it does not introduce a separate API or data store. The preview binding uses `?cmsPreview=1` and the protected preview route.

CMS mutation endpoints enforce same-origin checks. URL and image values accept HTTP/HTTPS URLs only. Public content responses expose published values only. Publishing is scoped to one page and one language. See [CMS implementation notes](WEBSITE_CMS_IMPLEMENTATION.md).

### CMS data model

- `cms_content`: draft and published values keyed by page, language and content key.
- `cms_static_content_versions`: append-only draft/published history for the static CMS.
- The legacy `cms_content_versions` table belongs to the pre-existing legacy CMS schema and is not used by this implementation.


### CMS revision and concurrency model

- `GET /api/admin/cms?page=...&lang=...` returns an integer `revision` for every content row.
- `POST /api/admin/cms/save` accepts a positive `revision` when updating an existing row. Omit, send null or an empty value only when creating a new key. Successful saves return the next revision.
- Archive (`/api/admin/cms/delete`), restore (`/api/admin/cms/restore`) and historical restore (`/api/admin/cms/restore-version`) require the current positive revision and increment it on success.
- Each update uses compare-and-swap semantics: the SQL update includes the expected revision in its WHERE clause and increments the stored revision in the same statement.
- A stale revision or missing row returns HTTP `409 Conflict`. The Admin UI displays the Worker error; reload the content to obtain the latest revision before retrying. Invalid or missing revisions on revision-required actions return HTTP `400`.
- Content changes, conditional draft-history snapshots and audit records are grouped in a D1 batch. When the compare-and-swap update changes no row, conditional history/audit statements do not add records.
- This protects individual `cms_content` rows. It does not add a revision token to page-level publication, bulk initialization or custom Page Builder structure. Bulk initialization uses insert-if-absent semantics instead.
- Migration `0018_cms_content_revision.sql` must be present in the target database before deploying the Worker code that queries and updates `revision`. Its presence in Git is not proof of remote application.
