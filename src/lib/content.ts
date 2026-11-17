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
export interface ExperienceEntry { label: string; title: string; organization: string; period: string; description: string; }
export interface Achievement { label: string; title: string; detail: string; imageUrl?: string; awardedOn?: string; }
export interface SkillGroup { name: string; skills: string[]; }
export interface HomeSection { id: string; type: string; enabled: boolean; order: number; }
export interface HomeContent {
  heroEyebrow: string; focus: string; aboutTitle: string; aboutParagraphs: string[];
  projectsTitle: string; projectsDescription: string; skillsTitle: string; skillsDescription: string;
  contactTitle: string; contactDescription: string;
}
export interface SiteContent {
  owner: { name: string; monogram: string; role: string; location: string; email: string; website: string; github: string; headline: string; intro: string; };
  projects: Project[];
  experience: ExperienceEntry[];
  achievements: Achievement[];
  skillGroups: SkillGroup[];
  homeSections: HomeSection[];
  homeContent: HomeContent;
}

const DEFAULT_HOME_SECTIONS: HomeSection[] = [
  { id: "hero", type: "hero", enabled: true, order: 10 },
  { id: "principles", type: "principles", enabled: true, order: 15 },
  { id: "achievement-gallery", type: "achievement-gallery", enabled: true, order: 20 },
  { id: "projects", type: "projects", enabled: true, order: 30 },
  { id: "about", type: "about", enabled: true, order: 40 },
  { id: "skills", type: "skills", enabled: true, order: 50 },
  { id: "contact", type: "contact", enabled: true, order: 60 }
];
const DEFAULT_HOME_CONTENT: HomeContent = {
  heroEyebrow: "INDEPENDENT BUILDER / SOFTWARE & SYSTEMS", focus: "AI · Data · Edge · Web",
  aboutTitle: "Curious by default.\nPractical by design.",
  aboutParagraphs: ["I enjoy working where software meets the physical world: an application that people can rely on, a model that runs within a real hardware budget, or a data pipeline that turns messy inputs into something useful.", "I care about the details behind the interface too — architecture, performance, maintainability and the trade-offs that make a product dependable."],
  projectsTitle: "Projects with a purpose.", projectsDescription: "A snapshot of things I’m building, exploring and learning from.",
  skillsTitle: "A toolkit that keeps evolving.", skillsDescription: "I choose tools around the problem, not the other way around.",
  contactTitle: "Have a thoughtful problem worth solving?", contactDescription: "I’m always interested in good engineering conversations and worthwhile collaborations."
};
const site = { ...(siteData as SiteContent), homeSections: DEFAULT_HOME_SECTIONS, homeContent: DEFAULT_HOME_CONTENT };
export { site };
export const projects = site.projects;
export const featuredProjects = projects.filter((project) => project.featured);
export function getProjectBySlug(slug: string): Project | undefined { return projects.find((project) => project.slug === slug); }
// VERCEL_URL identifies this frontend deployment, not the backend API. Only an explicit API_BASE_URL enables live-API mode; otherwise serve the reviewed public snapshot bundled with the site.
const API_BASE = (process.env.API_BASE_URL || "").replace(/\/$/, "");

async function readPublic<T>(path: string): Promise<T | null> {
  if (!API_BASE) return null;
  try {
    const response = await fetch(`${API_BASE}/api/v1/public/${path}`, { cache: "no-store", signal: AbortSignal.timeout(3500), headers: { Accept: "application/json" } });
    if (!response.ok) return null;
    return await response.json() as T;
  } catch { return null; }
}
function dateLabel(value?: string | null) {
  return value ? new Date(`${value}T00:00:00`).toLocaleDateString("en", { month: "short", year: "numeric" }) : "";
}
function periodLabel(start?: string | null, end?: string | null, current?: boolean) {
  return [dateLabel(start), current ? "Present" : dateLabel(end)].filter(Boolean).join(" — ") || "Experience";
}
function emptyLiveSite(): SiteContent {
  return {
    owner: { name: "", monogram: "BCH", role: "", location: "", email: "", website: "", github: "", headline: "", intro: "" },
    homeContent: DEFAULT_HOME_CONTENT,
    projects: [], experience: [], achievements: [], skillGroups: [], homeSections: site.homeSections ?? []
  };
}

