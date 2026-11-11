type SectionProps = {
  index: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
};

/** Eyebrow-labelled section: numbered label on the left, content on the right. */
export function Section({ index, title, intro, children }: SectionProps) {
  return (
    <section className="grid gap-8 border-t border-line/60 py-14 sm:grid-cols-[220px_1fr] sm:gap-12 sm:py-20">
      <div className="flex flex-col gap-2">
        <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-accent">
          {index}
        </span>
        <h2 className="text-lg font-medium tracking-[-0.01em] text-fg">{title}</h2>
      </div>
      <div className="space-y-8">
        {intro ? (
          <p className="max-w-xl text-[15px] leading-7 text-fg-muted">{intro}</p>
        ) : null}
        {children}
      </div>
    </section>
  );
}
