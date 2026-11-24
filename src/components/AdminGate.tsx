"use client";

import { useEffect, useState } from "react";
import LogoutButton from "@/components/LogoutButton";
import AdminContentManager from "@/components/AdminContentManager";
import LinkedInPublishingPanel from "@/components/LinkedInPublishingPanel";
import ResumeStudio from "@/components/ResumeStudio";
import MediaLibrary from "@/components/MediaLibrary";
import SiteBuilder from "@/components/SiteBuilder";
import CustomFieldDefinitions from "@/components/CustomFieldDefinitions";
import AdminContactPanel from "@/components/AdminContactPanel";
import AdminStepUp from "@/components/AdminStepUp";

const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");

type Session = { authenticated: boolean; name: string; email: string; issuer: string; totpConfigured: boolean; stepUp: boolean };

export default function AdminGate() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${apiBase}/api/v1/admin/session`, {
      credentials: "include",
      headers: { Accept: "application/json" },
      signal: controller.signal
    })
      .then(async (response) => {
        const contentType = response.headers.get("content-type") ?? "";
        if (!response.ok || !contentType.includes("application/json")) return null;
        return (await response.json()) as Session;
      })
      .then(setSession)
      .catch(() => setSession(null))
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  if (loading) return <p className="admin-state">Checking your owner session…</p>;
  if (!session?.authenticated) {
    return (
      <div className="admin-state">
        <p>No active owner session was found.</p>
        <a className="button button-primary" href="/login">Sign in to continue <span className="arrow-up-right">↗</span></a>
      </div>
    );
  }

  if (!session.stepUp) return <AdminStepUp configured={session.totpConfigured} onVerified={() => setSession(current => current ? { ...current, totpConfigured: true, stepUp: true } : current)} />;

  return (
    <div className="admin-state">
      <p className="eyebrow"><span className="status-pulse" /> AUTHENTICATED OWNER SESSION</p>
      <h2>Welcome, {session.name}.</h2>
      <p>{session.email}</p>
      <p className="admin-muted">Identity provider: {new URL(session.issuer).hostname}</p>
      <p className="admin-muted">The owner-only content API is active. Changes are audited.</p>
      <div className="owner-console-head"><div><p className="eyebrow">CONTROL PLANE / OWNER ONLY</p><h2>Private <span>workspace.</span></h2><p>Manage content, publication, media and private documents from one place.</p></div><div className="owner-console-status"><i /> API SESSION VERIFIED</div></div>
      <nav className="owner-console-nav" aria-label="Workspace sections"><a href="#site-builder">Site builder</a><a href="#content-manager">Content</a><a href="#custom-fields">Custom fields</a><a href="#media-library">Media</a><a href="#resume-studio">Resume studio</a><a href="#contact-queue">Inbox</a></nav>
      <LogoutButton />
      <div id="site-builder"><SiteBuilder /></div>
      <div id="content-manager"><AdminContentManager /></div>
      <div id="custom-fields"><CustomFieldDefinitions /></div>
      <div id="media-library"><MediaLibrary /></div>
      <div id="resume-studio"><ResumeStudio /></div>
      <div id="contact-queue"><AdminContactPanel /></div>
      <LinkedInPublishingPanel />
    </div>
  );
}
