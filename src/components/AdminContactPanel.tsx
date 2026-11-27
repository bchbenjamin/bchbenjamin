"use client";

import { useCallback, useEffect, useState } from "react";

const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
type ContactRecord = {
  id: string; sender_name: string; organization?: string; sender_email: string; subject: string;
  message: string; ai_decision: string; ai_confidence?: number; ai_risk_score?: number;
  ai_identity_assessment?: string; ai_reason?: string; status: string; email_verified_at?: string;
  notification_sent_at?: string; notification_error?: string; created_at: string;
};

async function csrfToken() {
  const response = await fetch(`${apiBase}/api/v1/csrf`, { credentials: "include" });
  if (!response.ok) throw new Error("Could not initialise a secure request.");
  return (await response.json() as { token: string }).token;
}

export default function AdminContactPanel() {
  const [records, setRecords] = useState<ContactRecord[]>([]);
  const [selected, setSelected] = useState<ContactRecord | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("Loading submissions…");

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const response = await fetch(`${apiBase}/api/v1/admin/contact`, { credentials: "include", headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`Could not load contact submissions (${response.status}).`);
      const rows = await response.json() as ContactRecord[];
      setRecords(rows);
      setSelected((current) => current ? rows.find((row) => row.id === current.id) ?? null : rows[0] ?? null);
      setMessage(`${rows.length} submission${rows.length === 1 ? "" : "s"} loaded.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load submissions.");
    } finally { setBusy(false); }
  }, []);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => { if (active) return load(); });
    return () => { active = false; };
  }, [load]);

  async function review(approve: boolean) {
    if (!selected) return;
    setBusy(true);
    try {
      const token = await csrfToken();
      const response = await fetch(`${apiBase}/api/v1/admin/contact/${selected.id}/review`, {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json", "X-XSRF-TOKEN": token },
        body: JSON.stringify({ approve, note })
      });
      const body = await response.json().catch(() => ({})) as { message?: string };
      if (!response.ok) throw new Error(body.message || `Review failed (${response.status}).`);
      setNote("");
      setMessage(approve ? "Approved. Inbox notification attempted." : "Submission rejected.");
      await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Review failed."); }
    finally { setBusy(false); }
  }

  async function resendVerification() {
    if (!selected) return;
    setBusy(true);
    try {
      const token = await csrfToken();
      const response = await fetch(`${apiBase}/api/v1/admin/contact/${selected.id}/resend-verification`, { method: "POST", credentials: "include", headers: { "X-XSRF-TOKEN": token } });
      if (!response.ok) throw new Error(`Verification resend failed (${response.status}).`);
      setMessage("A fresh verification link has been sent.");
      await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Verification resend failed."); }
    finally { setBusy(false); }
  }

  async function retry() {
    if (!selected) return;
    setBusy(true);
    try {
      const token = await csrfToken();
      const response = await fetch(`${apiBase}/api/v1/admin/contact/${selected.id}/retry`, { method: "POST", credentials: "include", headers: { "X-XSRF-TOKEN": token } });
      if (!response.ok) throw new Error(`Retry failed (${response.status}).`);
      setMessage("Delivery retry completed.");
      await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Retry failed."); }
    finally { setBusy(false); }
  }

  return (
    <section className="admin-contact-panel" aria-label="Contact inbox moderation">
      <div className="admin-manager-head"><div><p className="eyebrow">INBOUND ENQUIRIES</p><h2>Contact review</h2></div><button className="button button-quiet" type="button" onClick={() => void load()} disabled={busy}>Refresh</button></div>
      <div className="admin-contact-grid">
        <div className="admin-record-list">
          {records.map((record) => <button className={`admin-record${selected?.id === record.id ? " is-selected" : ""}`} type="button" key={record.id} onClick={() => setSelected(record)}><strong>{record.sender_name}</strong><span>{record.subject}</span><span className="admin-contact-status">{record.status.replaceAll("_", " ")}</span></button>)}
          {records.length === 0 && <p className="admin-empty">No contact submissions yet.</p>}
        </div>
        <div className="admin-contact-detail">
          {selected ? <>
            <div className="admin-contact-detail-head"><span className={`admin-contact-badge status-${selected.status.toLowerCase()}`}>{selected.status.replaceAll("_", " ")}</span><span>{new Date(selected.created_at).toLocaleString()}</span></div>
            <h3>{selected.subject}</h3>
            <p><strong>{selected.sender_name}</strong>{selected.organization ? ` · ${selected.organization}` : ""}</p>
            <p><a href={`mailto:${selected.sender_email}`}>{selected.sender_email}</a> · {selected.email_verified_at ? "Email verified" : "Email not verified"}</p>
            <div className="admin-contact-message">{selected.message}</div>
            <div className="admin-contact-ai"><strong>AI screening</strong><span>{selected.ai_decision} · risk {selected.ai_risk_score ?? "—"}/100 · confidence {selected.ai_confidence == null ? "—" : `${Math.round(selected.ai_confidence * 100)}%`}</span><p>{selected.ai_identity_assessment}</p><p>{selected.ai_reason}</p></div>
            {selected.notification_error && <p className="admin-message">{selected.notification_error}</p>}
            <label className="admin-review-note">Review note<textarea rows={2} maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional internal note" /></label>
            <div className="admin-editor-actions">
              <button className="button button-primary" type="button" disabled={busy || !selected.email_verified_at || ["NOTIFIED", "REJECTED"].includes(selected.status)} onClick={() => void review(true)}>Approve & notify</button>
              <button className="button button-quiet" type="button" disabled={busy || ["NOTIFIED", "REJECTED"].includes(selected.status)} onClick={() => void review(false)}>Reject</button>
              {selected.status === "DELIVERY_FAILED" && <button className="button button-quiet" type="button" disabled={busy} onClick={() => void retry()}>Retry delivery</button>}
              {(["VERIFICATION_FAILED", "PENDING_EMAIL_VERIFICATION"].includes(selected.status) && !selected.email_verified_at) && <button className="button button-quiet" type="button" disabled={busy} onClick={() => void resendVerification()}>Resend verification</button>}
            </div>
          </> : <p className="admin-empty">Select a submission to review.</p>}
          <p className="admin-message" role="status">{message}</p>
        </div>
      </div>
    </section>
  );
}
