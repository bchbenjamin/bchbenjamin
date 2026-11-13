import { describe, expect, it } from "vitest";

import { connectionStringFor, isDatabaseConfigured } from "./config";

describe("connectionStringFor", () => {
  it("reads each role from its own variable", () => {
    const env = {
      DATABASE_URL_APP: "postgresql://app_read@example/db",
      DATABASE_URL_ADMIN: "postgresql://app_admin@example/db",
      DATABASE_URL_MIGRATE: "postgresql://owner@example/db",
    };
    expect(connectionStringFor("app", env)).toContain("app_read");
    expect(connectionStringFor("admin", env)).toContain("app_admin");
    expect(connectionStringFor("migrate", env)).toContain("owner");
  });

  it("treats empty and whitespace values as missing", () => {
    expect(connectionStringFor("app", { DATABASE_URL_APP: "" })).toBeUndefined();
    expect(
      connectionStringFor("app", { DATABASE_URL_APP: "   " }),
    ).toBeUndefined();
    expect(connectionStringFor("app", {})).toBeUndefined();
  });

  it("does not fall back from one role to another", () => {
    expect(
      connectionStringFor("app", { DATABASE_URL_ADMIN: "postgresql://a@b/c" }),
    ).toBeUndefined();
  });
});

describe("isDatabaseConfigured", () => {
  it("is true only with an app connection string", () => {
    expect(
      isDatabaseConfigured({ DATABASE_URL_APP: "postgresql://a@b/c" }),
    ).toBe(true);
    expect(isDatabaseConfigured({ DATABASE_URL_ADMIN: "postgresql://a@b/c" })).toBe(
      false,
    );
    expect(isDatabaseConfigured({})).toBe(false);
  });
});
