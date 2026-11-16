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
