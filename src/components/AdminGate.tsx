"use client";

import { useEffect, useState } from "react";
import AdminAnalytics from "@/components/AdminAnalytics";
import LogoutButton from "@/components/LogoutButton";
import AdminContentManager from "@/components/AdminContentManager";
import LinkedInPublishingPanel from "@/components/LinkedInPublishingPanel";
import ResumeStudio from "@/components/ResumeStudio";
import MediaLibrary from "@/components/MediaLibrary";
import SiteBuilder from "@/components/SiteBuilder";
import AdminContactPanel from "@/components/AdminContactPanel";
import AdminStepUp from "@/components/AdminStepUp";

const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");

type Session = { authenticated: boolean; name: string; email: string; issuer: string; totpConfigured: boolean; stepUp: boolean };

export default function AdminGate() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [section,setSection]=useState("Analytics");

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 5000);
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
      .finally(() => { window.clearTimeout(timeout); setLoading(false); });
    return () => { window.clearTimeout(timeout); controller.abort(); };
  }, []);

  if (loading) return <p className="admin-state">Checking owner session…</p>;
  if (!session?.authenticated) {
    return (
      <div className="admin-state">
        <p>No active owner session was found.</p>
        <a className="button button-primary" href="/login">Sign in to continue <span className="arrow-up-right">↗</span></a>
      </div>
    );
  }

  if (!session.stepUp) return <AdminStepUp configured={session.totpConfigured} onVerified={() => setSession(current => current ? { ...current, totpConfigured: true, stepUp: true } : current)} />;

  const sections = {"Analytics":AdminAnalytics,"Site builder":SiteBuilder,"Profile & content":AdminContentManager,"Media":MediaLibrary,"Resume":ResumeStudio,"Inbox":AdminContactPanel,"LinkedIn":LinkedInPublishingPanel};
  const Panel=sections[section as keyof typeof sections];
  return <div className="admin-dashboard"><aside className="admin-sidebar"><h2>Portfolio Admin</h2><nav aria-label="Administration">{Object.keys(sections).map(name=><button key={name} aria-current={section===name?"page":undefined} onClick={()=>setSection(name)}>{name}</button>)}</nav><LogoutButton/></aside><main className="admin-main"><header><div><small>Owner workspace</small><h1>{section}</h1></div><span>Verified · TOTP</span></header><Panel/></main></div>;
}
