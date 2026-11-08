// Spec: UI-001, UI-080, UI-090, AR-009
import { expect, test, type Page } from "@playwright/test";

/** UI-001 sidebar items in order: label, route, data-testid, placeholder (null once the screen is implemented). */
const NAV = [
  { label: "Projects", route: "/projects", testId: "nav-projects", placeholder: null },
  { label: "Contracts", route: "/contracts", testId: "nav-contracts", placeholder: null },
  { label: "Invoices", route: "/invoices", testId: "nav-invoices", placeholder: null },
  { label: "Investors", route: "/investors", testId: "nav-investors", placeholder: null },
  { label: "Subcontractors", route: "/subcontractors", testId: "nav-subcontractors", placeholder: null },
  {
    label: "Contracted vs collected",
    route: "/analytics/contracted-vs-collected",
    testId: "nav-analytics-contracted",
    placeholder: null,
  },
  {
    label: "Subcontractor payments",
    route: "/analytics/subcontractor-payments",
    testId: "nav-analytics-subcontractors",
    placeholder: null,
  },
  {
    label: "Projects per year",
    route: "/analytics/projects-per-year",
    testId: "nav-analytics-projects",
    placeholder: null,
  },
  { label: "Net result", route: "/analytics/net-result", testId: "nav-analytics-net", placeholder: null },
  {
    label: "Budget realisation",
    route: "/analytics/budget-realisation",
    testId: "nav-analytics-budget",
    placeholder: null,
  },
  { label: "Settings", route: "/settings", testId: "nav-settings", placeholder: null },
] as const;

const UNTRANSLATED_KEY = /^[a-z]+(\.[a-zA-Z]+)+$/;

async function visibleTexts(page: Page): Promise<string[]> {
  const text = await page.locator("body").innerText();
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

test("TC-M1-020 app loads in browser mode and the sidebar shows all UI-001 items in order", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/projects$/);

  const items = page.locator('nav [data-testid^="nav-"]');
  await expect(items).toHaveCount(NAV.length);
  expect(await items.evaluateAll((els) => els.map((el) => el.getAttribute("data-testid")))).toEqual(
    NAV.map((item) => item.testId),
  );
  expect((await items.allInnerTexts()).map((text) => text.trim())).toEqual(NAV.map((item) => item.label));
  await expect(page.locator("nav")).toContainText("Analytics");
  // Browser mode in an e2e build exposes the test hooks (AR-009).
  expect(
    await page.evaluate(() => [
      typeof window.__TEST__?.reset,
      typeof window.__TEST__?.seed,
      "__TAURI_INTERNALS__" in window,
    ]),
  ).toEqual(["function", "function", false]);
});

test("TC-M1-021 navigating to each sidebar item changes the route and shows its heading", async ({ page }) => {
  await page.goto("/");
  for (const item of NAV) {
    await page.getByTestId(item.testId).click();
    await expect(page).toHaveURL(new RegExp(`${item.route}$`));
    await expect(page.getByTestId("screen-title")).toHaveText(item.label);
    if (item.placeholder) {
      await expect(page.getByRole("main")).toContainText(item.placeholder);
    }
  }
});

test("TC-M1-022 settings: change currency to RSD and VAT to 10, save, navigate away and back keeps values", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByTestId("nav-settings").click();
  await expect(page.getByTestId("field-currency")).toHaveValue("EUR");
  await expect(page.getByTestId("field-defaultVatRate")).toHaveValue("20");
  await expect(page.getByRole("main")).toContainText("In-memory (browser mode)");
  await expect(page.getByRole("button", { name: "Open folder" })).toHaveCount(0);

  await page.getByTestId("field-currency").click();
  await page.getByRole("option", { name: "RSD" }).click();
  await page.getByTestId("field-defaultVatRate").fill("10");
  await page.getByTestId("btn-save").click();
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();

  // Client-side navigation only: browser mode keeps the DB in memory (AR-009).
  await page.getByTestId("nav-projects").click();
  await expect(page.getByTestId("screen-title")).toHaveText("Projects");
  await page.getByTestId("nav-settings").click();
  await expect(page.getByTestId("screen-title")).toHaveText("Settings");
  await expect(page.getByTestId("field-currency")).toHaveValue("RSD");
  await expect(page.getByTestId("field-defaultVatRate")).toHaveValue("10");
});

test("TC-M1-023 no untranslated i18n keys are visible on any screen", async ({ page }) => {
  await page.goto("/");
  for (const item of NAV) {
    await page.getByTestId(item.testId).click();
    await expect(page.getByTestId("screen-title")).toHaveText(item.label);
    const offending = (await visibleTexts(page)).filter((line) => UNTRANSLATED_KEY.test(line));
    expect(offending, `untranslated keys on ${item.route}`).toEqual([]);
  }
});