export async function getSiteContent(): Promise<SiteContent> {
  if (!API_BASE) return site;
  const [profile, projectRows, experienceRows, achievementRows, skillRows, siteConfig] = await Promise.all([
    readPublic<Record<string, unknown>>("profile"),
    readPublic<Record<string, unknown>[]>("projects"),
    readPublic<Record<string, unknown>[]>("experience"),
    readPublic<Record<string, unknown>[]>("achievements"),
    readPublic<Record<string, unknown>[]>("skills"),
    readPublic<Record<string, unknown>>("site-configuration")
  ]);
  // No stale local snapshot is used when the live API is configured. A hidden field or an
  // unavailable API must never cause old public-build data to reappear.
  if (!profile) return emptyLiveSite();

  const localBySlug = new Map(site.projects.map((project) => [project.slug, project]));
  const liveProjects: Project[] = (projectRows ?? []).filter((row) => row.name && row.slug).map((row) => {
    const slug = String(row.slug);
    const local = localBySlug.get(slug);
    return {
      slug,
      name: String(row.name),
      category: String(row.tagline ?? "PROJECT"),
      status: String(row.status ?? ""),
      summary: String(row.summary ?? ""),
      description: String(row.description ?? ""),
      role: String(row.role ?? ""),
      stack: [],
      repo: row.repositoryUrl || row.repository_url ? String(row.repositoryUrl ?? row.repository_url) : undefined,
      visual: local?.visual ?? "clipz",
      featured: Boolean(row.featured)
    };
  });
  const liveExperience: ExperienceEntry[] = (experienceRows ?? []).filter((row) => row.roleTitle && row.organization).map((row) => ({
    label: String(row.employmentType ?? "EXPERIENCE").toUpperCase(),
    title: String(row.roleTitle), organization: String(row.organization),
    period: periodLabel(row.startedOn as string | null, row.endedOn as string | null, Boolean(row.isCurrent)),
    description: String(row.description ?? "")
  }));
  const liveAchievements: Achievement[] = (achievementRows ?? []).filter((row) => row.title).map((row) => ({
    label: String(row.category ?? "MILESTONE"), title: String(row.title), detail: String(row.detail ?? ""),
    imageUrl: row.imageUrl ? `${API_BASE}${String(row.imageUrl)}` : undefined,
    awardedOn: row.awardedOn ? String(row.awardedOn) : undefined
  }));
  const groups = new Map<string, string[]>();
  for (const row of skillRows ?? []) {
    const group = String(row.group_name ?? "OTHER");
    if (!groups.has(group)) groups.set(group, []);
    if (row.skill_name) groups.get(group)?.push(String(row.skill_name));
  }
  let homeSections = site.homeSections ?? [];
  let homeContent = site.homeContent ?? DEFAULT_HOME_CONTENT;
  try {
    const parsed = typeof siteConfig === "string" ? JSON.parse(siteConfig) as { home?: { sections?: HomeSection[]; content?: Partial<HomeContent> } } : siteConfig as { home?: { sections?: HomeSection[]; content?: Partial<HomeContent> } } | undefined;
    if (parsed?.home?.sections) homeSections = parsed.home.sections;
    if (parsed?.home?.content) homeContent = { ...DEFAULT_HOME_CONTENT, ...parsed.home.content };
  } catch { /* Keep the known safe section layout and content if configuration is malformed. */ }

  return {
    ...emptyLiveSite(),
    owner: {
      name: String(profile.fullName ?? ""), monogram: "BCH", role: String(profile.headline ?? ""),
      location: String(profile.location ?? ""), email: String(profile.email ?? ""),
      website: String(profile.websiteUrl ?? ""), github: String(profile.githubUrl ?? ""),
      headline: String(profile.headline ?? ""), intro: String(profile.summary ?? "")
    },
    projects: liveProjects,
    experience: liveExperience,
    achievements: liveAchievements,
    skillGroups: Array.from(groups, ([name, skills]) => ({ name, skills })),
    homeSections,
    homeContent
  };
}

export async function getPublicProjectBySlug(slug: string): Promise<Project | undefined> {
  // A configured live API is authoritative: never fall back to stale snapshot content
  // when the project is unpublished, hidden or the API is temporarily unavailable.
  if (!API_BASE) return getProjectBySlug(slug);
  const content = await getSiteContent();
  return content.projects.find((project) => project.slug === slug);
}
