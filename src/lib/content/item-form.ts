import { randomUUID } from "node:crypto";

import { parseItem } from "./index";
import { ITEM_TYPES, type Item, type ItemType } from "./types";

/*
 * Parses the admin item form into a validated Item. Pure and shared by the
 * server actions and the tests, so the same rules cover both.
 *
 * urls arrive as "Label | https://…" lines, bullets as one per line, and skills
 * as a comma separated list.
 */

export type ItemFormResult =
  | { ok: true; item: Item }
  | { ok: false; errors: string[] };

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function checked(formData: FormData, name: string): boolean {
  return formData.get(name) === "on" || formData.get(name) === "true";
}

function lines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");
}

function isItemType(value: string): value is ItemType {
  return (ITEM_TYPES as readonly string[]).includes(value);
}

export function parseItemForm(formData: FormData, id?: string): ItemFormResult {
  const errors: string[] = [];

  const slug = text(formData, "slug");
  if (!SLUG.test(slug)) {
    errors.push("Slug must be lowercase words separated by single hyphens.");
  }

  const type = text(formData, "type");
  if (!isItemType(type)) {
    errors.push(`Type must be one of ${ITEM_TYPES.join(", ")}.`);
  }

  const title = text(formData, "title");
  if (!title) errors.push("Title is required.");

  const startDate = text(formData, "startDate");
  if (!MONTH.test(startDate)) errors.push("Start date must be yyyy-mm.");

  const endDate = text(formData, "endDate");
  if (endDate && !MONTH.test(endDate)) errors.push("End date must be yyyy-mm or empty.");

  const summaryShort = text(formData, "summaryShort");
  if (!summaryShort) errors.push("Summary is required.");

  const descriptionLong = text(formData, "descriptionLong");
  if (!descriptionLong) errors.push("Description is required.");

  const displayOrderRaw = text(formData, "displayOrder") || "0";
  const displayOrder = Number(displayOrderRaw);
  if (!Number.isInteger(displayOrder)) {
    errors.push("Display order must be a whole number.");
  }

  const urls = lines(text(formData, "urls")).map((line, index) => {
    const separator = line.indexOf("|");
    if (separator === -1) {
      errors.push(`Link line ${index + 1} must look like "Label | https://…".`);
      return { label: "", url: "" };
    }
    return {
      label: line.slice(0, separator).trim(),
      url: line.slice(separator + 1).trim(),
    };
  });

  const bullets = lines(text(formData, "bullets"));
  const skills = text(formData, "skills")
    .split(",")
    .map((name) => name.trim())
    .filter((name) => name !== "");

  if (errors.length > 0) return { ok: false, errors };

  try {
    const item = parseItem(
      {
        id: id ?? randomUUID(),
        slug,
        type,
        title,
        org: text(formData, "org") || null,
        location: text(formData, "location") || null,
        startDate,
        endDate: endDate || null,
        descriptionLong,
        summaryShort,
        displayOrder,
        isPublic: checked(formData, "isPublic"),
        resumeEligible: checked(formData, "resumeEligible"),
        announceOnLinkedIn: checked(formData, "announceOnLinkedIn"),
        isBeta: checked(formData, "isBeta"),
        urls,
        bullets,
        skills,
      },
      "item",
    );
    return { ok: true, item };
  } catch (error) {
    return {
      ok: false,
      errors: [error instanceof Error ? error.message : "Invalid item."],
    };
  }
}

/** Renders stored values back into the textarea formats the form expects. */
export function itemToFormDefaults(item: Item) {
  return {
    slug: item.slug,
    type: item.type,
    title: item.title,
    org: item.org ?? "",
    location: item.location ?? "",
    startDate: item.startDate,
    endDate: item.endDate ?? "",
    summaryShort: item.summaryShort,
    descriptionLong: item.descriptionLong,
    displayOrder: String(item.displayOrder),
    isPublic: item.isPublic,
    resumeEligible: item.resumeEligible,
    announceOnLinkedIn: item.announceOnLinkedIn,
    isBeta: item.isBeta,
    urls: item.urls.map((link) => `${link.label} | ${link.url}`).join("\n"),
    bullets: item.bullets.join("\n"),
    skills: item.skills.join(", "),
  };
}

export type ItemFormDefaults = ReturnType<typeof itemToFormDefaults>;
