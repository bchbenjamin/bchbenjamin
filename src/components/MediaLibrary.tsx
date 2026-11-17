"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";

const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080").replace(/\/$/, "");
type MediaAsset = { id: string; original_filename: string; content_type: string; byte_size: number; alt_text: string; caption: string; visibility: "PUBLIC" | "PRIVATE"; uploaded_at: string };
type AchievementOption = { id: string; title: string; detail?: string };
async function csrfToken() { const r = await fetch(`${apiBase}/api/v1/csrf`, { credentials: "include" }); if (!r.ok) throw new Error("Could not initialise a secure request."); return (await r.json() as { token: string }).token; }

export default function MediaLibrary() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [achievements, setAchievements] = useState<AchievementOption[]>([]);
  const [achievementId, setAchievementId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [altText, setAltText] = useState("");
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Original uploads are private until you explicitly publish them.");

  const load = useCallback(async () => {
    const [mediaResponse, achievementResponse] = await Promise.all([
      fetch(`${apiBase}/api/v1/admin/media`, { credentials: "include", cache: "no-store" }),
      fetch(`${apiBase}/api/v1/admin/content/achievements`, { credentials: "include", cache: "no-store" })
    ]);
    if (!mediaResponse.ok || !achievementResponse.ok) throw new Error("Could not load the media library.");
    setAssets(await mediaResponse.json() as MediaAsset[]);
    const rows = await achievementResponse.json() as AchievementOption[];
    setAchievements(rows); if (!achievementId && rows[0]?.id) setAchievementId(rows[0].id);
  }, [achievementId]);
  useEffect(() => { let active = true; void Promise.resolve().then(() => active ? load() : undefined).catch((error: unknown) => { if (active) setMessage(error instanceof Error ? error.message : "Could not load media."); }); return () => { active = false; }; }, [load]);

  async function upload() {
    if (!file) { setMessage("Choose an image or PDF first."); return; }
    setBusy(true);
    try {
      const token = await csrfToken(); const body = new FormData(); body.append("file", file); body.append("altText", altText); body.append("caption", caption); body.append("visibility", "PRIVATE");
      const response = await fetch(`${apiBase}/api/v1/admin/media`, { method: "POST", credentials: "include", headers: { "X-XSRF-TOKEN": token }, body });
      if (!response.ok) throw new Error(`Upload failed (${response.status}). Images and PDFs up to 12 MB are supported.`);
      setFile(null); setAltText(""); setCaption(""); setMessage("Upload stored privately. Publish and attach it when ready."); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Upload failed."); }
    finally { setBusy(false); }
  }

  async function updateVisibility(asset: MediaAsset) {
    try {
      const token = await csrfToken();
      const response = await fetch(`${apiBase}/api/v1/admin/media/${asset.id}`, { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json", "X-XSRF-TOKEN": token }, body: JSON.stringify({ altText: asset.alt_text, caption: asset.caption, visibility: asset.visibility === "PUBLIC" ? "PRIVATE" : "PUBLIC" }) });
      if (!response.ok) throw new Error(`Could not update ${asset.original_filename}.`);
      await load(); setMessage(`${asset.original_filename} is now ${asset.visibility === "PUBLIC" ? "private" : "public"}.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Visibility update failed."); }
  }

  async function attach(asset: MediaAsset) {
    if (!achievementId) { setMessage("Create an achievement first, then attach this image."); return; }
    try {
      const token = await csrfToken();
      const response = await fetch(`${apiBase}/api/v1/admin/media/${asset.id}/link`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json", "X-XSRF-TOKEN": token }, body: JSON.stringify({ resourceType: "achievement", resourceId: achievementId, purpose: "gallery", sortOrder: 0 }) });
      if (!response.ok) throw new Error(`Could not attach ${asset.original_filename}.`);
      setMessage("Image linked to the selected achievement. It appears publicly only when both the asset and achievement are published.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not attach media."); }
  }

  return (
    <section className="media-library admin-module" aria-label="Media library">
      <div className="admin-module-heading"><div><p className="eyebrow">ASSETS / SCREENSHOTS / DOCUMENTS</p><h2>Media <span>Library</span></h2><p>Upload once. Reuse across your site. Publish only the assets you choose.</p></div><span className="private-chip">PRIVATE BY DEFAULT</span></div>
      <div className="media-upload-panel">
        <label className="media-dropzone"><input type="file" accept="image/png,image/jpeg,image/webp,image/gif,application/pdf" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /><span className="media-upload-symbol">＋</span><strong>{file?.name ?? "Add screenshots, photos or documents"}</strong><small>PNG · JPEG · WEBP · GIF · PDF · UP TO 12 MB</small></label>
        <div className="media-upload-fields"><label>Alt text<input value={altText} onChange={(event) => setAltText(event.target.value)} placeholder="Describe the image" /></label><label>Caption<input value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="Optional caption" /></label><button className="button button-primary" disabled={busy || !file} onClick={() => void upload()} type="button">{busy ? "Uploading…" : "Upload privately ↗"}</button></div>
      </div>
      <div className="media-library-toolbar"><div><span className="eyebrow">YOUR ASSETS / {assets.length}</span><h3>Asset collection</h3></div><label>Attach to achievement<select value={achievementId} onChange={(event) => setAchievementId(event.target.value)}><option value="">Choose an achievement</option>{achievements.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label></div>
      <div className="media-asset-grid">{assets.map((asset) => <article className="media-asset-card" key={asset.id}><div className="media-asset-preview">{asset.content_type.startsWith("image/") ? <Image unoptimized fill sizes="(max-width: 700px) 100vw, 25vw" crossOrigin="use-credentials" src={`${apiBase}/api/v1/admin/media/${asset.id}/file`} alt={asset.alt_text || asset.original_filename} /> : <span>PDF</span>}<span className={asset.visibility === "PUBLIC" ? "asset-status public" : "asset-status"}>{asset.visibility}</span></div><div className="media-asset-info"><strong>{asset.original_filename}</strong><span>{Math.max(1, Math.round(asset.byte_size / 1024))} KB · {asset.content_type}</span><div><button type="button" onClick={() => void attach(asset)}>Feature in gallery</button><button type="button" onClick={() => void updateVisibility(asset)}>{asset.visibility === "PUBLIC" ? "Make private" : "Publish"}</button></div></div></article>)}</div>
      {assets.length === 0 && <div className="media-empty">Your media library is empty. Upload a certificate, screenshot or project photograph to start.</div>}
      <p className="admin-message" role="status">{message}</p>
    </section>
  );
}
