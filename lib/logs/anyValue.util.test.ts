import { describe, it, expect } from "vitest";
import { anyValueToString } from "./anyValue.util";

describe("anyValueToString", () => {
  it("returns string value as-is", () => {
    expect(anyValueToString({ stringValue: "hello" })).toBe("hello");
  });

  it("converts intValue to string", () => {
    expect(anyValueToString({ intValue: 42 })).toBe("42");
  });

  it("converts doubleValue to string", () => {
    expect(anyValueToString({ doubleValue: 3.14 })).toBe("3.14");
  });

  it("converts boolValue true", () => {
    expect(anyValueToString({ boolValue: true })).toBe("true");
  });

  it("converts boolValue false", () => {
    expect(anyValueToString({ boolValue: false })).toBe("false");
  });

  it("JSON-stringifies arrayValue", () => {
    const arr = { values: [{ stringValue: "a" }] };
    expect(anyValueToString({ arrayValue: arr })).toBe(JSON.stringify(arr));
  });

  it("JSON-stringifies kvlistValue", () => {
    const kv = { values: [{ key: "k", value: { stringValue: "v" } }] };
    expect(anyValueToString({ kvlistValue: kv })).toBe(JSON.stringify(kv));
  });

  it("returns empty string for null", () => {
    expect(anyValueToString(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(anyValueToString(undefined)).toBe("");
  });

  it("returns empty string for empty object", () => {
    expect(anyValueToString({})).toBe("");
  });
});
