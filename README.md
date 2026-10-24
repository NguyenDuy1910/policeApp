# VNPolice Care — Full-stack competition demo

Native React Native citizen app, responsive admin dashboard, native NestJS REST API, and persistent SQLite database for a Cà Mau emergency-reporting concept.

> **DEMO ONLY.** This project is not connected to Công an nhân dân or any real dispatch system. For a real emergency, call **113**, **114**, or **115**.

## Repository

```text
apps/
├── mobile/                 Expo + React Native + TypeScript + Expo Router
│   ├── app/                Native screens and routes
│   ├── components/
│   ├── features/reports/
│   ├── services/
│   └── theme/
├── admin/                  Vite + React + TypeScript + Leaflet
└── server/                 NestJS + better-sqlite3
    ├── migrations/
    ├── src/admin/
    ├── src/database/
    ├── src/public/
    ├── src/reports/
    └── uploads/
packages/shared/            Shared Zod schemas, enums, and API types
references/                 Original product documents, prototype, and unit data
docs/IMPLEMENTATION_STATUS.md
```

The existing HTML is retained only as a design and interaction reference. The mobile app uses native React Native views and `react-native-maps`; it contains no WebView and no Capacitor code.

## Prerequisites

- Node.js 22+
- npm 10+
- Android Studio / Android SDK and Java 17 for local Android builds
- Xcode 16.1+, CocoaPods, and an installed iOS Simulator runtime for local iOS builds
- A Google Maps Android API key with **Maps SDK for Android** enabled for Android maps
- Android device/emulator, iOS Simulator/device, or an Expo development build

## One-command setup and run

From the repository root:

```bash
make
```

The root `Makefile` installs dependencies, creates missing app-local `.env` files, migrates and seeds SQLite, then starts the NestJS API, admin dashboard, and Expo bundler together. Press `Ctrl+C` once to stop all three processes. Existing `.env` files are never overwritten.

Run `make help` for setup-only, build, test, Android APK, iOS Simulator, and Xcode targets. Set `GOOGLE_MAPS_ANDROID_API_KEY` in `apps/mobile/.env` before building or running the Android map.

## Manual installation

```bash
npm install
cp apps/server/.env.example apps/server/.env
cp apps/admin/.env.example apps/admin/.env
cp apps/mobile/.env.example apps/mobile/.env
npm run db:migrate
npm run db:seed
```

Change `SESSION_SECRET` and `ADMIN_PASSWORD` before sharing a running instance. The local admin login defaults to:

```text
username: admin
password: DemoAdmin!2026
```

The server reads `apps/server/.env` at startup. Vite and Expo read their app-local `.env` files.

## Start the three applications

Terminal 1 — NestJS API:

```bash
npm run dev:server
# http://0.0.0.0:3000/api
```

Terminal 2 — admin dashboard:

```bash
npm run dev:admin
# http://localhost:5173
```

Terminal 3 — native mobile app:

```bash
npm run dev:mobile
```

The default `start` command expects an Expo development client because native maps and secure storage must be tested as native modules. `npm run start:go -w @vnpolice/mobile` may be used for compatible Expo Go testing, but it is not the release workflow.

## Mobile API URL

Never use `localhost` from a physical phone.

| Target | `EXPO_PUBLIC_API_URL` |
|---|---|
| iOS Simulator | `http://127.0.0.1:3000/api` |
| Android emulator | `http://10.0.2.2:3000/api` |
| Physical phone on same Wi-Fi | `http://<COMPUTER_LAN_IP>:3000/api` |
| Deployed backend | `https://<HOST>/api` |

The NestJS process binds to `0.0.0.0`. Allow TCP port 3000 through the workstation firewall when using a physical phone. Production mobile traffic should use HTTPS.

## Android maps and permissions

Set this in `apps/mobile/.env` before prebuild/build:

```dotenv
GOOGLE_MAPS_ANDROID_API_KEY=your_restricted_android_key
```

`app.config.ts` injects the key into the generated Android manifest. Restrict the key by package name and signing certificate:

```text
package: vn.gov.demo.vnpolicecare
```

Location permission is requested only after the user taps a locate/GPS action. Browsing the map does not request it. Photo-library or camera permission is requested only after the user chooses the corresponding attachment action.

## Android development build

```bash
cd apps/mobile
npx expo prebuild --platform android --clean
npx expo run:android
```

For a local release APK:

```bash
cd apps/mobile
npx expo prebuild --platform android --clean
cd android
./gradlew assembleRelease
```

APK output:

```text
apps/mobile/android/app/build/outputs/apk/release/app-release.apk
```

The repository workspace currently contains a locally generated, v2-signed APK at that path:

