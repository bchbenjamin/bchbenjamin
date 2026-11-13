import Link from "next/link";

const NAV = [
  { href: "/projects", label: "Projects" },
  { href: "/experience", label: "Experience" },
  { href: "/resume", label: "Resume" },
  { href: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-ink/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-[1120px] items-center justify-between px-6 sm:px-8">
        <Link
          href="/"
          className="font-mono text-sm tracking-tight text-fg transition-colors hover:text-accent"
        >
          bchbenjamin<span className="text-accent">.</span>
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-5 sm:gap-8">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted transition-colors hover:text-fg"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
