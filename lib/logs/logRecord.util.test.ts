import { describe, it, expect } from "vitest";
import { parseTimestamp, buildId } from "./logRecord.util";

describe("parseTimestamp", () => {
  it("parses nanosecond string to Date", () => {
    const date = parseTimestamp("1705160354264000000", undefined);
    expect(date.getTime()).toBe(1705160354264);
  });

  it("falls back to observedTimeUnixNano when timeUnixNano is '0'", () => {
    const date = parseTimestamp("0", "1705160354264000000");
    expect(date.getTime()).toBe(1705160354264);
  });

  it("falls back to observedTimeUnixNano when timeUnixNano is undefined", () => {
    const date = parseTimestamp(undefined, "1705160354264000000");
    expect(date.getTime()).toBe(1705160354264);
  });

  it("returns epoch when both are undefined", () => {
    const date = parseTimestamp(undefined, undefined);
    expect(date.getTime()).toBe(0);
  });

  it("returns epoch when both are '0'", () => {
    const date = parseTimestamp("0", "0");
    expect(date.getTime()).toBe(0);
  });

  it("does not lose precision with large nanosecond values", () => {
    const date = parseTimestamp("1705160354264123456", undefined);
    expect(date.getTime()).toBe(1705160354264);
  });
});

describe("buildId", () => {
  it("produces hyphen-separated indices", () => {
    expect(buildId(0, 1, 2)).toBe("0-1-2");
  });

  it("handles larger indices", () => {
    expect(buildId(10, 20, 30)).toBe("10-20-30");
  });
});
