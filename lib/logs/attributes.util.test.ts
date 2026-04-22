import { describe, it, expect } from "vitest";
import { splitAttributes } from "@/lib/logs/attributes.util";

describe("splitAttributes", () => {
  it("returns empty arrays for empty input", () => {
    expect(splitAttributes({})).toEqual({ resource: [], scope: [], log: [] });
  });

  it("splits by prefix", () => {
    const result = splitAttributes({
      "resource.service.name": "api",
      "scope.name": "my-lib",
      trace_id: "abc123",
    });
    expect(result.resource).toEqual([["service.name", "api"]]);
    expect(result.scope).toEqual([["name", "my-lib"]]);
    expect(result.log).toEqual([["trace_id", "abc123"]]);
  });

  it("strips prefix from keys", () => {
    const result = splitAttributes({ "resource.host.name": "prod-1" });
    expect(result.resource[0][0]).toBe("host.name");
  });

  it("sorts entries alphabetically within each bucket", () => {
    const result = splitAttributes({
      "resource.z": "last",
      "resource.a": "first",
      "log.z": "last",
      "log.a": "first",
    });
    expect(result.resource.map(([k]) => k)).toEqual(["a", "z"]);
    expect(result.log.map(([k]) => k)).toEqual(["log.a", "log.z"]);
  });

  it("puts trace_id and span_id in log bucket", () => {
    const result = splitAttributes({ trace_id: "t", span_id: "s" });
    expect(result.log).toContainEqual(["trace_id", "t"]);
    expect(result.log).toContainEqual(["span_id", "s"]);
  });
});
