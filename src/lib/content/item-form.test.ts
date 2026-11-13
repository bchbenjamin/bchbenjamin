import { describe, expect, it } from "vitest";

import { itemToFormDefaults, parseItemForm } from "./item-form";
import type { Item } from "./types";

function form(overrides: Record<string, string | boolean> = {}): FormData {
  const data = new FormData();
  const values: Record<string, string | boolean> = {
    slug: "ledger-lab",
    type: "PROJECT",
    title: "Ledger Lab",
    org: "Helios Systems",
    location: "",
    startDate: "2024-03",
    endDate: "",
    summaryShort: "Double-entry accounting in the browser.",
    descriptionLong: "A long description.",
    displayOrder: "2",
    urls: "Repo | https://example.com/repo",
    bullets: "Did a thing\nDid another thing",
    skills: "TypeScript, PostgreSQL",
    isPublic: "on",
    resumeEligible: "on",
    ...overrides,
  };
  for (const [name, value] of Object.entries({ ...values, ...overrides })) {
    data.set(name, typeof value === "boolean" ? (value ? "on" : "") : value);
  }
  return data;
}

describe("parseItemForm", () => {
  it("parses a valid submission", () => {
    const result = parseItemForm(form());
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.item.slug).toBe("ledger-lab");
    expect(result.item.endDate).toBeNull();
    expect(result.item.location).toBeNull();
    expect(result.item.urls).toEqual([
      { label: "Repo", url: "https://example.com/repo" },
    ]);
    expect(result.item.bullets).toHaveLength(2);
    expect(result.item.skills).toEqual(["TypeScript", "PostgreSQL"]);
    expect(result.item.isPublic).toBe(true);
    expect(result.item.isBeta).toBe(false);
  });

  it("keeps an existing id when editing", () => {
    const id = "3d0c2f66-1111-4a4a-8a8a-000000000001";
    const result = parseItemForm(form(), id);
    expect(result.ok && result.item.id).toBe(id);
  });

  it("rejects a slug with spaces or capitals", () => {
    const result = parseItemForm(form({ slug: "Ledger Lab" }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.join(" ")).toMatch(/Slug/);
  });

  it("rejects a bad month", () => {
    const result = parseItemForm(form({ startDate: "2024-3" }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.join(" ")).toMatch(/yyyy-mm/);
  });

  it("rejects a non-https link", () => {
    const result = parseItemForm(form({ urls: "Repo | http://example.com" }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.join(" ")).toMatch(/https/i);
  });

  it("rejects a link line without a separator", () => {
    const result = parseItemForm(form({ urls: "https://example.com" }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.join(" ")).toMatch(/Link line 1/);
  });

  it("rejects a non-integer display order", () => {
    const result = parseItemForm(form({ displayOrder: "1.5" }));
    expect(result.ok).toBe(false);
  });

  it("treats unchecked flags as false", () => {
    const result = parseItemForm(form({ isPublic: "", resumeEligible: "" }));
    expect(result.ok && result.item.isPublic).toBe(false);
    expect(result.ok && result.item.resumeEligible).toBe(false);
  });
});

describe("itemToFormDefaults", () => {
  it("renders stored values back into the form formats", () => {
    const entry: Item = {
      id: "3d0c2f66-1111-4a4a-8a8a-000000000001",
      slug: "ledger-lab",
      type: "PROJECT",
      title: "Ledger Lab",
      org: null,
      location: null,
      startDate: "2024-03",
      endDate: null,
      descriptionLong: "Body",
      summaryShort: "Short",
      displayOrder: 2,
      isPublic: true,
      resumeEligible: false,
      announceOnLinkedIn: false,
      isBeta: false,
      urls: [{ label: "Repo", url: "https://example.com/repo" }],
      bullets: ["One", "Two"],
      skills: ["TypeScript", "PostgreSQL"],
    };

    const defaults = itemToFormDefaults(entry);
    expect(defaults.endDate).toBe("");
    expect(defaults.urls).toBe("Repo | https://example.com/repo");
    expect(defaults.bullets).toBe("One\nTwo");
    expect(defaults.skills).toBe("TypeScript, PostgreSQL");

    const roundTrip = parseItemForm(form(defaults), entry.id);
    expect(roundTrip.ok).toBe(true);
    if (!roundTrip.ok) return;
    expect(roundTrip.item.urls).toEqual(entry.urls);
    expect(roundTrip.item.skills).toEqual(entry.skills);
  });
});
