// Spec: UI-080, UI-090, UI-091, UI-002, UI-001, AN-901, DM-060
import { expect, test, type Page } from "@playwright/test";
import { openScreen, pick, setLanguage } from "./helpers";

/** UI-001 sidebar items with their en and sr-Latn (UI-091) labels. */
const NAV = [
  { testId: "nav-projects", en: "Projects", sr: "Projekti" },
  { testId: "nav-contracts", en: "Contracts", sr: "Ugovori" },
  { testId: "nav-invoices", en: "Invoices", sr: "Fakture" },
  { testId: "nav-investors", en: "Investors", sr: "Investitori" },
  { testId: "nav-subcontractors", en: "Subcontractors", sr: "Podizvođači" },
  { testId: "nav-analytics-contracted", en: "Contracted vs collected", sr: "Ugovoreno i naplaćeno" },
  { testId: "nav-analytics-subcontractors", en: "Subcontractor payments", sr: "Plaćanja podizvođačima" },
  { testId: "nav-analytics-projects", en: "Projects per year", sr: "Projekti po godinama" },
  { testId: "nav-analytics-net", en: "Net result", sr: "Neto rezultat" },
  { testId: "nav-analytics-budget", en: "Budget realisation", sr: "Realizacija budžeta" },
  { testId: "nav-settings", en: "Settings", sr: "Podešavanja" },
] as const;

const ENGLISH_SIDEBAR_LABELS = [...NAV.map((item) => item.en), "Analytics"];
/** U+00A0 produced by `Intl` before the currency symbol (UI-002). */
const NBSP = String.fromCharCode(0xa0);
const UNTRANSLATED_KEY = /^[a-z]+(\.[a-zA-Z]+)+$/;

async function visibleTexts(page: Page): Promise<string[]> {
  const text = await page.locator("body").innerText();
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/** Opens Settings (optionally seeding a fixture) and switches the UI to Serbian (Latin). */
async function openInSerbian(page: Page, fixture?: string): Promise<void> {
  await openScreen(page, "nav-settings", fixture);
  await setLanguage(page, "Srpski (latinica)");
}

test("TC-M6-008 settings: switching to Srpski (latinica) applies immediately, survives navigation, English restores", async ({
  page,
}) => {
  await openScreen(page, "nav-settings");
  await expect(page.getByTestId("field-language")).toHaveValue("English");

  await setLanguage(page, "Srpski (latinica)");
  await expect(page.getByTestId("nav-projects")).toHaveText("Projekti");
  await expect(page.getByTestId("nav-settings")).toHaveText("Podešavanja");
  await expect(page.getByTestId("screen-title")).toHaveText("Podešavanja");

  // Client-side navigation only: browser mode keeps the DB in memory (AR-009).
  await page.getByTestId("nav-projects").click();
  await expect(page.getByTestId("screen-title")).toHaveText("Projekti");
  await page.getByTestId("nav-settings").click();
  await expect(page.getByTestId("screen-title")).toHaveText("Podešavanja");
  await expect(page.getByTestId("nav-projects")).toHaveText("Projekti");
  await expect(page.getByTestId("field-language")).toHaveValue("Srpski (latinica)");

  await setLanguage(page, "English");
  await expect(page.getByTestId("nav-projects")).toHaveText("Projects");
  await expect(page.getByTestId("nav-settings")).toHaveText("Settings");
});

test("TC-M6-009 Serbian, seed analytics, UI-061 year 2025: footer contracted 600.000,00 € and percent 33,3 %", async ({
  page,
}) => {
  await openInSerbian(page, "analytics");
  await page.getByTestId("nav-analytics-contracted").click();
  await expect(page.getByTestId("screen-title")).toHaveText("Ugovoreno i naplaćeno");
  await pick(page, "filter-year", "2025");
  await expect(page.locator('[data-testid^="row-"]')).toHaveCount(2);

  const footer = (await page.getByTestId("table-footer").locator("td").allInnerTexts()).map((text) =>
    text.trim().replaceAll(NBSP, " "),
  );
  expect(footer).toEqual(["Projekti: 2 (ugovoreno u godini: 2)", "", "600.000,00 €", "200.000,00 €", "33,3 %"]);
});

test("TC-M6-010 Serbian: no untranslated keys and no English sidebar labels on any UI-001 screen", async ({ page }) => {
  await openInSerbian(page, "basic");
  for (const item of NAV) {
    await page.getByTestId(item.testId).click();
    await expect(page.getByTestId("screen-title")).toHaveText(item.sr);
    const texts = await visibleTexts(page);
    expect(
      texts.filter((line) => UNTRANSLATED_KEY.test(line)),
      `untranslated keys on ${item.testId}`,
    ).toEqual([]);
    expect(
      texts.filter((line) => ENGLISH_SIDEBAR_LABELS.some((label) => line.includes(label))),
      `English sidebar labels on ${item.testId}`,
    ).toEqual([]);
  }
});

test("TC-M6-011 Serbian: contract date picker shows Serbian month names; typing 05.03.2026 saves 2026-03-05", async ({
  page,
}) => {
  await openInSerbian(page, "basic");
  await page.getByTestId("nav-contracts").click();
  await expect(page.getByTestId("screen-title")).toHaveText("Ugovori");
  await page.getByTestId("btn-new").click();
  const form = page.getByRole("dialog", { name: "Novi ugovor" });
  await expect(form).toBeVisible();

  await pick(page, "field-projectId", "Office Tower");
  await page.getByTestId("field-number").fill("SR-001");
  await page.getByTestId("field-date").fill("05.03.2026");
  await expect(page.locator('[class*="calendarHeaderLevel"]')).toHaveText(/^mart 2026$/i);
  await page.getByTestId("field-date").press("Tab");
  await expect(page.getByTestId("field-date")).toHaveValue("05.03.2026");
  await page.getByTestId("field-value").fill("1.000,00");
  await page.getByTestId("btn-save").click();
  await expect(form).toBeHidden();
  await expect(page.getByText("Sačuvano", { exact: true }).last()).toBeVisible();

  const row = page.locator('[data-testid^="row-"]').filter({ hasText: "SR-001" });
  await expect(row).toHaveCount(1);
  await expect(row).toContainText("05.03.2026");
  await expect(row).toContainText("1.000,00");
});
