import { describe, expect, it } from "vitest";

import {
  getFeaturedProjects,
  getPublicItemBySlug,
  getPublicItems,
  getPublicItemsByType,
  getSkillsByCategory,
  parseSiteContent,
  profile,
  siteContent,
} from "./index";

function item(overrides: Record<string, unknown> = {}) {
  return {
    id: "id-1",
    slug: "one",
    type: "PROJECT",
    title: "One",
    org: null,
    location: null,
    startDate: "2024-01",
    endDate: null,
    descriptionLong: "Body",
    summaryShort: "Short",
    displayOrder: 1,
    isPublic: true,
    resumeEligible: true,
    announceOnLinkedIn: false,
    isBeta: false,
    urls: [],
    bullets: [],
    skills: [],
    ...overrides,
  };
}

function content(items: unknown[]) {
  return {
    profile: {
      name: "B",
      headline: "H",
      summary: "S",
      email: "b@example.com",
      links: [],
    },
    items,
    skills: [
      { name: "TypeScript", category: "Languages" },
      { name: "PostgreSQL", category: "Data" },
      { name: "React", category: "Frameworks" },
    ],
  };
}

describe("parseSiteContent", () => {
  it("accepts the content shipped with the site", () => {
    expect(siteContent.items.length).toBeGreaterThan(0);
    expect(profile.email).toContain("@");
  });

  it("rejects an unknown item type", () => {
    expect(() => parseSiteContent(content([item({ type: "BLOG" })]))).toThrow(
      /items\[0\]\.type/,
    );
  });

  it("rejects a missing required field", () => {
    expect(() =>
      parseSiteContent(content([item({ title: undefined })])),
    ).toThrow(/items\[0\]\.title/);
  });

  it("rejects a non-integer display order", () => {
    expect(() =>
      parseSiteContent(content([item({ displayOrder: 1.5 })])),
    ).toThrow(/displayOrder/);
  });

  it("rejects a month that is not yyyy-mm", () => {
    expect(() =>
      parseSiteContent(content([item({ startDate: "2024" })])),
    ).toThrow(/startDate/);
  });

  it("rejects non-https links", () => {
    expect(() =>
      parseSiteContent(
        content([item({ urls: [{ label: "Repo", url: "http://example.com" }] })]),
      ),
    ).toThrow(/https/);
  });

  it("rejects a skill without a category", () => {
    expect(() =>
      parseSiteContent({ ...content([item()]), skills: [{ name: "TypeScript" }] }),
    ).toThrow(/skills\[0\]\.category/);
  });
});

describe("public queries", () => {
  it("hides items that are not public", () => {
    const slugs = getPublicItems().map((item_) => item_.slug);
    expect(slugs).not.toContain("internal-tooling");
    expect(getPublicItemBySlug("internal-tooling")).toBeUndefined();
  });

  it("returns public items in display order", () => {
    const orders = getPublicItems().map((item_) => item_.displayOrder);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });

  it("filters by type", () => {
    const projects = getPublicItemsByType("PROJECT");
    expect(projects.length).toBeGreaterThan(0);
    expect(projects.every((item_) => item_.type === "PROJECT")).toBe(true);
  });

  it("finds a public item by slug", () => {
    expect(getPublicItemBySlug("ledger-lab")?.title).toBe("Ledger Lab");
  });

  it("respects the featured project limit", () => {
    expect(getFeaturedProjects(1)).toHaveLength(1);
  });

  it("groups skills by category in file order", () => {
    const groups = getSkillsByCategory();
    expect(groups[0].category).toBe("Languages");
    expect(groups[0].skills).toContain("TypeScript");
  });
});
