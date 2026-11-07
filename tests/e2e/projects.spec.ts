// Spec: UI-030, UI-031, UI-032, UI-002, UI-002a, UI-002b, BR-GEN-006, BR-GEN-007, AN-3
import { expect, test } from "@playwright/test";
import { BASIC } from "../fixtures/basic";
import { archiveRow, drawer, openScreen, pick, rowAction, rowByText, rows, toggleArchived } from "./helpers";

const villa = `row-${BASIC.projects.villa}`;
const tower = `row-${BASIC.projects.tower}`;
const school = `row-${BASIC.projects.school}`;

test("TC-M2-033 projects: create with investor picker (no archived investors), status badge, deadline and budget formatted", async ({
  page,
}) => {
  await openScreen(page, "nav-investors", "basic");
  await archiveRow(rowByText(page, "Beta Holding"));
  await page.getByTestId("nav-projects").click();
  await expect(page.getByTestId("screen-title")).toHaveText("Projects");

  await page.getByTestId("btn-new").click();
  const form = drawer(page, "New Project");
  await expect(form).toBeVisible();
  await expect(page.getByTestId("field-status")).toHaveValue("Planned");
  await page.getByTestId("field-investorId").click();
  await expect(page.getByRole("option")).toHaveText(["Alpha Invest"]);
  await page.getByRole("option", { name: "Alpha Invest", exact: true }).click();
  await page.getByTestId("field-name").fill("Library");
  await page.getByTestId("field-deadline").fill("01.05.2027");
  await page.getByTestId("field-deadline").press("Tab");
  await expect(page.getByTestId("field-deadline")).toHaveValue("01.05.2027");
  await page.getByTestId("field-budget").fill("1,234.56");
  await page.getByTestId("btn-save").click();
  await expect(form).toBeHidden();

  const row = rowByText(page, "Library");
  await expect(row).toHaveCount(1);
  await expect(row).toContainText("Alpha Invest");
  await expect(row.getByText("Planned", { exact: true })).toBeVisible();
  await expect(row).toContainText("01.05.2027");
  await expect(row).toContainText("€1,234.56");
  await expect(page.getByTestId(tower)).toContainText("€600,000.00");
});

test("TC-M2-034 projects: status filter and year filter narrow the list", async ({ page }) => {
  await openScreen(page, "nav-projects", "basic");
  await expect(rows(page)).toHaveCount(2);
  await expect(page.getByTestId(villa)).toBeVisible();
  await expect(page.getByTestId(tower)).toBeVisible();

  await pick(page, "filter-status", "Done");
  await expect(rows(page)).toHaveCount(1);
  await expect(page.getByTestId(villa)).toBeVisible();
  await pick(page, "filter-status", "Active");
  await expect(rows(page)).toHaveCount(2);
  await pick(page, "filter-status", "Done");
  await expect(rows(page)).toHaveCount(1);
  await expect(page.getByTestId(tower)).toBeVisible();

  // Status "Active" + year 2025 → no row; the status filter is then cleared again.
  await pick(page, "filter-year", "2025");
  await expect(rows(page)).toHaveCount(0);
  await pick(page, "filter-status", "Active");
  await expect(rows(page)).toHaveCount(1);
  await expect(page.getByTestId(villa)).toBeVisible();
  await pick(page, "filter-year", "2026");
  await expect(rows(page)).toHaveCount(1);
  await expect(page.getByTestId(tower)).toBeVisible();

  await page.getByTestId("filter-year").click();
  await expect(page.getByRole("option")).toHaveText(["All years", "2026", "2025"]);
  await page.getByRole("option", { name: "All years", exact: true }).click();
  await expect(rows(page)).toHaveCount(2);
});

test("TC-M2-035 archived row opens a read-only view with a Restore button only", async ({ page }) => {
  await openScreen(page, "nav-projects", "basic");
  await expect(page.getByTestId(school)).toHaveCount(0);
  await toggleArchived(page);
  await expect(page.getByTestId(school)).toContainText("Archived");

  await page.getByTestId(school).click();
  const view = drawer(page, "Project");
  await expect(view).toBeVisible();
  await expect(page.getByTestId("field-name")).toHaveValue("School Annex");
  await expect(page.getByTestId("field-name")).toBeDisabled();
  await expect(page.getByTestId("field-budget")).toBeDisabled();
  await expect(view.getByRole("button", { name: "Restore" })).toBeVisible();
  await expect(page.getByTestId("btn-save")).toHaveCount(0);
  await expect(page.getByTestId("btn-cancel")).toHaveCount(0);

  await view.getByRole("button", { name: "Restore" }).click();
  await expect(view).toBeHidden();
  await expect(page.getByTestId(school)).not.toContainText("Archived");
  await page.getByTestId(school).click();
  await expect(drawer(page, "Edit Project")).toBeVisible();
  await expect(page.getByTestId("btn-save")).toBeVisible();
});

test("TC-M2-036 project detail page shows header data and summary cards with zero values", async ({ page }) => {
  await openScreen(page, "nav-projects", "basic");
  await rowAction(page.getByTestId(tower), "Open");
  await expect(page).toHaveURL(new RegExp(`/projects/${BASIC.projects.tower}$`));

  const main = page.getByRole("main");
  await expect(page.getByTestId("screen-title")).toHaveText("Office Tower");
  await expect(main).toContainText("Beta Holding");
  await expect(main.getByText("Active", { exact: true })).toBeVisible();
  await expect(main).toContainText("31.12.2026");
  await expect(main).toContainText("€600,000.00");
  for (const card of ["Contracted", "Collected", "Contracted to subcontractors", "Paid to subcontractors", "Net"]) {
    await expect(main.getByText(card, { exact: true }).locator("..")).toContainText("€0.00");
  }
  await expect(main.getByRole("tab", { name: "Contracts" })).toBeVisible();
  await expect(main).toContainText("Coming in M3");
  await main.getByRole("tab", { name: "Invoices" }).click();
  await expect(main).toContainText("Coming in M4");
});
