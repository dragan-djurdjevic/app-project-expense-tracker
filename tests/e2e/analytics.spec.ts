// Spec: UI-060, UI-061, UI-062, UI-063, UI-064, UI-065, UI-033, AN-900, AN-901, AN-902, AN-903, AN-904, AN-905
import { expect, test, type Locator, type Page } from "@playwright/test";
import { ANALYTICS } from "../fixtures/analytics";
import { openScreen, pick, toggleSwitch } from "./helpers";

const { P1, P2, P3, P4 } = ANALYTICS.projects;
const { S1, S2 } = ANALYTICS.subcontractors;

/** Cell texts of a table row, without the project column (name + optional badge). */
async function cells(row: Locator): Promise<string[]> {
  const texts = await row.locator("td").allInnerTexts();
  return texts.slice(1).map((text) => text.trim());
}

async function footer(page: Page): Promise<string[]> {
  const texts = await page.getByTestId("table-footer").locator("td").allInnerTexts();
  return texts.map((text) => text.trim());
}

const row = (page: Page, projectId: string) => page.getByTestId(`row-${projectId}`);

async function yearOptions(page: Page): Promise<string[]> {
  await page.getByTestId("filter-year").click();
  const options = (await page.getByRole("option").allInnerTexts()).map((text) => text.trim());
  await page.getByTestId("filter-year").press("Escape");
  return options;
}

test("TC-M5-020 UI-061 year 2025: cells and footer equal AN-901 formatted", async ({ page }) => {
  await openScreen(page, "nav-analytics-contracted", "analytics");
  await pick(page, "filter-year", "2025");
  await expect(page.locator('[data-testid^="row-"]')).toHaveCount(2);
  await expect(row(page, P2)).toContainText("Office Tower");
  expect(await cells(row(page, P2))).toEqual(["Beta Holding", "€500,000.00", "€100,000.00", "20.0 %"]);
  expect(await cells(row(page, P1))).toEqual(["Alpha Invest", "€100,000.00", "€100,000.00", "100.0 %"]);
  expect(await footer(page)).toEqual([
    "Projects: 2 (contracted in year: 2)",
    "",
    "€600,000.00",
    "€200,000.00",
    "33.3 %",
  ]);
});

test("TC-M5-021 UI-061 switching to 2026 updates the table; — for Villa Lake; Archived badge on School Annex", async ({
  page,
}) => {
  await openScreen(page, "nav-analytics-contracted", "analytics");
  await pick(page, "filter-year", "2025");
  await expect(page.locator('[data-testid^="row-"]')).toHaveCount(2);
  await pick(page, "filter-year", "2026");
  await expect(page.locator('[data-testid^="row-"]')).toHaveCount(3);
  expect(await cells(row(page, P2))).toEqual(["Beta Holding", "€50,000.00", "€150,000.00", "300.0 %"]);
  expect(await cells(row(page, P3))).toEqual(["Alpha Invest", "€30,000.00", "€15,000.00", "50.0 %"]);
  expect(await cells(row(page, P1))).toEqual(["Alpha Invest", "€0.00", "€5,000.00", "—"]);
  await expect(row(page, P3).getByText("Archived", { exact: true })).toBeVisible();
  await expect(row(page, P2).getByText("Archived", { exact: true })).toHaveCount(0);
  expect(await footer(page)).toEqual([
    "Projects: 3 (contracted in year: 2)",
    "",
    "€80,000.00",
    "€170,000.00",
    "212.5 %",
  ]);
});

test("TC-M5-022 UI-061 Gross toggle 2025: collected footer €240,000.00", async ({ page }) => {
  await openScreen(page, "nav-analytics-contracted", "analytics");
  await pick(page, "filter-year", "2025");
  await expect(page.getByTestId("table-footer")).toContainText("€200,000.00");
  await toggleSwitch(page, "toggle-gross");
  await expect(page.getByTestId("table-footer")).toContainText("€240,000.00");
  expect(await footer(page)).toEqual([
    "Projects: 2 (contracted in year: 2)",
    "",
    "€600,000.00",
    "€240,000.00",
    "33.3 %",
  ]);
  expect(await cells(row(page, P2))).toEqual(["Beta Holding", "€500,000.00", "€120,000.00", "20.0 %"]);
  await expect(page.getByRole("columnheader", { name: "Contracted (net)" })).toBeVisible();
});

