import { expect, test } from '@playwright/test';

function uniqueEmail(projectName: string): string {
  const stamp = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
  return `e2e-${projectName}-${stamp}@e2e.fakturcho.test`;
}

test('signup through issue, PDF render and mark paid', async ({ page }, testInfo) => {
  const email = uniqueEmail(testInfo.project.name);
  const clientName = `Тестов клиент ${Date.now()}`;

  await page.goto('/signup');
  await page.getByLabel('Име', { exact: true }).fill('Е2Е Тестер');
  await page.getByLabel('Имейл', { exact: true }).fill(email);
  await page.getByLabel('Парола', { exact: true }).fill('TestPass123!');
  await page.getByRole('button', { name: 'Регистрация', exact: true }).click();
  await page.waitForURL(/\/documents$/);

  await page.goto('/profile');
  await page.getByLabel('Фирма', { exact: true }).fill('Тест Фирма ЕООД');
  await page.getByLabel('ЕИК / Булстат').fill('123456789');
  await page.getByLabel('Адрес', { exact: true }).fill('ул. Тестова 1');
  await page.getByLabel('Град', { exact: true }).fill('София');
  await page.getByRole('button', { name: 'Запази профила', exact: true }).click();
  await expect(page.getByText('Профилът е запазен', { exact: true })).toBeVisible();

  await page.goto('/clients');
  await page.getByRole('button', { name: 'Нов клиент', exact: true }).first().click();
  await page.getByLabel('Фирма', { exact: true }).fill(clientName);
  await page.getByRole('button', { name: 'Запази', exact: true }).click();
  await expect(page.getByText('Клиентът е запазен', { exact: true })).toBeVisible();

  await page.goto('/documents/new');
  await page.getByLabel('Клиент', { exact: true }).click();
  await page.getByRole('option', { name: clientName, exact: true }).click();

  await page.getByLabel('Наименование', { exact: true }).nth(0).fill('Консултантска услуга');
  await page.getByLabel('Количество', { exact: true }).nth(0).fill('2.5');
  await page.getByLabel('Цена', { exact: true }).nth(0).fill('100');

  await page.getByRole('button', { name: 'Добави артикул', exact: true }).click();
  await page.getByLabel('Наименование', { exact: true }).nth(1).fill('Разработка на модул');
  await page.getByLabel('Количество', { exact: true }).nth(1).fill('1.5');
  await page.getByLabel('Цена', { exact: true }).nth(1).fill('50');

  await expect(page.getByText('325,00 €', { exact: true }).last()).toBeVisible();

  await page.getByRole('button', { name: 'Запази чернова', exact: true }).click();
  await page.waitForURL(/\/documents\/[^/]+$/);

  await expect(page.locator('iframe')).toBeVisible();

  await page.getByRole('button', { name: 'Издай', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Издай', exact: true }).click();
  await expect(page.getByText('Документът е издаден', { exact: true })).toBeVisible();
  await expect(page.getByText('Издадена', { exact: true })).toBeVisible();

  const documentId = new URL(page.url()).pathname.split('/').filter(Boolean).pop();
  const renderResponse = await page.request.get(`/api/documents/${documentId}/render`);
  expect(renderResponse.status()).toBe(200);
  expect(renderResponse.headers()['content-type']).toContain('application/pdf');
  expect(renderResponse.headers()['content-disposition']).toContain('filename*=');

  await page.getByRole('button', { name: 'Отбележи като платена', exact: true }).click();
  await expect(page.getByText('Документът е отбелязан като платен', { exact: true })).toBeVisible();
  await expect(page.getByText('ПЛАТЕНО', { exact: true })).toBeVisible();

  await page.goto('/documents');
  await expect(page.getByText('ПЛАТЕНО', { exact: true })).toBeVisible();
});
