import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const apiBase = (process.env.API_BASE_URL ?? "").replace(/\/$/, "");
  if (!apiBase) return NextResponse.json({ error: "Resume service is not configured." }, { status: 503 });

  const variant = request.nextUrl.searchParams.get("variant") ?? "resume";
  if (!["long", "short", "resume"].includes(variant)) {
    return NextResponse.json({ error: "Unknown resume variant." }, { status: 400 });
  }

  try {
    const upstream = await fetch(`${apiBase}/api/v1/public/resume.pdf?variant=${variant}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(20_000)
    });
    if (!upstream.ok) return NextResponse.json({ error: "Resume generation is temporarily unavailable." }, { status: upstream.status });
    return new NextResponse(await upstream.arrayBuffer(), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename=Benjamin-${variant}-resume.pdf`,
        "Cache-Control": "private, no-store"
      }
    });
  } catch {
    return NextResponse.json({ error: "Resume service could not be reached." }, { status: 503 });
  }
}
