import { describe, expect, it } from "vitest";

import { formatMonth, formatRange } from "./format";

describe("formatMonth", () => {
  it("formats a yyyy-mm value with a three letter month", () => {
    expect(formatMonth("2024-03")).toBe("Mar 2024");
    expect(formatMonth("2016-09")).toBe("Sep 2016");
    expect(formatMonth("2024-12")).toBe("Dec 2024");
  });

  it("rejects anything that is not yyyy-mm", () => {
    expect(() => formatMonth("2024-13")).toThrow(/Unsupported month/);
    expect(() => formatMonth("2024-3")).toThrow(/Unsupported month/);
    expect(() => formatMonth("2024")).toThrow(/Unsupported month/);
    expect(() => formatMonth("")).toThrow(/Unsupported month/);
  });
});

describe("formatRange", () => {
  it("renders an open range as Present", () => {
    expect(formatRange("2022-08", null)).toBe("Aug 2022 — Present");
  });

  it("renders a closed range", () => {
    expect(formatRange("2020-07", "2022-07")).toBe("Jul 2020 — Jul 2022");
  });

  it("propagates invalid months", () => {
    expect(() => formatRange("nope", null)).toThrow(/Unsupported month/);
  });
});
