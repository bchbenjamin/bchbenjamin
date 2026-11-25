"use client";

import { useCallback, useEffect, useState } from "react";
const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");
type Section = { id: string; type: string; enabled: boolean; order: number };
type LauncherConfig = { homeLayout: { icons: Record<string, { panel: number; slot: number }>; widgets: Record<string, { panel: number; row: number; column: number }> }; chessComProfileUrl: string; lichessProfileUrl: string; customApps: { id: string; name: string; url: string; iconUrl?: string }[]; wallpaper: "water" | "android-default" | "custom"; wallpaperImageUrl: string; appLabels: Record<string,string>; microbeCount: number; microbeSpeed: number; appColumns: number; showLabels: boolean; hiddenApps: string[]; appOrder: string[]; showSearch: boolean; showClock: boolean; showGallery: boolean; showStatusBar: boolean; showDock: boolean; showPageIndicator: boolean; showNavigationBar: boolean };
const defaultLauncher: LauncherConfig = { homeLayout: { icons: {}, widgets: {} }, chessComProfileUrl: "https://www.chess.com", lichessProfileUrl: "https://lichess.org", customApps: [], wallpaper: "android-default", wallpaperImageUrl: "", appLabels: {}, microbeCount: 28, microbeSpeed: 0.65, appColumns: 4, showLabels: true, hiddenApps: [], appOrder: ["about","gallery","projects","breach-defend","hermes-quizzer","street-safety","experience","education","skills","terminal","magisk","github","contact","settings","chess","achievements","journey","email","contactDetails"], showSearch: true, showClock: true, showGallery: true, showStatusBar: true, showDock: true, showPageIndicator: true, showNavigationBar: true };
type HomeContent = { heroEyebrow: string; focus: string; aboutTitle: string; aboutParagraphs: string[]; projectsTitle: string; projectsDescription: string; skillsTitle: string; skillsDescription: string; contactTitle: string; contactDescription: string };
const labels: Record<string, string> = { "image-gallery": "Horizontal project image gallery", hero: "Opening hero", principles: "Principles strip", "achievement-gallery": "Achievement gallery", projects: "Selected projects", about: "About", skills: "Skills and tools", contact: "Contact" };
async function csrfToken() { const r = await fetch(`${apiBase}/api/v1/csrf`, { credentials: "include" }); if (!r.ok) throw new Error("Could not initialise a secure request."); return (await r.json() as { token: string }).token; }

