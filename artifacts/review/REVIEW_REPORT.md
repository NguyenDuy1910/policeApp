# VNPolice Care — Review and remediation report

## Executive result

The repository now operates as one local end-to-end incident-reporting system:

1. A citizen submits a geolocated incident and optional image from the native Expo application.
2. NestJS validates and persists the report in SQLite and stores evidence in a private local directory.
3. The report appears in the authenticated Admin Web queue.
4. A duty officer inspects the same evidence, assigns an active police unit, and advances the report through the enforced workflow.
5. The citizen application polls the protected report APIs and renders the updated assignment, state, history actor, and timestamp.

The implemented product is anonymous public-safety reporting for Cà Mau. It is not an insurance claim product: there is no customer identity, vehicle, policy, claim amount, or adjudication model.

## Architecture reviewed

| Layer | Implementation | Review conclusion |
|---|---|---|
| Citizen client | Expo 54, React Native 0.81, Expo Router, TanStack Query | Native mobile flow is coherent and operational on iOS Simulator |
| Operations client | React 19, Vite 8, Leaflet | Authenticated operational queue and CRUD surfaces use the same API data |
| API | NestJS 12, Express, Zod, session middleware | Public, capability-protected, and admin-session routes are separated server-side |
| Persistence | better-sqlite3, WAL, migrations | Report/status operations use transactions; reset is deterministic |
| Evidence | private filesystem plus DB metadata | Both clients stream the same protected file through principal-specific routes |
| Contracts | `@vnpolice/shared` | Incident/status enums, labels, schemas, and response types are shared |

Detailed architecture and field traces are in `ARCHITECTURE.md`, `SYSTEM_FLOW_MAP.md`, and `DATA_MAPPING.md`.

## Personas and authorization

| Persona | Credential | Backend-enforced access |
|---|---|---|
| Public citizen | none | Read active public reference data; create a review or incident subject to validation/rate limits |
| Report-owning device | report ID plus random capability token | Read only that report, timeline, and evidence; invalid credentials intentionally return 404 |
| Duty officer | HttpOnly admin session cookie | Queue/detail/evidence, assignment, sequential status changes, reference-data CRUD, review moderation |

There is one duty-officer role. Reviewer/operator/approver separation is not implemented. Admin buttons are not the authorization boundary: protected API controllers require a current active admin session.

## Defects found and fixed

### P0 — demo blockers

| Defect | Root cause | Fix | Verification |
|---|---|---|---|
| Native submission failed with `Promise.withResolvers is not a function` | The upload adapter used an ES2024 API unavailable in the active React Native runtime | Replaced it with a standard `new Promise` adapter while retaining progress, timeout, abort, and error handling | Mobile unit tests plus successful native multipart submission |
| iOS build succeeded but install targeted a nonexistent `VNPoliceCareDemo.app` | The generated scheme and Xcode `WRAPPER_NAME` no longer matched | `Makefile` now resolves the actual built wrapper from Xcode build settings before `simctl install` | App built, installed, launched, and completed the native flow on `iPhone 16 Pro` |
| Admin evidence could fail to render even when the upload existed | Framework response helpers behaved inconsistently for the configured absolute upload path in the live TypeScript runtime | Protected attachment controllers now stream the validated file directly and set explicit content headers | HTTP 200 JPEG response with real bytes; Admin image decoded; E2E checks evidence dimensions and bytes |
| Successful submit returned to the incident-type screen instead of the receipt | Clearing the draft triggered the incomplete-draft redirects of the detail screen and of the still-mounted location screen underneath it, which replaced the receipt | The detail guard is suppressed once submission succeeds, the location guard runs only while that screen is focused, and a successful submit resets the stack to map → receipt so the cleared wizard steps are no longer reachable | Release build on `iPhone 16 Pro`: submission landed directly on the receipt (`VN-20261017-S57RIB`) and back from tracking returned to the map |

### P1 — incorrect behavior/data risks

| Defect | Risk | Fix |
|---|---|---|
| Successful server submission followed by SecureStore failure looked like a failed submission | A retry could create a duplicate report | Submission success and local credential persistence are now separate states; the result screen retries only credential storage |
| Successful report left the old draft in context | A later report could inherit stale type/location/image data | The draft resets only after confirmed server creation |
| Tracking could replace useful report data with an error during a transient poll failure | Demo-visible blank/error state despite previously loaded server data | Previously loaded report/history stay visible with a synchronization warning and retry path |
| Missing evidence file surfaced as a generic server failure | Broken local file produced misleading behavior | Both citizen and admin attachment routes return a controlled 404 |
| Admin session could expire while the shell remained interactive | Actions repeatedly failed without a clear recovery path | Operational 401 responses emit one session-expired event and return the UI to login with an explanation |
| Admin detail failure could leave a stale drawer | Operator could act on the wrong visible record | Failed detail load closes stale content and exposes the error |
| An inactive assigned unit could disappear from the assignment selector | Existing persisted assignment appeared silently changed | Current assignment remains visible while new assignments are restricted to active units |
| Modal mutations hid backend validation errors | Operator saw no actionable reason for failure | Police-unit and place forms now render API errors and clear stale errors when reopened |
| Admin evidence requests did not explicitly opt into credentialed image loading | Cookie behavior could differ by origin configuration | Evidence image uses credentialed loading and an authenticated open-original action |
| Optional police-unit/place fields could not be cleared | Partial-update merge treated empty input as “keep current value” | Nullable update contracts distinguish omitted fields from explicit clear; DB writes `NULL`; integration regression added |

