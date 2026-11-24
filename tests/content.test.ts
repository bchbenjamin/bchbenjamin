import { describe, expect, it } from "vitest";
import { featuredProjects, getProjectBySlug, getSiteContent, projects, site } from "../src/lib/content";

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

  it("limits public projects to the entries in the current résumé", () => {
    expect(projects.map((project) => project.slug)).toEqual([
      "ease-health", "bengaluruduru", "street-safety-device", "hermes-the-quizzer",
      "academic-result-management-system", "peer-management-platform", "breach-defend"
    ]);
    expect(getProjectBySlug("awarespan")).toBeUndefined();
  });

  it("places the horizontal project gallery before the home hero", () => {
    expect(site.homeSections[0]).toMatchObject({ id: "image-gallery", enabled: true, order: 1 });
  });

  it("contains résumé-backed education and experience records", () => {
    expect(site.education).toHaveLength(3);
    expect(site.experience.some((item) => item.organization.includes("FOSSEE"))).toBe(true);
  });

  it("uses the checked-in snapshot when the public API is not configured", async () => {
    expect(await getSiteContent()).toEqual(site);
  });

  it("defaults the launcher to the Micromax A110 water wallpaper and an empty media gallery", () => {
    expect(site.launcher.wallpaper).toBe("water");
    expect(site.gallery).toEqual([]);
  });

  it("provides a featured portfolio selection", () => {
    expect(featuredProjects.length).toBeGreaterThan(0);
    expect(featuredProjects.every((project) => project.featured)).toBe(true);
  });

  it("resolves existing projects and rejects unknown slugs", () => {
    expect(getProjectBySlug("ease-health")?.name).toContain("Ease Health");
    expect(getProjectBySlug("not-a-project")).toBeUndefined();
  });
});
