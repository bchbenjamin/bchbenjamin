"use client";

import { useCallback, useEffect, useState } from "react";

const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");
type Draft = { id: string; content: string; status: string; linkedin_post_id?: string | null; failure_code?: string | null; created_at?: string };

async function getCsrf() {
  const response = await fetch(`${apiBase}/api/v1/csrf`, { credentials: "include" });
  if (!response.ok) throw new Error("Could not initialise a secure request.");
  return (await response.json() as { token: string }).token;
}

export default function LinkedInPublishingPanel() {
  const [connected, setConnected] = useState(false);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Connect LinkedIn publishing to begin.");

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const [connectionResponse, draftsResponse] = await Promise.all([
        fetch(`${apiBase}/api/v1/admin/linkedin/connection`, { credentials: "include" }),
        fetch(`${apiBase}/api/v1/admin/linkedin/drafts`, { credentials: "include" })
      ]);
      if (!connectionResponse.ok || !draftsResponse.ok) throw new Error("Could not load LinkedIn publishing status.");
      const connection = await connectionResponse.json() as { connected: boolean };
      setConnected(connection.connected);
      setDrafts(await draftsResponse.json() as Draft[]);
      setMessage(connection.connected ? "Connected. New posts always enter the review queue." : "LinkedIn publishing is not connected.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load LinkedIn publishing.");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => { if (active) return load(); });
    return () => { active = false; };
  }, [load]);

  async function createDraft() {
    setBusy(true);
    try {
      const token = await getCsrf();
      const response = await fetch(`${apiBase}/api/v1/admin/linkedin/drafts`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json", "X-XSRF-TOKEN": token },
        body: JSON.stringify({ content })
      });
      if (!response.ok) throw new Error(`Draft creation failed (${response.status}).`);
      setContent("");
      await load();
      setMessage("Draft submitted to the review queue. It has not been published.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create draft.");
    } finally { setBusy(false); }
  }

  async function transition(id: string, action: "approve" | "reject" | "publish") {
    if (action === "publish" && !window.confirm("Publish this approved post to LinkedIn now?")) return;
    setBusy(true);
    try {
      const token = await getCsrf();
      const response = await fetch(`${apiBase}/api/v1/admin/linkedin/drafts/${id}/${action}`, {
        method: "POST", credentials: "include", headers: { "X-XSRF-TOKEN": token }
      });
      if (!response.ok) throw new Error(`${action} failed (${response.status}).`);
      await load();
      setMessage(action === "publish" ? "Publish request processed. Check the draft status below." : `Draft ${action}d.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : `Could not ${action} draft.`);
    } finally { setBusy(false); }
  }

  return (
    <section className="linkedin-panel" aria-label="LinkedIn publishing workflow">
      <div className="admin-manager-head">
        <div><p className="eyebrow">LINKEDIN / MANUAL PUBLISHING</p><h2>Review before posting.</h2></div>
        <span className={`linkedin-connection${connected ? " is-connected" : ""}`}>{connected ? "CONNECTED" : "NOT CONNECTED"}</span>
      </div>
      {!connected && <a className="button button-primary linkedin-connect" href={`${apiBase}/oauth2/authorization/linkedin-publisher`}>Connect LinkedIn publishing <span className="arrow-up-right">↗</span></a>}
      <p className="admin-muted">Drafts are never auto-published. Create a draft, review it, explicitly approve it, then publish in a separate action.</p>
      <label className="linkedin-composer">New post draft
        <textarea value={content} maxLength={3000} onChange={(event) => setContent(event.target.value)} placeholder="Write the post you want to review…" />
      </label>
      <div className="linkedin-compose-actions"><span>{content.length}/3000</span><button className="button button-primary" type="button" disabled={busy || !content.trim()} onClick={() => void createDraft()}>Submit for review</button></div>
      <div className="linkedin-drafts-head"><span>REVIEW QUEUE / {drafts.length}</span><button type="button" onClick={() => void load()} disabled={busy}>Refresh</button></div>
      <div className="linkedin-drafts">
        {drafts.map((draft) => <article className="linkedin-draft" key={draft.id}>
          <div className="linkedin-draft-top"><span className={`draft-status status-${draft.status.toLowerCase()}`}>{draft.status.replaceAll("_", " ")}</span><span>{draft.created_at ? new Date(draft.created_at).toLocaleString() : ""}</span></div>
          <p>{draft.content}</p>
          {draft.linkedin_post_id && <a className="text-link" href={`https://www.linkedin.com/feed/update/${encodeURIComponent(draft.linkedin_post_id)}`} target="_blank" rel="noreferrer">View LinkedIn post ↗</a>}
          {draft.failure_code && <span className="admin-muted">{draft.failure_code}</span>}
          <div className="linkedin-draft-actions">
            {draft.status === "PENDING_REVIEW" && <><button type="button" disabled={busy} onClick={() => void transition(draft.id, "approve")}>Approve</button><button type="button" disabled={busy} onClick={() => void transition(draft.id, "reject")}>Reject</button></>}
            {draft.status === "APPROVED" && <button type="button" disabled={busy || !connected} onClick={() => void transition(draft.id, "publish")}>Publish to LinkedIn</button>}
          </div>
        </article>)}
        {drafts.length === 0 && <p className="admin-empty">No LinkedIn drafts yet.</p>}
      </div>
      <p className="admin-message" role="status">{message}</p>
    </section>
  );
}
