import { requireOwner } from "@/lib/auth";
import { getSiteContent } from "@/content/repository";
import { isDatabaseConfigured } from "@/db/config";
import { getPublishedResume } from "@/db/resume";
import { buildResume } from "@/lib/resume/build";

import { PublishButton } from "./publish-button";

export default async function AdminResumePage() {
  await requireOwner();

  const live = buildResume(await getSiteContent());
  const published = isDatabaseConfigured() ? await getPublishedResume() : null;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-medium tracking-[-0.02em] text-fg">Resume</h1>
      <p className="mt-2 text-sm leading-6 text-fg-muted">
        Publishing freezes the current resume into a snapshot. The public page and
        the .docx download serve that snapshot until you publish again.
      </p>

      <dl className="mt-8 space-y-3 border-t border-line/60 pt-6 text-sm">
        <div className="flex justify-between gap-6">
          <dt className="text-fg-muted">Items on the resume</dt>
          <dd className="font-mono text-fg">{live.itemIds.length}</dd>
        </div>
        <div className="flex justify-between gap-6">
          <dt className="text-fg-muted">Experience entries</dt>
          <dd className="font-mono text-fg">{live.experience.length}</dd>
        </div>
        <div className="flex justify-between gap-6">
          <dt className="text-fg-muted">Projects</dt>
          <dd className="font-mono text-fg">{live.projects.length}</dd>
        </div>
        <div className="flex justify-between gap-6">
          <dt className="text-fg-muted">Published version</dt>
          <dd className="font-mono text-fg">
            {published ? `${published.version} · ${published.publishedAt.slice(0, 10)}` : "none"}
          </dd>
        </div>
      </dl>

      <PublishButton />
    </div>
  );
}
