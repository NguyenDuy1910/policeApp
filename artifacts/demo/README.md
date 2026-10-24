# VNPolice Care — Demo deliverables

## Deliverables

| File | Purpose |
|---|---|
| `full-system-demo.mp4` | Primary 12:23 H.264, yuv420p, fast-start product video with chapters and Vietnamese on-screen narration |
| `VIDEO_RECORDING_PLAN.md` | Shot list, fixed content set C1–C8, narration and validation rules followed by the video |
| `../screenshots/app/` | Native customer-app stills |
| `../screenshots/admin/` | Admin Web stills |

## Local prerequisites

- Node.js 22+
- npm 10+
- Xcode with iOS Simulator
- iPhone 16 Pro simulator runtime
- Chromium installed by Playwright

## First setup

From the repository root:

```bash
make setup
npx playwright install chromium
```

Environment files are created from each `.env.example` by `make setup` when absent. The checked-in examples contain only local demo defaults; production credentials are not required.

## Deterministic starting state

```bash
npm run demo:reset
```

This command rebuilds the shared contract, atomically replaces SQLite records with the fixed Vietnamese seed, and replaces stored upload files with repository assets. The API may remain running. Old mobile credentials are harmless: the History screen removes them when the reset API returns 404 for deleted report IDs.

Known local Admin account:

```text
Username: admin
Password: DemoAdmin!2026
```

Stable evidence asset:

```text
apps/server/seed-assets/incidents/motorcycle-car-collision.jpg
```

Load it into Simulator Photos before the take:

```bash
xcrun simctl addmedia "iPhone 16 Pro" \
  apps/server/seed-assets/incidents/motorcycle-car-collision.jpg
```

## Start the demo system

Use separate terminals:

```bash
npm run dev:server
```

```bash
npm run dev:admin
```

Build and install the standalone release app once:

```bash
make ios-release IOS_DEVICE="iPhone 16 Pro"
```

Endpoints:

```text
API       http://127.0.0.1:3000/api
Admin     http://localhost:5173
Simulator API target  http://127.0.0.1:3000/api
```

Health check:

```bash
curl --fail http://127.0.0.1:3000/api/health
```

## Rehearsal gate

Before recording, complete this loop without interruption:

1. Native App submits one traffic incident with the prepared image.
2. Admin Web searches the exact generated ID.
3. Detail renders the exact description, coordinates, and decoded image.
4. Admin assigns `Công an phường An Xuyên`.
5. Admin advances the report through `Đã tiếp nhận`, `Đang xử lý`, and `Đã giải quyết`.
6. Native tracking shows `Đã giải quyết`, the assigned unit, four timeline entries, and the Admin actor.

Also run:

```bash
npm run typecheck
npm test
npm run test:e2e
```

All must pass before the final take.

## Recovery after a failed take

1. Stop the recording and discard its partial capture.
2. Run `npm run demo:reset`.
3. Return the native app to Home and clear its report credentials with `xcrun simctl keychain "iPhone 16 Pro" reset`, so **Tin đã báo** starts empty. Credentials of deleted reports would otherwise appear until History prunes them.
4. Log out/reload Admin Web and sign in again. API restarts invalidate the in-memory Admin session by design.
5. Confirm `/api/health` returns HTTP 200.
6. Start a fresh recording only after a short non-recorded smoke pass.

## Final take

| Item | Value |
|---|---|
| Generated report | `VN-20261017-S57RIB` — submitted 06:23:14, received 06:25:57, processing 06:27:10, resolved 06:28:23 (18/10/2026) |
| Mobile capture | Release build on the `iPhone 16 Pro` simulator (iOS 18.3, Vietnamese system language), 1206 × 2622 capture inside a rendered iPhone 16 Pro titanium frame; touch points are shown as circles |
| Admin capture | Chromium at 1440 × 900, shown 1:1 inside a desktop window frame with a visible cursor |
| Narration | The plan's “Lời dẫn gợi ý” lines appear as on-screen captions; the file has no audio track |
| Lifecycle | Status changes were about 70 s apart; dissolves shorten the waits and the captions state that business time is compressed |
| Admin take checks | Exact search left 1 row; assignment persisted; 4 ordered timeline entries; no console errors or HTTP ≥ 400 responses |
| Mobile take checks | C6/C7 shown as **Chưa xác minh** on the map; the approved C2 review visible on `Cà phê Bến Gành Hào`; tracking shows the Admin actor |

## Final video chapters

| Start | Chapter | Content |
|---:|---|---|
| `00:00.0` | Mở đầu · VNPolice Care | Product scope |
| `00:05.5` | Phần 1 · Mobile — Khám phá bản đồ, đơn vị, cơ sở và gửi đánh giá | M01–M06 |
| `02:39.1` | Phần 2 · Mobile — Tạo và gửi tin báo có GPS và ảnh | M07–M17, receipt `VN-20261017-S57RIB` |
| `05:16.7` | Phần 3 · Admin — Tiếp nhận, kiểm tra, phân công và xử lý tin | A01–A09 |
| `07:24.7` | Phần 4 · Admin — Quản trị đơn vị, cơ sở và kiểm duyệt đánh giá | A10–A16 |
| `09:40.6` | Phần 5 · Mobile — Xác nhận kết quả trên thiết bị người dân | M18–M23 |
| `12:11.9` | Kết luận | M24 closing card |

## Measured media

| File | Codec | Resolution | Frame rate | Pixel format | Duration | Size |
|---|---|---:|---:|---|---:|---:|
| `full-system-demo.mp4` | H.264 High | 1920 × 1080 | 30 fps CFR | yuv420p | 742.87 s | 56,499,176 bytes |

The MP4 `moov` atom precedes `mdat` (`32 < 267717`), confirming fast-start layout. A full `ffmpeg -f null` decode finishes without errors. The Admin segment includes the supplied police-emblem avatar in the duty-officer profile.

## Security and product boundaries

- Admin evidence requires the HttpOnly session; citizen evidence requires the report capability token.
- Evidence files are not served as a public static directory.
- Demo records are synthetic. Police-unit reference labels are public-service data; no private citizen identity is stored.
- The duty-officer avatar is the user-supplied local image at `apps/admin/public/images/cong-an-hieu-avatar.jpg`; it is bundled with Admin Web and does not make a remote request.
- The current domain supports one optional image and an anonymous incident workflow, not insurance claims or dispatch integration.
