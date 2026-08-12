import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route(/^https?:\/\/(?!web:3000|localhost:3000)/, (route) => route.abort());
});

test.describe('smoke', () => {
  test('landing page renderuje się i prowadzi do logowania Google', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'SyncSphere' })).toBeVisible();

    const loginLink = page.getByRole('link', { name: 'Zacznij tutaj' });
    await expect(loginLink).toBeVisible();
    await expect(loginLink).toHaveAttribute('href', /\/auth\/google$/);
  });

  test('nieznana ścieżka zwraca stronę 404', async ({ page }) => {
    const response = await page.goto('/nie-ma-takiej-strony');

    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: 'Nie znaleziono strony' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Wróć do strony głównej' })).toBeVisible();
  });
});
