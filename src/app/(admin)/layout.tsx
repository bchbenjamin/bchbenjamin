import Link from "next/link";

import { requireOwnerPage } from "@/lib/auth";

import { signOutAction } from "./actions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireOwnerPage();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-line/70">
        <div className="mx-auto flex w-full max-w-[1120px] flex-wrap items-center justify-between gap-4 px-6 py-4 sm:px-8">
          <div className="flex items-center gap-6">
            <Link
              href="/admin"
              className="font-mono text-sm text-fg transition-colors hover:text-accent"
            >
              admin<span className="text-accent">.</span>
            </Link>
            <nav aria-label="Admin" className="flex items-center gap-5">
              <Link
                href="/admin"
                className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted transition-colors hover:text-fg"
              >
                Content
              </Link>
              <Link
                href="/"
                className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted transition-colors hover:text-fg"
              >
                View site
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-5">
            <span className="font-mono text-[11px] text-fg-faint">
              {session.user.email}
            </span>
            <form action={signOutAction}>
              <button
                type="submit"
                className="font-mono text-[11px] uppercase tracking-[0.18em] text-fg-muted transition-colors hover:text-accent"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1120px] flex-1 px-6 py-12 sm:px-8">
        {children}
      </main>
    </div>
  );
}
