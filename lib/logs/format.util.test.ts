import { describe, it, expect } from "vitest";
import { formatTimestamp } from "./format.util";

describe("formatTimestamp", () => {
  it("formats date in MMM DD HH:mm:ss.SSS", () => {
    const date = new Date(2025, 3, 19, 14, 32, 1, 445);
    expect(formatTimestamp(date)).toBe("Apr 19 14:32:01.445");
  });

  it("zero-pads day and time fields", () => {
    const date = new Date(2025, 0, 5, 3, 7, 2, 9);
    expect(formatTimestamp(date)).toBe("Jan 05 03:07:02.009");
  });

  it("milliseconds always 3 digits", () => {
    const date = new Date(2025, 5, 15, 12, 0, 0, 0);
    expect(formatTimestamp(date)).toMatch(/\.000$/);
  });

  it("uses 3-letter month abbreviation", () => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    for (let i = 0; i < 12; i++) {
      const date = new Date(2025, i, 15, 12, 0, 0, 0);
      expect(formatTimestamp(date)).toMatch(new RegExp(`^${months[i]} `));
    }
  });

  it("handles epoch date", () => {
    const result = formatTimestamp(new Date(0));
    expect(result).toMatch(/^\w{3} \d{2} \d{2}:\d{2}:\d{2}\.000$/);
  });
});
