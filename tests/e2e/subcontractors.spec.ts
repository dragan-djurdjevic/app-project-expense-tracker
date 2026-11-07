// Spec: UI-020, UI-021, UI-002a, UI-002b, BR-GEN-004
import { expect, test } from "@playwright/test";
import { archiveRow, drawer, openScreen, rowByText, rows } from "./helpers";

test("TC-M2-032 subcontractors: create, search by industry, archive", async ({ page }) => {
  await openScreen(page, "nav-subcontractors", "basic");
  await expect(page.getByTestId("screen-title")).toHaveText("Subcontractors");
  await expect(rows(page)).toHaveCount(2);

  await page.getByTestId("btn-new").click();
  const form = drawer(page, "New Subcontractor");
  await page.getByTestId("field-name").fill("Facade Masters");
  await page.getByTestId("field-vatNumber").fill("FAC01");
  await page.getByTestId("field-industry").fill("Facades");
  await page.getByTestId("btn-save").click();
  await expect(form).toBeHidden();
  await expect(rows(page)).toHaveCount(3);
  await expect(rowByText(page, "Facade Masters")).toContainText("Facades");

  await page.getByTestId("list-search").fill("hvac");
  await expect(rows(page)).toHaveCount(1);
  await expect(rows(page).first()).toContainText("HVAC Pro");
  await page.getByTestId("list-search").fill("FACAD");
  await expect(rows(page)).toHaveCount(1);
  await expect(rows(page).first()).toContainText("Facade Masters");
  await page.getByTestId("list-search").fill("nothing-like-this");
  await expect(rows(page)).toHaveCount(0);
  await expect(page.getByRole("main")).toContainText("No records match your search.");
  await page.getByTestId("list-search").fill("");
  await expect(rows(page)).toHaveCount(3);

  await archiveRow(rowByText(page, "Facade Masters"));
  await expect(rows(page)).toHaveCount(2);
  await expect(rowByText(page, "Facade Masters")).toHaveCount(0);
});
