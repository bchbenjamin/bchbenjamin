import siteData from "../data/site.json";

export interface ProjectMedia { id: string; original_filename: string; content_type: string; alt_text?: string; caption?: string; url: string; source_type?: string; source_title?: string; source_caption?: string; uploaded_at?: string; }
export interface GalleryMedia extends ProjectMedia { source_type?: string; source_title?: string; source_caption?: string; }
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
  liveUrl?: string;
  period?: string;
  imageUrl?: string;
  imageAlt?: string;
  media: ProjectMedia[];
  visual: "awarespan" | "siddhi" | "aiida" | "clipz";
  featured: boolean;
}
export interface ExperienceEntry { label: string; title: string; organization: string; period: string; description: string; repo?: string; }
export interface EducationEntry { qualification: string; fieldOfStudy: string; institution: string; period: string; description: string; }
export interface Achievement { label: string; title: string; detail: string; imageUrl?: string; awardedOn?: string; }
export interface SkillGroup { name: string; skills: string[]; }
export interface HomeSection { id: string; type: string; enabled: boolean; order: number; }
export interface LauncherShortcut { id: string; name: string; url: string; iconUrl?: string; }
export interface LauncherConfig { customApps: LauncherShortcut[]; chessComProfileUrl: string; lichessProfileUrl: string; wallpaper: "water" | "android-default" | "custom"; wallpaperImageUrl: string; appLabels: Record<string,string>; microbeCount: number; microbeSpeed: number; appColumns: number; showLabels: boolean; hiddenApps: string[]; appOrder: string[]; showSearch: boolean; showClock: boolean; showGallery: boolean; }
export interface HomeContent {
  heroEyebrow: string; focus: string; aboutTitle: string; aboutParagraphs: string[];
  projectsTitle: string; projectsDescription: string; skillsTitle: string; skillsDescription: string;
  contactTitle: string; contactDescription: string;
}
export interface SiteContent {
  owner: { name: string; monogram: string; role: string; location: string; email: string; website: string; github: string; linkedin: string; headline: string; intro: string; };
  projects: Project[];
  gallery: GalleryMedia[];
  experience: ExperienceEntry[];
  education: EducationEntry[];
  achievements: Achievement[];
  skillGroups: SkillGroup[];
  homeSections: HomeSection[];
  homeContent: HomeContent;
  launcher: LauncherConfig;
}

const DEFAULT_HOME_SECTIONS: HomeSection[] = [
  { id: "image-gallery", type: "image-gallery", enabled: true, order: 1 },
  { id: "hero", type: "hero", enabled: true, order: 10 },
  { id: "principles", type: "principles", enabled: true, order: 15 },
  { id: "achievement-gallery", type: "achievement-gallery", enabled: true, order: 20 },
  { id: "projects", type: "projects", enabled: true, order: 30 },
  { id: "about", type: "about", enabled: true, order: 40 },
  { id: "skills", type: "skills", enabled: true, order: 50 },
  { id: "contact", type: "contact", enabled: true, order: 60 }
];
const DEFAULT_LAUNCHER: LauncherConfig = { customApps: [], chessComProfileUrl: "https://www.chess.com", lichessProfileUrl: "https://lichess.org", wallpaper: "water", wallpaperImageUrl: "", appLabels: {}, microbeCount: 28, microbeSpeed: 0.65, appColumns: 4, showLabels: true, hiddenApps: [], appOrder: ["about","gallery","projects","experience","education","skills","terminal","github","contact","settings","chess","achievements","journey","email","contactDetails"], showSearch: true, showClock: true, showGallery: true };
const DEFAULT_HOME_CONTENT: HomeContent = {
  heroEyebrow: "5TH-SEMESTER B.E. COMPUTER SCIENCE / BATCH OF 2028", focus: "Python Development · Data Engineering · Artificial Intelligence · Technical Research & Documentation",
  aboutTitle: "Technical curiosity.\nPractical engineering.",
  aboutParagraphs: ["I am a 5th-semester B.E. Computer Science student (Batch of 2028) with a strong foundation in Python Development, Data Engineering and Technical Research.", "At FOSSEE, IIT Bombay, I contributed to open-source Python software, Blender/OpenFOAM tooling, geometry-driven mesh generation and validation workflows. I value rigorous implementation, clear technical documentation and solutions that can be tested."],
  projectsTitle: "Selected projects.", projectsDescription: "Software, AI, data and systems work documented in my résumé.",
  skillsTitle: "Technologies and tools.", skillsDescription: "Languages, frameworks, databases and technical focus areas.",
  contactTitle: "Have a worthwhile engineering problem?", contactDescription: "Get in touch to discuss software, AI, data engineering or technical research."
};
const site = { ...(siteData as SiteContent), gallery: [], homeSections: DEFAULT_HOME_SECTIONS, homeContent: DEFAULT_HOME_CONTENT, launcher: DEFAULT_LAUNCHER };
export { site };
export const projects = site.projects;
export const featuredProjects = projects.filter((project) => project.featured);
export function getProjectBySlug(slug: string): Project | undefined { return projects.find((project) => project.slug === slug); }
// On Vercel, the frontend and Spring API share the same origin through service rewrites. Local development can point directly at the API using NEXT_PUBLIC_API_BASE_URL.
const API_BASE = (process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "")).replace(/\/$/, "");

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
    owner: { name: "", monogram: "BCH", role: "", location: "", email: "", website: "", github: "", linkedin: "", headline: "", intro: "" },
    homeContent: DEFAULT_HOME_CONTENT,
    launcher: DEFAULT_LAUNCHER,
    projects: [], gallery: [], experience: [], education: [], achievements: [], skillGroups: [], homeSections: site.homeSections ?? []
  };
}

