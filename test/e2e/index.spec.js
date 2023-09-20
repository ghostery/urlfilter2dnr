import { test, expect } from '@playwright/test';

test('converts rules with postMessage', async ({ page }) => {
  const messages = [];
  page.exposeFunction('logMessage', (msg) => messages.push(msg));
  await page.goto('/');
  await page.evaluate(() => window.addEventListener('message', (msg) => {
    window.logMessage(msg.data);
  }));
  await page.evaluate(() => window.postMessage('test'));
  await expect(() => {
    expect(messages.length).toEqual(1);
  }).toPass();
});
