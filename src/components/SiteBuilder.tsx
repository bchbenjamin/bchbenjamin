"use client";

import { useCallback, useEffect, useState } from "react";
const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");
type Section = { id: string; type: string; enabled: boolean; order: number };
type LauncherConfig = { wallpaper: "water" | "android-default" | "custom"; wallpaperImageUrl: string; appLabels: Record<string,string>; microbeCount: number; microbeSpeed: number; appColumns: number; showLabels: boolean; hiddenApps: string[]; appOrder: string[]; showSearch: boolean; showClock: boolean; showGallery: boolean };
const defaultLauncher: LauncherConfig = { wallpaper: "water", wallpaperImageUrl: "", appLabels: {}, microbeCount: 28, microbeSpeed: 0.65, appColumns: 4, showLabels: true, hiddenApps: [], appOrder: ["about","gallery","projects","experience","education","skills","terminal","github","contact","settings","chess","achievements","journey","email","contactDetails"], showSearch: true, showClock: true, showGallery: true };
type HomeContent = { heroEyebrow: string; focus: string; aboutTitle: string; aboutParagraphs: string[]; projectsTitle: string; projectsDescription: string; skillsTitle: string; skillsDescription: string; contactTitle: string; contactDescription: string };
const labels: Record<string, string> = { "image-gallery": "Horizontal project image gallery", hero: "Opening hero", principles: "Principles strip", "achievement-gallery": "Achievement gallery", projects: "Selected projects", about: "About", skills: "Skills and tools", contact: "Contact" };
async function csrfToken() { const r = await fetch(`${apiBase}/api/v1/csrf`, { credentials: "include" }); if (!r.ok) throw new Error("Could not initialise a secure request."); return (await r.json() as { token: string }).token; }

