// Spec: UI-050, UI-051, UI-052, UI-053, UI-032, UI-002, UI-002a, UI-002b, DM-050, BR-IVC-005, BR-IVC-006, BR-IVC-008
import { expect, test, type Page } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { BASIC } from "../fixtures/basic";
import { drawer, openScreen, rowAction, rowByText, rows } from "./helpers";

const FILES = fileURLToPath(new URL("../fixtures/files/", import.meta.url));
const inv001 = `row-${BASIC.invoices.inv001}`;
const inv002 = `row-${BASIC.invoices.inv002}`;
const inv003 = `row-${BASIC.invoices.inv003}`;

async function fillDate(page: Page, testId: string, text: string): Promise<void> {
  await page.getByTestId(testId).fill(text);
  await page.getByTestId(testId).press("Tab");
  await expect(page.getByTestId(testId)).toHaveValue(text);
}

async function newInvoice(page: Page, contractLabel: string, number: string): Promise<void> {
  await page.getByTestId("btn-new").click();
  await expect(drawer(page, "New Invoice")).toBeVisible();
  await page.getByTestId("field-contractId").click();
  await page.getByRole("option", { name: contractLabel, exact: true }).click();
  await page.getByTestId("field-number").fill(number);
  await fillDate(page, "field-date", "01.09.2025");
}

test("TC-M4-020 create invoice: contract picker labels and computed VAT / gross", async ({ page }) => {
  await openScreen(page, "nav-invoices", "basic");
  await expect(page.getByTestId("screen-title")).toHaveText("Invoices");
  await expect(rows(page)).toHaveCount(5);

  await page.getByTestId("btn-new").click();
  await expect(drawer(page, "New Invoice")).toBeVisible();
  // Active contracts only (incl. those of the archived School Annex), sorted by number.
  await page.getByTestId("field-contractId").click();
  await expect(page.getByRole("option")).toHaveText([
    "S-001 — School Annex (In)",
    "S-OUT-1 — School Annex (Out)",
    "V-001 — Villa Lake (In)",
    "V-OUT-1 — Villa Lake (Out)",
  ]);
  await page.getByRole("option", { name: "V-001 — Villa Lake (In)", exact: true }).click();
  await expect(page.getByTestId("info-invoiced")).toHaveText(
    "Invoiced so far: €80,000.00 of contract value €100,000.00",
  );
  await expect(page.getByTestId("field-vatRate")).toHaveValue("20");
  await expect(page.getByTestId("field-vatAmount")).toHaveText("—");
  await page.getByTestId("field-value").fill("1000");
  await expect(page.getByTestId("field-vatAmount")).toHaveText("€200.00");
  await expect(page.getByTestId("field-gross")).toHaveText("€1,200.00");

  await page.getByTestId("field-number").fill("INV-005");
  await fillDate(page, "field-date", "01.09.2025");
  await page.getByTestId("btn-save").click();
  await expect(drawer(page, "New Invoice")).toBeHidden();
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();
  const row = rowByText(page, "INV-005");
  await expect(row).toContainText("V-001");
  await expect(row).toContainText("Villa Lake");
  await expect(row).toContainText("01.09.2025");
  await expect(row).toContainText("€1,000.00");
  await expect(row).toContainText("20 %");
  await expect(row).toContainText("€1,200.00");
  await expect(row.getByText("Draft", { exact: true })).toBeVisible();
  await expect(rows(page).nth(0)).toContainText("INV-005");
});

test("TC-M4-021 status select offers only allowed next statuses", async ({ page }) => {
  await openScreen(page, "nav-invoices", "basic");
  await page.getByTestId("btn-new").click();
  await expect(page.getByTestId("field-status")).toHaveValue("Draft");
  await page.getByTestId("field-status").click();
  await expect(page.getByRole("option")).toHaveText(["Draft", "Issued", "Cancelled"]);
  await page.getByTestId("field-status").press("Escape");
  await page.getByTestId("btn-cancel").click();

  // Edit of an ISSUED invoice: current status first, then the allowed next statuses in enum order.
  await page.getByTestId(inv002).click();
  await expect(drawer(page, "Edit Invoice")).toBeVisible();
  await expect(page.getByTestId("field-contractId")).toBeDisabled();
  await page.getByTestId("field-status").click();
  await expect(page.getByRole("option")).toHaveText(["Issued", "Draft", "Paid", "Cancelled"]);
});

test("TC-M4-022 attach sample.pdf in the create form; list shows the icon; edit shows the file name link", async ({
  page,
}) => {
  await openScreen(page, "nav-invoices", "basic");
  await newInvoice(page, "V-OUT-1 — Villa Lake (Out)", "SI-002");
  await page.getByTestId("field-value").fill("100");
  await expect(page.getByTestId("btn-attach")).toBeVisible();
  await page.getByTestId("input-attach").setInputFiles(`${FILES}sample.pdf`);
  await expect(page.getByTestId("link-attachment")).toHaveText("sample.pdf");
  await page.getByTestId("btn-save").click();
  await expect(drawer(page, "New Invoice")).toBeHidden();

  const row = rowByText(page, "SI-002");
  await expect(row.getByTestId("icon-attachment")).toBeVisible();
  await expect(page.getByTestId(inv003).getByTestId("icon-attachment")).toHaveCount(0);
  await row.click();
  await expect(drawer(page, "Edit Invoice")).toBeVisible();
  await expect(page.getByTestId("link-attachment")).toHaveText("sample.pdf");
  await expect(page.getByTestId("btn-replace")).toBeVisible();
  await expect(page.getByTestId("btn-remove-attachment")).toBeVisible();
});

