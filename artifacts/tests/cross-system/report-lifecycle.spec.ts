import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const API_URL = 'http://127.0.0.1:3100/api';
const description =
  'Xe máy va chạm ô tô tại vòng xoay Lý Thường Kiệt – Trần Hưng Đạo. Một người bị trầy xước tay, giao thông chậm theo hướng cầu Gành Hào.';

test('citizen report reaches admin operations and returns the final state through the capability token', async ({ page, request }) => {
  const evidence = readFileSync(resolve(process.cwd(), 'apps/server/seed-assets/incidents/motorcycle-car-collision.jpg'));
  const submission = await request.post(`${API_URL}/reports`, {
    multipart: {
      incidentType: 'traffic_accident',
      description,
      incidentLatitude: '9.17690',
      incidentLongitude: '105.15240',
      reporterLatitude: '9.17696',
      reporterLongitude: '105.15246',
      gpsAccuracy: '6',
      attachment: {
        name: 'hien-truong-va-cham-xe-may-o-to.jpg',
        mimeType: 'image/jpeg',
        buffer: evidence,
      },
    },
  });
  expect(submission.status()).toBe(201);
  const created = (await submission.json()) as {
    report: { id: string; status: string; attachmentAvailable: boolean; suggestedPoliceUnit: { id: number; name: string } };
    accessToken: string;
  };
  expect(created.report.status).toBe('submitted');
  expect(created.report.attachmentAvailable).toBe(true);
  expect(created.report.suggestedPoliceUnit.name).toBe('Công an phường An Xuyên');

  await page.goto('/');
  await page.getByLabel('Tên đăng nhập').fill('admin');
  await page.getByLabel('Mật khẩu').fill('DemoAdmin!2026');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Quản lý tin báo' })).toBeVisible();

  await page.getByLabel('Tìm tin báo').fill(created.report.id);
  const reportRow = page.locator('tbody tr').filter({ hasText: created.report.id });
  await expect(reportRow).toHaveCount(1);
  await expect(reportRow).toContainText('Tai nạn giao thông');
  await reportRow.getByRole('button', { name: 'Mở chi tiết' }).click();

  const detail = page.getByRole('dialog', { name: `Chi tiết ${created.report.id}` });
  await expect(detail).toContainText(description);
  await expect(detail).toContainText('9.176900, 105.152400');
  await expect(detail).toContainText('9.176960, 105.152460');
  await expect(detail).toContainText('±6 m');
  await expect(detail).toContainText('hien-truong-va-cham-xe-may-o-to.jpg');
  const image = detail.getByRole('img', { name: 'Ảnh hiện trường do người báo tin cung cấp' });
  await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBeGreaterThan(0);

  await Promise.all([
    page.waitForResponse((response) => response.url().endsWith(`/admin/reports/${created.report.id}/assignment`) && response.request().method() === 'PATCH' && response.ok()),
    detail.getByLabel('Đơn vị được phân công').selectOption('1'),
  ]);
  await expect(detail.getByLabel('Đơn vị được phân công')).toHaveValue('1');

  for (const transition of [
    { button: 'Chuyển sang “Đã tiếp nhận”', status: 'received' },
    { button: 'Chuyển sang “Đang xử lý”', status: 'processing' },
    { button: 'Chuyển sang “Đã giải quyết”', status: 'resolved' },
  ]) {
    await Promise.all([
      page.waitForResponse((response) => response.url().endsWith(`/admin/reports/${created.report.id}/status`) && response.request().method() === 'PATCH' && response.ok()),
      detail.getByRole('button', { name: transition.button }).click(),
    ]);
    await expect(detail.locator('.detail-head .status')).toHaveText(
      transition.status === 'received' ? 'Đã tiếp nhận' : transition.status === 'processing' ? 'Đang xử lý' : 'Đã giải quyết',
    );
  }
  await expect(detail.getByText('Tin báo đã giải quyết')).toBeVisible();
  await expect(detail.locator('.history-row')).toHaveCount(4);

  const citizenReport = await request.get(`${API_URL}/reports/${created.report.id}`, {
    headers: { 'x-report-token': created.accessToken },
  });
  expect(citizenReport.status()).toBe(200);
  const citizenBody = await citizenReport.json();
  expect(citizenBody.report.status).toBe('resolved');
  expect(citizenBody.report.assignedPoliceUnit.id).toBe(1);
  expect(citizenBody.report.description).toBe(description);

  const citizenHistory = await request.get(`${API_URL}/reports/${created.report.id}/history`, {
    headers: { 'x-report-token': created.accessToken },
  });
  expect(citizenHistory.status()).toBe(200);
  expect((await citizenHistory.json()).history.map((entry: { status: string }) => entry.status)).toEqual([
    'submitted',
    'received',
    'processing',
    'resolved',
  ]);

  const citizenEvidence = await request.get(`${API_URL}/reports/${created.report.id}/attachment`, {
    headers: { 'x-report-token': created.accessToken },
  });
  expect(citizenEvidence.status()).toBe(200);
  expect(await citizenEvidence.body()).toEqual(evidence);

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Quản lý tin báo' })).toBeVisible();
  await page.getByLabel('Tìm tin báo').fill(created.report.id);
  await expect(page.locator('tbody tr').filter({ hasText: created.report.id })).toContainText('Đã giải quyết');
});
