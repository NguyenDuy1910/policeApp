# Customer app verification

The customer surface is an Expo/React Native iOS application, not a browser/PWA. Playwright cannot drive UIKit or the iOS photo picker. Native verification therefore uses the real `iPhone 16 Pro` Simulator plus the automated unit/integration layers below; the admin and cross-system browser surfaces are covered by Playwright.

## Automated checks

```bash
npm test -w @vnpolice/mobile
npm test -w @vnpolice/server
npm run test:e2e
```

Coverage relevant to the app boundary:

- Hermes-compatible multipart upload transport, progress, timeout, and network errors.
- Multipart field mapping, image signature/type/size/count validation, durable file storage, capability-token authorization, and missing-file behavior.
- Citizen report/history/attachment reads after admin assignment and every status transition.
- Full admin UI lifecycle in `../cross-system/report-lifecycle.spec.ts` against an isolated SQLite database and upload directory.

## Native simulator smoke scenario

Verified on `iPhone 16 Pro`, iOS Simulator, at 1206 × 2622 device pixels:

1. Launch `vn.gov.demo.vnpolicecare`.
2. Start **Báo tin sự cố** and select **Tai nạn giao thông**.
3. Grant location permission and use GPS near `9.17690, 105.15240`.
4. Enter a realistic Vietnamese description.
5. Select an image, verify preview/metadata, then submit.
6. Confirm success, report ID, suggested unit, uploaded image, and persisted access credential.
7. Terminate/relaunch the app; open **Tin đã báo** and confirm the report remains available.
8. Perform assignment/status update in Admin Web.
9. Confirm the list badge and tracking timeline update on the native app.

Observed flagship run: `VN-20261017-SHM0WV`, submitted from the native app, assigned to **Công an phường An Xuyên**, changed to **Đã tiếp nhận**, then observed on the app timeline.

## Why there is no coordinate-driven permanent test

Raw Simulator mouse coordinates are viewport- and host-layout-dependent, and would violate the repository's deterministic-selector requirement. The final demo rehearsal uses the real simulator; repeatable contract and browser automation use stable roles, labels, API responses, and state assertions.
