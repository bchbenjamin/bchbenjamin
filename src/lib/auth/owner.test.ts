import { describe, expect, it } from "vitest";

import { safeNextPath } from "@/lib/next-path";

import { isOwnerEmail } from "./index";

describe("isOwnerEmail", () => {
  it("accepts the configured owner, ignoring case and whitespace", () => {
    expect(isOwnerEmail("  Benjamin@Example.com ", "benjamin@example.com")).toBe(
      true,
    );
  });

  it("rejects any other address when OWNER_EMAIL is configured", () => {
    expect(isOwnerEmail("someone@example.com", "benjamin@example.com")).toBe(
      false,
    );
  });

  it("accepts the single existing account when OWNER_EMAIL is not set", () => {
    expect(isOwnerEmail("benjamin@example.com", undefined)).toBe(true);
    expect(isOwnerEmail("benjamin@example.com", "   ")).toBe(true);
  });

  it("rejects a missing email", () => {
    expect(isOwnerEmail(null, "benjamin@example.com")).toBe(false);
    expect(isOwnerEmail("", undefined)).toBe(false);
  });
});

describe("safeNextPath", () => {
  it("keeps admin paths", () => {
    expect(safeNextPath("/admin/items")).toBe("/admin/items");
    expect(safeNextPath("/admin")).toBe("/admin");
  });

  it("refuses other destinations", () => {
    expect(safeNextPath("/login")).toBe("/admin");
    expect(safeNextPath(undefined)).toBe("/admin");
    expect(safeNextPath("https://evil.example")).toBe("/admin");
    expect(safeNextPath("//evil.example/admin")).toBe("/admin");
    expect(safeNextPath("/admin\nSet-Cookie: x")).toBe("/admin");
  });
});
