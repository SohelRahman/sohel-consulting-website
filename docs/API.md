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

Administrator routes require a valid signed session unless explicitly handled otherwise in the Worker.

## Administrator endpoints

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
| POST | `/api/admin/media/signature` | Generate signed media-upload parameters |
| GET, POST | `/api/admin/pages` | List and create custom pages |
| PUT, DELETE | `/api/admin/pages/:slug` | Update or delete custom page |
| GET | `/api/admin/pages/:slug/preview` | Preview a draft page |
| GET, POST | `/api/admin/site-content` | Read and update editable site content |
| DELETE | `/api/admin/site-content/:key` | Delete a content item |
| GET, POST | `/api/admin/page-styles` | Read and update page style drafts/publication |
| GET | `/api/admin/chat/conversations` | List chat conversations |
| GET, POST | `/api/admin/chat/conversations/:id` | Read conversation or perform supported admin action |
| GET | `/api/admin/analytics` | Analytics summary/reporting data |

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
