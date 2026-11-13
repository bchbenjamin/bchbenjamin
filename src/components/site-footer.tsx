import { getProfile } from "@/content/repository";

export async function SiteFooter() {
  const profile = await getProfile();

  return (
    <footer className="border-t border-line/70">
      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-faint">
            bchbenjamin
          </span>
          <a
            href={`mailto:${profile.email}`}
            className="text-sm text-fg-muted transition-colors hover:text-accent"
          >
            {profile.email}
          </a>
        </div>
        <ul className="flex flex-wrap items-center gap-6">
          {profile.links.map((link) => (
            <li key={link.url}>
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer noopener"
                className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-faint transition-colors hover:text-fg"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
