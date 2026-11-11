import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Markdown } from "@/components/markdown";
import { getPublicItemBySlug, getPublicItemsByType } from "@/lib/content";
import { formatRange } from "@/lib/format";

export const revalidate = 3600;

export function generateStaticParams() {
  return getPublicItemsByType("PROJECT").map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const item = getPublicItemBySlug(slug);
  if (!item) return { title: "Not found" };
  return { title: item.title, description: item.summaryShort };
}

export default async function ProjectPage({
  params,
}: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const item = getPublicItemBySlug(slug);
  if (!item || item.type !== "PROJECT") notFound();

  return (
    <article className="py-16 sm:py-24">
      <Link
        href="/projects"
        className="font-mono text-[11px] uppercase tracking-[0.18em] text-fg-faint transition-colors hover:text-accent"
      >
        ← Projects
      </Link>

      <header className="mt-8 max-w-2xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-fg-faint">
          {formatRange(item.startDate, item.endDate)}
          {item.isBeta ? " · Beta" : ""}
        </p>
        <h1 className="mt-4 text-4xl font-medium tracking-[-0.025em] text-fg sm:text-5xl">
          {item.title}
        </h1>
        <p className="mt-5 text-[15px] leading-7 text-fg-muted">
          {item.summaryShort}
        </p>
        {item.skills.length > 0 ? (
          <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.16em] text-fg-faint">
            {item.skills.join(" · ")}
          </p>
        ) : null}
      </header>

      <div className="mt-12 max-w-2xl">
        <Markdown>{item.descriptionLong}</Markdown>
      </div>

      {item.urls.length > 0 ? (
        <div className="mt-12 max-w-2xl border-t border-line/60 pt-6">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-fg-faint">
            Links
          </h2>
          <ul className="mt-3 space-y-2">
            {item.urls.map((url) => (
              <li key={url.url} className="flex flex-wrap items-baseline gap-3">
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg-muted">
                  {url.label}
                </span>
                <a
                  href={url.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="break-all text-sm text-accent underline underline-offset-4 decoration-accent/40 transition-colors hover:decoration-accent"
                >
                  {url.url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}
