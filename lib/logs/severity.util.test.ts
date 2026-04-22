import { describe, it, expect } from "vitest";
import { deriveSeverityText, getSeverityMeta } from "./severity.util";

describe("deriveSeverityText", () => {
  it.each([
    [1, "TRACE"],
    [4, "TRACE"],
    [5, "DEBUG"],
    [8, "DEBUG"],
    [9, "INFO"],
    [12, "INFO"],
    [13, "WARN"],
    [16, "WARN"],
    [17, "ERROR"],
    [20, "ERROR"],
    [21, "FATAL"],
    [24, "FATAL"],
  ] as const)("maps severityNumber %d to %s", (num, expected) => {
    expect(deriveSeverityText(num)).toBe(expected);
  });

  it("returns UNSPECIFIED for 0", () => {
    expect(deriveSeverityText(0)).toBe("UNSPECIFIED");
  });

  it("returns UNSPECIFIED for negative", () => {
    expect(deriveSeverityText(-1)).toBe("UNSPECIFIED");
  });

  it("returns UNSPECIFIED for 25+", () => {
    expect(deriveSeverityText(25)).toBe("UNSPECIFIED");
  });
});

describe("getSeverityMeta", () => {
  it("returns textClass and label for every band", () => {
    for (const num of [0, 1, 5, 9, 13, 17, 21, 99]) {
      const meta = getSeverityMeta(num);
      expect(meta.textClass).toBeTruthy();
      expect(meta.label).toBeTruthy();
    }
  });

  it("returns title-cased label", () => {
    expect(getSeverityMeta(9).label).toBe("Info");
    expect(getSeverityMeta(17).label).toBe("Error");
    expect(getSeverityMeta(0).label).toBe("Unspecified");
  });
});
