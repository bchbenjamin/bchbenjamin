import type { Item } from "@/lib/content/types";
import { formatRange } from "@/lib/format";

export function ExperienceEntry({
  item,
  showBullets = true,
}: {
  item: Item;
  showBullets?: boolean;
}) {
  const meta = [item.org, item.location].filter(Boolean).join(" · ");

  return (
    <article className="grid gap-3 border-t border-line/60 pt-6 sm:grid-cols-[1fr_auto] sm:gap-8">
      <div className="space-y-2">
        <h3 className="text-base font-medium text-fg">{item.title}</h3>
        {meta ? (
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg-faint">
            {meta}
          </p>
        ) : null}
        <p className="text-sm leading-6 text-fg-muted">{item.summaryShort}</p>
        {showBullets && item.bullets.length > 0 ? (
          <ul className="space-y-1.5 pt-1">
            {item.bullets.map((bullet) => (
              <li
                key={bullet}
                className="relative pl-4 text-sm leading-6 text-fg-muted before:absolute before:left-0 before:top-[0.9em] before:h-px before:w-2 before:bg-line"
              >
                {bullet}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <p className="font-mono text-[11px] tracking-[0.12em] text-fg-faint sm:whitespace-nowrap sm:text-right">
        {formatRange(item.startDate, item.endDate)}
      </p>
    </article>
  );
}
