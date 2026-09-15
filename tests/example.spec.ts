import { test, expect } from '@playwright/test';

test.describe('Index lifecycle', () => {
  test('logs in, creates an index with valid fields, checks metrics, and deletes it', async ({ page }) => {
    const uniqueSuffix = Date.now();
    const indexName = `Playwright Test Index ${uniqueSuffix}`;

    await page.goto('http://localhost/login');
    await page.locator('input[type="email"]').fill('12345678@gmail.com');
    await page.locator('input[type="password"]').fill('12345678');

    const loginResponse = page.waitForResponse(
      (response) => response.url().includes('/api/auth/login') && response.status() === 200,
      { timeout: 30000 }
    );

    await page.getByRole('button', { name: /Login/i }).click();
    await loginResponse;
    await expect(page).toHaveURL(/\/my-indices(?:\/)?$/, { timeout: 30000 });

    await page.goto('http://localhost/create');
    await expect(page).toHaveURL(/\/create$/, { timeout: 15000 });

    await page.locator('text=Bitcoin').first().click();
    await page.locator('text=Ethereum').first().click();
    await page.getByRole('button', { name: /^Next$/ }).click();

    await page.getByPlaceholder('e.g., My Diversified Crypto Portfolio').fill(indexName);
    const numberInputs = page.locator('input[type="number"]');
    await numberInputs.nth(0).fill('1000');
    await numberInputs.nth(1).fill('50');
    await numberInputs.nth(2).fill('50');
    await page.getByRole('button', { name: /^Next$/ }).click();

    await expect(page.getByText(indexName)).toBeVisible();
    await expect(page.getByText('Initial Investment')).toBeVisible();
    await expect(page.getByText('50%')).toHaveCount(2);

    const createResponse = page.waitForResponse(
      (response) => response.url().includes('/api/indices') && response.status() === 201,
      { timeout: 30000 }
    );

    await page.getByRole('button', { name: 'Create Index' }).nth(1).click();
    await createResponse;
    await page.waitForURL(/\/my-indices\/.+/, { timeout: 30000 });

    await expect(page.getByText(indexName)).toBeVisible({ timeout: 20000 });
    await expect(page.getByText('Initial Investment:')).toBeVisible();
    await expect(page.getByText('Portfolio Composition')).toBeVisible();
    await expect(page.getByText('BTC')).toBeVisible();
    await expect(page.getByText('ETH')).toBeVisible();

    await expect(page.getByText('Current Value')).toBeVisible();
    await expect(page.getByText('PNL (USD)')).toBeVisible();
    await expect(page.getByText('PNL %')).toBeVisible();
    await expect(page.getByText('Sharpe Ratio')).toBeVisible();

    const pageText = await page.locator('body').textContent();
    expect(pageText ?? '').toMatch(/Current Value\$\d+(?:,\d{3})*\.\d{2}/);
    expect(pageText ?? '').toMatch(/PNL \(USD\)[+-]?\$\d+(?:,\d{3})*\.\d{2}/);
    expect(pageText ?? '').toMatch(/PNL %[+-]?\d+(?:\.\d+)?%/);
    expect(pageText ?? '').toMatch(/Sharpe Ratio(?:N\/A|-?\d+(?:\.\d+)?)/);

    await page.getByRole('button', { name: /^Delete Index$/ }).click();
    await expect(page.getByText('Delete Index?')).toBeVisible();

    const deleteResponse = page.waitForResponse(
      (response) => response.url().includes('/api/indices/') && response.status() === 200,
      { timeout: 30000 }
    );

    await page.getByRole('button', { name: /^Delete$/ }).click();
    await deleteResponse;
    await page.waitForURL(/\/my-indices(?:\/)?$/, { timeout: 20000 });
    await expect(page.getByText(indexName)).not.toBeVisible({ timeout: 20000 });
  });

  test('logs in and creates an index with all available crypto assets', async ({ page }) => {
    const uniqueSuffix = Date.now();
    const indexName = `All Crypto Index ${uniqueSuffix}`;

    await page.goto('http://localhost/login');
    await page.locator('input[type="email"]').fill('12345678@gmail.com');
    await page.locator('input[type="password"]').fill('12345678');

    const loginResponse = page.waitForResponse(
      (response) => response.url().includes('/api/auth/login') && response.status() === 200,
      { timeout: 30000 }
    );

    await page.getByRole('button', { name: /Login/i }).click();
    await loginResponse;
    await expect(page).toHaveURL(/\/my-indices(?:\/)?$/, { timeout: 30000 });

    await page.goto('http://localhost/create');
    await expect(page).toHaveURL(/\/create$/, { timeout: 15000 });

    for (const symbol of ['Bitcoin', 'Ethereum', 'Solana', 'Cardano', 'Avalanche', 'Polkadot', 'Litecoin', 'Chainlink']) {
      await page.getByText(symbol, { exact: true }).first().click();
    }

    await expect(page.getByText('8 cryptocurrencies selected.')).toBeVisible({ timeout: 20000 });
    await page.getByRole('button', { name: /^Next$/ }).click();

    await page.getByPlaceholder('e.g., My Diversified Crypto Portfolio').fill(indexName);
    await page.locator('input[type="number"]').nth(0).fill('2500');
    await page.getByRole('button', { name: /^Next$/ }).click();

    await expect(page.getByText(indexName)).toBeVisible();
    await expect(page.getByText('8 assets')).toBeVisible();
    await expect(page.getByText('2500')).toBeVisible();

    const createResponse = page.waitForResponse(
      (response) => response.url().includes('/api/indices') && response.status() === 201,
      { timeout: 30000 }
    );

    await page.getByRole('button', { name: 'Create Index' }).nth(1).click();
    await createResponse;
    await page.waitForURL(/\/my-indices\/.+/, { timeout: 30000 });

    await expect(page.getByText(indexName)).toBeVisible({ timeout: 20000 });
    await expect(page.getByText('Portfolio Composition')).toBeVisible();
    await expect(page.getByText('BTC')).toBeVisible();
    await expect(page.getByText('LINK')).toBeVisible();
    await expect(page.getByText('ASSETS')).toBeVisible();

    const pageText = await page.locator('body').textContent();
    expect(pageText ?? '').toMatch(/ASSETS\s*8/);

    await page.getByRole('button', { name: /^Delete Index$/ }).click();
    await expect(page.getByText('Delete Index?')).toBeVisible();

    const deleteResponse = page.waitForResponse(
      (response) => response.url().includes('/api/indices/') && response.status() === 200,
      { timeout: 30000 }
    );

    await page.getByRole('button', { name: /^Delete$/ }).click();
    await deleteResponse;
    await page.waitForURL(/\/my-indices(?:\/)?$/, { timeout: 20000 });
    await expect(page.getByText(indexName)).not.toBeVisible({ timeout: 20000 });
  });
});
