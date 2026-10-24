# Deterministic E2E suite

Run from the repository root:

```bash
npm run test:e2e
```

The Playwright configuration:

- builds the shared package and API;
- deletes and recreates `artifacts/.tmp/e2e`;
- starts an isolated API on `127.0.0.1:3100`;
- uses an isolated SQLite file and upload directory;
- seeds the same realistic Vietnamese baseline on every run;
- starts Admin Web on `127.0.0.1:5179`;
- runs serially with one worker because the lifecycle test intentionally mutates shared state;
- retains trace, screenshot, and video only on failure.

Suites:

- `admin/admin.spec.ts`: authentication failure/success, dashboard, filters, search, detail, evidence rendering, module navigation, required form fields, and expired-session recovery.
- `cross-system/report-lifecycle.spec.ts`: multipart citizen submission with a repository accident image, exact field rendering in Admin Web, assignment, every allowed status transition, persisted history, citizen-token round trip, byte-identical evidence retrieval, and reload persistence.
- `app/README.md`: native Simulator verification boundary and the exercised customer journey.

Generated Playwright HTML report: `artifacts/tests/report/index.html`.
