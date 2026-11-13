import type { Item, SiteContent } from "@/lib/content/types";

/*
 * Turns a content snapshot into the resume.
 *
 * Only items that are both public and resumeEligible are included: /resume is a
 * public page and a public .docx download, so a private item can never appear
 * on it, even if it was flagged for the resume.
 */

export type ResumeContent = {
  name: string;
  headline: string;
  email: string;
  summary: string;
  links: { label: string; url: string }[];
  experience: Item[];
  projects: Item[];
  education: Item[];
  achievements: Item[];
  skills: { category: string; skills: string[] }[];
  itemIds: string[];
};

function newestFirst(a: Item, b: Item): number {
  if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder;
  return b.startDate.localeCompare(a.startDate);
}

function eligible(content: SiteContent): Item[] {
  return content.items
    .filter((item) => item.isPublic && item.resumeEligible)
    .sort(newestFirst);
}

function groupSkills(content: SiteContent) {
  const groups = new Map<string, string[]>();
  for (const skill of content.skills) {
    const skills = groups.get(skill.category);
    if (skills) skills.push(skill.name);
    else groups.set(skill.category, [skill.name]);
  }
  return [...groups].map(([category, skills]) => ({ category, skills }));
}

export function buildResume(content: SiteContent): ResumeContent {
  const included = eligible(content);

  return {
    name: content.profile.name,
    headline: content.profile.headline,
    email: content.profile.email,
    summary: content.profile.summary,
    links: content.profile.links,
    experience: included.filter((item) => item.type === "EXPERIENCE"),
    projects: included.filter((item) => item.type === "PROJECT"),
    education: included.filter((item) => item.type === "EDUCATION"),
    achievements: included.filter((item) => item.type === "ACHIEVEMENT"),
    skills: groupSkills(content),
    itemIds: included.map((item) => item.id),
  };
}

/** Shape-check for a published snapshot read back from jsonb. */
export function isResumeContent(value: unknown): value is ResumeContent {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.name === "string" &&
    typeof candidate.headline === "string" &&
    typeof candidate.email === "string" &&
    Array.isArray(candidate.experience) &&
    Array.isArray(candidate.projects) &&
    Array.isArray(candidate.skills) &&
    Array.isArray(candidate.itemIds)
  );
}
