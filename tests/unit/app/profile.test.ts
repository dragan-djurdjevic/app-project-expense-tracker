// Spec: AR-013
import { describe, expect, it } from "vitest";
import { profileFromSearch } from "../../../src/app/profile";

describe("profileFromSearch (AR-013)", () => {
  it("TC-M7-001 returns demo only for profile=demo exactly, otherwise live", () => {
    expect(profileFromSearch("?profile=demo")).toBe("demo");
    expect(profileFromSearch("?a=1&profile=demo")).toBe("demo");
    expect(profileFromSearch("")).toBe("live");
    expect(profileFromSearch("?profile=live")).toBe("live");
    expect(profileFromSearch("?profile=DEMO")).toBe("live");
    expect(profileFromSearch("?profile=")).toBe("live");
    expect(profileFromSearch("?x=demo")).toBe("live");
  });
});
