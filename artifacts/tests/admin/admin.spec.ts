import { expect, test } from '@playwright/test';

test('admin operator can authenticate, filter, inspect evidence, navigate, and recover from session expiry', async ({ page, context }) => {
  await page.goto('/');
  await page.getByLabel('Tên đăng nhập').fill('admin');
  await page.getByLabel('Mật khẩu').fill('MatKhauSai!2026');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('không đúng');

  await page.getByLabel('Mật khẩu').fill('DemoAdmin!2026');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Quản lý tin báo' })).toBeVisible();
  await expect(page.getByText('Đang đồng bộ')).toBeVisible();

  await page.getByLabel('Trạng thái').selectOption('submitted');
  await page.getByLabel('Loại sự cố').selectOption('traffic_accident');
  await page.getByLabel('Tìm tin báo').fill('K7M2QD');
  const reportRows = page.locator('tbody tr');
  await expect(reportRows).toHaveCount(1);
  await expect(reportRows.first()).toContainText('Tai nạn giao thông');
  await expect(reportRows.first()).toContainText('Đã gửi');

  await reportRows.first().getByRole('button', { name: 'Mở chi tiết' }).click();
  const detail = page.getByRole('dialog', { name: /Chi tiết VN-/ });
  await expect(detail).toBeVisible();
  await expect(detail).toContainText('Va chạm giữa xe máy và xe tải nhỏ');
  await expect(detail).toContainText('9.176120, 105.156840');
  await expect(detail.locator('.detail-grid').getByText('Công an phường An Xuyên', { exact: true })).toBeVisible();
  const evidence = detail.getByRole('img', { name: 'Ảnh hiện trường do người báo tin cung cấp' });
  await expect(evidence).toBeVisible();
  await expect.poll(() => evidence.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  await detail.locator('.drawer-header').getByRole('button', { name: 'Đóng chi tiết' }).click();

  await page.getByRole('button', { name: 'Đơn vị công an' }).click();
  await expect(page.getByRole('heading', { name: 'Đơn vị công an' })).toBeVisible();
  await page.getByRole('button', { name: 'Thêm đơn vị' }).click();
  const unitForm = page.getByRole('dialog', { name: 'Thêm đơn vị' });
  await expect(unitForm.getByLabel('Tên đơn vị *')).toHaveAttribute('required', '');
  await unitForm.locator('form').getByRole('button', { name: 'Đóng biểu mẫu' }).click();

  await page.getByRole('button', { name: 'Cơ sở & dịch vụ' }).click();
  await expect(page.getByRole('heading', { name: 'Quán ăn & dịch vụ' })).toBeVisible();
  await page.getByRole('button', { name: 'Đánh giá' }).click();
  await expect(page.getByRole('heading', { name: 'Kiểm duyệt đánh giá' })).toBeVisible();

  await context.clearCookies();
  await page.getByRole('button', { name: 'Tin báo' }).click();
  await expect(page.getByRole('heading', { name: 'Đăng nhập quản trị' })).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('Phiên quản trị đã hết hạn');
});
