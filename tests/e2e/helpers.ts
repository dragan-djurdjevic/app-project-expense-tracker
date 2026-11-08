// Spec: AR-009, UI-001, UI-002a, UI-060, UI-080, UI-090
import { expect, type Locator, type Page } from "@playwright/test";

/**
 * Opens the app on Settings, optionally seeds a fixture via `window.__TEST__`, then navigates client-side to the
 * given sidebar item so the screen loads the seeded data (browser-mode DB is in memory, AR-009).
 */
export async function openScreen(page: Page, navTestId: string, fixture?: string): Promise<void> {
  await page.goto("/settings");
  await expect(page.getByTestId("screen-title")).toHaveText("Settings");
  if (fixture) {
    await page.evaluate((name) => window.__TEST__?.seed(name), fixture);
  }
  await page.getByTestId(navTestId).click();
}

/** Table rows (`data-testid="row-<id>"`). */
export function rows(page: Page): Locator {
  return page.locator('[data-testid^="row-"]');
}

export function rowByText(page: Page, text: string): Locator {
  return rows(page).filter({ hasText: text });
}

/** Opens the row action menu and clicks an item (Open, Edit, Archive, Restore). */
export async function rowAction(row: Locator, item: string): Promise<void> {
  await row.getByRole("button", { name: "Actions" }).click();
  await row.page().getByRole("menuitem", { name: item, exact: true }).click();
}

/** Archives a row via its action menu and the confirm dialog (`confirm-archive`). */
export async function archiveRow(row: Locator): Promise<void> {
  await rowAction(row, "Archive");
  const dialog = row.page().getByTestId("confirm-archive");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Archive" }).click();
  await expect(dialog).toBeHidden();
}

/** Picks options of a Mantine Select / MultiSelect identified by its `data-testid`, then closes the dropdown. */
export async function pick(page: Page, testId: string, ...options: string[]): Promise<void> {
  await page.getByTestId(testId).click();
  for (const option of options) {
    await page.getByRole("option", { name: option, exact: true }).click();
  }
  if (await page.getByRole("listbox").isVisible()) {
    await page.getByTestId(testId).press("Escape");
  }
  await expect(page.getByRole("listbox")).toBeHidden();
}

/** Clicks the "Show archived" switch (`toggle-archived`; Mantine keeps the input itself off-screen). */
export async function toggleArchived(page: Page): Promise<void> {
  const id = await page.getByTestId("toggle-archived").getAttribute("id");
  await page.locator(`label[for="${id}"]`).first().click();
}

export function drawer(page: Page, title: string): Locator {
  return page.getByRole("dialog", { name: title });
}

/** Clicks a Mantine Switch identified by its `data-testid` (e.g. `toggle-gross`). */
export async function toggleSwitch(page: Page, testId: string): Promise<void> {
  const id = await page.getByTestId(testId).getAttribute("id");
  await page.locator(`label[for="${id}"]`).first().click();
}

/** UI-080: on the Settings screen, selects a language option (e.g. "Srpski (latinica)") and saves. */
export async function setLanguage(page: Page, option: "English" | "Srpski (latinica)"): Promise<void> {
  await pick(page, "field-language", option);
  await page.getByTestId("btn-save").click();
  await expect(page.getByText(option === "English" ? "Saved" : "Sačuvano", { exact: true })).toBeVisible();
}
