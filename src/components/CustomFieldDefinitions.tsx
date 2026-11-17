"use client";

import { useCallback, useEffect, useState } from "react";
const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080").replace(/\/$/, "");
type Definition = { id: string; field_key: string; label: string; field_type: string; public_by_default: boolean; sort_order: number };
const resources = ["profile", "project", "experience", "education", "skill-group", "skill", "achievement"];
const types = ["text", "long-text", "url", "date", "number", "boolean", "select", "multi-select", "rich-text", "media"];
async function csrfToken() { const r = await fetch(`${apiBase}/api/v1/csrf`, { credentials: "include" }); if (!r.ok) throw new Error("Could not initialise a secure request."); return (await r.json() as { token: string }).token; }

export default function CustomFieldDefinitions() {
  const [resourceType, setResourceType] = useState("project");
  const [fieldKey, setFieldKey] = useState("");
  const [label, setLabel] = useState("");
  const [fieldType, setFieldType] = useState("text");
  const [publicByDefault, setPublicByDefault] = useState(false);
  const [definitions, setDefinitions] = useState<Definition[]>([]);
  const [message, setMessage] = useState("Define reusable parameters for your content collections.");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch(`${apiBase}/api/v1/admin/custom-fields?resourceType=${resourceType}`, { credentials: "include", cache: "no-store" });
    if (!response.ok) throw new Error("Could not load custom fields.");
    setDefinitions(await response.json() as Definition[]);
  }, [resourceType]);
  useEffect(() => { let active = true; void Promise.resolve().then(() => active ? load() : undefined).catch((error: unknown) => { if (active) setMessage(error instanceof Error ? error.message : "Could not load custom fields."); }); return () => { active = false; }; }, [load]);

  async function create() {
    setBusy(true);
    try {
      const token = await csrfToken();
      const response = await fetch(`${apiBase}/api/v1/admin/custom-fields`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json", "X-XSRF-TOKEN": token }, body: JSON.stringify({ resourceType, fieldKey, label, fieldType, options: [], publicByDefault, sortOrder: definitions.length * 10 }) });
      if (!response.ok) throw new Error(`Could not create parameter (${response.status}).`);
      setFieldKey(""); setLabel(""); setMessage("Custom parameter definition created."); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Creation failed."); }
    finally { setBusy(false); }
  }
  async function remove(id: string) {
    try {
      const token = await csrfToken();
      const response = await fetch(`${apiBase}/api/v1/admin/custom-fields/${id}`, { method: "DELETE", credentials: "include", headers: { "X-XSRF-TOKEN": token } });
      if (!response.ok) throw new Error("Could not delete custom parameter.");
      setDefinitions((rows) => rows.filter((row) => row.id !== id)); setMessage("Parameter definition deleted. Existing values are not automatically removed.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Deletion failed."); }
  }

  return <section className="custom-fields-manager admin-module"><div className="admin-module-heading"><div><p className="eyebrow">SCHEMA EXTENSIONS / REUSABLE PARAMETERS</p><h2>Custom <span>Fields</span></h2><p>Add typed fields without changing the relational schema.</p></div><span className="private-chip">OWNER DEFINED</span></div><div className="custom-field-form"><label>Collection<select value={resourceType} onChange={(event) => setResourceType(event.target.value)}>{resources.map((item) => <option value={item} key={item}>{item}</option>)}</select></label><label>Field key<input value={fieldKey} onChange={(event) => setFieldKey(event.target.value)} placeholder="e.g. toolsUsed" /></label><label>Display label<input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Tools used" /></label><label>Field type<select value={fieldType} onChange={(event) => setFieldType(event.target.value)}>{types.map((item) => <option value={item} key={item}>{item}</option>)}</select></label><label className="custom-public-toggle"><input type="checkbox" checked={publicByDefault} onChange={(event) => setPublicByDefault(event.target.checked)} /> Public by default</label><button type="button" className="button button-primary" disabled={busy || fieldKey.trim().length < 2 || !label.trim()} onClick={() => void create()}>{busy ? "Adding…" : "Add parameter ↗"}</button></div><div className="custom-field-list">{definitions.map((item) => <article key={item.id}><div><strong>{item.label}</strong><span>{item.field_key} · {item.field_type} · {item.public_by_default ? "public default" : "private default"}</span></div><button type="button" onClick={() => void remove(item.id)}>Remove</button></article>)}{definitions.length === 0 && <p>No custom field definitions for this collection.</p>}</div><p className="admin-message" role="status">{message}</p></section>;
}
