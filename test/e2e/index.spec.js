import { test, expect } from "@playwright/test";

let messages = [];

async function setup(page) {
  await page.goto("/");
  page.exposeFunction("logMessage", (msg) => messages.push(msg));
  await page.evaluate(() =>
    window.addEventListener("message", (msg) => {
      window.logMessage(msg.data);
    })
  );
}

test.describe("converts rules with postMessage", () => {
  test.beforeEach(() => {
    messages = [];
  });

  test("with adguard converter", async ({ page }) => {
    await setup(page);
    await page.evaluate(() =>
      window.postMessage({
        action: "convert",
        converter: "adguard",
        filters: ["||example.com"],
      })
    );
    await expect(() => {
      expect(messages.at(-1)).toEqual({
        errors: [],
        rules: [
          {
            id: 1,
            action: {
              type: "block",
            },
            condition: {
              urlFilter: "||example.com",
              isUrlFilterCaseSensitive: false,
            },
            priority: 1,
          },
        ],
      });
    }).toPass();
  });

  test("with abp converter", async ({ page }) => {
    await setup(page);
    await page.evaluate(() =>
      window.postMessage({
        action: "convert",
        converter: "abp",
        filters: ["||example.com"],
      })
    );
    await expect(() => {
      expect(messages.at(-1)).toEqual({
        errors: [],
        rules: [
          {
            priority: 1000,
            condition: {
              isUrlFilterCaseSensitive: false,
              urlFilter: "||example.com",
            },
            action: {
              type: "block",
            },
          },
        ],
      });
    }).toPass();
  });
});
