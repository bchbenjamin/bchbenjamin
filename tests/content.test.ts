import { describe, expect, it } from "vitest";
import { featuredProjects, getProjectBySlug, projects, site } from "../src/lib/content";

describe("portfolio content", () => {
  it("has the owner details required by the public site", () => {
    expect(site.owner.name).toBeTruthy();
    expect(site.owner.email).toMatch(/^[^@\s]+@[^@\s]+\.[^@\s]+$/);
    expect(site.owner.website).toMatch(/^https:\/\//);
  });

  it("uses unique, URL-safe project slugs", () => {
    const slugs = projects.map((project) => project.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  });

  it("keeps each project summary within the planned 180-character limit", () => {
    for (const project of projects) {
      expect(project.summary.length).toBeLessThanOrEqual(180);
      expect(project.stack.length).toBeGreaterThan(0);
      expect(project.description.length).toBeGreaterThan(30);
    }
  });

  it("provides a featured portfolio selection", () => {
    expect(featuredProjects.length).toBeGreaterThan(0);
    expect(featuredProjects.every((project) => project.featured)).toBe(true);
  });

  it("resolves existing projects and rejects unknown slugs", () => {
    expect(getProjectBySlug("awarespan")?.name).toBe("AWARESPAN");
    expect(getProjectBySlug("not-a-project")).toBeUndefined();
  });
});
