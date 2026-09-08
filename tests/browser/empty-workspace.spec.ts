import { test, expect } from '@playwright/test';

// No research data, test accounts, API interceptions, or fake responses.
// These tests verify the genuine unauthenticated / unconfigured experience.
test('login, registration, and recovery are accessible without invented data', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Selamat datang kembali.' })).toBeVisible();
  await page.getByRole('button', { name: 'Daftar Owner', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Mulai perjalanan Anda.' })).toBeVisible();
  await expect(page.getByLabel('Nama lengkap')).toBeVisible();
  await expect(page.getByLabel('Nama lengkap')).toHaveValue('');
  await expect(page.getByRole('button', { name: 'Buat akun Owner' })).toBeVisible();
  await page.getByRole('button', { name: 'Masuk', exact: true }).click();
  await page.getByRole('button', { name: 'Tampilkan password' }).click();
  await expect(page.locator('input[name="password"]')).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: 'Sembunyikan password' }).click();
  await expect(page.locator('input[name="password"]')).toHaveAttribute('type', 'password');
  await page.getByRole('button', { name: 'Lupa password?' }).click();
  await expect(page.getByRole('heading', { name: 'Lupa password?' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Kirim tautan pemulihan' })).toBeVisible();
});

test('every management route requires authentication', async ({ page }) => {
  for (const route of [
    'dashboard',
    'questionnaire',
    'questionnaire-data',
    'analysis',
    'top-variables',
    'photoboxes',
    'assessment',
    'ranking',
    'settings',
  ]) {
    await page.goto(`/${route}`);
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Selamat datang kembali.' })).toBeVisible();
  }
});

test('login is responsive and does not overflow on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Selamat datang kembali.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Masuk ke workspace' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test('missing configuration is explicit and cannot silently authenticate', async ({ page }) => {
  await page.goto('/login');
  const notice = page.getByText('Hubungkan workspace Anda', { exact: true });
  test.skip(
    !(await notice.isVisible()),
    'Supabase has been configured; this assertion is only for first-run setup.',
  );
  await expect(page.getByRole('button', { name: 'Masuk ke workspace' })).toBeDisabled();
  await expect(page.locator('input[name="email"]')).toHaveValue('');
  await expect(page.locator('input[name="password"]')).toHaveValue('');
  await expect(page.locator('.recharts-wrapper')).toHaveCount(0);
});
