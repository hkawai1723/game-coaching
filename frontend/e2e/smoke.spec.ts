import { expect, test } from '@playwright/test';

// アプリが Vite scaffold を抜けたら、意味のあるユーザーフロー（試合の選択 → 解析待ち →
// フィードバック表示）のテストに置き換える。
test('home page renders', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Get started' }),
  ).toBeVisible();
});
