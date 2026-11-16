import siteData from "../data/site.json";

export interface Project {
  slug: string;
  name: string;
  category: string;
  status: string;
  summary: string;
  description: string;
  role: string;
  stack: string[];
  repo?: string;
  visual: "awarespan" | "siddhi" | "aiida" | "clipz";
  featured: boolean;
}

export interface ExperienceEntry {
  label: string;
  title: string;
  organization: string;
  period: string;
  description: string;
}

export interface Achievement {
  label: string;
  title: string;
  detail: string;
}

export interface SkillGroup {
  name: string;
  skills: string[];
}

export interface SiteContent {
  owner: {
    name: string;
    monogram: string;
    role: string;
    location: string;
    email: string;
    website: string;
    github: string;
    headline: string;
    intro: string;
  };
  projects: Project[];
  experience: ExperienceEntry[];
  achievements: Achievement[];
  skillGroups: SkillGroup[];
}

export const site = siteData as SiteContent;
export const projects = site.projects;
export const featuredProjects = projects.filter((project) => project.featured);

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}

const API_BASE = (process.env.API_BASE_URL ?? "").replace(/\/$/, "");

async function readPublic<T>(path: string): Promise<T | null> {
  if (!API_BASE) return null;
  try {
    const response = await fetch(`${API_BASE}/api/v1/public/${path}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(2500),
      headers: { Accept: "application/json" }
    });
    if (!response.ok) return null;
    return await response.json() as T;
  } catch {
    return null;
  }
}

function periodLabel(startedOn?: string | null, endedOn?: string | null, current?: boolean) {
  const format = (value?: string | null) => value ? new Date(`${value}T00:00:00`).toLocaleDateString("en", { month: "short", year: "numeric" }) : "";
  const start = format(startedOn);
  const end = current ? "Present" : format(endedOn);
  return [start, end].filter(Boolean).join(" — ") || "Experience";
}

export async function getSiteContent(): Promise<SiteContent> {
  if (!API_BASE) return site;

  const [profile, projectRows, experienceRows, achievementRows, skillRows] = await Promise.all([
    readPublic<Record<string, string>>("profile"),
    readPublic<Record<string, unknown>[]>("projects"),
    readPublic<Record<string, unknown>[]>("experience"),
    readPublic<Record<string, unknown>[]>("achievements"),
    readPublic<Record<string, unknown>[]>("skills")
  ]);

  const localBySlug = new Map(site.projects.map((project) => [project.slug, project]));
  const liveProjects: Project[] = projectRows?.map((row) => {
    const slug = String(row.slug);
    const local = localBySlug.get(slug);
    return {
      ...(local ?? { visual: "clipz" as const, stack: [] }),
      slug,
      name: String(row.name),
      category: String(row.tagline ?? local?.category ?? "PROJECT"),
      status: String(row.status ?? "IN DEVELOPMENT"),
      summary: String(row.summary ?? ""),
      description: String(row.description ?? ""),
      role: String(row.role ?? "Independent development"),
      repo: row.repository_url ? String(row.repository_url) : undefined,
      featured: Boolean(row.featured)
    };
  }) ?? site.projects;

  const liveExperience: ExperienceEntry[] = experienceRows?.map((row) => ({
    label: String(row.employment_type ?? "EXPERIENCE").toUpperCase(),
    title: String(row.role_title),
    organization: String(row.organization),
    period: periodLabel(row.started_on as string | null, row.ended_on as string | null, Boolean(row.is_current)),
    description: String(row.description)
  })) ?? site.experience;

  const liveAchievements: Achievement[] = achievementRows?.map((row) => ({
    label: String(row.category),
    title: String(row.title),
    detail: String(row.detail)
  })) ?? site.achievements;

  const groups = new Map<string, string[]>();
  for (const row of skillRows ?? []) {
    const name = String(row.group_name ?? "OTHER");
    const skill = row.skill_name ? String(row.skill_name) : "";
    if (!groups.has(name)) groups.set(name, []);
    if (skill) groups.get(name)?.push(skill);
  }
  const liveSkillGroups = skillRows ? Array.from(groups, ([name, skills]) => ({ name, skills })) : site.skillGroups;

  return {
    ...site,
    owner: profile ? {
      ...site.owner,
      name: profile.fullName ?? site.owner.name,
      role: profile.headline ?? site.owner.role,
      intro: profile.summary ?? site.owner.intro,
      location: profile.location ?? site.owner.location,
      email: profile.email ?? site.owner.email,
      website: profile.websiteUrl ?? site.owner.website,
      github: profile.githubUrl ?? site.owner.github
    } : site.owner,
    projects: liveProjects,
    experience: liveExperience,
    achievements: liveAchievements,
    skillGroups: liveSkillGroups
  };
}

export async function getLiveProjectBySlug(slug: string): Promise<Project | undefined> {
  const content = await getSiteContent();
  return content.projects.find((project) => project.slug === slug);
}