export default function SiteBuilder() {
  const [sections, setSections] = useState<Section[]>([]);
  const [projectNames, setProjectNames] = useState<Record<string, string>>({});
  const [content, setContent] = useState<HomeContent>({ heroEyebrow: "", focus: "", aboutTitle: "", aboutParagraphs: ["", ""], projectsTitle: "", projectsDescription: "", skillsTitle: "", skillsDescription: "", contactTitle: "", contactDescription: "" });
  const [launcher, setLauncher] = useState<LauncherConfig>(defaultLauncher);
  const [busy, setBusy] = useState(false);
  const [shortcutName, setShortcutName] = useState("");
  const [shortcutUrl, setShortcutUrl] = useState("");
  const [shortcutIcon, setShortcutIcon] = useState("");
  const [shortcutIconFile, setShortcutIconFile] = useState<File | null>(null);
  const [message, setMessage] = useState("The public site uses a separate published configuration.");
  const load = useCallback(async () => {
    const response = await fetch(`${apiBase}/api/v1/admin/site-configuration`, { credentials: "include", cache: "no-store" });
    if (!response.ok) throw new Error("Could not load site configuration.");
    const result = await response.json() as { draftConfig?: string | { home?: { sections?: Section[]; content?: HomeContent }; launcher?: Partial<LauncherConfig> }; draft_config?: string | { home?: { sections?: Section[]; content?: HomeContent }; launcher?: Partial<LauncherConfig> } };
    const raw = result.draftConfig ?? result.draft_config;
    const config = typeof raw === "string" ? JSON.parse(raw) as { home?: { sections?: Section[]; content?: HomeContent }; launcher?: Partial<LauncherConfig> } : raw as { home?: { sections?: Section[]; content?: HomeContent }; launcher?: Partial<LauncherConfig> };
    setSections(config?.home?.sections ?? []);
    const publicProjects = await fetch(`${apiBase}/api/v1/public/projects`, { cache: "no-store" }).then(response => response.ok ? response.json() as Promise<{ slug: string; name: string }[]> : []).catch(() => [] as { slug: string; name: string }[]);
    setProjectNames(Object.fromEntries(publicProjects.flatMap(project => project.slug === "breach-defend" ? [["breach-defend", project.name]] : project.slug === "hermes-the-quizzer" ? [["hermes-quizzer", project.name]] : project.slug === "street-safety-device" ? [["street-safety", project.name]] : [])));
    if (config?.home?.content) setContent(config.home.content);
    const retired = new Set(["bengaluruduru", "ease-health", "academic-results", "peer-management"]);
    const appOrder = [...new Set([...(config?.launcher?.appOrder ?? []).filter(id => !retired.has(id)), ...defaultLauncher.appOrder])];
    setLauncher({ ...defaultLauncher, ...config?.launcher, homeLayout: config?.launcher?.homeLayout ?? defaultLauncher.homeLayout, hiddenApps: (config?.launcher?.hiddenApps ?? []).filter(id => !retired.has(id)), wallpaper: config?.launcher?.wallpaper === "custom" ? "custom" : "android-default", appOrder, customApps: Array.isArray(config?.launcher?.customApps) ? config.launcher.customApps : [] });
  }, []);
  useEffect(() => { let active = true; void Promise.resolve().then(() => active ? load() : undefined).catch((error: unknown) => { if (active) setMessage(error instanceof Error ? error.message : "Could not load site settings."); }); return () => { active = false; }; }, [load]);

  function reorder(index: number, delta: number) {
    setSections((items) => { const next = [...items]; const target = index + delta; if (target < 0 || target >= next.length) return items; [next[index], next[target]] = [next[target], next[index]]; return next.map((item, i) => ({ ...item, order: (i + 1) * 10 })); });
  }
  async function addShortcut() {
    if (!shortcutName.trim() || !/^https:\/\//i.test(shortcutUrl.trim())) return;
    setBusy(true);
    try {
      let iconUrl = shortcutIcon.trim();
      if (shortcutIconFile) {
        if (!/^image\/(png|jpeg|webp|gif)$/i.test(shortcutIconFile.type) || shortcutIconFile.size > 2 * 1024 * 1024) {
          throw new Error("Choose a PNG, JPEG, WebP or GIF icon up to 2 MB.");
        }
        const token = await csrfToken();
        const form = new FormData();
        form.append("file", shortcutIconFile);
        form.append("visibility", "PUBLIC");
        form.append("altText", `${shortcutName.trim()} app icon`);
        form.append("caption", "Launcher app icon");
        const uploaded = await fetch(`${apiBase}/api/v1/admin/media`, { method: "POST", credentials: "include", headers: { "X-XSRF-TOKEN": token }, body: form });
        if (!uploaded.ok) throw new Error(`Icon upload failed (${uploaded.status}).`);
        const asset = await uploaded.json() as { id: string };
        iconUrl = `/api/v1/public/media/${asset.id}`;
      }
      const id = `custom-${shortcutName.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}-${Date.now().toString(36)}`;
      setLauncher(value => ({ ...value, customApps: [...value.customApps, { id, name: shortcutName.trim(), url: shortcutUrl.trim(), ...(iconUrl ? { iconUrl } : {}) }], appOrder: [...value.appOrder, id] }));
      setShortcutName(""); setShortcutUrl(""); setShortcutIcon(""); setShortcutIconFile(null);
      setMessage("Shortcut added to the site draft. Save and publish to make it available on every device.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not add the app shortcut.");
    } finally { setBusy(false); }
  }

  async function save(publish: boolean) {
    setBusy(true);
    try {
      const token = await csrfToken();
      const latestResponse = await fetch(`${apiBase}/api/v1/admin/site-configuration`, { credentials: "include", cache: "no-store" });
      if (!latestResponse.ok) throw new Error("Could not refresh the latest owner configuration before saving.");
      const latestResult = await latestResponse.json() as { draftConfig?: string | { launcher?: Partial<LauncherConfig> }; draft_config?: string | { launcher?: Partial<LauncherConfig> } };
      const latestRaw = latestResult.draftConfig ?? latestResult.draft_config;
      const latest = typeof latestRaw === "string" ? JSON.parse(latestRaw) as { launcher?: Partial<LauncherConfig> } : latestRaw as { launcher?: Partial<LauncherConfig> };
      const mergedLauncher = { ...launcher, homeLayout: latest?.launcher?.homeLayout ?? launcher.homeLayout };
      const config = { home: { sections: sections.map((item, i) => ({ ...item, order: (i + 1) * 10 })), content }, launcher: mergedLauncher };
      const saved = await fetch(`${apiBase}/api/v1/admin/site-configuration`, { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json", "X-XSRF-TOKEN": token }, body: JSON.stringify(config) });
      if (!saved.ok) throw new Error("Could not save the site draft.");
      if (publish) {
        const response = await fetch(`${apiBase}/api/v1/admin/site-configuration/publish`, { method: "POST", credentials: "include", headers: { "X-XSRF-TOKEN": token } });
        if (!response.ok) throw new Error("Draft saved, but publishing failed.");
      }
      setMessage(publish ? "Site configuration published." : "Draft saved. The public website is unchanged until you publish.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Site configuration update failed."); }
    finally { setBusy(false); }
  }

  return <section className="site-builder admin-module"><div className="admin-module-heading"><div><p className="eyebrow">PRESENTATION / PUBLICATION CONTROL</p><h2>Site <span>Builder</span></h2><p>Choose which homepage sections exist and how they are ordered.</p></div><span className="private-chip">DRAFT → PUBLISH</span></div><div className="site-content-editor">
      <div className="admin-list-top"><strong>Homepage copy and labels</strong><span>CONTENT CONTROLS</span></div>
      <div className="site-content-grid">
        <label>Hero eyebrow<input value={content.heroEyebrow} onChange={(event) => setContent((value) => ({ ...value, heroEyebrow: event.target.value }))} /></label>
        <label>Focus line<input value={content.focus} onChange={(event) => setContent((value) => ({ ...value, focus: event.target.value }))} /></label>
        <label>About heading<textarea rows={2} value={content.aboutTitle} onChange={(event) => setContent((value) => ({ ...value, aboutTitle: event.target.value }))} /></label>
        <label>About paragraph one<textarea rows={3} value={content.aboutParagraphs[0] ?? ""} onChange={(event) => setContent((value) => ({ ...value, aboutParagraphs: [event.target.value, value.aboutParagraphs[1] ?? ""] }))} /></label>
        <label>About paragraph two<textarea rows={3} value={content.aboutParagraphs[1] ?? ""} onChange={(event) => setContent((value) => ({ ...value, aboutParagraphs: [value.aboutParagraphs[0] ?? "", event.target.value] }))} /></label>
        <label>Projects heading<input value={content.projectsTitle} onChange={(event) => setContent((value) => ({ ...value, projectsTitle: event.target.value }))} /></label>
        <label>Projects description<input value={content.projectsDescription} onChange={(event) => setContent((value) => ({ ...value, projectsDescription: event.target.value }))} /></label>
        <label>Skills heading<input value={content.skillsTitle} onChange={(event) => setContent((value) => ({ ...value, skillsTitle: event.target.value }))} /></label>
        <label>Skills description<input value={content.skillsDescription} onChange={(event) => setContent((value) => ({ ...value, skillsDescription: event.target.value }))} /></label>
        <label>Contact heading<input value={content.contactTitle} onChange={(event) => setContent((value) => ({ ...value, contactTitle: event.target.value }))} /></label>
        <label>Contact description<input value={content.contactDescription} onChange={(event) => setContent((value) => ({ ...value, contactDescription: event.target.value }))} /></label>
      </div>
      </div>
      <div className="site-content-editor launcher-editor">
        <div className="admin-list-top"><strong>Launcher and wallpaper</strong><span>ANDROID INTERFACE</span></div>
        <div className="site-content-grid">
          <label>Wallpaper<select value={launcher.wallpaper} onChange={e=>setLauncher(v=>({...v,wallpaper:e.target.value as LauncherConfig["wallpaper"]}))}><option value="android-default">Android 4.1 stock wallpaper · huts</option><option value="custom">Custom image</option></select></label>
          <label>Custom wallpaper URL<input type="url" value={launcher.wallpaperImageUrl} onChange={e=>setLauncher(v=>({...v,wallpaperImageUrl:e.target.value}))} placeholder="/api/v1/public/media/…" disabled={launcher.wallpaper!=="custom"}/></label>
          <label>App drawer columns<select value={launcher.appColumns} onChange={e=>setLauncher(v=>({...v,appColumns:Number(e.target.value)}))}><option value={3}>3 columns</option><option value={4}>4 columns</option><option value={5}>5 columns</option><option value={6}>6 columns</option></select></label>
          <label className="launcher-toggle"><input type="checkbox" checked={launcher.showLabels} onChange={e=>setLauncher(v=>({...v,showLabels:e.target.checked}))}/> Show app labels</label>
          <label className="launcher-toggle"><input type="checkbox" checked={launcher.showSearch} onChange={e=>setLauncher(v=>({...v,showSearch:e.target.checked}))}/> Show search widget</label>
          <label className="launcher-toggle"><input type="checkbox" checked={launcher.showClock} onChange={e=>setLauncher(v=>({...v,showClock:e.target.checked}))}/> Show analog clock</label>
          <label className="launcher-toggle"><input type="checkbox" checked={launcher.showGallery} onChange={e=>setLauncher(v=>({...v,showGallery:e.target.checked}))}/> Show gallery widget</label>
          <label className="launcher-toggle"><input type="checkbox" checked={launcher.showStatusBar} onChange={e=>setLauncher(v=>({...v,showStatusBar:e.target.checked}))}/> Show status bar</label>
          <label className="launcher-toggle"><input type="checkbox" checked={launcher.showDock} onChange={e=>setLauncher(v=>({...v,showDock:e.target.checked}))}/> Show launcher dock</label>
          <label className="launcher-toggle"><input type="checkbox" checked={launcher.showPageIndicator} onChange={e=>setLauncher(v=>({...v,showPageIndicator:e.target.checked}))}/> Show home-page indicators</label>
          <label className="launcher-toggle"><input type="checkbox" checked={launcher.showNavigationBar} onChange={e=>setLauncher(v=>({...v,showNavigationBar:e.target.checked}))}/> Show navigation bar</label>
        </div>
        <div className="launcher-custom-apps">
          <strong>Chess folder profiles</strong>
          <p>These destinations are opened by the two branded icons inside the Chess folder.</p>
          <div className="site-content-grid">
            <label>Chess.com profile URL<input type="url" value={launcher.chessComProfileUrl} onChange={e=>setLauncher(v=>({...v,chessComProfileUrl:e.target.value}))} placeholder="https://www.chess.com/member/your-username"/></label>
            <label>Lichess profile URL<input type="url" value={launcher.lichessProfileUrl} onChange={e=>setLauncher(v=>({...v,lichessProfileUrl:e.target.value}))} placeholder="https://lichess.org/@/your-username"/></label>
          </div>
        </div>
        <div className="launcher-custom-apps">
          <strong>Custom app shortcuts</strong>
          <p>Add project or service icons. Uploaded images are stored in the media library and published as public launcher assets; new shortcuts appear after you publish the site configuration.</p>
          <div className="site-content-grid">
            <label>App name<input value={shortcutName} onChange={e=>setShortcutName(e.target.value)} placeholder="Chess.com profile" maxLength={32}/></label>
            <label>Destination URL<input type="url" value={shortcutUrl} onChange={e=>setShortcutUrl(e.target.value)} placeholder="https://example.com/project"/></label>
            <label>Icon image URL (optional)<input type="url" value={shortcutIcon} onChange={e=>setShortcutIcon(e.target.value)} placeholder="https://… or /api/v1/public/media/…"/></label>
            <label>Upload icon (PNG, JPEG, WebP or GIF · 2 MB max)<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={e=>setShortcutIconFile(e.target.files?.[0] ?? null)}/></label>
            <button type="button" className="button button-quiet" disabled={busy || !shortcutName.trim() || !/^https:\/\//i.test(shortcutUrl.trim()) || launcher.customApps.length >= 24} onClick={()=>void addShortcut()}>{busy ? "Uploading…" : "Add app icon"}</button>
          </div>
          {launcher.customApps.map(item=><div className="launcher-custom-app-row" key={item.id}><span>{item.name}<small>{item.url}</small></span><button type="button" aria-label={`Delete ${item.name}`} onClick={()=>setLauncher(v=>({...v,customApps:v.customApps.filter(app=>app.id!==item.id),appOrder:v.appOrder.filter(id=>id!==item.id)}))}>Delete</button></div>)}
        </div>
        <div className="launcher-app-order"><strong>App order</strong>{launcher.appOrder.map((id,index)=><div key={id}><span>{index+1}. {({about:"People",gallery:"Gallery",projects:"Projects","breach-defend":projectNames["breach-defend"]??"Project shortcut","hermes-quizzer":projectNames["hermes-quizzer"]??"Project shortcut",experience:"Experience",education:"Education",skills:"Skills",terminal:"Termux",magisk:"Magisk",github:"GitHub","street-safety":projectNames["street-safety"]??"Project shortcut",contact:"Messaging",settings:"Settings",chess:"Chess",achievements:"Achievements",journey:"Journey",email:"Email",contactDetails:"Contact"} as Record<string,string>)[id]??id}</span><button type="button" disabled={index===0} onClick={()=>setLauncher(v=>{const next=[...v.appOrder];[next[index-1],next[index]]=[next[index],next[index-1]];return {...v,appOrder:next};})}>↑</button><button type="button" disabled={index===launcher.appOrder.length-1} onClick={()=>setLauncher(v=>{const next=[...v.appOrder];[next[index+1],next[index]]=[next[index],next[index+1]];return {...v,appOrder:next};})}>↓</button></div>)}</div>
        <div className="launcher-app-labels"><strong>App labels</strong>{launcher.appOrder.map(id=><label key={id}><span>{id}</span><input value={launcher.appLabels[id] ?? ""} onChange={e=>setLauncher(v=>({...v,appLabels:{...v.appLabels,[id]:e.target.value}}))} placeholder={({about:"About",gallery:"Gallery",projects:"Projects","breach-defend":projectNames["breach-defend"]??"Project shortcut","hermes-quizzer":projectNames["hermes-quizzer"]??"Project shortcut",experience:"Experience",education:"Education",skills:"Skills",terminal:"Termux",magisk:"Magisk",github:"GitHub","street-safety":projectNames["street-safety"]??"Project shortcut",contact:"Messaging",settings:"Settings",chess:"Chess",achievements:"Achievements",journey:"Journey",email:"Email",contactDetails:"Contact"} as Record<string,string>)[id]??id}/></label>)}</div>
        <div className="launcher-app-visibility"><strong>Apps in drawer</strong>{[["about","People"],["gallery","Gallery"],["projects","Projects"],["breach-defend",projectNames["breach-defend"]??"Project shortcut"],["hermes-quizzer",projectNames["hermes-quizzer"]??"Project shortcut"],["street-safety",projectNames["street-safety"]??"Project shortcut"],["experience","Work / Experience"],["education","Education"],["skills","Skills & tools"],["terminal","Termux"],["magisk","Magisk"],["github","GitHub"],["contact","Messaging"],["settings","Settings"],["chess","Chess"],["achievements","Achievements"],["journey","Journey"],["email","Email"],["contactDetails","Contact"]].map(([id,label])=><label key={id}><input type="checkbox" checked={!launcher.hiddenApps.includes(id)} onChange={e=>setLauncher(v=>({...v,hiddenApps:e.target.checked?v.hiddenApps.filter(x=>x!==id):[...v.hiddenApps,id]}))}/>{label}</label>)}</div>
      </div>
      <div className="site-section-list">{sections.map((section, index) => <article className={`site-section-row${section.enabled ? " enabled" : " disabled"}`} key={section.id}><label><input type="checkbox" checked={section.enabled} onChange={(event) => setSections((items) => items.map((item) => item.id === section.id ? { ...item, enabled: event.target.checked } : item))} /><span className="section-switch" aria-hidden="true" /><span className="site-section-number">{String(index + 1).padStart(2, "0")}</span><span><strong>{labels[section.id] ?? section.id}</strong><small>{section.type}</small></span></label><div><button aria-label={`Move ${section.id} up`} disabled={index === 0} onClick={() => reorder(index, -1)} type="button">↑</button><button aria-label={`Move ${section.id} down`} disabled={index === sections.length - 1} onClick={() => reorder(index, 1)} type="button">↓</button></div></article>)}</div><div className="site-builder-actions"><button className="button button-quiet" type="button" disabled={busy} onClick={() => void save(false)}>Save draft</button><button className="button button-primary" type="button" disabled={busy} onClick={() => void save(true)}>Publish website ↗</button></div><p className="admin-message" role="status">{message}</p></section>;
}