export async function getSiteContent(): Promise<SiteContent> {
  if (!API_BASE) return site;
  const [profile, projectRows, galleryRows, experienceRows, educationRows, achievementRows, skillRows, siteConfig] = await Promise.all([
    readPublic<Record<string, unknown>>("profile"),
    readPublic<Record<string, unknown>[]>("projects"),
    readPublic<Record<string, unknown>[]>("gallery"),
    readPublic<Record<string, unknown>[]>("experience"),
    readPublic<Record<string, unknown>[]>("education"),
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
      stack: Array.isArray(row.stack) ? row.stack.map(String) : [],
      repo: row.repositoryUrl || row.repository_url ? String(row.repositoryUrl ?? row.repository_url) : undefined,
      liveUrl: row.liveUrl ? String(row.liveUrl) : undefined,
      period: row.displayPeriod ? String(row.displayPeriod) : undefined,
      imageUrl: Array.isArray(row.media) && row.media.length ? (() => {
        const image = (row.media as Record<string, unknown>[]).find((asset) => String(asset.content_type ?? "").startsWith("image/"));
        return image?.url ? `${API_BASE}${String(image.url)}` : undefined;
      })() : undefined,
      media: Array.isArray(row.media) ? (row.media as Record<string, unknown>[]).map((asset) => ({ id: String(asset.id), original_filename: String(asset.original_filename ?? ""), content_type: String(asset.content_type ?? ""), alt_text: String(asset.alt_text ?? ""), caption: String(asset.caption ?? ""), url: `${API_BASE}${String(asset.url ?? "")}` })) : [],
      imageAlt: Array.isArray(row.media) && row.media.length ? (() => {
        const image = (row.media as Record<string, unknown>[]).find((asset) => String(asset.content_type ?? "").startsWith("image/"));
        return image?.alt_text ? String(image.alt_text) : undefined;
      })() : undefined,
      visual: (row.visual === "awarespan" || row.visual === "siddhi" || row.visual === "aiida" || row.visual === "clipz" ? row.visual : local?.visual) ?? "clipz",
      featured: Boolean(row.featured)
    };
  });
  const liveGallery: GalleryMedia[] = (galleryRows ?? []).map(row => ({
    id: String(row.id), original_filename: String(row.original_filename ?? ""), content_type: String(row.content_type ?? ""),
    alt_text: String(row.alt_text ?? ""), caption: String(row.caption ?? ""), url: `${API_BASE}${String(row.url ?? "")}`,
    source_type: row.source_type ? String(row.source_type) : undefined,
    source_title: row.source_title ? String(row.source_title) : undefined,
    source_caption: row.source_caption ? String(row.source_caption) : undefined,
    uploaded_at: row.uploaded_at ? String(row.uploaded_at) : undefined
  }));
  const liveExperience: ExperienceEntry[] = (experienceRows ?? []).filter((row) => row.roleTitle && row.organization).map((row) => ({
    label: String(row.employmentType ?? "EXPERIENCE").toUpperCase(),
    title: String(row.roleTitle), organization: String(row.organization),
    period: String(row.displayPeriod ?? periodLabel(row.startedOn as string | null, row.endedOn as string | null, Boolean(row.isCurrent))),
    description: String(row.description ?? ""), repo: row.repositoryUrl ? String(row.repositoryUrl) : undefined
  }));
  const liveEducation: EducationEntry[] = (educationRows ?? []).filter((row) => row.institution && row.qualification).map((row) => ({
    qualification: String(row.qualification), fieldOfStudy: String(row.fieldOfStudy ?? ""), institution: String(row.institution),
    period: String(row.displayPeriod ?? periodLabel(row.startedOn as string | null, row.endedOn as string | null, false)),
    description: String(row.description ?? "")
  }));
  const liveAchievements: Achievement[] = (achievementRows ?? []).filter((row) => row.title).map((row) => ({
    label: String(row.category ?? "MILESTONE"), title: String(row.title), detail: String(row.detail ?? ""),
    imageUrl: row.imageUrl ? `${API_BASE}${String(row.imageUrl)}` : undefined,
    media: [],
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
  let launcherConfig: LauncherConfig = DEFAULT_LAUNCHER;
  try {
    const parsed = typeof siteConfig === "string" ? JSON.parse(siteConfig) as { home?: { sections?: HomeSection[]; content?: Partial<HomeContent> }; launcher?: Partial<LauncherConfig> } : siteConfig as { home?: { sections?: HomeSection[]; content?: Partial<HomeContent> }; launcher?: Partial<LauncherConfig> } | undefined;
    if (parsed?.home?.sections) homeSections = parsed.home.sections;
    if (parsed?.home?.content) homeContent = { ...DEFAULT_HOME_CONTENT, ...parsed.home.content };
    const launcher = { ...DEFAULT_LAUNCHER, ...parsed?.launcher };
    launcher.wallpaper = launcher.wallpaper === "android-default" || launcher.wallpaper === "custom" ? launcher.wallpaper : "water";
    launcher.microbeCount = Math.max(12, Math.min(38, Number(launcher.microbeCount) || 28));
    launcher.microbeSpeed = Math.max(0.1, Math.min(1.5, Number(launcher.microbeSpeed) || 0.65));
    launcher.appColumns = Math.max(3, Math.min(6, Number(launcher.appColumns) || 4));
    launcherConfig = {
      ...launcher,
      hiddenApps: Array.isArray(launcher.hiddenApps) ? launcher.hiddenApps.map(String) : [],
      appOrder: Array.isArray(launcher.appOrder) ? [...new Set([...launcher.appOrder.map(String).filter(id => DEFAULT_LAUNCHER.appOrder.includes(id) || (Array.isArray(launcher.customApps) && launcher.customApps.some(app => app && typeof app.id === "string" && app.id === id))), ...DEFAULT_LAUNCHER.appOrder])] : DEFAULT_LAUNCHER.appOrder,
      chessComProfileUrl: typeof launcher.chessComProfileUrl === "string" && /^https:\/\//i.test(launcher.chessComProfileUrl) ? launcher.chessComProfileUrl : DEFAULT_LAUNCHER.chessComProfileUrl,
      lichessProfileUrl: typeof launcher.lichessProfileUrl === "string" && /^https:\/\//i.test(launcher.lichessProfileUrl) ? launcher.lichessProfileUrl : DEFAULT_LAUNCHER.lichessProfileUrl,
      customApps: Array.isArray(launcher.customApps) ? launcher.customApps.filter(app => app && typeof app.id === "string" && typeof app.name === "string" && typeof app.url === "string" && /^https:\/\//i.test(app.url)).slice(0,24).map(app => ({ id: app.id.slice(0,64), name: app.name.slice(0,32), url: app.url, ...(typeof app.iconUrl === "string" && (/^https:\/\//i.test(app.iconUrl) || app.iconUrl.startsWith("/api/v1/public/media/")) ? { iconUrl: app.iconUrl.startsWith("/") ? `${API_BASE}${app.iconUrl}` : app.iconUrl } : {}) })) : [],
      appLabels: launcher.appLabels && typeof launcher.appLabels === "object" && !Array.isArray(launcher.appLabels) ? Object.fromEntries(Object.entries(launcher.appLabels).map(([key,value])=>[key,String(value).slice(0,32)])) : {},
      wallpaperImageUrl: typeof launcher.wallpaperImageUrl === "string" && (launcher.wallpaperImageUrl.startsWith("https://") || launcher.wallpaperImageUrl.startsWith("/api/v1/public/media/")) ? (launcher.wallpaperImageUrl.startsWith("/") ? `${API_BASE}${launcher.wallpaperImageUrl}` : launcher.wallpaperImageUrl) : "",
      showSearch: launcher.showSearch !== false,
      showClock: launcher.showClock !== false,
      showGallery: launcher.showGallery !== false
    };
  } catch { /* Keep the known safe section layout and content if configuration is malformed. */ }

  return {
    ...emptyLiveSite(),
    owner: {
      name: String(profile.fullName || site.owner.name), monogram: String(profile.monogram || site.owner.monogram), role: String(profile.headline || site.owner.role),
      location: String(profile.location || site.owner.location), email: String(profile.email || site.owner.email),
      website: String(profile.websiteUrl || site.owner.website), github: String(profile.githubUrl || site.owner.github), linkedin: String(profile.linkedinUrl || site.owner.linkedin),
      headline: String(profile.headline || site.owner.headline), intro: String(profile.summary || site.owner.intro)
    },
    projects: liveProjects,
    gallery: liveGallery,
    experience: liveExperience,
    education: liveEducation,
    achievements: liveAchievements,
    skillGroups: Array.from(groups, ([name, skills]) => ({ name, skills })),
    homeSections,
    homeContent,
    launcher: launcherConfig
  };
}

export async function getPublicProjectBySlug(slug: string): Promise<Project | undefined> {
  // A configured live API is authoritative: never fall back to stale snapshot content
  // when the project is unpublished, hidden or the API is temporarily unavailable.
  if (!API_BASE) return getProjectBySlug(slug);
  const content = await getSiteContent();
  return content.projects.find((project) => project.slug === slug);
}
