// Spec: DEMO-002
import { describe, expect, it } from "vitest";
import { localDateOnly } from "../../../src/core/domain/Invoice";
import { demoDueDate, resolveDemoDate } from "../../../src/app/demo/resolveDemoDate";
import { fixedClock } from "../../fixtures/fixedClock";

const todayOf = (year: number, month: number, day: number) =>
  localDateOnly(fixedClock(new Date(year, month - 1, day, 12).toISOString()).now());

describe("DEMO-002 relative dates", () => {
  it("TC-M7-002 resolves Y-offset dates, clamps offset 0 to today and adds 30 days for the due date", () => {
    const june = todayOf(2026, 6, 15);
    expect(resolveDemoDate("Y-1-09-15", june)).toBe("2025-09-15");
    expect(resolveDemoDate("Y+1-03-31", june)).toBe("2027-03-31");
    expect(resolveDemoDate("Y0-06-01", june)).toBe("2026-06-01");

    const january = todayOf(2026, 1, 3);
    expect(resolveDemoDate("Y0-06-01", january)).toBe("2026-01-03");
    expect(resolveDemoDate("Y-1-11-20", january)).toBe("2025-11-20");

    expect(demoDueDate("2025-12-20")).toBe("2026-01-19");
    expect(demoDueDate("2024-01-31")).toBe("2024-03-01");
  });
});
