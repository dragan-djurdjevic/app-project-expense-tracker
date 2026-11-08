// Spec: UI-090, UI-091
import { describe, expect, it } from "vitest";
import en from "../../../src/ui/i18n/en.json";
import srLatn from "../../../src/ui/i18n/sr-Latn.json";

type Tree = { [key: string]: string | Tree };

function leaves(tree: Tree, prefix = ""): [string, string][] {
  return Object.entries(tree).flatMap(([key, value]) =>
    typeof value === "string" ? [[`${prefix}${key}`, value] as [string, string]] : leaves(value, `${prefix}${key}.`),
  );
}

describe("translations (UI-090)", () => {
  it("TC-M6-001 sr-Latn.json and en.json have identical deep key sets and no empty values", () => {
    const enLeaves = leaves(en as Tree);
    const srLeaves = leaves(srLatn as Tree);

    expect(srLeaves.map(([key]) => key).sort()).toEqual(enLeaves.map(([key]) => key).sort());
    expect(enLeaves.filter(([, value]) => value.trim() === "")).toEqual([]);
    expect(srLeaves.filter(([, value]) => value.trim() === "")).toEqual([]);
  });
});
