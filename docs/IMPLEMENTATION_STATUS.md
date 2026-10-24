# VNPolice Care implementation status

## Delivery status

| Phase | Status | Implemented evidence |
|---|---|---|
| 0 — Workspace | Complete | npm workspaces for Expo mobile, Vite admin, NestJS server, and dual ESM/CommonJS shared contracts |
| 1 — Database/API | Complete | SQLite migration, idempotent seed, authenticated admin API, capability report API, protected uploads, routing, moderation, integration suite |
| 2 — Native UI | Complete | Expo Router screens, polished native tabs/cards/forms/sheets, police/place/review details, emergency guidance |
| 3 — Map/GPS | Complete | Cà Mau-first `react-native-maps`, custom category markers, accent-insensitive search, service-area checks, draggable incident pin, nearest-unit preview, dialer/maps handoff |
| 4 — Reporting | Complete | Three-step flow, separate reporter/incident coordinates, camera/library picker, file validation and metadata preview, multipart progress/retry, SecureStore access, result/history/tracking with protected image rendering |
| 5 — Admin | Complete | Session login, counters, 5-second incident polling, Leaflet incident map, inline protected evidence image, assignment/status history, unit/place map forms, review moderation |
| 6 — Data/reviews | Complete | 65 reference-derived police units, Cà Mau places, moderated reviews, 6 days of incident history, and 3 local CC0 seed evidence images; `db:reset` reloads it in place |
| 7 — QA/build | Complete with environment notes | Automated backend workflow, full TypeScript/build, iOS Debug simulator build/runtime, mobile map visual smoke, and admin browser smoke; see results below |

## Observed verification

- `npm run build`: passed for shared contracts, NestJS, Vite admin, and native TypeScript.
- `npm test`: 2 NestJS integration scenarios and 2 mobile upload-adapter scenarios passed.
- Integration scenario exercised:
  - public places and reference-derived police-unit reads;
  - admin session authorization;
  - unit verification and nearest-unit suggestion;
  - multipart incident with a valid PNG;
  - report-ID-only and invalid-token denial for detail and attachment reads;
  - citizen and admin attachment streaming with exact uploaded bytes;
  - seeded JPEG attachment metadata and protected admin retrieval;
  - admin list, detail, assignment, and all status transitions;
  - citizen status history with display actor names;
  - pending review visibility and approval;
  - police-unit and place create/update;
  - review/report rate limits;
  - SQLite close/reopen with resolved report, assignment, and citizen attachment preserved;
  - invalid coordinates, disguised image rejection, and 5 MB limit enforcement.
- Mobile regression coverage deletes `Promise.withResolvers` from the test runtime and verifies multipart upload success, progress, timeout, and offline errors through the Hermes-compatible `XMLHttpRequest` adapter.
- `npx expo install --check`: dependencies aligned with Expo SDK 54 and React Native 0.81 for the installed Xcode 16.2 toolchain.
- Android Metro export completed successfully.
- Browser smoke at 1440×1000:
  - login rendered and authenticated with no page exceptions;
  - incident counters/list rendered from NestJS;
  - detail drawer rendered marker, distinct incident/device coordinates, assignment, and history;
  - assignment and transition to `received` succeeded;
  - unit editor rendered its interactive coordinate map.
- Android `assembleRelease`: completed successfully with 357 Gradle tasks after Expo SDK 54 alignment.
- `apksigner verify`: valid APK Signature Scheme v2 signature, one signer.
- `aapt dump badging`: package `vn.gov.demo.vnpolicecare`, version `1.0.0` (1), launchable `MainActivity`.
- Generated APK: `apps/mobile/android/app/build/outputs/apk/release/app-release.apk`.
- APK SHA-256: `3e3a0c6ade052cb4c57920843b23c4ee98d93eb742ebd8837feab616572c8819`.
- Xcode 16.2 Release simulator build: succeeded with an embedded 1,279-module JavaScript bundle.
- `make ios-simulator IOS_CONFIGURATION=Debug`: regenerated camera/photo permissions, built, installed, set the GPS to central Cà Mau, and launched `vn.gov.demo.vnpolicecare` on iPhone 16 Pro Simulator.
- Simulator visual smoke: polished Apple Maps surface rendered 65 police units and 14 Cà Mau places with category markers, filters, search, data status, map/GPS controls, incident CTA, and native tabs.
- iOS Hermes end-to-end smoke: a 380,164-byte JPEG was submitted from the installed native app, persisted byte-for-byte, rendered on the receipt, appeared in device history, and reflected an admin `received` transition in the live tracking timeline.

## Data integrity decisions

- Police-unit coordinates are the approximate administrative centres of the wards and communes, not surveyed station addresses. Units are seeded as verified so routing works; change the coordinates and verification through the admin dashboard if precise positions are required.
- Only organization duty lines from the provided file are seeded; named officers and their personal numbers are not.
- Places use real Cà Mau streets with fictitious business names; reviews are written for those fictitious businesses.
- Seeded incident reports have no device credential; they are visible only to administrators.
- Three seeded traffic reports have local CC0 JPEG evidence copied into the private upload directory during reset. Sources and licenses are recorded in `README.md`.
- Verification can be changed only through authenticated admin APIs.
- Haversine chooses the nearest eligible unit but never asserts jurisdiction.
- Controllers inject their services with explicit `@Inject` tokens, because `tsx` (used by `npm run dev:server`) does not emit decorator metadata.

## Current limitations

- No real police, fire, ambulance, or dispatch integration; this is the explicit local-development boundary.
- Google Maps Android key is not committed. Native map tiles require a configured, restricted key.
- The generated APK used an empty maps key because no credential was available; rebuild it after configuring `GOOGLE_MAPS_ANDROID_API_KEY` to render Google map tiles.
- Police-unit positions are approximate (ward/commune centre), so suggestions are distance-based estimates.
- Admin sessions use the in-memory store suitable for one local process, not horizontal production deployment.
- iOS Debug was compiled, installed, launched, GPS-pinned to Cà Mau, and visually exercised on iPhone 16 Pro Simulator. Camera capture, dialer, and installed-map handoff still require physical-device verification; the protected multipart image path was exercised end to end from the Hermes runtime against the live API.
- No connected Android device or configured AVD was detected. Android GPS, dialer, image picker, installed-map handoff, and the key-dependent native map surface therefore remain unexercised on hardware; native compilation, Metro bundling, permissions, and APK signing were verified.

## Safety statement

The product UI no longer carries demo banners. The mobile app still shows the 113/114/115 emergency notice on the About screen and before a report is submitted. Private incident details and attachments are not exposed through public list or static endpoints. The system is not connected to any real dispatch service.
