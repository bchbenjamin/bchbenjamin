"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";

const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");
type ResumeItem = { id: string; mode: string; template_id: string; job_description_preview?: string; model_used?: string; created_at: string; pdf_bytes: number };
type Generated = { id: string; mode: string; templateId: string; modelUsed?: string; createdAt: string; matchReport?: Record<string, unknown> };

async function csrfToken() {
  const response = await fetch(`${apiBase}/api/v1/csrf`, { credentials: "include" });
  if (!response.ok) throw new Error("Could not initialise a secure request.");
  return (await response.json() as { token: string }).token;
}

export default function ResumeStudio() {
  const [mode, setMode] = useState<"general" | "job">("general");
  const [jobDescription, setJobDescription] = useState("");
  const [history, setHistory] = useState<ResumeItem[]>([]);
  const [generated, setGenerated] = useState<Generated | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Your generated resumes are private to this owner account.");

  const load = useCallback(async () => {
    try {
      const response = await fetch(`${apiBase}/api/v1/admin/resumes`, { credentials: "include", cache: "no-store" });
      if (!response.ok) throw new Error("Could not load resume history.");
      setHistory(await response.json() as ResumeItem[]);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not load resume history."); }
  }, []);
  useEffect(() => { let active = true; void Promise.resolve().then(() => active ? load() : undefined); return () => { active = false; }; }, [load]);

  async function generate() {
    setBusy(true); setGenerated(null); setMessage("Preparing your source records and rendering the ATS document…");
    try {
      const token = await csrfToken();
      const response = await fetch(`${apiBase}/api/v1/admin/resumes/generate`, {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json", "X-XSRF-TOKEN": token },
        body: JSON.stringify({ mode, jobDescription: mode === "job" ? jobDescription : null, templateId: "ats" })
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null) as { message?: string } | null;
        throw new Error(body?.message ?? `Generation failed (${response.status}).`);
      }
      const result = await response.json() as Generated;
      setGenerated(result); setMessage(mode === "job" ? "JD-specific resume generated. Review the evidence selection before downloading." : "General resume generated from your private profile.");
      await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Resume generation failed."); }
    finally { setBusy(false); }
  }

  async function download(id: string) {
    try {
      const response = await fetch(`${apiBase}/api/v1/admin/resumes/${id}/download`, { credentials: "include", cache: "no-store" });
      if (!response.ok) throw new Error(`Download failed (${response.status}).`);
      const blob = await response.blob(); const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = `Benjamin-resume-${id}.pdf`; anchor.click(); URL.revokeObjectURL(url);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Download failed."); }
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this private resume version?")) return;
    try {
      const token = await csrfToken();
      const response = await fetch(`${apiBase}/api/v1/admin/resumes/${id}`, { method: "DELETE", credentials: "include", headers: { "X-XSRF-TOKEN": token } });
      if (!response.ok) throw new Error(`Delete failed (${response.status}).`);
      setHistory((items) => items.filter((item) => item.id !== id)); setMessage("Resume version deleted.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Delete failed."); }
  }

  const report = generated?.matchReport ?? {};
  const selectedCount = ["projects", "experience", "education", "skills", "achievements"].reduce((total, key) => total + (Array.isArray(report[key]) ? (report[key] as unknown[]).length : 0), 0);

  return (
    <section className="resume-studio admin-module" aria-label="Private resume studio">
      <div className="admin-module-heading"><div><p className="eyebrow">PRIVATE DOCUMENT WORKSPACE</p><h2>Resume <span>Studio</span></h2><p>One verified profile. Two generation modes. Every generated document stays private.</p></div><span className="private-chip">● PRIVATE</span></div>
      <div className="resume-studio-grid">
        <div className="resume-builder-panel">
          <div className="resume-mode-switch"><button className={mode === "general" ? "active" : ""} onClick={() => setMode("general")} type="button"><span>01</span> General resume</button><button className={mode === "job" ? "active" : ""} onClick={() => setMode("job")} type="button"><span>02</span> Tailor to a JD</button></div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={mode} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
              {mode === "general" ? <div className="resume-mode-explainer"><span className="resume-mode-icon">01</span><h3>Your general profile</h3><p>Uses your verified career records, including unpublished/private records, and the standard ATS template. No job-specific filtering.</p></div> : <div className="resume-jd-input"><label htmlFor="resume-jd">Complete job description</label><textarea id="resume-jd" value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} rows={9} placeholder="Paste the complete job description here…"/><p>We extract requirements, match them against your stored evidence and rank the most relevant records. We do not fabricate claims.</p></div>}
            </motion.div>
          </AnimatePresence>
          <div className="resume-template-card"><div><span className="template-overline">TEMPLATE / 01</span><h3>ATS — Single column</h3><p>Text-first, standard headings, selectable PDF text and parser-safe structure.</p></div><span className="template-preview">Aa</span></div>
          <div className="resume-integrity-note"><span>✓</span><p><strong>Evidence guard enabled</strong><br/>JD mode can only select stored record IDs. The PDF uses the original source wording.</p></div>
          <button className="button button-primary resume-generate-button" disabled={busy || (mode === "job" && jobDescription.trim().length < 80)} onClick={() => void generate()}>{busy ? "Generating…" : mode === "job" ? "Generate JD-specific resume ↗" : "Generate general resume ↗"}</button>
          <p className="admin-message" role="status">{message}</p>
          {generated && <div className="resume-generated-result"><div><span>GENERATED / {generated.mode}</span><strong>Resume ready</strong><small>{selectedCount ? `${selectedCount} matched source records selected` : "Complete profile selected"}</small></div><button type="button" className="button button-primary" onClick={() => void download(generated.id)}>Download PDF ↓</button></div>}
        </div>
        <div className="resume-history-panel"><div className="admin-list-top"><span>PRIVATE GENERATION HISTORY</span><span>{history.length} VERSIONS</span></div>{history.length ? history.map((item) => <article className="resume-history-item" key={item.id}><div className="resume-history-icon">PDF</div><div className="resume-history-meta"><strong>{item.mode === "GENERAL" ? "General resume" : "Job-specific resume"}</strong><span>{new Date(item.created_at).toLocaleString()} · {Math.max(1, Math.round(item.pdf_bytes / 1024))} KB</span>{item.job_description_preview && <small>{item.job_description_preview}</small>}</div><button aria-label="Download resume" onClick={() => void download(item.id)} type="button">↓</button><button aria-label="Delete resume" onClick={() => void remove(item.id)} type="button">×</button></article>) : <div className="resume-history-empty"><span>NO DOCUMENTS YET</span><p>Your private resume versions will appear here after generation.</p></div>}</div>
      </div>
    </section>
  );
}