test("TC-M5-023 UI-062 2026: expand Office Tower shows HVAC Pro and Struct Eng with AN-902 values", async ({
  page,
}) => {
  await openScreen(page, "nav-analytics-subcontractors", "analytics");
  await pick(page, "filter-year", "2026");
  await expect(row(page, P2)).toBeVisible();
  expect(await cells(row(page, P2))).toEqual([
    "€120,000.00",
    "€40,000.00",
    "33.3 %",
    "€150,000.00",
    "26.7 %",
    "€110,000.00",
    "73.3 %",
  ]);
  await expect(page.getByTestId(`btn-expand-${P3}`)).toHaveCount(0);
  await expect(page.getByTestId(`btn-expand-${P1}`)).toHaveCount(0);
  await page.getByTestId(`btn-expand-${P2}`).click();
  const hvac = page.getByTestId(`subrow-${P2}-${S2}`);
  const struct = page.getByTestId(`subrow-${P2}-${S1}`);
  await expect(hvac).toContainText("HVAC Pro");
  expect(await cells(hvac)).toEqual(["€40,000.00", "€10,000.00", "25.0 %", "", "6.7 %", "", ""]);
  await expect(struct).toContainText("Struct Eng");
  expect(await cells(struct)).toEqual(["€80,000.00", "€30,000.00", "37.5 %", "", "20.0 %", "", ""]);
  const order = await page.locator('[data-testid^="subrow-"]').allInnerTexts();
  expect(order[0]).toContain("HVAC Pro");
  expect(await footer(page)).toEqual([
    "",
    "€120,000.00",
    "€40,000.00",
    "33.3 %",
    "€170,000.00",
    "23.5 %",
    "€130,000.00",
    "76.5 %",
  ]);
});

test("TC-M5-024 UI-063 2027 shows Library with budget — and footer Projects: 1", async ({ page }) => {
  await openScreen(page, "nav-analytics-projects", "analytics");
  await pick(page, "filter-year", "2027");
  await expect(page.locator('[data-testid^="row-"]')).toHaveCount(1);
  await expect(row(page, P4)).toContainText("Library");
  expect(await cells(row(page, P4))).toEqual(["Beta Holding", "PLANNED", "01.05.2027", "—", "€0.00"]);
  expect(await footer(page)).toEqual(["Projects: 1", "", "", "", "€0.00", "€0.00"]);
});

test("TC-M5-025 UI-064 2026 footer net €130,000.00, margin 76.5 %", async ({ page }) => {
  await openScreen(page, "nav-analytics-net", "analytics");
  await pick(page, "filter-year", "2026");
  await expect(page.locator('[data-testid^="row-"]')).toHaveCount(3);
  expect(await cells(row(page, P2))).toEqual(["€150,000.00", "€40,000.00", "€110,000.00", "73.3 %"]);
  expect(await footer(page)).toEqual(["", "€170,000.00", "€40,000.00", "€130,000.00", "76.5 %"]);
});

test("TC-M5-026 clicking a project name in any analytics table opens its detail page", async ({ page }) => {
  const screens = [
    "nav-analytics-contracted",
    "nav-analytics-subcontractors",
    "nav-analytics-projects",
    "nav-analytics-net",
    "nav-analytics-budget",
  ];
  await openScreen(page, screens[0], "analytics");
  for (const screen of screens) {
    await page.getByTestId(screen).click();
    if (screen !== "nav-analytics-budget") await pick(page, "filter-year", "2026");
    await page.getByTestId(`row-${P2}`).getByRole("link", { name: "Office Tower" }).click();
    await expect(page).toHaveURL(new RegExp(`/projects/${P2}$`));
    await expect(page.getByTestId("screen-title")).toHaveText("Office Tower");
  }
});

