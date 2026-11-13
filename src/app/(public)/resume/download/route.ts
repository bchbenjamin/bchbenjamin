import { getSiteContent } from "@/content/repository";
import { isDatabaseConfigured } from "@/db/config";
import { getPublishedResume } from "@/db/resume";
import { buildResume, isResumeContent } from "@/lib/resume/build";
import { resumeBuffer } from "@/lib/resume/document";

export const dynamic = "force-dynamic";

const DOCX =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export async function GET() {
  let resume = buildResume(await getSiteContent());

  if (isDatabaseConfigured()) {
    const published = await getPublishedResume();
    if (published && isResumeContent(published.body)) resume = published.body;
  }

  const body = await resumeBuffer(resume);

  return new Response(body, {
    headers: {
      "content-type": DOCX,
      "content-disposition": 'attachment; filename="benjamin-resume.docx"',
      "cache-control": "no-store",
    },
  });
}
