import type { Metadata } from "next";
import Link from "next/link";

import { safeNextPath } from "@/lib/next-path";

import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeNextPath(
    typeof params.next === "string" ? params.next : undefined,
  );

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-16">
      <Link
        href="/"
        className="font-mono text-sm text-fg transition-colors hover:text-accent"
      >
        bchbenjamin<span className="text-accent">.</span>
      </Link>

      <h1 className="mt-10 text-2xl font-medium tracking-[-0.02em] text-fg">
        Owner sign in
      </h1>
      <p className="mt-2 text-sm leading-6 text-fg-muted">
        One account exists for this site. There is no sign-up.
      </p>

      <LoginForm next={next} />
    </main>
  );
}