```text
SHA-256 3e3a0c6ade052cb4c57920843b23c4ee98d93eb742ebd8837feab616572c8819
package vn.gov.demo.vnpolicecare
version 1.0.0 (1)
```

It was built without a Google Maps key because no credential was available. It proves the native Android project is installable, but must be rebuilt after setting `GOOGLE_MAPS_ANDROID_API_KEY` for Google map tiles to render.

For an EAS installable preview APK:

```bash
cd apps/mobile
npx eas-cli build --platform android --profile preview
```

`eas.json` sets `buildType: apk` for the preview profile. EAS requires an Expo account; no account or production signing secret is committed.

## iOS Simulator and Xcode

The mobile workspace targets both Android and iOS. Its iOS bundle identifier is `vn.gov.demo.vnpolicecare`, and iOS uses Apple Maps through `react-native-maps`; no Google Maps key is required.

Build, install, and launch a standalone Release app on the default `iPhone 16 Pro` simulator:

```bash
make ios-release
```

For a Debug simulator build:

```bash
make ios
```

Override the simulator, local API, or simulated Cà Mau GPS position when needed:

```bash
make ios IOS_DEVICE="iPhone SE (3rd generation)" IOS_API_URL=http://127.0.0.1:3000/api
make ios IOS_LATITUDE=9.1769 IOS_LONGITUDE=105.1524
```

To generate the native project and open the workspace in Xcode:

```bash
make ios-xcode
```

The generated workspace is `apps/mobile/ios/<AppName>.xcworkspace`, named after `app.json` `name` on the first prebuild (`VNPoliceCare` for a fresh checkout; an existing `VNPoliceCareDemo` workspace keeps its name). The Makefile detects the workspace automatically. Generated `ios/` content is intentionally ignored because Expo prebuild recreates it from `app.json` and `app.config.ts`. A simulator build is locally signed and cannot be installed on a physical iPhone. Select an Apple Development team in Xcode for device builds; use **Product → Archive** with the project-specific signing and provisioning profile for distribution.

`make ios` and `make ios-release` set the simulator location to central Cà Mau by default, so **Dùng GPS của tôi** produces a routeable local report during recording.

## Database lifecycle

```bash
npm run db:migrate
npm run db:seed
npm run db:reset   # or: make reset
```

Default persistent file:

```text
apps/server/data/vnpolice-care.sqlite
```

Migrations are applied at server startup and recorded in `schema_migrations`. SQLite foreign keys, a 5-second busy timeout, and WAL mode are enabled.

`db:reset` clears stored attachments, replaces every database record in one transaction, and reloads the seed with fresh relative timestamps and local seed photos. It is safe to run while the API is up. Report credentials stored on a device for deleted reports are pruned automatically the next time the **Tin của bạn** tab syncs.

Seed policy (`apps/server/src/database/seed-data.ts`):

