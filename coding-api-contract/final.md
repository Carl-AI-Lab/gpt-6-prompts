This is a proposed contract for a fictional API. Requirements supplied in the brief are marked **Fixed**; additional choices needing approval are explicitly tagged.

| Boundary | Contract | Status |
|---|---|---|
| Request | `GET /events?limit=20&cursor=<opaque-value>`, accepting JSON responses; no request body. | Endpoint and parameters Fixed; JSON media type [OWNER APPROVAL] |
| Limit | Omitted means 20; maximum 50. Proposed valid values: a single decimal integer from 1 through 50. Reject zero, negative, fractional, empty, repeated, nonnumeric, or over-50 values; never silently clamp. | Default/maximum/invalid-limit error Fixed; minimum and parsing [PRODUCT APPROVAL] |
| Cursor | Optional opaque string. Clients must preserve its value and URL-encode it when sending it; no decoding or reconstruction. | Opaque/optional Fixed; handling rules [OWNER APPROVAL] |
| Success | Proposed HTTP 200 with `{ "events": Event[], "nextCursor": string \| null }`. Both envelope fields always present. Empty `events` is valid. | Fields/empty results Fixed; HTTP status [OWNER APPROVAL] |
| Event | Required `id`, `title`, `startAt`, `capacity`. Proposed `id` and `title` are strings; `startAt` is an ISO 8601 UTC string; `capacity` is an integer ≥ 0. | Field set/time/capacity Fixed; string types [PRODUCT APPROVAL] |
| Timestamp wire format | Proposed `YYYY-MM-DDTHH:mm:ss[.SSS]Z`, with fractional milliseconds optional. | UTC Fixed; restricted serialization [OWNER APPROVAL] |
| Error envelope | Proposed `{ "error": { "code": string, "message": string, "field": string \| null } }`, with all three members present. Messages are descriptive; clients branch on `code`. | [OWNER APPROVAL] |
| Authentication | Undecided. Browser/mobile clients must not assume public access or embed a confidential credential. Public access, session cookies, or bearer tokens require a selected scheme and documented transport. | [PRODUCT + SECURITY APPROVAL: BLOCKING] |
| Idempotency | Proposed read-only operation, with no application-state mutation or idempotency key. Repeated reads may differ as event data changes. | [OWNER APPROVAL] |
| Ordering | Proposed ascending `startAt`, then unique `id` as a deterministic tie-breaker. Identifier comparison must be fixed before implementation. | [PRODUCT APPROVAL] |
| Pagination consistency | Proposed snapshot pagination: cursors bind to an ordering snapshot; following a cursor continues after its previous page. | [PRODUCT + ENGINEERING APPROVAL] |
| Completion | `nextCursor: null` means no continuation. If non-null, request that cursor even after an empty page. Proposed limit may change between requests without invalidating the cursor. | Nullable cursor Fixed; continuation/limit policy [OWNER APPROVAL] |
| Cursor validity | Expiry period, restart UX, integrity protection, and binding to authorization/filter context remain undecided. Clients must treat cursors as sensitive until classified. | [PRODUCT + SECURITY APPROVAL: BLOCKING] |
| Compatibility | Additive optional response fields must not change existing fields' meaning/types. Clients ignore unknown response members and tolerate absent optional fields. Removing/renaming required fields requires a separately approved versioning strategy. | Backward compatibility Fixed; versioning strategy [OWNER APPROVAL] |
| Additional limits | Rate limits, cursor length, title length, identifier constraints, and maximum capacity beyond nonnegativity are not specified. Proposed duplicate/unknown query handling also needs definition. | [PRODUCT + SECURITY APPROVAL] |
| Browser access | Allowed origins, credentialed cross-origin requests, cookie protections if applicable, and caching of authenticated responses depend on the authentication decision. | [SECURITY APPROVAL: BLOCKING] |

Proposed error semantics—all status/code assignments below need **[OWNER APPROVAL]**, with authentication and cursor errors also needing **[SECURITY APPROVAL]**:

| HTTP | Code | Meaning / client action |
|---|---|---|
| 400 | `INVALID_LIMIT` | Invalid limit; correct it before retrying. `field` is `limit`. |
| 400 | `INVALID_CURSOR` | Malformed or unusable cursor; do not retry unchanged. `field` is `cursor`. |
| 410 | `CURSOR_EXPIRED` | Cursor expired; offer a fresh listing. Expiry policy is unresolved. `field` is `cursor`. |
| 401 | `UNAUTHENTICATED` | Only if authentication is required; authenticate using the selected scheme. `field` is null. |
| 403 | `FORBIDDEN` | Selected identity lacks permission. `field` is null. |
| 429 | `RATE_LIMITED` | Only if rate limiting is adopted; retry timing/header policy requires approval. `field` is null. |
| 500 | `INTERNAL_ERROR` | Generic failure with no stack traces or private details; bounded retry is appropriate. `field` is null. |

Proposed examples, not an existing provider's behavior:

```http
GET /events?limit=1
Accept: application/json
```

```json
{
  "events": [
    {
      "id": "evt_001",
      "title": "Paper Lantern",
      "startAt": "2026-09-19T14:00:00Z",
      "capacity": 24
    }
  ],
  "nextCursor": "opaque-demo-token"
}
```

```http
GET /events?limit=1&cursor=opaque-demo-token
```

A valid empty final page:

```json
{ "events": [], "nextCursor": null }
```

Invalid limit example, proposed HTTP 400:

```http
GET /events?limit=51
```

```json
{
  "error": {
    "code": "INVALID_LIMIT",
    "message": "limit must be an integer from 1 through 50",
    "field": "limit"
  }
}
```

Authentication headers are intentionally absent from examples because the owner has not selected authentication.

Acceptance tests should cover omitted/default limit, 1 and 50, every invalid-limit class, capacity zero, UTC timestamp parsing, empty pages, nullable continuation, opaque cursor round-tripping, and an added unknown optional response field. Ordering, snapshot traversal, authentication, and expiry tests become binding only when their tagged decisions are approved. Both browser and mobile clients need the same approved semantics before production implementation.
