# VNPolice Care — Verification report

## Verification strategy

The review used four complementary layers:

1. **Type/build checks** for all workspaces.
2. **Vitest/Supertest integration** against isolated SQLite and upload directories.
3. **Playwright Admin Web and cross-system E2E** against isolated API/Admin processes and seeded storage.
4. **Native iOS Simulator execution** for the customer interaction path that Playwright cannot drive.

No test substitutes a second mock API for the application backend. Browser E2E writes through the real NestJS service to real temporary SQLite/filesystem persistence.

## Latest automated result

| Command | Scope | Result |
|---|---|---|
| `npm run typecheck` | Admin, mobile, server, shared TypeScript | PASS |
| `npm test` | Shared build, server integration, mobile upload adapter | PASS — server 2/2, mobile 2/2 |
| `npm run test:e2e` | Isolated API + SQLite/uploads + Admin Web + lifecycle automation | PASS — 2/2 |
| `npm run demo:reset` | Live demo SQLite, uploads, deterministic Vietnamese seed | PASS |
| `GET /api/health` after reset | Live NestJS process and reset compatibility | PASS — HTTP 200, `status: ok` |
| `npm run typecheck -w @vnpolice/admin && npm run build -w @vnpolice/admin` | Avatar-enabled Admin production bundle | PASS — Vite built 1,670 modules and copied the local avatar asset |

Generated Playwright report: `artifacts/tests/report/index.html`.

## Server integration coverage

`apps/server/src/app.integration.test.ts` uses a temporary database/upload directory and exercises:

- health response and complete seed counts;
- unauthenticated rejection on protected Admin APIs;
- admin login and session cookie;
- seeded report detail, complete timeline, actor display, and evidence stream;
- citizen multipart report creation with device/incident coordinates and PNG evidence;
- generated report ID and one-time capability token;
- nearest-unit suggestion;
- missing/wrong-token non-disclosure via 404;
- authorized citizen report, history, and evidence reads;
- admin filtering, assignment, and all sequential state transitions;
- citizen visibility of the admin-created history;
- admin evidence retrieval;
- pending public review creation, hidden-before-approval behavior, moderation, and public visibility;
- police-unit and place creation/update;
- explicit clearing of optional police-unit/place fields to database `NULL`;
- public review rate limiting;
- report, assignment, timeline, and evidence persistence after API restart;
- controlled 404 when a persisted evidence file is missing;
- malformed coordinates;
- MIME-spoofed image bytes;
- upload larger than 5 MiB;
- invalid reporter-coordinate pairs and invalid verified-reference-data combinations.

Result: **2 tests passed**.

## Mobile unit coverage

`apps/mobile/services/report-upload.test.ts` exercises the native XHR transport with a controlled request implementation:

- successful multipart upload when `Promise.withResolvers` is absent;
- progress callback percentage;
- POST URL/body and 30-second timeout configuration;
- stable Vietnamese offline error;
- stable Vietnamese timeout error.

Result: **2 tests passed**.

## Admin Playwright coverage

`artifacts/tests/admin/admin.spec.ts` verifies observable browser behavior using roles and labels:

- invalid credentials expose a visible error;
- valid login reaches the operations shell;
- synchronization state is visible;
- status/type filters and report-ID search produce one exact record;
- report detail renders description, coordinates, suggested unit, and decoded evidence;
- detail close behavior;
- police-unit form opens and preserves required-field semantics;
- navigation across police-unit, place, and review modules;
- clearing the session cookie and making an operational request returns the user to login with an expiry explanation.

## Cross-system Playwright coverage

`artifacts/tests/cross-system/report-lifecycle.spec.ts` is the deterministic flagship automation:

1. Sends a citizen multipart report to the actual API with Vietnamese description, two coordinate pairs, GPS accuracy, and the repository accident JPEG.
2. Confirms HTTP 201, `submitted`, evidence metadata, and the nearest real unit `Công an phường An Xuyên`.
3. Logs into Admin Web.
4. Searches by the generated report ID and opens that exact row.
5. Verifies every submitted text/number field and waits for the evidence image to decode.
6. Assigns police unit ID 1 and waits for the successful PATCH response.
7. Advances `submitted -> received -> processing -> resolved`, waiting on each successful PATCH and visible state.
8. Verifies four timeline rows and the resolved terminal state.
9. Reads the report and timeline through the citizen capability token and checks the final status, assignment, description, and exact state sequence.
10. Downloads the citizen evidence and compares its bytes with the source asset.
11. Reloads Admin Web and confirms the resolved state persisted.

