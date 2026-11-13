import Link from "next/link";

import { requireOwner } from "@/lib/auth";
import { isDatabaseConfigured } from "@/db/config";
import { getProfileRow, listItemSummaries } from "@/db/admin";

export default async function AdminPage() {
  await requireOwner();

  if (!isDatabaseConfigured()) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-medium text-fg">Database not configured</h1>
        <p className="mt-3 text-sm leading-6 text-fg-muted">
          Set <code className="font-mono text-fg">DATABASE_URL_APP</code> and the
          other values from <code className="font-mono text-fg">.env.example</code>,
          then run{" "}
          <code className="font-mono text-fg">npm run db:migrate</code> and{" "}
          <code className="font-mono text-fg">npm run db:seed</code>.
        </p>
      </div>
    );
  }

  const [items, profileRow] = await Promise.all([
    listItemSummaries(),
    getProfileRow(),
  ]);

  const publicCount = items.filter((entry) => entry.isPublic).length;
  const resumeCount = items.filter((entry) => entry.resumeEligible).length;

  return (
    <div>
      <h1 className="text-2xl font-medium tracking-[-0.02em] text-fg">Content</h1>
      <p className="mt-2 text-sm text-fg-muted">
        {items.length} items · {publicCount} public · {resumeCount} on the resume
      </p>

      <section className="mt-10">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.24em] text-accent">
          Profile
        </h2>
        <div className="mt-4 border border-line bg-card p-5">
          {profileRow ? (
            <>
              <p className="text-base text-fg">{profileRow.name}</p>
              <p className="mt-1 text-sm text-fg-muted">{profileRow.headline}</p>
              <p className="mt-1 font-mono text-[11px] text-fg-faint">
                {profileRow.email}
              </p>
            </>
          ) : (
            <p className="text-sm text-fg-muted">
              No profile row yet. Run{" "}
              <code className="font-mono">npm run db:seed</code>.
            </p>
          )}
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-baseline justify-between gap-6">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.24em] text-accent">
            Items
          </h2>
          <Link
            href="/admin/items/new"
            className="border border-line px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-fg-muted transition-colors hover:border-accent hover:text-accent"
          >
            New item
          </Link>
        </div>
        <div className="mt-4 overflow-x-auto border border-line">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-fg-faint">
                  Title
                </th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-fg-faint">
                  Type
                </th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-fg-faint">
                  Visibility
                </th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-fg-faint">
                  Resume
                </th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-fg-faint">
                  Order
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((entry) => (
                <tr key={entry.id} className="border-b border-line/60 last:border-0">
                  <td className="px-4 py-3 text-fg">
                    <Link
                      href={`/admin/items/${entry.id}`}
                      className="transition-colors hover:text-accent"
                    >
                      {entry.title}
                    </Link>
                    <span className="ml-2 font-mono text-[10px] text-fg-faint">
                      /{entry.slug}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.14em] text-fg-muted">
                    {entry.type}
                  </td>
                  <td className="px-4 py-3 text-fg-muted">
                    {entry.isPublic ? "Public" : "Private"}
                  </td>
                  <td className="px-4 py-3 text-fg-muted">
                    {entry.resumeEligible ? "Yes" : "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-fg-faint">
                    {entry.displayOrder}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