- 65 police units: names and organization duty lines from `references/Ten_don_vi.docx`. Coordinates are the approximate administrative centre of each ward/commune, not surveyed station addresses. All are seeded active and verified so routing suggestions work.
- No personal officer numbers from the source document are seeded.
- 14 places in central Cà Mau on real streets with fictitious business names, plus 39 reviews: approved, 3 pending moderation, and 1 rejected advertisement.
- 18 incident reports covering the last 6 days, with full status history. 6 are from today and still open (2 new, 1 received, 2 processing, 1 resolved). Times are relative to the moment of seeding (Asia/Ho_Chi_Minh), so the dashboard always shows current activity. Three traffic reports include locally stored JPEG evidence; seeded reports have no device token and therefore appear only in the admin dashboard.
- Units, places, and the admin account are inserted by primary key and never overwritten. Reviews and reports are seeded only into empty tables, so restarts never duplicate data or touch records created through the apps.
- Set `ADMIN_DISPLAY_NAME` in `apps/server/.env` to choose the officer name shown in the admin sidebar and in status history.
- Seed evidence photos are non-graphic, CC0 images downloaded from Wikimedia Commons: [motorcycle/car collision](https://commons.wikimedia.org/wiki/File:Honda_City_hit_by_motorcycle_1.jpg) by love krittaya, [crashed motorcycle](https://commons.wikimedia.org/wiki/File:Crashed_motorcycle_in_Gda%C5%84sk.JPG) by Artur Andrzej, and [incident response](https://commons.wikimedia.org/wiki/File:Car_crash_scene_with_police_nobody_hurt.jpg) by Tomwsulcer. They are representative staging assets, not photographs of the fictional Cà Mau reports.

The nearest eligible unit (active, verified, with coordinates) is selected with Haversine distance. This is a suggestion only; proximity does not establish administrative jurisdiction. When no eligible unit exists, the suggestion remains empty for manual assignment.

## Security and privacy behavior

- Admin passwords are bcrypt hashes; plaintext passwords are never stored.
- Admin routes require an HttpOnly session cookie.
- CORS is restricted by `ADMIN_ORIGIN`; production cookies can be marked secure with `COOKIE_SECURE=true`.
- Report creation returns a 256-bit random capability token. Only its SHA-256 hash is stored.
- Public report reads require `x-report-token`; a report ID alone returns no private data.
- Attachments are never statically served. Citizens can reopen only their own attachment with `x-report-token`; authenticated admins can open attachments while handling reports.
- Uploads are capped at 5 MB and checked by MIME type and image signature (JPEG, PNG, WebP).
- Report and review submissions are rate-limited.
- Public APIs expose no report-list endpoint.
- Device report tokens are stored with Expo SecureStore.

The in-memory Express session store is intentionally limited to this local single-process deployment. Use a persistent, production-grade Nest-compatible session store before horizontal scaling.

## REST API

Public/capability routes:

```text
GET    /api/health
GET    /api/police-units
GET    /api/places
GET    /api/places/:id/reviews
POST   /api/places/:id/reviews
POST   /api/reports                         multipart/form-data
GET    /api/reports/:id                     x-report-token required
GET    /api/reports/:id/history             x-report-token required
```

Authenticated admin routes:

```text
POST   /api/admin/login
POST   /api/admin/logout
GET    /api/admin/me
GET    /api/admin/dashboard
GET    /api/admin/reports
GET    /api/admin/reports/:id
GET    /api/admin/reports/:id/attachment
PATCH  /api/admin/reports/:id/status
PATCH  /api/admin/reports/:id/assignment
GET    /api/admin/police-units
POST   /api/admin/police-units
PATCH  /api/admin/police-units/:id
GET    /api/admin/places
POST   /api/admin/places
PATCH  /api/admin/places/:id
GET    /api/admin/reviews
PATCH  /api/admin/reviews/:id
```

Status transitions are monotonic:

```text
submitted → received → processing → resolved
```

Each accepted transition is committed with a `report_status_history` row in one SQLite transaction.

## End-to-end recording script

The complete end-user shot list is [`artifacts/demo/VIDEO_RECORDING_PLAN.md`](artifacts/demo/VIDEO_RECORDING_PLAN.md); the recorded result and its chapters are described in [`artifacts/demo/README.md`](artifacts/demo/README.md).

1. Run `make reset` so timestamps, workload counts, and the three seeded evidence photos start clean.
2. Start API, admin, and Metro with `make`. In another terminal, run `make ios`; it builds the native app and sets the simulator GPS to central Cà Mau.
3. Add a polished incident photo to the simulator library:
   ```bash
   xcrun simctl addmedia "iPhone 16 Pro" apps/server/seed-assets/incidents/motorcycle-car-collision.jpg
   ```
4. Open the native map. Show the Cà Mau dataset count, category filters, accent-insensitive search, verified marker sheet, and **Dùng vị trí của tôi**.
5. Tap **Báo tin sự cố** → **Tai nạn giao thông**.
6. Use GPS, then drag the red incident marker. Confirm the nearest verified police-unit preview; the device GPS remains separate from the incident pin.
7. Enter a realistic description. Choose **Chọn từ thư viện**, select the imported photo, and show its dimensions, size, preview, replace, and remove controls.
8. Confirm submission. Keep the upload progress visible, then record the generated `VN-YYYYMMDD-XXXXXX` receipt and attachment confirmation.
9. Open **Tin đã báo** and the tracking detail. Show the map, uploaded image, assigned unit, secure device-only access, and live timeline.
10. Log in to the admin dashboard. The new report appears within five seconds with inline map and photo.
11. Assign the suggested police unit and advance to **Đã tiếp nhận**, **Đang xử lý**, then **Đã giải quyết**. Record each mobile timeline update and actor name.
12. Restart only NestJS and reopen the report from mobile history. SQLite records, the uploaded file, and SecureStore capability access remain valid.

## Verification commands

```bash
npm run typecheck
npm test
npm run build
cd apps/mobile && npx expo install --check
cd apps/mobile && npx expo export --platform android --output-dir ../../.expo-smoke --clear
```

`npm test` runs the NestJS integration suite and the mobile upload-adapter regression suite. Coverage includes report capability authorization, SQLite persistence across a NestJS restart, protected attachments, status history, assignment, Haversine suggestion eligibility, review moderation, admin CRUD, validation, rate limiting, and multipart progress/error behavior without relying on the unsupported Hermes `Promise.withResolvers` API.

See [`docs/IMPLEMENTATION_STATUS.md`](docs/IMPLEMENTATION_STATUS.md) for observed verification and current limitations.