The Playwright configuration uses one worker and a clean `artifacts/.tmp/e2e` database/upload directory. It does not use fixed sleep calls. Failure traces, screenshots, and video are retained.

## Native iOS Simulator verification

Environment:

- Simulator: `iPhone 16 Pro`
- Bundle: `vn.gov.demo.vnpolicecare`
- API: `http://127.0.0.1:3000/api`
- Simulated location: `9.1769, 105.1524`

Observed customer journey:

1. App launched and rendered the public map/home surface.
2. Selected `Tai nạn giao thông`.
3. Confirmed the Cà Mau incident pin and device coordinates.
4. Entered a realistic Vietnamese incident description.
5. Selected a local image, reviewed its preview/metadata, and submitted.
6. Upload completed without the previous Promise runtime failure.
7. Submission navigated directly to the receipt, which rendered the generated report ID and stored capability state; back from tracking returned to the map.
8. Admin located the exact new report, opened its evidence, assigned `Công an phường An Xuyên`, and advanced it through `Đã tiếp nhận`, `Đang xử lý`, and `Đã giải quyết`.
9. Native history/detail polling rendered `Đã giải quyết`, the assigned unit, and `Trực ban Trung tâm Chỉ huy` on every Admin timeline entry.

Observed final recorded report: `VN-20261017-S57RIB`; Admin assigned `Công an phường An Xuyên`, persisted `resolved`, and the same device rendered all four timeline entries.

## Evidence test matrix

| Case | Layer | Result |
|---|---|---|
| Valid JPEG | Playwright cross-system + native | PASS |
| Valid PNG | Server integration | PASS |
| WebP allow-list | Contract/static path | Supported; no separate browser fixture |
| Invalid MIME/content disguise | Server integration | PASS — HTTP 400 |
| Over 5 MiB | Server integration | PASS — HTTP 413 |
| Replace before submit | Native UI interaction/code path | PASS |
| Remove before submit | Native UI interaction/code path | PASS |
| Multiple files in one request | Multer one-file contract | Rejected by configured file count; product supports one image |
| Submit with evidence | Native + integration + E2E | PASS |
| Citizen preview/read | Native + integration | PASS |
| Admin preview/read | Browser + integration + E2E | PASS |
| Browser/API reload | E2E + integration restart | PASS |
| Missing stored file | Server integration | PASS — controlled 404 |
| Wrong/missing citizen token | Server integration | PASS — indistinguishable 404 |
| Exact bytes | Cross-system E2E | PASS |

## Field consistency checked

| Field group | Citizen request | DB/API | Admin rendering | Citizen reverse rendering |
|---|---:|---:|---:|---:|
| Incident type | PASS | PASS | PASS | PASS |
| Description | PASS | PASS | PASS | PASS |
| Incident coordinates | PASS | PASS | PASS | PASS |
| Reporter coordinates/accuracy | PASS | PASS | PASS | PASS |
| Evidence name/type/size/bytes | PASS | PASS | PASS | PASS |
| Suggested unit | server-derived | PASS | PASS | PASS |
| Assigned unit | n/a at submit | PASS | PASS | PASS |
| Generated report ID | response | PASS | PASS | PASS |
| Status/history/actor/time | initial submit | PASS | PASS | PASS |

## UX and failure checks

| Check | Result |
|---|---|
| Duplicate submit guard during upload | PASS |
| Server-created/local-save-failed state does not resubmit | PASS by implementation path and type/unit checks |
| Visible upload progress and retry | PASS on native surface |
| Stable previously loaded tracking data on poll failure | PASS by implementation path; no network fault injection in final recording |
| Admin invalid-login message | PASS in Playwright |
| Admin expired-session recovery | PASS in Playwright |
| Admin stale detail closes on failed record fetch | PASS by implementation review; endpoint behavior covered |
| Admin form backend errors visible | PASS by implementation review and browser surface inspection |
| Legal one-step status state machine | PASS in integration/E2E |
| Skipped/backward status rejection | PASS in server integration |
| Persisted data after page/API reload | PASS |
| Supplied Admin avatar | PASS — browser rendered 512 × 512 local asset; production bundle contains `dist/images/cong-an-hieu-avatar.jpg` |
| Final video media contract | PASS — MP4 H.264/yuv420p/fast-start and WebM VP9, both 1920 × 1080, 30 fps, 53.13 s, nine chapters |

## Automation boundary

Playwright cannot directly drive the native Expo iOS surface. The permanent cross-system test begins at the citizen HTTP contract, then verifies Admin Web and the complete reverse data path. The customer UI was separately exercised on Simulator, captured in screenshots, and used for the product-demo recording. Camera hardware, phone dialing, and external navigation are outside Simulator proof.