test("TC-M5-027 year selector lists 2027, 2026, 2025 (+ All years on UI-061/062/064, not on UI-063)", async ({
  page,
}) => {
  await openScreen(page, "nav-analytics-contracted", "analytics");
  for (const screen of ["nav-analytics-contracted", "nav-analytics-subcontractors", "nav-analytics-net"]) {
    await page.getByTestId(screen).click();
    await expect(page.getByTestId("table-footer")).toBeVisible();
    expect(await yearOptions(page)).toEqual(["All years", "2027", "2026", "2025"]);
  }
  await page.getByTestId("nav-analytics-projects").click();
  await expect(page.getByTestId("table-footer")).toBeVisible();
  expect(await yearOptions(page)).toEqual(["2027", "2026", "2025"]);
});

test("TC-M5-028 UI-065: footer realisation 49.0 %, Villa Lake bar 87.5 %, Library —; no year selector", async ({
  page,
}) => {
  await openScreen(page, "nav-analytics-budget", "analytics");
  await expect(page.locator('[data-testid^="row-"]')).toHaveCount(4);
  await expect(page.getByTestId("filter-year")).toHaveCount(0);
  await expect(page.getByTestId("toggle-gross")).toHaveCount(0);
  expect(await footer(page)).toEqual([
    "",
    "",
    "",
    "€755,000.00",
    "€680,000.00",
    "90.1 %",
    "€470,000.00",
    "€370,000.00",
    "49.0 %",
    "54.4 %",
    "€385,000.00",
  ]);
  const bar = page.getByTestId(`bar-realisation-${P1}`);
  await expect(bar).toHaveAttribute("data-value", "87.5");
  await expect(bar.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "87.5");
  expect(await cells(row(page, P1))).toEqual([
    "Alpha Invest",
    "DONE",
    "€120,000.00",
    "€100,000.00",
    "83.3 %",
    "€105,000.00",
    "€105,000.00",
    "87.5 %",
    "105.0 %",
    "€15,000.00",
  ]);
  expect(await cells(row(page, P4))).toEqual([
    "Beta Holding",
    "PLANNED",
    "—",
    "€0.00",
    "—",
    "€0.00",
    "€0.00",
    "—",
    "—",
    "—",
  ]);
  await expect(page.getByTestId(`bar-realisation-${P4}`)).toHaveCount(0);

  await pick(page, "filter-status", "Active");
  await expect(page.locator('[data-testid^="row-"]')).toHaveCount(2);
  const active = await footer(page);
  expect([active[3], active[7], active[8]]).toEqual(["€635,000.00", "€265,000.00", "41.7 %"]);
});

test("TC-M5-029 UI-033: Office Tower detail shows realisation 41.7 % and remaining €350,000.00; Library has no card", async ({
  page,
}) => {
  await openScreen(page, "nav-analytics-budget", "analytics");
  await row(page, P2).getByRole("link", { name: "Office Tower" }).click();
  await expect(page.getByTestId("screen-title")).toHaveText("Office Tower");
  const card = page.getByTestId("card-realisation");
  await expect(card).toContainText("41.7 %");
  await expect(card).toContainText("€350,000.00");
  await expect(card).toContainText("€600,000.00");
  await expect(card).toContainText("€250,000.00");
  await expect(card.getByTestId("bar-realisation")).toHaveAttribute("data-value", "41.7");

  await page.getByTestId("nav-analytics-budget").click();
  await row(page, P4).getByRole("link", { name: "Library" }).click();
  await expect(page.getByTestId("screen-title")).toHaveText("Library");
  await expect(page.getByText("Planned").first()).toBeVisible();
  await expect(page.getByTestId("card-realisation")).toHaveCount(0);
});
