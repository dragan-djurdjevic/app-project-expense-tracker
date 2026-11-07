// Spec: UI-010, UI-011, UI-002a, UI-002b, BR-INV-001, BR-GEN-002, BR-GEN-004, BR-GEN-007
import { expect, test } from "@playwright/test";
import { archiveRow, drawer, openScreen, rowAction, rowByText, rows, toggleArchived } from "./helpers";

test("TC-M2-030 investors: create, edit, archive with confirm, show archived with badge, restore", async ({ page }) => {
  await openScreen(page, "nav-investors");
  await expect(page.getByTestId("screen-title")).toHaveText("Investors");
  await expect(page.getByRole("main")).toContainText("No records yet.");

  // Create via form → row appears.
  await page.getByTestId("btn-new").click();
  const create = drawer(page, "New Investor");
  await expect(create).toBeVisible();
  await page.getByTestId("field-name").fill("Alpha Invest");
  await page.getByTestId("field-vatNumber").fill("alpha001");
  await page.getByTestId("field-contactPerson").fill("Ana Alpha");
  await page.getByTestId("field-email").fill("ana@alpha.example");
  await page.getByTestId("btn-save").click();
  await expect(create).toBeHidden();
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();
  await expect(rows(page)).toHaveCount(1);
  const row = rowByText(page, "Alpha Invest");
  await expect(row).toContainText("ALPHA001");
  await expect(row).toContainText("Ana Alpha");

  // Edit name → updated.
  await row.click();
  const edit = drawer(page, "Edit Investor");
  await expect(edit).toBeVisible();
  await expect(page.getByTestId("field-name")).toHaveValue("Alpha Invest");
  await page.getByTestId("field-name").fill("Alpha Invest Ltd");
  await page.getByTestId("btn-save").click();
  await expect(edit).toBeHidden();
  await expect(rows(page)).toHaveCount(1);
  await expect(rows(page).first()).toContainText("Alpha Invest Ltd");

  // Archive with confirm → row hidden.
  await archiveRow(rowByText(page, "Alpha Invest Ltd"));
  await expect(rows(page)).toHaveCount(0);

  // Toggle archived → row visible with badge.
  await toggleArchived(page);
  await expect(rows(page)).toHaveCount(1);
  await expect(rows(page).first()).toContainText("Alpha Invest Ltd");
  await expect(rows(page).first()).toContainText("Archived");

  // Restore → active.
  await rowAction(rows(page).first(), "Restore");
  await expect(rows(page).first()).not.toContainText("Archived");
  await toggleArchived(page);
  await expect(rows(page)).toHaveCount(1);
  await expect(rows(page).first()).toContainText("Alpha Invest Ltd");
});

test("TC-M2-031 investor form shows field errors for empty name and duplicate VAT; drawer stays open", async ({
  page,
}) => {
  await openScreen(page, "nav-investors", "basic");
  await expect(rows(page)).toHaveCount(2);

  await page.getByTestId("btn-new").click();
  const form = drawer(page, "New Investor");
  await page.getByTestId("field-vatNumber").fill("NEW001");
  await page.getByTestId("btn-save").click();
  await expect(page.getByTestId("error-name")).toHaveText("This field is required.");
  await expect(form).toBeVisible();

  await page.getByTestId("field-name").fill("Alpha Copy");
  await page.getByTestId("field-vatNumber").fill("alpha001");
  await page.getByTestId("btn-save").click();
  await expect(page.getByTestId("error-vatNumber")).toHaveText("This VAT number is already in use.");
  await expect(page.getByTestId("error-name")).toHaveCount(0);
  await expect(form).toBeVisible();

  await page.getByTestId("btn-cancel").click();
  await expect(form).toBeHidden();
  await expect(rows(page)).toHaveCount(2);
});
