export const ITEM_TYPES = [
  "PROJECT",
  "EXPERIENCE",
  "EDUCATION",
  "ACHIEVEMENT",
] as const;

export type ItemType = (typeof ITEM_TYPES)[number];

export type ItemUrl = {
  label: string;
  url: string;
};

export type Item = {
  id: string;
  slug: string;
  type: ItemType;
  title: string;
  org: string | null;
  location: string | null;
  /** yyyy-mm */
  startDate: string;
  /** yyyy-mm, or null for "present" */
  endDate: string | null;
  descriptionLong: string;
  summaryShort: string;
  displayOrder: number;
  isPublic: boolean;
  resumeEligible: boolean;
  announceOnLinkedIn: boolean;
  isBeta: boolean;
  urls: ItemUrl[];
  bullets: string[];
  skills: string[];
};

export type Skill = {
  name: string;
  category: string;
};

export type ProfileLink = {
  label: string;
  url: string;
};

export type Profile = {
  name: string;
  headline: string;
  summary: string;
  email: string;
  links: ProfileLink[];
};

export type SiteContent = {
  profile: Profile;
  items: Item[];
  skills: Skill[];
};
