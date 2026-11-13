import { describe, expect, it } from "vitest";

import { siteContent } from "@/lib/content";

import { getSiteContent, getPublicItemBySlug } from "./repository";

describe("content repository", () => {
  it("falls back to the checked-in content when no database is configured", async () => {
    expect(process.env.DATABASE_URL_APP).toBeUndefined();

    const content = await getSiteContent();
    expect(content.items).toHaveLength(siteContent.items.length);
    expect(content.profile.name).toBe(siteContent.profile.name);
  });

  it("keeps non-public items out of the public read path", async () => {
    expect(await getPublicItemBySlug("internal-tooling")).toBeUndefined();
  });
});
