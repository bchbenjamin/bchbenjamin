import { describe, expect, it } from "vitest";

import { mapItemRow, mapProfileRow, mapSkillRow, type ItemRow } from "./map";

function row(overrides: Partial<ItemRow> = {}): ItemRow {
  return {
    id: "3d0c2f66-1111-4a4a-8a8a-000000000001",
    slug: "one",
    type: "PROJECT",
    title: "One",
    org: null,
    location: null,
    start_date: "2024-01",
    end_date: null,
    description_long: "Body",
    summary_short: "Short",
    display_order: 1,
    is_public: true,
    resume_eligible: true,
    announce_on_linkedin: false,
    is_beta: false,
    urls: [{ label: "Repo", url: "https://example.com/one" }],
    bullets: ["Did a thing"],
    skills: ["TypeScript"],
    ...overrides,
  };
}

describe("mapItemRow", () => {
  it("maps a view row onto the content model", () => {
    const item = mapItemRow(row());
    expect(item.slug).toBe("one");
    expect(item.startDate).toBe("2024-01");
    expect(item.endDate).toBeNull();
    expect(item.urls).toEqual([
      { label: "Repo", url: "https://example.com/one" },
    ]);
    expect(item.bullets).toEqual(["Did a thing"]);
    expect(item.skills).toEqual(["TypeScript"]);
  });

  it("validates the row instead of trusting it", () => {
    expect(() => mapItemRow(row({ start_date: "2024-13" }))).toThrow(
      /item\(one\)\.startDate/,
    );
    expect(() => mapItemRow(row({ type: "BLOG" }))).toThrow(/item\(one\)\.type/);
    expect(() =>
      mapItemRow(
        row({ urls: [{ label: "Repo", url: "http://example.com" }] }),
      ),
    ).toThrow(/https/);
  });

  it("names the failing row by slug", () => {
    expect(() => mapItemRow(row({ slug: "ledger-lab", title: "" }))).toThrow(
      /item\(ledger-lab\)\.title/,
    );
  });
});

describe("mapProfileRow", () => {
  it("maps profile links", () => {
    const profile = mapProfileRow({
      name: "B",
      headline: "H",
      summary: "S",
      email: "b@example.com",
      links: [{ label: "GitHub", url: "https://github.com/b" }],
    });
    expect(profile.links).toHaveLength(1);
  });

  it("rejects a non-https link", () => {
    expect(() =>
      mapProfileRow({
        name: "B",
        headline: "H",
        summary: "S",
        email: "b@example.com",
        links: [{ label: "GitHub", url: "javascript:alert(1)" }],
      }),
    ).toThrow(/https/);
  });
});

describe("mapSkillRow", () => {
  it("maps a skill and reports its index", () => {
    expect(mapSkillRow({ name: "Go", category: "Languages" }, 0)).toEqual({
      name: "Go",
      category: "Languages",
    });
    expect(() =>
      mapSkillRow({ name: "Go", category: "" }, 2),
    ).toThrow(/skill\[2\]\.category/);
  });
});