export default function SiteBuilder() {
  const [sections, setSections] = useState<Section[]>([]);
  const [content, setContent] = useState<HomeContent>({ heroEyebrow: "", focus: "", aboutTitle: "", aboutParagraphs: ["", ""], projectsTitle: "", projectsDescription: "", skillsTitle: "", skillsDescription: "", contactTitle: "", contactDescription: "" });
  const [launcher, setLauncher] = useState<LauncherConfig>(defaultLauncher);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("The public site uses a separate published configuration.");
  const load = useCallback(async () => {
    const response = await fetch(`${apiBase}/api/v1/admin/site-configuration`, { credentials: "include", cache: "no-store" });
    if (!response.ok) throw new Error("Could not load site configuration.");
    const result = await response.json() as { draftConfig?: string | { home?: { sections?: Section[]; content?: HomeContent }; launcher?: Partial<LauncherConfig> }; draft_config?: string | { home?: { sections?: Section[]; content?: HomeContent }; launcher?: Partial<LauncherConfig> } };
    const raw = result.draftConfig ?? result.draft_config;
    const config = typeof raw === "string" ? JSON.parse(raw) as { home?: { sections?: Section[]; content?: HomeContent }; launcher?: Partial<LauncherConfig> } : raw as { home?: { sections?: Section[]; content?: HomeContent }; launcher?: Partial<LauncherConfig> };
    setSections(config?.home?.sections ?? []);
    if (config?.home?.content) setContent(config.home.content);
    setLauncher({ ...defaultLauncher, ...config?.launcher, wallpaper: config?.launcher?.wallpaper === "android-default" || config?.launcher?.wallpaper === "custom" ? config.launcher.wallpaper : "water", appOrder: [...new Set([...(config?.launcher?.appOrder ?? []), ...defaultLauncher.appOrder])] });
  }, []);
  useEffect(() => { let active = true; void Promise.resolve().then(() => active ? load() : undefined).catch((error: unknown) => { if (active) setMessage(error instanceof Error ? error.message : "Could not load site settings."); }); return () => { active = false; }; }, [load]);

  function reorder(index: number, delta: number) {
    setSections((items) => { const next = [...items]; const target = index + delta; if (target < 0 || target >= next.length) return items; [next[index], next[target]] = [next[target], next[index]]; return next.map((item, i) => ({ ...item, order: (i + 1) * 10 })); });
  }
  async function save(publish: boolean) {
    setBusy(true);
    try {
      const token = await csrfToken(); const config = { home: { sections: sections.map((item, i) => ({ ...item, order: (i + 1) * 10 })), content }, launcher };
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
          <label>Wallpaper<select value={launcher.wallpaper} onChange={e=>setLauncher(v=>({...v,wallpaper:e.target.value as LauncherConfig["wallpaper"]}))}><option value="water">Water live wallpaper · Micromax A110</option><option value="android-default">Android 4.1 static wallpaper</option><option value="custom">Custom image</option></select></label>
          <label>Custom wallpaper URL<input type="url" value={launcher.wallpaperImageUrl} onChange={e=>setLauncher(v=>({...v,wallpaperImageUrl:e.target.value}))} placeholder="/api/v1/public/media/…" disabled={launcher.wallpaper!=="custom"}/></label>
          <label>App drawer columns<select value={launcher.appColumns} onChange={e=>setLauncher(v=>({...v,appColumns:Number(e.target.value)}))}><option value={3}>3 columns</option><option value={4}>4 columns</option><option value={5}>5 columns</option><option value={6}>6 columns</option></select></label>
          <label className="launcher-toggle"><input type="checkbox" checked={launcher.showLabels} onChange={e=>setLauncher(v=>({...v,showLabels:e.target.checked}))}/> Show app labels</label>
          <label className="launcher-toggle"><input type="checkbox" checked={launcher.showSearch} onChange={e=>setLauncher(v=>({...v,showSearch:e.target.checked}))}/> Show search widget</label>
          <label className="launcher-toggle"><input type="checkbox" checked={launcher.showClock} onChange={e=>setLauncher(v=>({...v,showClock:e.target.checked}))}/> Show analog clock</label>
          <label className="launcher-toggle"><input type="checkbox" checked={launcher.showGallery} onChange={e=>setLauncher(v=>({...v,showGallery:e.target.checked}))}/> Show gallery widget</label>
        </div>
        <div className="launcher-app-order"><strong>App order</strong>{launcher.appOrder.map((id,index)=><div key={id}><span>{index+1}. {({about:"People",gallery:"Gallery",projects:"Projects",experience:"Experience",education:"Education",skills:"Skills",terminal:"Termux",github:"GitHub",contact:"Messaging",settings:"Settings",chess:"Chess",achievements:"Achievements",journey:"Journey",email:"Email",contactDetails:"Contact"} as Record<string,string>)[id]??id}</span><button type="button" disabled={index===0} onClick={()=>setLauncher(v=>{const next=[...v.appOrder];[next[index-1],next[index]]=[next[index],next[index-1]];return {...v,appOrder:next};})}>↑</button><button type="button" disabled={index===launcher.appOrder.length-1} onClick={()=>setLauncher(v=>{const next=[...v.appOrder];[next[index+1],next[index]]=[next[index],next[index+1]];return {...v,appOrder:next};})}>↓</button></div>)}</div>
        <div className="launcher-app-labels"><strong>App labels</strong>{launcher.appOrder.map(id=><label key={id}><span>{id}</span><input value={launcher.appLabels[id] ?? ""} onChange={e=>setLauncher(v=>({...v,appLabels:{...v.appLabels,[id]:e.target.value}}))} placeholder={({about:"About",gallery:"Gallery",projects:"Projects",experience:"Experience",education:"Education",skills:"Skills",terminal:"Termux",github:"GitHub",contact:"Messaging",settings:"Settings",chess:"Chess",achievements:"Achievements",journey:"Journey",email:"Email",contactDetails:"Contact"} as Record<string,string>)[id]??id}/></label>)}</div>
        <div className="launcher-app-visibility"><strong>Apps in drawer</strong>{[["about","People"],["gallery","Gallery"],["projects","Browser / Projects"],["experience","Work / Experience"],["education","Education"],["skills","Skills & tools"],["terminal","Termux"],["github","GitHub"],["contact","Messaging"],["settings","Settings"],["chess","Chess"],["achievements","Achievements"],["journey","Journey"],["email","Email"],["contactDetails","Contact"]].map(([id,label])=><label key={id}><input type="checkbox" checked={!launcher.hiddenApps.includes(id)} onChange={e=>setLauncher(v=>({...v,hiddenApps:e.target.checked?v.hiddenApps.filter(x=>x!==id):[...v.hiddenApps,id]}))}/>{label}</label>)}</div>
      </div>
      <div className="site-section-list">{sections.map((section, index) => <article className={`site-section-row${section.enabled ? " enabled" : " disabled"}`} key={section.id}><label><input type="checkbox" checked={section.enabled} onChange={(event) => setSections((items) => items.map((item) => item.id === section.id ? { ...item, enabled: event.target.checked } : item))} /><span className="section-switch" aria-hidden="true" /><span className="site-section-number">{String(index + 1).padStart(2, "0")}</span><span><strong>{labels[section.id] ?? section.id}</strong><small>{section.type}</small></span></label><div><button aria-label={`Move ${section.id} up`} disabled={index === 0} onClick={() => reorder(index, -1)} type="button">↑</button><button aria-label={`Move ${section.id} down`} disabled={index === sections.length - 1} onClick={() => reorder(index, 1)} type="button">↓</button></div></article>)}</div><div className="site-builder-actions"><button className="button button-quiet" type="button" disabled={busy} onClick={() => void save(false)}>Save draft</button><button className="button button-primary" type="button" disabled={busy} onClick={() => void save(true)}>Publish website ↗</button></div><p className="admin-message" role="status">{message}</p></section>;
}
