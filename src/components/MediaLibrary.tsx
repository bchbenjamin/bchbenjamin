"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";

const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");
type MediaAsset = { id: string; original_filename: string; content_type: string; byte_size: number; alt_text: string; caption: string; visibility: "PUBLIC" | "PRIVATE"; uploaded_at: string };
type AchievementOption = { id: string; title: string; detail?: string };
type ProjectOption = { id: string; name: string; slug: string };
type MediaResourceType = "project" | "achievement";
const acceptedTypes = ["image/png", "image/jpeg", "image/webp", "image/gif", "application/pdf", "video/mp4", "video/webm"];
const maxFileSize = 12 * 1024 * 1024;
async function csrfToken() { const r = await fetch(`${apiBase}/api/v1/csrf`, { credentials: "include" }); if (!r.ok) throw new Error("Could not initialise a secure request."); return (await r.json() as { token: string }).token; }

export default function MediaLibrary() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [achievements, setAchievements] = useState<AchievementOption[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [resourceType, setResourceType] = useState<MediaResourceType>("project");
  const [resourceId, setResourceId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [altText, setAltText] = useState("");
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [message, setMessage] = useState("Original uploads are private until you explicitly publish them.");

  const load = useCallback(async () => {
    const [mediaResponse, achievementResponse, projectResponse] = await Promise.all([
      fetch(`${apiBase}/api/v1/admin/media`, { credentials: "include", cache: "no-store" }),
      fetch(`${apiBase}/api/v1/admin/content/achievements`, { credentials: "include", cache: "no-store" }),
      fetch(`${apiBase}/api/v1/admin/content/projects`, { credentials: "include", cache: "no-store" })
    ]);
    if (!mediaResponse.ok || !achievementResponse.ok || !projectResponse.ok) throw new Error("Could not load the media library.");
    setAssets(await mediaResponse.json() as MediaAsset[]);
    const [achievementRows, projectRows] = await Promise.all([achievementResponse.json() as Promise<AchievementOption[]>, projectResponse.json() as Promise<ProjectOption[]>]);
    setAchievements(achievementRows); setProjects(projectRows);
    const options = resourceType === "project" ? projectRows : achievementRows;
    if (!resourceId && options[0]?.id) setResourceId(options[0].id);
  }, [resourceId, resourceType]);
  useEffect(() => { let active = true; void Promise.resolve().then(() => active ? load() : undefined).catch((error: unknown) => { if (active) setMessage(error instanceof Error ? error.message : "Could not load media."); }); return () => { active = false; }; }, [load]);

  function chooseFile(next: File | undefined) {
    if (!next) return;
    if (!acceptedTypes.includes(next.type)) { setFile(null); setMessage("That file type is not supported. Choose an image or PDF."); return; }
    if (next.size > maxFileSize) { setFile(null); setMessage("That file is larger than 12 MB. Choose a smaller file."); return; }
    setFile(next); setUploadProgress(0); setUploadComplete(false); setMessage(`${next.name} is ready to upload privately.`);
  }

  async function upload() {
    if (!file) { setMessage("Choose an image, video or PDF first."); return; }
    setBusy(true); setUploadProgress(0);
    try {
      const token = await csrfToken();
      const body = new FormData(); body.append("file", file); body.append("altText", altText); body.append("caption", caption); body.append("visibility", "PRIVATE");
      const result = await new Promise<{ status: number; responseText: string }>((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open("POST", `${apiBase}/api/v1/admin/media`);
        request.withCredentials = true;
        request.setRequestHeader("X-XSRF-TOKEN", token);
        request.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) setUploadProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)));
        });
        request.addEventListener("load", () => resolve({ status: request.status, responseText: request.responseText }));
        request.addEventListener("error", () => reject(new Error("The upload connection failed. Please try again.")));
        request.addEventListener("abort", () => reject(new Error("The upload was cancelled.")));
        request.send(body);
      });
      let responseMessage = "";
      try { responseMessage = (JSON.parse(result.responseText) as { message?: string }).message ?? ""; } catch { /* response body may be empty */ }
      if (result.status < 200 || result.status >= 300) throw new Error(responseMessage || `Upload failed (${result.status}). Images, MP4/WebM videos and PDFs up to 12 MB are supported.`);
      setUploadProgress(100); setUploadComplete(true); setFile(null); setAltText(""); setCaption("");
      setMessage("Upload complete. Stored privately; publish and attach it when ready.");
      await load();
    } catch (error) { setUploadComplete(false); setUploadProgress(0); setMessage(error instanceof Error ? error.message : "Upload failed."); }
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
    const targetName = resourceType === "project"
      ? projects.find((item) => item.id === resourceId)?.name
      : achievements.find((item) => item.id === resourceId)?.title;
    if (!targetName) { setMessage("Choose a project or achievement first."); return; }
    try {
      const token = await csrfToken();
      const response = await fetch(`${apiBase}/api/v1/admin/media/${asset.id}/link`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json", "X-XSRF-TOKEN": token }, body: JSON.stringify({ resourceType, resourceId, purpose: resourceType === "project" ? "project-gallery" : "gallery", sortOrder: 0 }) });
      if (!response.ok) throw new Error(`Could not attach ${asset.original_filename}.`);
      setMessage(`Media linked to ${targetName}. It appears publicly only when both the asset and record are published.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not attach media."); }
  }


  return (
    <section className="media-library admin-module" aria-label="Media library">
      <div className="admin-module-heading"><div><p className="eyebrow">ASSETS / SCREENSHOTS / DOCUMENTS</p><h2>Media <span>Library</span></h2><p>Upload once. Reuse across your site. Publish only the assets you choose.</p></div><span className="private-chip">PRIVATE BY DEFAULT</span></div>
      <div className="media-upload-panel">
        <label
          className={`media-dropzone${dragging ? " is-dragging" : ""}${file ? " has-file" : ""}${uploadComplete ? " is-complete" : ""}`}
          onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
          onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false); }}
          onDrop={(event) => { event.preventDefault(); setDragging(false); chooseFile(event.dataTransfer.files?.[0]); }}
        >
          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif,application/pdf,video/mp4,video/webm" disabled={busy} onChange={(event) => chooseFile(event.target.files?.[0])} />
          <span className="media-upload-symbol" aria-hidden="true">{uploadComplete ? "✓" : file ? "↗" : "＋"}</span>
          <strong>{uploadComplete ? "Upload complete — stored privately" : file?.name ?? "Add screenshots, photos or documents"}</strong>
          <small>{dragging ? "RELEASE TO ADD FILE" : uploadComplete ? "READY FOR ANOTHER ASSET" : "PNG · JPEG · WEBP · GIF · MP4 · WEBM · PDF · UP TO 12 MB"}</small>
          {(busy || uploadComplete) && <span className={`media-upload-progress${uploadComplete ? " is-complete" : ""}`} role="progressbar" aria-label="Upload progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={uploadProgress}><i style={{ width: `${uploadProgress}%` }} /></span>}
        </label>
        <div className="media-upload-fields"><label>Alt text<input value={altText} onChange={(event) => setAltText(event.target.value)} placeholder="Describe the image" /></label><label>Caption<input value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="Optional caption" /></label><button className={`button button-primary upload-action${busy ? " is-busy" : ""}`} disabled={busy || !file} onClick={() => void upload()} type="button"><span>{busy ? `Uploading ${uploadProgress}%` : "Upload privately"}</span><i aria-hidden="true">{busy ? "" : "↗"}</i></button></div>
      </div>
      <div className="media-library-toolbar"><div><span className="eyebrow">YOUR ASSETS / {assets.length}</span><h3>Asset collection</h3></div><div className="media-attach-targets"><label>Gallery<select value={resourceType} onChange={(event) => { const next = event.target.value as MediaResourceType; setResourceType(next); const options = next === "project" ? projects : achievements; setResourceId(options[0]?.id ?? ""); }}><option value="project">Project image gallery</option><option value="achievement">Achievement gallery</option></select></label><label>{resourceType === "project" ? "Project" : "Achievement"}<select value={resourceId} onChange={(event) => setResourceId(event.target.value)}><option value="">Choose a {resourceType}</option>{resourceType === "project" ? projects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>) : achievements.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label></div></div>
      <div className="media-asset-grid">{assets.map((asset) => <article className="media-asset-card" key={asset.id}><div className="media-asset-preview">{asset.content_type.startsWith("image/") ? <Image unoptimized fill sizes="(max-width: 700px) 100vw, 25vw" crossOrigin="use-credentials" src={`${apiBase}/api/v1/admin/media/${asset.id}/file`} alt={asset.alt_text || asset.original_filename} /> : asset.content_type.startsWith("video/") ? <video src={`${apiBase}/api/v1/admin/media/${asset.id}/file`} controls preload="metadata" /> : <span>PDF</span>}<span className={asset.visibility === "PUBLIC" ? "asset-status public" : "asset-status"}>{asset.visibility}</span></div><div className="media-asset-info"><strong>{asset.original_filename}</strong><span>{Math.max(1, Math.round(asset.byte_size / 1024))} KB · {asset.content_type}</span><div><button type="button" onClick={() => void attach(asset)}>Feature in gallery</button><button className={`asset-visibility-toggle${asset.visibility === "PUBLIC" ? " is-public" : ""}`} type="button" aria-pressed={asset.visibility === "PUBLIC"} onClick={() => void updateVisibility(asset)}><span className="asset-visibility-track" aria-hidden="true"><i /></span><span>{asset.visibility === "PUBLIC" ? "Public" : "Private"}</span></button></div></div></article>)}</div>
      {assets.length === 0 && <div className="media-empty">Your media library is empty. Upload a certificate, screenshot or project photograph to start.</div>}
      <p className="admin-message" role="status">{message}</p>
    </section>
  );
}