### P2 — demo polish

- Replaced the crowded native back affordance with one labelled, icon-only, accessible control.
- Improved incident-image preview, upload progress, retry copy, privacy guidance, and successful evidence confirmation.
- Added graceful evidence-image fallback/retry behavior on citizen and admin surfaces.
- Added an operational incident search alongside status/type filters.
- Added visible synchronization, form, and mutation errors instead of silent console-only failures.
- Added the supplied police emblem as the local duty-officer avatar in the Admin sidebar, with a square optimized asset, circular containment, text overflow protection, and no remote image dependency.
- Preserved the existing green public-service visual direction rather than introducing a second design system.
- Retained realistic Cà Mau operational wording, coordinates, police-unit names, hotlines, places, timestamps, and status labels.

## Citizen flow review

### Supported journey

`Map/Home -> Incident type -> Incident location -> Description/evidence/review -> Submit -> Receipt -> History/tracking`

Observed behavior:

- Location may originate from device GPS or a manually adjusted pin.
- The incident and reporter-device coordinate pairs remain separate.
- Description is optional and capped by the shared schema.
- One optional JPEG, PNG, or WebP image up to 5 MiB is supported.
- The submit CTA is guarded against repeated taps while uploading.
- XHR progress is displayed.
- A capability credential is stored only on the submitting device.
- History and detail refresh every five seconds while focused.
- A server reset causes stale report credentials to be pruned after a capability read returns 404.

### Mobile UX conclusion

The critical path is video-ready at a 390 × 844-class viewport. Headers, cards, primary action placement, evidence preview, status badges, and timeline form a consistent journey. Native camera capture, telephone handoff, and external-map handoff still require physical-device validation.

## Admin flow review

### Supported operations

`Login -> Dashboard/incident queue -> Filter/search -> Open report -> Inspect coordinates/evidence/history -> Assign unit -> Advance status`

Additional modules:

- Police units: create/edit, verification metadata, activation, location, hotline.
- Places: create/edit, category, verification, activation, source metadata.
- Reviews: filter and moderate pending public reviews.

### Admin UX conclusion

The incident queue is usable as an operational surface rather than a gallery: filters and search reduce scanning, status badges are consistent, the drawer groups report/dispatch/evidence/timeline data, status transitions expose only the next legal operation, and server errors remain visible. Reference-data forms retain backend invariants instead of relying only on browser validation.

## Cross-system data conclusion

The manually exercised live report `VN-20261017-SHM0WV` proved the round trip before the final deterministic reset:

- Native report creation persisted coordinates, Vietnamese description, status, suggestion, and evidence.
- Admin search located the exact generated ID.
- Admin rendered the same description, coordinates, evidence, and suggested unit.
- The officer assigned `Công an phường An Xuyên` and moved the report to `received`.
- The native history/detail view updated to `Đã tiếp nhận`, rendered the assigned unit, and showed the actor `Trực ban Trung tâm Chỉ huy`.

The automated cross-system scenario additionally exercises all legal status transitions through `resolved`, reload persistence, report-token reads, timeline rows, evidence decoding, and byte identity.

## Vietnamese demo data

The deterministic seed contains:

- 65 Cà Mau police units with administrative level, address, hotline, verification source, activation, and coordinates;
- 14 synthetic but believable local places;
- Vietnamese reviews in pending, approved, and rejected states;
- 18 incident reports distributed across the complete workflow;
- three local accident-evidence assets copied into private uploads during reset;
- one local duty-officer account configured through environment variables.

Visible generic placeholders such as `John Doe`, `123 Main Street`, and `Lorem ipsum` are not used in the product data.

## Evidence review

Validated paths:

- library selection and preview;
- camera action/permission code path review;
- client MIME and known-size rejection;
- authoritative server MIME, size, and magic-byte validation;
- preview replacement/removal before submission;
- submit after attachment selection;
- private file persistence and metadata mapping;
- citizen receipt/tracking rendering;
- admin preview/open-original rendering;
- reload persistence;
- missing-file 404;
- invalid type, spoofed content, and oversized-file rejection.

Current schema limitation: exactly one optional evidence file. Multiple images, image ordering, captions, and post-submit evidence additions are not represented.

## Known limitations

1. One admin role; no role-based separation of duties.
2. Admin sessions are stored in process memory and are invalidated by an API restart.
3. In-progress mobile drafts are memory-only; only submitted report credentials persist.
4. Report access cannot be recovered on another device without the capability token.
5. One image per report; no video or document evidence.
6. Filesystem evidence and SQLite are appropriate for this local demo, not horizontally scaled deployment.
7. Assignment changes have no separate audit-history row; status changes do.
8. OpenStreetMap tiles require network access; report coordinates and operations do not depend on tile availability.
9. Native UI automation remains Simulator-driven/manual; deterministic Playwright coverage starts at the HTTP boundary and covers Admin Web plus the complete persisted lifecycle.
10. The product does not integrate emergency dispatch, identity, vehicle, insurance, payment, or external government systems.