test("TC-M4-023 attaching image.png shows the notPdf error", async ({ page }) => {
  await openScreen(page, "nav-invoices", "basic");
  await page.getByTestId("btn-new").click();
  await page.getByTestId("input-attach").setInputFiles(`${FILES}image.png`);
  await expect(page.getByTestId("error-attachment")).toHaveText("The file must be a PDF.");
  await expect(page.getByTestId("link-attachment")).toHaveCount(0);
});

test("TC-M4-024 remove attachment with confirm, save → icon gone", async ({ page }) => {
  await openScreen(page, "nav-invoices", "basic");
  await expect(page.getByTestId(inv001).getByTestId("icon-attachment")).toBeVisible();
  await page.getByTestId(inv001).click();
  await expect(drawer(page, "Edit Invoice")).toBeVisible();
  await expect(page.getByTestId("link-attachment")).toHaveText("sample.pdf");

  await page.getByTestId("btn-remove-attachment").click();
  const confirm = page.getByTestId("confirm-remove-attachment");
  await expect(confirm).toBeVisible();
  await confirm.getByRole("button", { name: "Remove" }).click();
  await expect(confirm).toBeHidden();
  await expect(page.getByTestId("link-attachment")).toHaveCount(0);
  await expect(page.getByTestId("btn-attach")).toBeVisible();
  await page.getByTestId("btn-save").click();
  await expect(drawer(page, "Edit Invoice")).toBeHidden();
  await expect(page.getByTestId(inv001).getByTestId("icon-attachment")).toHaveCount(0);
});

test("TC-M4-025 over-invoicing warning appears when net exceeds the remaining contract value", async ({ page }) => {
  await openScreen(page, "nav-invoices", "basic");
  await newInvoice(page, "V-001 — Villa Lake (In)", "INV-006");
  // V-001: value €100,000.00, invoiced so far €80,000.00 → €20,000.00 remaining.
  await page.getByTestId("field-value").fill("20000");
  await expect(page.getByTestId("warn-over-invoiced")).toHaveCount(0);
  await page.getByTestId("field-value").fill("20000.01");
  await expect(page.getByTestId("warn-over-invoiced")).toHaveText(
    "Saving this invoice will exceed the contract value.",
  );
  await page.getByTestId("btn-save").click();
  await expect(drawer(page, "New Invoice")).toBeHidden();
  await expect(rowByText(page, "INV-006")).toContainText("€20,000.01");
});

test("TC-M4-026 ISSUED invoice with due date in the past shows the due date in red", async ({ page }) => {
  await openScreen(page, "nav-invoices", "basic");
  const overdue = page.getByTestId(inv002).getByText("30.06.2025", { exact: true });
  const paid = page.getByTestId(inv001).getByText("31.03.2025", { exact: true });
  await expect(overdue).toBeVisible();
  await expect(paid).toBeVisible();
  const color = (locator: typeof overdue) => locator.evaluate((el) => getComputedStyle(el).color);
  const red = await page.evaluate(() => {
    const probe = document.createElement("span");
    probe.style.color = "var(--mantine-color-red-text)";
    document.body.appendChild(probe);
    const value = getComputedStyle(probe).color;
    probe.remove();
    return value;
  });
  expect(await color(overdue)).toBe(red);
  expect(await color(paid)).not.toBe(red);
});

test("TC-M4-027 project detail Invoices tab and summary cards reflect seeded invoices", async ({ page }) => {
  await openScreen(page, "nav-projects", "basic");
  await rowAction(page.getByTestId(`row-${BASIC.projects.villa}`), "Open");
  await expect(page.getByTestId("screen-title")).toHaveText("Villa Lake");
  const main = page.getByRole("main");
  // Summary cards (the Invoices table also has a "Net" header).
  const card = (label: string) =>
    main.locator(".mantine-Paper-root").filter({ has: page.getByText(label, { exact: true }) });
  await expect(card("Collected")).toContainText("€40,000.00");
  await expect(card("Paid to subcontractors")).toContainText("€15,000.00");
  await expect(card("Net")).toContainText("€25,000.00");

  await main.getByRole("tab", { name: "Invoices" }).click();
  await expect(rows(page)).toHaveCount(5);
  await expect(page.getByTestId("filter-project")).toHaveCount(0);
  await expect(page.getByTestId("filter-status")).toBeVisible();
  await expect(page.getByTestId("filter-type")).toBeVisible();
  await expect(page.getByTestId(inv001)).toContainText("Villa Lake");

  // Marking INV-002 as paid reloads the cards.
  await page.getByTestId(inv002).click();
  await page.getByTestId("field-status").click();
  await page.getByRole("option", { name: "Paid", exact: true }).click();
  await page.getByTestId("btn-save").click();
  await expect(drawer(page, "Edit Invoice")).toBeHidden();
  await expect(card("Collected")).toContainText("€70,000.00");
  await expect(card("Net")).toContainText("€55,000.00");

  // New invoice from the tab: only this project's active contracts.
  await page.getByTestId("btn-new").click();
  await page.getByTestId("field-contractId").click();
  await expect(page.getByRole("option")).toHaveText(["V-001 — Villa Lake (In)", "V-OUT-1 — Villa Lake (Out)"]);
});
