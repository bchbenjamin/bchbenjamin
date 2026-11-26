"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  const [menu,setMenu]=useState(false);

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
      <div className="kippo-auth">
        <h1>Owner access</h1><p>Sign in to unlock the developer workspace.</p>
        <a className="button button-primary" href="/login">Sign in to continue <span className="arrow-up-right">↗</span></a>
      </div>
    );
  }

  if (!session.stepUp) return <AdminStepUp configured={session.totpConfigured} onVerified={() => setSession(current => current ? { ...current, totpConfigured: true, stepUp: true } : current)} />;

  const sections = {"Analytics":AdminAnalytics,"Site builder":SiteBuilder,"Profile & content":AdminContentManager,"Media":MediaLibrary,"Resume":ResumeStudio,"Inbox":AdminContactPanel,"LinkedIn":LinkedInPublishingPanel};
  const Panel=sections[section as keyof typeof sections];
  return <div className="kippo-layout">
    <header className="kippo-top"><Link href="/" className="kippo-brand">PORTFOLIO / DEV</Link><button type="button" className="kippo-menu" aria-expanded={menu} aria-controls="kippo-nav" onClick={()=>setMenu(!menu)}> {menu?"Close":"Menu"} </button><span className="kippo-verified">TOTP verified</span></header>
    <aside className={`kippo-sidebar ${menu?"is-open":""}`} id="kippo-nav"><nav aria-label="Administration">{Object.keys(sections).map((name,index)=><button key={name} aria-current={section===name?"page":undefined} onClick={()=>{setSection(name);setMenu(false);}}><span>{String(index+1).padStart(2,"0")}</span>{name}</button>)}</nav><LogoutButton/></aside>
    <div className="kippo-main"><header className="kippo-section-head"><p>Developer workspace / {section}</p><h1>{section}</h1></header><div className="kippo-panel"><Panel/></div></div>
  </div>;
}
