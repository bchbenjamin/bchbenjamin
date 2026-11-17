"use client";

import { useCallback, useEffect, useState } from "react";

const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");
type TokenRow = { id: string; token_prefix: string; name: string; scopes: string; created_at: string; expires_at: string; last_used_at?: string | null; revoked_at?: string | null };
type ProposalRow = { id: string; resource: string; operation: string; status: string; created_by: string; payload: unknown; created_at: string; review_note?: string | null };

async function csrf() {
  const response = await fetch(`${apiBase}/api/v1/csrf`, { credentials: "include" });
  if (!response.ok) throw new Error("Could not initialise secure request.");
  return (await response.json() as { token: string }).token;
}

export default function AgentAccessPanel() {
  const [tokens, setTokens] = useState<TokenRow[]>([]);
  const [proposals, setProposals] = useState<ProposalRow[]>([]);
  const [name, setName] = useState("Portfolio agent");
  const [read, setRead] = useState(true);
  const [propose, setPropose] = useState(false);
  const [expiry, setExpiry] = useState("90");
  const [newToken, setNewToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Create scoped tokens for external AI agents.");

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const [tokenResponse, proposalResponse] = await Promise.all([
        fetch(`${apiBase}/api/v1/admin/agent-tokens`, { credentials: "include" }),
        fetch(`${apiBase}/api/v1/admin/agent-proposals`, { credentials: "include" })
      ]);
      if (!tokenResponse.ok || !proposalResponse.ok) throw new Error("Could not load agent access data.");
      setTokens(await tokenResponse.json() as TokenRow[]);
      setProposals(await proposalResponse.json() as ProposalRow[]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load agent access data.");
    } finally { setBusy(false); }
  }, []);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => { if (active) return load(); });
    return () => { active = false; };
  }, [load]);

  async function createToken() {
    const scopes = [read ? "portfolio:read" : "", propose ? "portfolio:propose" : ""].filter(Boolean);
    if (!scopes.length) { setMessage("Choose at least one scope."); return; }
    setBusy(true);
    try {
      const token = await csrf();
      const response = await fetch(`${apiBase}/api/v1/admin/agent-tokens`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json", "X-XSRF-TOKEN": token },
        body: JSON.stringify({ name, scopes, expiresInDays: Number(expiry) })
      });
      if (!response.ok) throw new Error(`Token creation failed (${response.status}).`);
      const created = await response.json() as { token: string };
      setNewToken(created.token);
      await load();
      setMessage("Token created. Copy it now; the secret is never shown again.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Token creation failed."); }
    finally { setBusy(false); }
  }

  async function revoke(id: string) {
    if (!window.confirm("Revoke this agent token? Existing clients will lose access immediately.")) return;
    setBusy(true);
    try {
      const token = await csrf();
      const response = await fetch(`${apiBase}/api/v1/admin/agent-tokens/${id}`, { method: "DELETE", credentials: "include", headers: { "X-XSRF-TOKEN": token } });
      if (!response.ok) throw new Error(`Revoke failed (${response.status}).`);
      await load();
      setMessage("Token revoked.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Revoke failed."); }
    finally { setBusy(false); }
  }

  async function review(id: string, action: "approve" | "reject") {
    const note = window.prompt(action === "approve" ? "Optional approval note:" : "Reason for rejection:") ?? "";
    if (action === "reject" && !note.trim()) { setMessage("Add a reason when rejecting a proposal."); return; }
    setBusy(true);
    try {
      const token = await csrf();
      const response = await fetch(`${apiBase}/api/v1/admin/agent-proposals/${id}/${action}`, {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json", "X-XSRF-TOKEN": token }, body: JSON.stringify({ note })
      });
      if (!response.ok) throw new Error(`Proposal ${action} failed (${response.status}).`);
      await load();
      setMessage(`Proposal ${action}d. Approval does not apply changes automatically; use the CMS to make the reviewed change.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : `Could not ${action} proposal.`); }
    finally { setBusy(false); }
  }

  return (
    <section className="agent-access-panel">
      <div className="admin-manager-head"><div><p className="eyebrow">REST + MCP / AGENT ACCESS</p><h2>Scoped agent connections.</h2></div><span className="linkedin-connection">HUMAN APPROVAL REQUIRED</span></div>
      <p className="admin-muted">Agents can read published portfolio data and submit change proposals. They cannot write directly to your CMS.</p>
      <div className="agent-create-grid">
        <label>Token name<input value={name} onChange={(event) => setName(event.target.value)} maxLength={120} /></label>
        <label>Expiry<select value={expiry} onChange={(event) => setExpiry(event.target.value)}><option value="30">30 days</option><option value="90">90 days</option><option value="180">180 days</option><option value="365">365 days</option></select></label>
        <label className="agent-scope"><input type="checkbox" checked={read} onChange={(event) => setRead(event.target.checked)} /> portfolio:read</label>
        <label className="agent-scope"><input type="checkbox" checked={propose} onChange={(event) => setPropose(event.target.checked)} /> portfolio:propose</label>
        <button className="button button-primary" type="button" disabled={busy || !name.trim()} onClick={() => void createToken()}>Create API token</button>
      </div>
      {newToken && <div className="agent-token-reveal"><span>ONE-TIME SECRET — COPY NOW</span><code>{newToken}</code><button type="button" onClick={() => void navigator.clipboard.writeText(newToken)}>Copy token</button></div>}
      <div className="agent-mcp-note"><strong>MCP endpoint</strong><code>{apiBase}/mcp</code><span>Use the token as an HTTP Bearer credential. MCP tools: portfolio_get_profile, portfolio_list_projects, portfolio_create_change_proposal.</span></div>
      <div className="linkedin-drafts-head"><span>API TOKENS / {tokens.length}</span><button type="button" disabled={busy} onClick={() => void load()}>Refresh</button></div>
      <div className="agent-token-list">
        {tokens.map((item) => <article className="agent-token-row" key={item.id}><div><strong>{item.name}</strong><span>{item.token_prefix}… · {item.scopes}</span><small>{item.revoked_at ? "REVOKED" : `Expires ${new Date(item.expires_at).toLocaleDateString()}`}</small></div>{!item.revoked_at && <button type="button" disabled={busy} onClick={() => void revoke(item.id)}>Revoke</button>}</article>)}
        {tokens.length === 0 && <p className="admin-empty">No agent tokens created.</p>}
      </div>
      <div className="linkedin-drafts-head"><span>AGENT PROPOSALS / {proposals.length}</span></div>
      <div className="linkedin-drafts">
        {proposals.map((proposal) => <article className="linkedin-draft" key={proposal.id}>
          <div className="linkedin-draft-top"><span className={`draft-status status-${proposal.status.toLowerCase()}`}>{proposal.status.replaceAll("_", " ")}</span><span>{proposal.operation} · {proposal.resource}</span></div>
          <p className="agent-proposal-json">{JSON.stringify(proposal.payload, null, 2)}</p>
          <small className="admin-muted">Submitted by {proposal.created_by} · {new Date(proposal.created_at).toLocaleString()}</small>
          {proposal.status === "PENDING_REVIEW" && <div className="linkedin-draft-actions"><button type="button" disabled={busy} onClick={() => void review(proposal.id, "approve")}>Approve</button><button type="button" disabled={busy} onClick={() => void review(proposal.id, "reject")}>Reject</button></div>}
        </article>)}
        {proposals.length === 0 && <p className="admin-empty">No agent change proposals yet.</p>}
      </div>
      <p className="admin-message" role="status">{message}</p>
    </section>
  );
}
