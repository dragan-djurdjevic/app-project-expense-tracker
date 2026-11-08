// Spec: AN-000, UI-002
import { describe, expect, it } from "vitest";
import { percent, sumOf } from "../../../src/core/domain/Percent";
import { formatPercentValue } from "../../../src/ui/format/percent";

describe("percent helper (AN-000d/e)", () => {
  it("TC-M5-001 percent: (1,3) → 33.3; (2125,1000) → 212.5; (x,0) → null (—); half-up 0.45455 → 45.5", () => {
    expect(percent(1, 3)).toBe(33.3);
    expect(percent(2125, 1000)).toBe(212.5);
    expect(percent(5, 0)).toBeNull();
    expect(percent(0, 0)).toBeNull();
    expect(percent(45455, 100000)).toBe(45.5);
    expect(percent(45449, 100000)).toBe(45.4);
    expect(percent(-90_000, 150_000)).toBe(-60.0);
    expect(percent(0, 7)).toBe(0);
    expect(sumOf([{ v: 1 }, { v: 2 }], (row) => row.v)).toBe(3);
    expect(formatPercentValue(33.3)).toBe("33.3 %");
    expect(formatPercentValue(100)).toBe("100.0 %");
    expect(formatPercentValue(null)).toBe("—");
  });
});
