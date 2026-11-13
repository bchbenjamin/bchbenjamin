"use client";

import Link from "next/link";
import { useActionState } from "react";

import { ITEM_TYPES } from "@/lib/content/types";
import type { ItemFormDefaults } from "@/lib/content/item-form";

import type { ItemActionState } from "./actions";

const initialState: ItemActionState = { errors: [] };

const field =
  "mt-2 w-full border border-line bg-card px-3 py-2 text-sm text-fg placeholder:text-fg-faint focus:border-accent focus:outline-none";
const label =
  "font-mono text-[10px] uppercase tracking-[0.18em] text-fg-faint";

export function ItemForm({
  action,
  defaults,
  itemId,
  heading,
  submitLabel,
}: {
  action: (
    previous: ItemActionState,
    formData: FormData,
  ) => Promise<ItemActionState>;
  defaults?: ItemFormDefaults;
  itemId?: string;
  heading: string;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="max-w-3xl">
      <div className="flex items-baseline justify-between gap-6">
        <h1 className="text-2xl font-medium tracking-[-0.02em] text-fg">
          {heading}
        </h1>
        <Link
          href="/admin"
          className="font-mono text-[11px] uppercase tracking-[0.18em] text-fg-faint transition-colors hover:text-accent"
        >
          ← Content
        </Link>
      </div>

      {itemId ? <input type="hidden" name="id" value={itemId} /> : null}

      {state.errors.length > 0 ? (
        <ul
          role="alert"
          className="mt-6 space-y-1 border-l border-accent pl-3 text-sm text-fg-muted"
        >
          {state.errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="title">
            Title
          </label>
          <input
            id="title"
            name="title"
            required
            defaultValue={defaults?.title}
            className={field}
          />
        </div>

        <div>
          <label className={label} htmlFor="slug">
            Slug
          </label>
          <input
            id="slug"
            name="slug"
            required
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            defaultValue={defaults?.slug}
            className={field}
          />
        </div>

        <div>
          <label className={label} htmlFor="type">
            Type
          </label>
          <select
            id="type"
            name="type"
            defaultValue={defaults?.type ?? "PROJECT"}
            className={field}
          >
            {ITEM_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={label} htmlFor="displayOrder">
            Display order
          </label>
          <input
            id="displayOrder"
            name="displayOrder"
            type="number"
            defaultValue={defaults?.displayOrder ?? "0"}
            className={field}
          />
        </div>

        <div>
          <label className={label} htmlFor="org">
            Organisation
          </label>
          <input
            id="org"
            name="org"
            defaultValue={defaults?.org}
            className={field}
          />
        </div>

        <div>
          <label className={label} htmlFor="location">
            Location
          </label>
          <input
            id="location"
            name="location"
            defaultValue={defaults?.location}
            className={field}
          />
        </div>

        <div>
          <label className={label} htmlFor="startDate">
            Start (yyyy-mm)
          </label>
          <input
            id="startDate"
            name="startDate"
            required
            placeholder="2024-01"
            defaultValue={defaults?.startDate}
            className={field}
          />
        </div>

        <div>
          <label className={label} htmlFor="endDate">
            End (yyyy-mm, empty = present)
          </label>
          <input
            id="endDate"
            name="endDate"
            placeholder="2025-06"
            defaultValue={defaults?.endDate}
            className={field}
          />
        </div>
      </div>

      <div className="mt-5">
        <label className={label} htmlFor="summaryShort">
          Summary
        </label>
        <textarea
          id="summaryShort"
          name="summaryShort"
          required
          rows={2}
          defaultValue={defaults?.summaryShort}
          className={field}
        />
      </div>

      <div className="mt-5">
        <label className={label} htmlFor="descriptionLong">
          Description (markdown)
        </label>
        <textarea
          id="descriptionLong"
          name="descriptionLong"
          required
          rows={10}
          defaultValue={defaults?.descriptionLong}
          className={field}
        />
      </div>

      <div className="mt-5">
        <label className={label} htmlFor="bullets">
          Bullets (one per line)
        </label>
        <textarea
          id="bullets"
          name="bullets"
          rows={4}
          defaultValue={defaults?.bullets}
          className={field}
        />
      </div>

      <div className="mt-5">
        <label className={label} htmlFor="urls">
          Links (one per line: Label | https://…)
        </label>
        <textarea
          id="urls"
          name="urls"
          rows={3}
          defaultValue={defaults?.urls}
          className={field}
        />
      </div>

      <div className="mt-5">
        <label className={label} htmlFor="skills">
          Skills (comma separated)
        </label>
        <input
          id="skills"
          name="skills"
          defaultValue={defaults?.skills}
          className={field}
        />
      </div>

      <fieldset className="mt-6 grid gap-3 border-t border-line/60 pt-5 sm:grid-cols-2">
        <legend className="sr-only">Flags</legend>
        {[
          { name: "isPublic", label: "Public on the site", value: defaults?.isPublic },
          { name: "resumeEligible", label: "Include on the resume", value: defaults?.resumeEligible },
          { name: "isBeta", label: "Mark as beta", value: defaults?.isBeta },
          { name: "announceOnLinkedIn", label: "Eligible for a LinkedIn post", value: defaults?.announceOnLinkedIn },
        ].map((flag) => (
          <label key={flag.name} className="flex items-center gap-3 text-sm text-fg-muted">
            <input
              type="checkbox"
              name={flag.name}
              defaultChecked={flag.value}
              className="h-4 w-4 accent-[#6798ff]"
            />
            {flag.label}
          </label>
        ))}
      </fieldset>

      <button
        type="submit"
        disabled={pending}
        className="mt-8 border border-line px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-fg transition-colors hover:border-accent hover:text-accent disabled:opacity-60"
      >
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
