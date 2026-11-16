"use client";

import { useEffect, useState } from "react";
import LogoutButton from "@/components/LogoutButton";
import AdminContentManager from "@/components/AdminContentManager";
import LinkedInPublishingPanel from "@/components/LinkedInPublishingPanel";
import AgentAccessPanel from "@/components/AgentAccessPanel";

const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080").replace(/\/$/, "");

type Session = { authenticated: boolean; name: string; email: string; issuer: string };

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

  return (
    <div className="admin-state">
      <p className="eyebrow"><span className="status-pulse" /> AUTHENTICATED OWNER SESSION</p>
      <h2>Welcome, {session.name}.</h2>
      <p>{session.email}</p>
      <p className="admin-muted">Identity provider: {new URL(session.issuer).hostname}</p>
      <p className="admin-muted">The owner-only content API is active. Changes are audited.</p>
      <LogoutButton />
      <AdminContentManager />
      <LinkedInPublishingPanel />
      <AgentAccessPanel />
    </div>
  );
}
