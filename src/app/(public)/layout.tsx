import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:border focus:border-line focus:bg-card focus:px-4 focus:py-2 focus:text-sm focus:text-fg"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" className="flex-1">
        <div className="mx-auto w-full max-w-[1120px] px-6 sm:px-8">
          {children}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
