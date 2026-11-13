import type { Metadata } from "next";
import Link from "next/link";

import { getSiteContent } from "@/content/repository";
import { isDatabaseConfigured } from "@/db/config";
import { getPublishedResume } from "@/db/resume";
import { formatRange } from "@/lib/format";
import { buildResume, isResumeContent, type ResumeContent } from "@/lib/resume/build";
import type { Item } from "@/lib/content/types";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Resume",
  description: "Resume of Benjamin, generated from the same content as this site.",
};

async function currentResume(): Promise<ResumeContent> {
  if (isDatabaseConfigured()) {
    const published = await getPublishedResume();
    if (published && isResumeContent(published.body)) return published.body;
  }
  return buildResume(await getSiteContent());
}

function Entry({ item }: { item: Item }) {
  const meta = [item.org, item.location].filter(Boolean).join(" · ");
  return (
    <article className="border-t border-line/60 pt-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-medium text-fg">{item.title}</h3>
        <p className="font-mono text-[11px] tracking-[0.12em] text-fg-faint">
          {formatRange(item.startDate, item.endDate)}
        </p>
      </div>
      {meta ? (
        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.16em] text-fg-faint">
          {meta}
        </p>
      ) : null}
      <p className="mt-2 text-sm leading-6 text-fg-muted">{item.summaryShort}</p>
      {item.bullets.length > 0 ? (
        <ul className="mt-2 space-y-1.5">
          {item.bullets.map((body) => (
            <li
              key={body}
              className="relative pl-4 text-sm leading-6 text-fg-muted before:absolute before:left-0 before:top-[0.9em] before:h-px before:w-2 before:bg-line"
            >
              {body}
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

function Section({
  title,
  items,
}: {
  title: string;
  items: Item[];
}) {
  if (items.length === 0) return null;
  return (
    <section className="mt-12">
      <h2 className="font-mono text-[11px] uppercase tracking-[0.24em] text-accent">
        {title}
      </h2>
      <div className="mt-5 space-y-6">
        {items.map((item) => (
          <Entry key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

export default async function ResumePage() {
  const resume = await currentResume();

  return (
    <div className="py-16 sm:py-24">
      <header className="max-w-2xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-accent">
          04 — Resume
        </p>
        <h1 className="mt-4 text-4xl font-medium tracking-[-0.025em] text-fg sm:text-5xl">
          {resume.name}
        </h1>
        <p className="mt-3 text-[15px] leading-7 text-fg-muted">
          {resume.headline}
        </p>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-fg-faint">
          {resume.summary}
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3">
          <a
            href="/resume/download"
            className="border-b border-accent pb-1 text-sm text-fg transition-colors hover:text-accent"
          >
            Download .docx
          </a>
          <a
            href={`mailto:${resume.email}`}
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-fg-faint transition-colors hover:text-fg"
          >
            {resume.email}
          </a>
          <Link
            href="/contact"
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-fg-faint transition-colors hover:text-fg"
          >
            Contact
          </Link>
        </div>
      </header>

      <div className="mt-16 max-w-3xl">
        <Section title="Experience" items={resume.experience} />
        <Section title="Projects" items={resume.projects} />
        <Section title="Education" items={resume.education} />
        <Section title="Other" items={resume.achievements} />

        {resume.skills.length > 0 ? (
          <section className="mt-12">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.24em] text-accent">
              Skills
            </h2>
            <div className="mt-5 space-y-2">
              {resume.skills.map((group) => (
                <p key={group.category} className="text-sm leading-6 text-fg-muted">
                  <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-fg-faint">
                    {group.category}
                  </span>
                  <span className="mx-3 text-line">·</span>
                  {group.skills.join(", ")}
                </p>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
