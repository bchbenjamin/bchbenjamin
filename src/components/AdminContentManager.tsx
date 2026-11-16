"use client";

import { useCallback, useEffect, useState } from "react";

const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080").replace(/\/$/, "");
const resources = ["profile", "projects", "experience", "education", "skill-groups", "skills", "achievements"] as const;
type Resource = (typeof resources)[number];
type RecordItem = Record<string, unknown> & { id?: string };

const templates: Record<Resource, Record<string, unknown>> = {
  profile: { fullName: "", headline: "", summary: "", location: "India", email: "", websiteUrl: "", githubUrl: "", linkedinUrl: "", published: false },
  projects: { slug: "", name: "", tagline: "", summary: "", description: "", role: "", status: "IN DEVELOPMENT", repositoryUrl: "", liveUrl: "", featured: false, published: false, sortOrder: 0, startedOn: null, completedOn: null },
  experience: { roleTitle: "", organization: "", employmentType: "", location: "", description: "", startedOn: null, endedOn: null, isCurrent: false, published: false, sortOrder: 0 },
  education: { institution: "", qualification: "", fieldOfStudy: "", location: "", description: "", startedOn: null, endedOn: null, grade: "", published: false, sortOrder: 0 },
  "skill-groups": { name: "", description: "", published: false, sortOrder: 0 },
  skills: { groupId: "", name: "", proficiency: "", sortOrder: 0 },
  achievements: { category: "", title: "", detail: "", awardedOn: null, issuer: "", credentialUrl: "", published: false, sortOrder: 0 }
};

function camelKey(key: string) {
  return key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

function camelRecord(record: RecordItem): RecordItem {
  return Object.fromEntries(Object.entries(record).map(([key, value]) => [camelKey(key), value]));
}

async function csrfToken() {
  const response = await fetch(`${apiBase}/api/v1/csrf`, { credentials: "include" });
  if (!response.ok) throw new Error("Could not initialise a secure request.");
  return (await response.json() as { token: string }).token;
}

export default function AdminContentManager() {
  const [resource, setResource] = useState<Resource>("projects");
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [selected, setSelected] = useState<RecordItem | null>(null);
  const [editor, setEditor] = useState(JSON.stringify(templates.projects, null, 2));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Select a record or create a new one.");

  const load = useCallback(async (kind: Resource) => {
    setBusy(true);
    try {
      const response = await fetch(`${apiBase}/api/v1/admin/content/${kind}`, { credentials: "include", headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? "Your owner session is not authorised." : `Load failed (${response.status}).`);
      const rows = await response.json() as RecordItem[];
      setRecords(rows);
      setSelected(null);
      setEditor(JSON.stringify(templates[kind], null, 2));
      setMessage(`${rows.length} record${rows.length === 1 ? "" : "s"} loaded.`);
    } catch (error) {
      setRecords([]);
      setMessage(error instanceof Error ? error.message : "Could not load content.");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => { if (active) return load(resource); });
    return () => { active = false; };
  }, [load, resource]);

  function selectRecord(record: RecordItem) {
    setSelected(record);
    setEditor(JSON.stringify(camelRecord(record), null, 2));
    setMessage("Editing selected record. Changes are not saved until you press Save.");
  }

  function newRecord() {
    setSelected(null);
    setEditor(JSON.stringify(templates[resource], null, 2));
    setMessage("New draft. Complete the required fields, then save.");
  }

  async function save() {
    setBusy(true);
    try {
      const body = JSON.parse(editor) as Record<string, unknown>;
      const token = await csrfToken();
      const editing = Boolean(selected?.id);
      const response = await fetch(`${apiBase}/api/v1/admin/content/${resource}${editing ? `/${selected?.id}` : ""}`, {
        method: editing ? "PUT" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "X-XSRF-TOKEN": token },
        body: JSON.stringify(body)
      });
      if (!response.ok) throw new Error(`Save failed (${response.status}). Check required fields and your session.`);
      const saved = await response.json() as RecordItem;
      await load(resource);
      setSelected(saved);
      setEditor(JSON.stringify(camelRecord(saved), null, 2));
      setMessage("Saved. The mutation was recorded in the admin audit log.");
    } catch (error) {
      setMessage(error instanceof SyntaxError ? "The editor does not contain valid JSON." : error instanceof Error ? error.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!selected?.id || !window.confirm("Delete this record permanently?")) return;
    setBusy(true);
    try {
      const token = await csrfToken();
      const response = await fetch(`${apiBase}/api/v1/admin/content/${resource}/${selected.id}`, {
        method: "DELETE", credentials: "include", headers: { "X-XSRF-TOKEN": token }
      });
      if (!response.ok) throw new Error(`Delete failed (${response.status}).`);
      await load(resource);
      setMessage("Record deleted and audit event recorded.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Delete failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="admin-manager" aria-label="Portfolio content manager">
      <div className="admin-manager-head">
        <div><p className="eyebrow">CONTENT MANAGEMENT</p><h2>Portfolio records</h2></div>
        <label className="admin-resource-select">Collection
          <select value={resource} onChange={(event) => setResource(event.target.value as Resource)}>
            {resources.map((item) => <option key={item} value={item}>{item.replaceAll("-", " ")}</option>)}
          </select>
        </label>
      </div>
      <div className="admin-manager-grid">
        <div className="admin-record-list">
          <div className="admin-list-top"><span>{records.length} RECORDS</span><button type="button" onClick={newRecord}>+ New</button></div>
          {records.map((record) => <button className={`admin-record${selected?.id === record.id ? " is-selected" : ""}`} type="button" key={String(record.id)} onClick={() => selectRecord(record)}>
            <strong>{String(record.name ?? record.title ?? record.full_name ?? record.role_title ?? record.institution ?? record.category ?? "Untitled")}</strong>
            <span>{String(record.slug ?? record.organization ?? record.qualification ?? record.email ?? record.id ?? "Record")}</span>
          </button>)}
          {records.length === 0 && <p className="admin-empty">No records in this collection yet.</p>}
        </div>
        <div className="admin-editor">
          <div className="admin-list-top"><span>{selected?.id ? "EDIT RECORD" : "NEW RECORD"}</span><span>JSON</span></div>
          <textarea aria-label="Content record JSON editor" spellCheck={false} value={editor} onChange={(event) => setEditor(event.target.value)} />
          <div className="admin-editor-actions">
            <button className="button button-primary" type="button" disabled={busy} onClick={() => void save()}>{busy ? "Working…" : "Save record"}</button>
            <button className="button button-quiet" type="button" disabled={busy || !selected?.id} onClick={() => void remove()}>Delete</button>
          </div>
          <p className="admin-message" role="status">{message}</p>
        </div>
      </div>
    </section>
  );
}
