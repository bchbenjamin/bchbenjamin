import Link from "next/link";

import type { Item } from "@/lib/content/types";
import { formatRange } from "@/lib/format";

export function ProjectCard({ item, index }: { item: Item; index: number }) {
  return (
    <Link
      href={`/projects/${item.slug}`}
      className="group flex flex-col overflow-hidden border border-line bg-card transition-colors hover:border-accent/60"
    >
      <div className="relative aspect-[16/10] border-b border-line/70 bg-[radial-gradient(130%_120%_at_18%_0%,#1c1c1c_0%,#141414_45%,#0e0e0e_100%)]">
        <span className="absolute left-4 top-4 font-mono text-[11px] tracking-[0.2em] text-fg-faint">
          {String(index).padStart(2, "0")}
        </span>
        {item.isBeta ? (
          <span className="absolute right-4 top-4 border border-line px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-fg-muted">
            Beta
          </span>
        ) : null}
        <span className="absolute bottom-4 left-4 font-mono text-[11px] text-fg-faint">
          /{item.slug}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="text-base font-medium text-fg transition-colors group-hover:text-accent">
          {item.title}
        </h3>
        <p className="text-sm leading-6 text-fg-muted">{item.summaryShort}</p>
        <div className="mt-auto flex flex-wrap items-baseline gap-3 pt-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg-faint">
            {item.skills.slice(0, 3).join(" · ")}
          </span>
          <span className="ml-auto font-mono text-[10px] tracking-[0.12em] text-fg-faint">
            {formatRange(item.startDate, item.endDate)}
          </span>
        </div>
      </div>
    </Link>
  );
}
