import { describe, expect, it } from "vitest";

import type { Item, SiteContent } from "@/lib/content/types";

import { buildResume, isResumeContent } from "./build";
import { resumeBuffer } from "./document";

function item(overrides: Partial<Item> = {}): Item {
  return {
    id: "3d0c2f66-1111-4a4a-8a8a-000000000001",
    slug: "one",
    type: "EXPERIENCE",
    title: "Engineer",
    org: "Helios Systems",
    location: "Remote",
    startDate: "2022-08",
    endDate: null,
    descriptionLong: "Body",
    summaryShort: "Built things.",
    displayOrder: 1,
    isPublic: true,
    resumeEligible: true,
    announceOnLinkedIn: false,
    isBeta: false,
    urls: [],
    bullets: ["Shipped a thing"],
    skills: ["TypeScript"],
    ...overrides,
  };
}

function content(items: Item[]): SiteContent {
  return {
    profile: {
      name: "Benjamin",
      headline: "Software engineer",
      summary: "Writes small systems.",
      email: "b@example.com",
      links: [{ label: "GitHub", url: "https://github.com/b" }],
    },
    items,
    skills: [
      { name: "TypeScript", category: "Languages" },
      { name: "PostgreSQL", category: "Data" },
      { name: "React", category: "Frameworks" },
    ],
  };
}

describe("buildResume", () => {
  it("includes only items that are public and resume eligible", () => {
    const resume = buildResume(
      content([
        item({ id: "a", slug: "public-eligible" }),
        item({ id: "b", slug: "private-eligible", isPublic: false }),
        item({ id: "c", slug: "public-not-eligible", resumeEligible: false }),
      ]),
    );

    expect(resume.itemIds).toEqual(["a"]);
    expect(resume.experience.map((entry) => entry.slug)).toEqual([
      "public-eligible",
    ]);
  });

  it("groups entries by type", () => {
    const resume = buildResume(
      content([
        item({ id: "e", type: "EXPERIENCE" }),
        item({ id: "p", type: "PROJECT", slug: "project" }),
        item({ id: "d", type: "EDUCATION", slug: "school" }),
        item({ id: "a", type: "ACHIEVEMENT", slug: "award" }),
      ]),
    );

    expect(resume.experience).toHaveLength(1);
    expect(resume.projects).toHaveLength(1);
    expect(resume.education).toHaveLength(1);
    expect(resume.achievements).toHaveLength(1);
  });

  it("orders by display order then newest first", () => {
    const resume = buildResume(
      content([
        item({ id: "1", slug: "first", displayOrder: 2, startDate: "2020-01" }),
        item({ id: "2", slug: "second", displayOrder: 1, startDate: "2018-01" }),
      ]),
    );
    expect(resume.itemIds).toEqual(["2", "1"]);
  });

  it("keeps skills grouped in file order", () => {
    const resume = buildResume(content([]));
    expect(resume.skills[0]).toEqual({
      category: "Languages",
      skills: ["TypeScript"],
    });
  });

  it("produces a snapshot the guard accepts", () => {
    const resume = buildResume(content([item()]));
    expect(isResumeContent(resume)).toBe(true);
    expect(isResumeContent({ name: "x" })).toBe(false);
    expect(isResumeContent(null)).toBe(false);
  });
});

describe("resumeBuffer", () => {
  it("builds a real .docx (zip) file with content", async () => {
    const buffer = await resumeBuffer(buildResume(content([item()])));
    const bytes = new Uint8Array(buffer);
    expect(bytes.byteLength).toBeGreaterThan(2000);
    // docx is a zip container: "PK\x03\x04"
    expect(String.fromCharCode(...bytes.slice(0, 4))).toBe("PK\u0003\u0004");
  });

  it("builds an empty-resume document without throwing", async () => {
    const buffer = await resumeBuffer(buildResume(content([])));
    expect(buffer.byteLength).toBeGreaterThan(1000);
  });
});
