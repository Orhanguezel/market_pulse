import { expect, test, type Page } from '@playwright/test';

const CONSULTANT_ID =
  process.env.PLAYWRIGHT_CONSULTANT_ID || '20000000-0000-4000-8000-000000000001';
const ADMIN_BASE_URL = (process.env.PLAYWRIGHT_ADMIN_BASE_URL || 'http://localhost:3094').replace(/\/+$/, '');
const API_BASE_URL = (process.env.PLAYWRIGHT_API_BASE_URL || 'http://127.0.0.1:8086/api/v1').replace(/\/+$/, '');
const ADMIN_EMAIL = process.env.PLAYWRIGHT_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.PLAYWRIGHT_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'admin123';

const bookingQuery = new URLSearchParams({
  consultantId: CONSULTANT_ID,
  resourceId: '30000000-0000-4000-8000-000000000001',
  slotId: '40000000-0000-4000-8000-000000000001',
  date: '2026-05-01',
  time: '10:00',
  price: '750',
  duration: '30',
  name: 'Test Consultant',
});

const publicRoutes = [
  '/tr',
  '/tr/consultants',
  `/tr/consultants/${CONSULTANT_ID}`,
  `/tr/booking?${bookingQuery.toString()}`,
  '/tr/login',
  '/tr/register',
  '/tr/profile/bookings',
];

async function expectHealthyPage(page: Page) {
  await expect(page.locator('body')).toBeVisible();
  await expect(page.locator('body')).not.toContainText(/Application error|Unhandled Runtime Error|Hydration failed/i);
}

async function waitForNextDevIdle(page: Page) {
  await expect(page.getByText('Compiling')).toHaveCount(0, { timeout: 60_000 }).catch(() => undefined);
}

async function gotoHealthy(page: Page, route: string) {
  let response = await page.goto(route, { waitUntil: 'commit' });
  if ((response?.status() ?? 0) >= 500) {
    await page.waitForTimeout(1_000);
    response = await page.goto(route, { waitUntil: 'commit' });
  }
  expect(response?.status(), route).toBeLessThan(400);
  await page.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => undefined);
  await waitForNextDevIdle(page);
  await expectHealthyPage(page);
}

async function loginAdmin(page: Page) {
  const response = await page.request.post(`${API_BASE_URL}/auth/token`, {
    data: { grant_type: 'password', email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  expect(response.status()).toBeLessThan(400);

  const payload = await response.json();
  const token = String(payload?.access_token || '');
  expect(token.length).toBeGreaterThan(10);

  await page.goto(ADMIN_BASE_URL, { waitUntil: 'commit' });
  await page.evaluate((accessToken) => {
    window.localStorage.setItem('mh_access_token', accessToken);
    window.localStorage.setItem('access_token', accessToken);
  }, token);
}

test.describe.configure({ mode: 'serial' });

test.describe('T5 public smoke', () => {
  test('critical public routes render without app errors', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    for (const route of publicRoutes) {
      await gotoHealthy(page, route);
    }

    expect(pageErrors).toEqual([]);
  });

  test('consultant filters and slot selection surface are interactive', async ({ page }) => {
    await gotoHealthy(page, '/tr/consultants');
    await waitForNextDevIdle(page);
    await page.waitForTimeout(2_500);
    await expect(page.getByText('Filtrele')).toBeVisible();

    for (let attempt = 0; attempt < 3; attempt += 1) {
      await page.getByText('Filtrele').click();
      if (await page.getByLabel('Min. Fiyat').count()) break;
      await page.waitForTimeout(500);
    }

    await expect(page.getByRole('combobox', { name: 'Min. Fiyat (₺)' })).toBeVisible();
    await page.getByRole('combobox', { name: 'Min. Fiyat (₺)' }).selectOption('500');
    await expect(page.getByRole('combobox', { name: 'Min. Fiyat (₺)' })).toHaveValue('500');

    await expect(page.getByRole('combobox', { name: 'Min. Puan' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Maks. Fiyat (₺)' })).toBeVisible();

    await gotoHealthy(page, `/tr/consultants/${CONSULTANT_ID}`);
    await expect(page.getByRole('heading', { name: /Tarih & Saat Sec|Tarih & Saat Seç/i })).toBeVisible();

    const slots = page.getByRole('button', { name: /^\d{2}:\d{2}$/ });
    if (await slots.count()) {
      const firstSlot = slots.first();
      const selectedTime = (await firstSlot.textContent())?.trim() || '';
      await firstSlot.click();
      await expect(page.getByRole('button', { name: new RegExp(selectedTime) })).toBeEnabled();
    } else {
      await expect(page.getByText(/musait slot yok|müsait slot yok|No available slots/i)).toBeVisible();
    }

    await expect(page.getByRole('button', { name: /Randevu Al|Book/i })).toBeVisible();
  });

  test('checkout summary page and validation surface is available', async ({ page }) => {
    await gotoHealthy(page, `/tr/booking?${bookingQuery.toString()}`);
    await expect(
      page.getByRole('heading', { name: /Randevu Özeti|Booking Summary/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Güvenli Ödemeye Geç|Proceed to Payment/i }),
    ).toBeVisible();
    await expect(page.getByLabel('Not (opsiyonel)')).toBeVisible();
  });

  test('auth forms surface validation feedback', async ({ page }) => {
    await gotoHealthy(page, '/tr/login');
    await expect(page.locator('#login-email')).toHaveAttribute('required');
    await expect(page.locator('#login-password')).toHaveAttribute('required');

    await gotoHealthy(page, '/tr/register');
    await page.fill('#reg-email', 'demo@example.com');
    await page.fill('#reg-password', '123456');
    await page.fill('#reg-password-again', '654321');
    await page.getByRole('button', { name: /sign up|kayıt|register/i }).click();
    await expect(page.getByRole('alert')).toBeVisible();
  });

  test('admin design token editor renders', async ({ page }) => {
    await loginAdmin(page);
    await gotoHealthy(page, `${ADMIN_BASE_URL}/admin/site-settings`);

    await page.getByRole('tab', { name: 'Design Tokens' }).click();
    await expect(
      page.getByRole('heading', { name: /Design Token Editörü|Design Token Editor/i }),
    ).toBeVisible();
    await expect(page.locator('input[type="color"]').first()).toBeVisible();
  });
});

test.describe('T5 responsive smoke', () => {
  for (const viewport of [
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 375, height: 812 },
  ]) {
    test(`core pages fit ${viewport.name} viewport`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      for (const route of ['/tr', '/tr/consultants', `/tr/consultants/${CONSULTANT_ID}`]) {
        await gotoHealthy(page, route);

        const overflow = await page.evaluate(() => {
          const root = document.documentElement;
          return root.scrollWidth - root.clientWidth;
        });

        expect(overflow, route).toBeLessThanOrEqual(8);
      }
    });
  }
});
