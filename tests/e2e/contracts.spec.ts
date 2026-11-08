// Spec: UI-040, UI-041, UI-032, UI-002, UI-002a, UI-002b, DM-040, BR-CON-002, BR-CON-005
import { expect, test, type Page } from "@playwright/test";
import { BASIC } from "../fixtures/basic";
import { drawer, openScreen, pick, rowAction, rowByText, rows, toggleArchived } from "./helpers";

const villaIn = `row-${BASIC.contracts.villaIn}`;
const villaOut = `row-${BASIC.contracts.villaOut}`;
const schoolIn = `row-${BASIC.contracts.schoolIn}`;
const schoolOut = `row-${BASIC.contracts.schoolOut}`;

async function fillDate(page: Page, testId: string, text: string): Promise<void> {
  await page.getByTestId(testId).fill(text);
  await page.getByTestId(testId).press("Tab");
  await expect(page.getByTestId(testId)).toHaveValue(text);
}

test("TC-M3-020 create INCOMING contract: subcontractor picker hidden, investor name shown read-only", async ({
  page,
}) => {
  await openScreen(page, "nav-contracts", "basic");
  await expect(page.getByTestId("screen-title")).toHaveText("Contracts");
  await expect(rows(page)).toHaveCount(4);

  await page.getByTestId("btn-new").click();
  const form = drawer(page, "New Contract");
  await expect(form).toBeVisible();
  await expect(page.getByTestId("field-type").getByRole("radio", { name: "Incoming" })).toBeChecked();
  await expect(page.getByTestId("field-subcontractorId")).toHaveCount(0);
  await expect(page.getByTestId("field-investorName")).toHaveText("—");

  // Project picker: active projects only, sorted by name.
  await page.getByTestId("field-projectId").click();
  await expect(page.getByRole("option")).toHaveText(["Office Tower", "Villa Lake"]);
  await page.getByRole("option", { name: "Office Tower", exact: true }).click();
  await expect(page.getByTestId("field-investorName")).toHaveText("Beta Holding");
  await page.getByTestId("field-number").fill("T-001");
  await fillDate(page, "field-date", "20.01.2026");
  await page.getByTestId("field-value").fill("250,000.00");
  await page.getByTestId("btn-save").click();
  await expect(form).toBeHidden();
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();

  const row = rowByText(page, "T-001");
  await expect(row).toHaveCount(1);
  await expect(row.getByText("In", { exact: true })).toBeVisible();
  await expect(row).toContainText("Office Tower");
  await expect(row).toContainText("Beta Holding");
  await expect(row).toContainText("20.01.2026");
  await expect(row).toContainText("€250,000.00");
  // Default sort: date desc, then number asc → S-OUT-1 (05.02.2026), S-001 and T-001 (both 20.01.2026), ...
  await expect(rows(page).nth(0)).toContainText("S-OUT-1");
  await expect(rows(page).nth(1)).toContainText("S-001");
  await expect(rows(page).nth(2)).toContainText("T-001");
});

test("TC-M3-021 create OUTGOING: switching type shows subcontractor picker; saving without it shows field error", async ({
  page,
}) => {
  await openScreen(page, "nav-contracts", "basic");
  await page.getByTestId("btn-new").click();
  const form = drawer(page, "New Contract");
  await expect(form).toBeVisible();

  await page.getByTestId("field-type").getByText("Outgoing", { exact: true }).click();
  await expect(page.getByTestId("field-subcontractorId")).toBeVisible();
  await expect(page.getByTestId("field-investorName")).toHaveCount(0);
  await pick(page, "field-projectId", "Villa Lake");
  await page.getByTestId("field-number").fill("V-OUT-2");
  await fillDate(page, "field-date", "01.04.2025");
  await page.getByTestId("field-value").fill("1000");
  await page.getByTestId("btn-save").click();

  await expect(page.getByTestId("error-subcontractorId")).toHaveText(
    "A subcontractor is required for outgoing contracts.",
  );
  await expect(form).toBeVisible();

  await page.getByTestId("field-subcontractorId").click();
  await expect(page.getByRole("option")).toHaveText(["HVAC Pro", "Struct Eng"]);
  await page.getByRole("option", { name: "HVAC Pro", exact: true }).click();
  await page.getByTestId("btn-save").click();
  await expect(form).toBeHidden();
  const row = rowByText(page, "V-OUT-2");
  await expect(row.getByText("Out", { exact: true })).toBeVisible();
  await expect(row).toContainText("HVAC Pro");
});

