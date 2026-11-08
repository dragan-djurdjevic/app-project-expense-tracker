// Spec: AR-013, UI-003, UI-081, UI-080, UI-090, UI-091, DEMO-001, DEMO-901, DEMO-905
import { expect, test, type Page } from "@playwright/test";
import { drawer, rowByText, rows, setLanguage, toggleArchived, toggleSwitch } from "./helpers";

/** UI-001 screens, by sidebar test id. */
const SCREENS = [
  "nav-projects",
  "nav-contracts",
  "nav-invoices",
  "nav-investors",
  "nav-subcontractors",
  "nav-analytics-contracted",
  "nav-analytics-subcontractors",
  "nav-analytics-projects",
  "nav-analytics-net",
  "nav-analytics-budget",
  "nav-settings",
];
const BANNER_EN = "Demo mode — sample data, separate from your real records.";
const UNTRANSLATED_KEY = /^[a-z]+(\.[a-zA-Z]+)+$/;

/** Opens the demo profile (`/?profile=demo`, AR-013) and waits for the seeded Projects list. */
async function openDemo(page: Page): Promise<void> {
  await page.goto("/?profile=demo");
  await expect(page.getByTestId("demo-banner")).toBeVisible();
  await expect(page.getByTestId("screen-title")).toHaveText("Projects");
  await expect(rows(page)).toHaveCount(7);
}

async function expectLiveEmpty(page: Page): Promise<void> {
  await expect(page.getByTestId("screen-title")).toHaveText("Projects");
  await expect(page.getByRole("main")).toContainText("No records yet.");
  await expect(page.getByTestId("demo-banner")).toHaveCount(0);
}

test("TC-M7-009 live profile at / has no banner, no data, demo switch off and no reset button", async ({ page }) => {
  await page.goto("/");
  await expectLiveEmpty(page);
  await page.getByTestId("nav-settings").click();
  await expect(page.getByTestId("screen-title")).toHaveText("Settings");
  await expect(page.getByTestId("field-demo-mode")).not.toBeChecked();
  await expect(page.getByTestId("btn-reset-demo")).toHaveCount(0);
  await expect(page.getByTestId("demo-banner")).toHaveCount(0);
});

test("TC-M7-010 demo profile shows the banner everywhere, the title suffix and the seeded data", async ({ page }) => {
  await openDemo(page);
  expect(await page.title()).toMatch(/— Demo$/);
  await expect(page.getByTestId("demo-banner")).toContainText(BANNER_EN);

  for (const nav of SCREENS) {
    await page.getByTestId(nav).click();
    await expect(page.getByTestId("demo-banner")).toBeVisible();
  }

  await page.getByTestId("nav-projects").click();
  await expect(rows(page)).toHaveCount(7);
  await toggleArchived(page);
  await expect(rows(page)).toHaveCount(8);

  await page.getByTestId("nav-analytics-contracted").click();
  const footer = page.getByTestId("table-footer");
  await expect(footer).toContainText("€1,100,000.00");
  await expect(footer).toContainText("€600,000.00");
  await expect(footer).toContainText("54.5 %");

  await page.getByTestId("nav-analytics-budget").click();
  const library = rowByText(page, "Harbor Library Renovation");
  const rowTestId = await library.getAttribute("data-testid");
  const projectId = (rowTestId ?? "").replace(/^row-/, "");
  const bar = page.getByTestId(`bar-realisation-${projectId}`);
  await expect(bar).toHaveAttribute("data-value", "110");
  await expect(bar.getByRole("progressbar")).toHaveAttribute("style", /red/);
});

test("TC-M7-011 switching live → demo (cancel, then confirm) and demo → live via the banner", async ({ page }) => {
  await page.goto("/settings");
  await expect(page.getByTestId("screen-title")).toHaveText("Settings");

  await toggleSwitch(page, "field-demo-mode");
  const dialog = page.getByTestId("confirm-switch-profile");
  await expect(dialog).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Switch to demo mode?" })).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByTestId("field-demo-mode")).not.toBeChecked();
  await expect(page.getByTestId("demo-banner")).toHaveCount(0);

  await toggleSwitch(page, "field-demo-mode");
  await expect(page.getByTestId("btn-confirm-switch")).toHaveText("Restart in demo mode");
  await page.getByTestId("btn-confirm-switch").click();
  await expect(page.getByTestId("demo-banner")).toBeVisible();
  await expect(rows(page)).toHaveCount(7);

  await page.getByTestId("btn-banner-switch-live").click();
  await expect(page.getByRole("dialog", { name: "Switch to live data?" })).toBeVisible();
  await expect(page.getByTestId("btn-confirm-switch")).toHaveText("Restart with live data");
  await page.getByTestId("btn-confirm-switch").click();
  await expectLiveEmpty(page);
});

test("TC-M7-012 reset restores the sample data after a change", async ({ page }) => {
  await openDemo(page);
  await page.getByTestId("nav-investors").click();
  await rowByText(page, "Northwind Developments").click();
  const edit = drawer(page, "Edit Investor");
  await expect(edit).toBeVisible();
  await page.getByTestId("field-name").fill("Changed");
  await page.getByTestId("btn-save").click();
  await expect(edit).toBeHidden();
  await expect(rowByText(page, "Changed")).toHaveCount(1);

  await page.getByTestId("nav-settings").click();
  await expect(page.getByTestId("field-demo-mode")).toBeChecked();
  await page.getByTestId("btn-reset-demo").click();
  await expect(page.getByTestId("confirm-reset-demo")).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Reset demo data?" })).toBeVisible();
  await page.getByTestId("btn-confirm-reset").click();

  await expect(page.getByTestId("demo-banner")).toBeVisible();
  await expect(rows(page)).toHaveCount(7);
  await page.getByTestId("nav-investors").click();
  await expect(rowByText(page, "Northwind Developments")).toHaveCount(1);
  await expect(rowByText(page, "Changed")).toHaveCount(0);
});

test("TC-M7-013 demo banner and Settings demo section in Srpski (latinica), no untranslated keys", async ({ page }) => {
  await openDemo(page);
  await page.getByTestId("nav-settings").click();
  await setLanguage(page, "Srpski (latinica)");

  await expect(page.getByTestId("demo-banner")).toContainText(
    "Demo režim — probni podaci, odvojeni od vaših stvarnih zapisa.",
  );
  await expect(page.getByTestId("btn-banner-switch-live")).toHaveText("Pređi na stvarne podatke");
  const main = page.getByRole("main");
  await expect(main).toContainText("Demo režim koristi sopstvenu bazu sa probnim podacima.");
  await expect(page.getByTestId("btn-reset-demo")).toHaveText("Vrati demo podatke na početne");

  const lines = (await page.locator("body").innerText())
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  expect(lines.filter((line) => UNTRANSLATED_KEY.test(line))).toEqual([]);

  await page.getByTestId("btn-reset-demo").click();
  await expect(page.getByRole("dialog", { name: "Vratiti demo podatke na početne?" })).toBeVisible();
  const dialogLines = (await page.getByTestId("confirm-reset-demo").innerText()).split("\n").map((l) => l.trim());
  expect(dialogLines.filter((line) => UNTRANSLATED_KEY.test(line))).toEqual([]);
});