test("TC-M3-022 edit form: type and project are not editable", async ({ page }) => {
  await openScreen(page, "nav-contracts", "basic");

  await page.getByTestId(villaIn).click();
  const form = drawer(page, "Edit Contract");
  await expect(form).toBeVisible();
  for (const radio of await page.getByTestId("field-type").getByRole("radio").all()) {
    await expect(radio).toBeDisabled();
  }
  await expect(page.getByTestId("field-type").getByRole("radio", { name: "Incoming" })).toBeChecked();
  await expect(page.getByTestId("field-projectId")).toBeDisabled();
  await expect(page.getByTestId("field-projectId")).toHaveValue("Villa Lake");
  await expect(page.getByTestId("field-investorName")).toHaveText("Alpha Invest");
  await expect(page.getByTestId("field-number")).toBeEnabled();
  await page.getByTestId("field-value").fill("120,000.00");
  await page.getByTestId("btn-save").click();
  await expect(form).toBeHidden();
  await expect(page.getByTestId(villaIn)).toContainText("€120,000.00");

  // OUTGOING contract on the archived project School Annex: the project is still shown (disabled).
  await page.getByTestId(schoolOut).click();
  await expect(drawer(page, "Edit Contract")).toBeVisible();
  await expect(page.getByTestId("field-type").getByRole("radio", { name: "Outgoing" })).toBeChecked();
  await expect(page.getByTestId("field-type").getByRole("radio", { name: "Incoming" })).toBeDisabled();
  await expect(page.getByTestId("field-projectId")).toBeDisabled();
  await expect(page.getByTestId("field-projectId")).toHaveValue("School Annex");
  await expect(page.getByTestId("field-subcontractorId")).toHaveValue("HVAC Pro");
  await expect(page.getByTestId("field-subcontractorId")).toBeEnabled();
});

test('TC-M3-023 type filter "Outgoing" shows only OUTGOING rows with "Out" badge', async ({ page }) => {
  await openScreen(page, "nav-contracts", "basic");
  await expect(rows(page)).toHaveCount(4);

  await page.getByTestId("filter-type").click();
  await expect(page.getByRole("option")).toHaveText(["All", "Incoming", "Outgoing"]);
  await page.getByRole("option", { name: "Outgoing", exact: true }).click();
  await expect(rows(page)).toHaveCount(2);
  await expect(page.getByTestId(villaOut)).toBeVisible();
  await expect(page.getByTestId(schoolOut)).toBeVisible();
  for (const row of await rows(page).all()) {
    await expect(row.getByText("Out", { exact: true })).toBeVisible();
    await expect(row.getByText("In", { exact: true })).toHaveCount(0);
  }

  await pick(page, "filter-type", "Incoming");
  await expect(rows(page)).toHaveCount(2);
  await expect(page.getByTestId(villaIn)).toBeVisible();
  await expect(page.getByTestId(schoolIn)).toBeVisible();

  // Project filter: "All projects", then all projects incl. archived, sorted by name.
  await pick(page, "filter-type", "All");
  await page.getByTestId("filter-project").click();
  await expect(page.getByRole("option")).toHaveText(["All projects", "Office Tower", "School Annex", "Villa Lake"]);
  await page.getByRole("option", { name: "School Annex", exact: true }).click();
  await expect(rows(page)).toHaveCount(2);
  await expect(page.getByTestId(schoolIn)).toBeVisible();
  await expect(page.getByTestId(schoolOut)).toBeVisible();
});

test("TC-M3-024 project detail Contracts tab lists only that project's contracts", async ({ page }) => {
  await openScreen(page, "nav-projects", "basic");
  await rowAction(page.getByTestId(`row-${BASIC.projects.villa}`), "Open");
  await expect(page.getByTestId("screen-title")).toHaveText("Villa Lake");
  const main = page.getByRole("main");
  const card = (label: string) => main.getByText(label, { exact: true }).locator("..");

  await expect(main.getByRole("tab", { name: "Contracts" })).toHaveAttribute("aria-selected", "true");
  await expect(rows(page)).toHaveCount(2);
  await expect(page.getByTestId(villaIn)).toBeVisible();
  await expect(page.getByTestId(villaOut)).toBeVisible();
  await expect(page.getByTestId(villaIn)).toContainText("Villa Lake");
  await expect(page.getByTestId("filter-project")).toHaveCount(0);
  await expect(page.getByTestId("filter-type")).toBeVisible();
  await expect(card("Contracted")).toContainText("€100,000.00");
  await expect(card("Contracted to subcontractors")).toContainText("€30,000.00");

  // "New" presets the project (disabled); the summary cards reload after saving.
  await page.getByTestId("btn-new").click();
  await expect(drawer(page, "New Contract")).toBeVisible();
  await expect(page.getByTestId("field-projectId")).toHaveValue("Villa Lake");
  await expect(page.getByTestId("field-projectId")).toBeDisabled();
  await expect(page.getByTestId("field-investorName")).toHaveText("Alpha Invest");
  await page.getByTestId("field-number").fill("V-002");
  await fillDate(page, "field-date", "01.06.2025");
  await page.getByTestId("field-value").fill("5000");
  await page.getByTestId("btn-save").click();
  await expect(drawer(page, "New Contract")).toBeHidden();
  await expect(rows(page)).toHaveCount(3);
  await expect(card("Contracted")).toContainText("€105,000.00");

  // Archived project School Annex: its contracts are listed, "New" is hidden.
  await page.getByTestId("nav-projects").click();
  await toggleArchived(page);
  await rowAction(page.getByTestId(`row-${BASIC.projects.school}`), "Open");
  await expect(page.getByTestId("screen-title")).toHaveText("School Annex");
  await expect(rows(page)).toHaveCount(2);
  await expect(page.getByTestId(schoolIn)).toBeVisible();
  await expect(page.getByTestId(schoolOut)).toBeVisible();
  await expect(page.getByTestId("btn-new")).toHaveCount(0);
});
