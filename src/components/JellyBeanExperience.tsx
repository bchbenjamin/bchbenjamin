"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { SiteContent } from "@/lib/content";
import ProjectArtwork from "@/components/ProjectArtwork";
import JellyBeanMessaging from "@/components/JellyBeanMessaging";
import MicrobesWallpaper from "@/components/MicrobesWallpaper";

type AppId = "about" | "gallery" | "projects" | "experience" | "education" | "skills" | "terminal" | "contact" | "github" | "settings" | "chess" | "achievements" | "journey" | "email" | "contactDetails";
type AppInfo = { id: AppId; name: string; icon: string; color: string; panel: number };

const APPS: AppInfo[] = [
  { id: "about", name: "About", icon: "person", color: "#4c9bd6", panel: 0 },
  { id: "gallery", name: "Gallery", icon: "gallery", color: "#e8a34c", panel: 0 },
  { id: "projects", name: "Projects", icon: "projects", color: "#48a7a0", panel: 1 },
  { id: "experience", name: "Experience", icon: "briefcase", color: "#8a79c6", panel: 1 },
  { id: "education", name: "Education", icon: "school", color: "#b38a55", panel: 1 },
  { id: "skills", name: "Skills", icon: "skills", color: "#6a9b63", panel: 2 },
  { id: "terminal", name: "Termux", icon: "terminal", color: "#303b43", panel: 2 },
  { id: "github", name: "GitHub", icon: "github", color: "#555b66", panel: 2 },
  { id: "contact", name: "Messaging", icon: "message", color: "#6eaa61", panel: 4 },
  { id: "settings", name: "Settings", icon: "skills", color: "#6a9b63", panel: 2 },
  { id: "chess", name: "Chess", icon: "chess", color: "#b59a70", panel: 3 },
  { id: "achievements", name: "Achievements", icon: "achievements", color: "#d6a34d", panel: 3 },
  { id: "journey", name: "Journey", icon: "person", color: "#4c9bd6", panel: 3 },
  { id: "email", name: "Email", icon: "email", color: "#668fa9", panel: 4 },
  { id: "contactDetails", name: "Contact", icon: "person", color: "#4c9bd6", panel: 4 }
];

function AppIcon({ app, size = "normal" }: { app: AppInfo; size?: "normal" | "large" }) {
  const assets: Record<string, string> = {
    person: "aosp-4.1.2/contacts.png", gallery: "aosp-4.1.2/gallery.png", projects: "aosp-4.1.2/browser.png",
    briefcase: "aosp-4.1.2/calendar.png", school: "aosp-4.1.2/calculator.png", skills: "aosp-4.1.2/settings.png",
    terminal: "termux.png", github: "github.png", message: "aosp-4.1.2/messaging.png",
    achievements: "aosp-4.1.2/calendar.png", email: "aosp-4.1.2/email.png"
  };
  const asset = assets[app.icon];
  return <span className={`jb-app-icon jb-app-icon-${size} jb-icon-${app.icon}`} style={{ "--app-color": app.color } as CSSProperties}>
    {asset ? <Image src={`/jellybean/icons/${asset}`} alt="" width={size === "large" ? 56 : 48} height={size === "large" ? 56 : 48} unoptimized /> : app.icon === "chess" ? <span className="jb-chess-glyph">♞</span> : null}
  </span>;
}

export default function JellyBeanExperience({ site }: { site: SiteContent }) {
  const router = useRouter();
  const [panel, setPanel] = useState(0);
  const [drawer, setDrawer] = useState(false);
  const [drawerTab, setDrawerTab] = useState<"apps" | "widgets">("apps");
  const [shade, setShade] = useState(false);
  const [recent, setRecent] = useState(false);
  const [recentApps, setRecentApps] = useState<AppId[]>([]);
  const [activeApp, setActiveApp] = useState<AppId | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [settingsPage, setSettingsPage] = useState<"main" | "about">("main");
  const [buildTaps, setBuildTaps] = useState(0);
  const [terminalInput, setTerminalInput] = useState("");
  const [terminalLines, setTerminalLines] = useState<string[]>(["Welcome to Termux!", "This is a read-only portfolio environment. Type help to get started."]);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const terminalOutputRef = useRef<HTMLDivElement>(null);
  const terminalInputRef = useRef<HTMLInputElement>(null);
  const clock = useClock();
  const dateLabel = useDateLabel();
  const [clockHours, clockMinutes] = clock.split(":").map(Number);
  const hourAngle = ((clockHours % 12) + clockMinutes / 60) * 30;
  const minuteAngle = clockMinutes * 6;
  const projects = site.projects;
  const currentProject = projects.find((project) => project.slug === selectedProject) ?? null;
  const visibleApps = useMemo(() => {
    const order = Array.isArray(site.launcher.appOrder) ? site.launcher.appOrder : [];
    const hidden = Array.isArray(site.launcher.hiddenApps) ? site.launcher.hiddenApps : [];
    return APPS.filter((item) => !hidden.includes(item.id)).sort((a,b) => order.indexOf(a.id)-order.indexOf(b.id)).map(item => ({ ...item, name: site.launcher.appLabels[item.id] || item.name }));
  }, [site.launcher.hiddenApps, site.launcher.appOrder, site.launcher.appLabels]);
  const app = visibleApps.find((item) => item.id === activeApp) ?? APPS.find((item) => item.id === activeApp) ?? null;
  const panels = useMemo(() => [0, 1, 2, 3, 4], []);
  useEffect(() => { if (activeApp === "terminal") { window.scrollTo(0, 0); terminalInputRef.current?.focus({ preventScroll: true }); if (terminalOutputRef.current) terminalOutputRef.current.scrollTop = terminalOutputRef.current.scrollHeight; } }, [activeApp, terminalLines]);

  const goPanel = useCallback((next: number) => setPanel(Math.max(0, Math.min(4, next))), []);
  const closeOverlays = useCallback(() => { setActiveApp(null); setDrawer(false); setShade(false); setRecent(false); }, []);
  const navBack = useCallback(() => {
    if (shade) setShade(false);
    else if (drawer) setDrawer(false);
    else if (recent) setRecent(false);
    else if (activeApp && selectedProject) setSelectedProject(null);
    else if (activeApp) setActiveApp(null);
    else goPanel(0);
  }, [shade, drawer, recent, activeApp, selectedProject, goPanel]);
  const navHome = useCallback(() => { closeOverlays(); setSelectedProject(null); goPanel(0); }, [closeOverlays, goPanel]);
  const navRecent = useCallback(() => { setActiveApp(null); setDrawer(false); setShade(false); setRecent(true); }, []);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") closeOverlays();
      if (!activeApp && !drawer && !shade && event.key === "ArrowLeft") goPanel(panel - 1);
      if (!activeApp && !drawer && !shade && event.key === "ArrowRight") goPanel(panel + 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeApp, drawer, shade, panel, closeOverlays, goPanel]);

  function onTouchStart(event: React.TouchEvent) { const t = event.touches[0]; touchStart.current = { x: t.clientX, y: t.clientY }; }
  function onTouchEnd(event: React.TouchEvent) {
    if (!touchStart.current) return;
    const t = event.changedTouches[0]; const dx = t.clientX - touchStart.current.x; const dy = t.clientY - touchStart.current.y;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.2) goPanel(panel + (dx < 0 ? 1 : -1));
    if (dy > 85 && touchStart.current.y < 70) setShade(true);
    if (dy < -85 && touchStart.current.y > window.innerHeight - 100 && touchStart.current.x > window.innerWidth - 220) setShade(true);
    touchStart.current = null;
  }
  function open(appId: AppId) { setDrawer(false); setShade(false); setRecent(false); setSelectedProject(null); setRecentApps(items => [appId, ...items.filter(item => item !== appId)].slice(0, 5)); if (appId === "settings") setSettingsPage("main"); setActiveApp(appId); }
  function openProject(slug: string) { setDrawer(false); setShade(false); setRecent(false); setRecentApps(itemS => ["projects" as AppId, ...itemS.filter(item => item !== "projects")].slice(0, 5)); setActiveApp("projects"); setSelectedProject(slug); }
  function runCommand(event: React.FormEvent) {
    event.preventDefault(); const command = terminalInput.trim().toLowerCase(); if (!command) return;
    const output: Record<string, string[]> = {
      help: ["Available commands:", "  help       Show this help", "  whoami     About the portfolio owner", "  projects   List public projects", "  skills     List technologies", "  experience List experience", "  education  List education", "  contact    Show public contact links", "  ls         List available sections", "  pwd        Show current directory", "  uname      Show this environment", "  date       Show local date and time", "  clear      Clear the screen"],
      ls: ["about  projects  experience  education  skills  contact"],
      pwd: ["/home/bch/portfolio"],
      uname: ["PortfolioOS browser x86_64 (read-only)"],
      date: [new Date().toString()],
      whoami: [`${site.owner.name}`, site.owner.role, site.owner.location],
      projects: projects.map((p) => `• ${p.name} — ${p.slug}`),
      skills: site.skillGroups.flatMap((g) => [`${g.name}: ${g.skills.join(", ")}`]),
      experience: site.experience.map((e) => `${e.title} · ${e.organization} (${e.period})`),
      education: site.education.map((e) => `${e.qualification}, ${e.fieldOfStudy} · ${e.institution}`),
      contact: [`Email: ${site.owner.email}`, `GitHub: ${site.owner.github}`, `LinkedIn: ${site.owner.linkedin}`],
      clear: []
    };
    if (command === "clear") setTerminalLines([]);
    else setTerminalLines((lines) => [...lines, `bch@portfolio:~$ ${command}`, ...(output[command] ?? [`command not found: ${command}`, "Type help for available commands."])]);
    setTerminalInput("");
  }

  return <main className="jb-world" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onPointerDown={(e) => { pointerStart.current = { x: e.clientX, y: e.clientY }; }} onPointerUp={(e) => {
    if (!pointerStart.current || e.pointerType === "touch") return;
    const dx = e.clientX - pointerStart.current.x; const dy = e.clientY - pointerStart.current.y;
    if (dy > 75 && pointerStart.current.y < 70) setShade(true);
    else if (dy < -75 && pointerStart.current.y > window.innerHeight - 100 && pointerStart.current.x > window.innerWidth - 220) setShade(true);
    else if (Math.abs(dx) > 90 && Math.abs(dx) > Math.abs(dy)) goPanel(panel + (dx < 0 ? 1 : -1));
    pointerStart.current = null;
  }}>
    <div className={`jb-device${site.launcher.showLabels ? "" : " jb-hide-labels"}`} aria-label="Android portfolio launcher">
      <div className="jb-status-bar" onClick={() => setShade(true)} role="button" tabIndex={0} aria-label="Open notifications and quick settings">
        <div className="jb-status-left" aria-hidden="true" />
        <div className="jb-status-right"><Image className="jb-status-icon" src="/jellybean/stat_sys_wifi_signal_4_fully.png" alt="Wi-Fi" width={13} height={13} /><Image className="jb-status-icon" src="/jellybean/stat_sys_signal_4_fully.png" alt="Mobile signal" width={13} height={13} /><Image className="jb-status-battery" src="/jellybean/stat_sys_battery_71.png" alt="Battery" width={17} height={13} /><span className="jb-status-time">{clock}</span></div>
      </div>

      <div className={`jb-wallpaper${site.launcher.wallpaper === "android-default" ? " jb-wallpaper-static" : site.launcher.wallpaper === "custom" ? " jb-wallpaper-custom" : ""}`} style={site.launcher.wallpaper === "custom" && site.launcher.wallpaperImageUrl ? { backgroundImage: `url("${site.launcher.wallpaperImageUrl}")` } : undefined}>{site.launcher.wallpaper === "microbes" ? <MicrobesWallpaper count={site.launcher.microbeCount} speed={site.launcher.microbeSpeed} /> : null}</div>
      <div className="jb-home-viewport">
        <div className="jb-panels" style={{ transform: `translateX(-${panel * 100}%)` }}>
          {panels.map((index) => <section className="jb-panel" key={index} aria-label={`Home screen ${index + 1}`}>
            {index === 0 && <>
              {site.launcher.showSearch && <div className="jb-search-widget" role="img" aria-label="Google Search"><Image src="/jellybean/search-widget.png" alt="" width={680} height={61} unoptimized /></div>}
              {site.launcher.showClock && <div className="jb-clock-widget" aria-label={`Analog clock showing ${clock}`}>
                <div className="jb-analog-clock">
                  <Image src="/jellybean/clock/dial.png" alt="" fill sizes="180px" unoptimized />
                  <Image className="jb-clock-hand jb-clock-hour-hand" src="/jellybean/clock/hour.png" alt="" fill sizes="180px" style={{ transform: `rotate(${hourAngle}deg)` }} unoptimized />
                  <Image className="jb-clock-hand jb-clock-minute-hand" src="/jellybean/clock/minute.png" alt="" fill sizes="180px" style={{ transform: `rotate(${minuteAngle}deg)` }} unoptimized />
                </div>
              </div>}
              {site.launcher.showGallery && <div className="jb-gallery-widget"><div className="jb-gallery-strip">{projects.slice(0, 5).map((project) => <button key={project.slug} onClick={() => openProject(project.slug)} aria-label={`Open ${project.name}`}><ProjectArtwork project={project} /><span>{project.name}</span></button>)}</div></div>}
              <div className="jb-home-shortcut-row">{visibleApps.filter((a) => ["about", "gallery"].includes(a.id)).map((a) => <button key={a.id} onClick={() => open(a.id)}><AppIcon app={a} /><span>{a.name}</span></button>)}</div>
            </>}
            {index === 1 && <>
              <div className="jb-icon-grid">{visibleApps.filter((a) => a.panel === 1).map((a) => <button key={a.id} onClick={() => open(a.id)}><AppIcon app={a} /><span>{a.name}</span></button>)}</div>
            </>}
            {index === 2 && <>
              <div className="jb-icon-grid jb-icon-grid-large">{visibleApps.filter((a) => a.panel === 2).map((a) => <button key={a.id} onClick={() => a.id === "github" ? window.open(site.owner.github, "_blank", "noopener,noreferrer") : open(a.id)}><AppIcon app={a} size="large" /><span>{a.name}</span></button>)}</div>
            </>}
            {index === 3 && <div className="jb-icon-grid">{visibleApps.filter((a) => a.panel === 3).map((a) => <button key={a.id} onClick={() => a.id === "chess" ? window.open("https://www.chess.com", "_blank", "noopener,noreferrer") : open(a.id)}><AppIcon app={a} /><span>{a.name}</span></button>)}</div>}
            {index === 4 && <div className="jb-icon-grid">{visibleApps.filter((a) => a.panel === 4).map((a) => <button key={a.id} onClick={() => a.id === "email" ? open("email") : open(a.id)}><AppIcon app={a} /><span>{a.name}</span></button>)}</div>}
          </section>)}
        </div>
      </div>

      <div className="jb-page-indicator" aria-label="Home screen pages">{panels.map((p) => <button key={p} className={panel === p ? "active" : ""} onClick={() => goPanel(p)} aria-label={`Go to home screen ${p + 1}`} />)}</div>
      <div className="jb-dock">
        <button onClick={() => open("contactDetails")} aria-label="Phone"><Image src="/jellybean/icons/aosp-4.1.2/phone.png" alt="" width={48} height={48} unoptimized /></button>
        <button onClick={() => open("about")} aria-label="People"><Image src="/jellybean/icons/aosp-4.1.2/contacts.png" alt="" width={48} height={48} unoptimized /></button>
        <button className="jb-app-drawer-button" onClick={() => setDrawer(true)} aria-label="Open app drawer"><Image src="/jellybean/icons/aosp-4.1.2/all-apps.png" alt="" width={48} height={48} unoptimized /></button>
        <button onClick={() => open("contact")} aria-label="Messaging"><Image src="/jellybean/icons/aosp-4.1.2/messaging.png" alt="" width={48} height={48} unoptimized /></button>
        <button onClick={() => window.open(site.owner.github, "_blank", "noopener,noreferrer")} aria-label="Browser"><Image src="/jellybean/icons/aosp-4.1.2/browser.png" alt="" width={48} height={48} unoptimized /></button>
      </div>
      <div className="jb-navigation-bar"><div className="jb-tablet-nav"><button onClick={navBack} aria-label="Back"><Image src="/jellybean/nav-back.png" alt="" width={20} height={20} /></button><button onClick={navHome} aria-label="Home"><Image src="/jellybean/nav-home.png" alt="" width={20} height={20} /></button><button onClick={navRecent} aria-label="Recent apps"><Image src="/jellybean/nav-recent.png" alt="" width={20} height={20} /></button></div><button className="jb-tablet-status" onClick={() => setShade(true)} aria-label="Open notifications"><Image src="/jellybean/stat_sys_wifi_signal_4_fully.png" alt="Wi-Fi" width={16} height={16} /><Image src="/jellybean/stat_sys_battery_71.png" alt="Battery" width={18} height={14} /><span>{clock}</span><span className="jb-tablet-notification-mark">●</span></button></div>

      {drawer && <div className="jb-overlay jb-drawer-overlay"><div className="jb-drawer"><div className="jb-drawer-tabs"><button className={drawerTab === "apps" ? "selected" : ""} onClick={() => setDrawerTab("apps")}>APPS</button><button className={drawerTab === "widgets" ? "selected" : ""} onClick={() => setDrawerTab("widgets")}>WIDGETS</button></div>{drawerTab === "apps" ? <div className="jb-drawer-grid" style={{ gridTemplateColumns: `repeat(${site.launcher.appColumns}, minmax(0, 1fr))` }}>{visibleApps.map((a) => <button key={a.id} onClick={() => a.id === "github" ? window.open(site.owner.github, "_blank", "noopener,noreferrer") : a.id === "chess" ? window.open("https://www.chess.com", "_blank", "noopener,noreferrer") : open(a.id)}><AppIcon app={a} size="large" /><span>{a.name}</span></button>)}</div> : <div className="jb-widget-picker">
        {site.launcher.showClock&&<button onClick={()=>{setDrawer(false);goPanel(0);}}><span className="jb-widget-preview-clock"><span className="jb-analog-clock"><Image src="/jellybean/clock/dial.png" alt="" fill sizes="90px" unoptimized/><Image className="jb-clock-hand" src="/jellybean/clock/hour.png" alt="" fill sizes="90px" unoptimized/><Image className="jb-clock-hand" src="/jellybean/clock/minute.png" alt="" fill sizes="90px" unoptimized/></span></span><b>Analog clock</b><small>2 × 2</small></button>}
        {site.launcher.showSearch&&<button onClick={()=>{setDrawer(false);goPanel(0);}}><span className="jb-widget-preview-search"><Image src="/jellybean/search-widget.png" alt="" width={220} height={20} unoptimized/></span><b>Google Search</b><small>4 × 1</small></button>}
        {site.launcher.showGallery&&<button onClick={()=>{setDrawer(false);goPanel(0);}}><span className="jb-widget-preview-gallery">{projects.slice(0,3).map(project=><ProjectArtwork key={project.slug} project={project}/>)}</span><b>Gallery</b><small>4 × 2</small></button>}
      </div>}</div></div>}

      {shade && <div className="jb-overlay jb-shade-overlay" onClick={() => setShade(false)}><div className="jb-notification-shade" onClick={(e) => e.stopPropagation()} onTouchStart={(e) => { const t=e.touches[0]; touchStart.current={x:t.clientX,y:t.clientY}; }} onTouchEnd={(e) => { if (!touchStart.current) return; const t=e.changedTouches[0]; if (touchStart.current.y-t.clientY>65) setShade(false); touchStart.current=null; }}><div className="jb-shade-head"><div><b>{clock}</b><span>{dateLabel}</span></div><div className="jb-shade-controls"><Image className="jb-shade-rotation" src="/jellybean/ic_notify_rotation_off_normal.png" alt="Rotation lock" width={36} height={36} unoptimized /><Image src="/jellybean/ic_notify_quicksettings_normal.png" alt="Settings" width={36} height={36} unoptimized /><Image className="jb-shade-clear" src="/jellybean/ic_notify_clear_normal.png" alt="Dismiss all notifications" width={36} height={36} unoptimized /></div></div><div className="jb-notification-empty"><span className="jb-notification-symbol"><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 34h28l-4-5V18a10 10 0 0 0-20 0v11z" fill="none" stroke="currentColor" strokeWidth="2.4"/><path d="M19 38q5 6 10 0" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/></svg></span><b>No notifications</b></div></div></div>}

      {recent && <div className="jb-overlay jb-recent-overlay"><div className="jb-recent-stack">{recentApps.length ? recentApps.map(id=>{const item=visibleApps.find(candidate=>candidate.id===id) ?? APPS.find(candidate=>candidate.id===id);return item?<button key={id} onClick={()=>open(id)}><AppIcon app={item} size="large"/><b>{item.name}</b></button>:null;}) : <p>No recent apps</p>}<button onClick={navHome}><span className="jb-recent-home">○</span><b>Home</b></button></div></div>}
      {app && <div className="jb-overlay jb-app-overlay"><div className="jb-app-window"><header className="jb-app-actionbar"><button onClick={navBack} aria-label="Back">‹</button><div><b>{currentProject?.name ?? app.name}</b></div></header><div className="jb-app-content">
        {activeApp === "about" && <><div className="jb-about-hero"><div className="jb-about-avatar">B</div><h2>{site.owner.name}</h2><p>{site.owner.role}</p></div><h3>MY STORY</h3><p>Android 4.1 was my first Android experience. Exploring it led me to custom ROMs, then Linux, programming and eventually engineering. This portfolio is built as a tribute to the interface that started that curiosity.</p><p>{site.owner.intro}</p><div className="jb-info-row"><span>LOCATION</span><b>{site.owner.location}</b></div><div className="jb-info-row"><span>GITHUB</span><a href={site.owner.github} target="_blank" rel="noreferrer">Open profile ↗</a></div></>}
        {activeApp === "gallery" && <><h3>RECENT PROJECTS</h3><div className="jb-app-gallery">{projects.map((p) => <button key={p.slug} onClick={() => openProject(p.slug)}><ProjectArtwork project={p} /><b>{p.name}</b><small>{p.summary}</small></button>)}</div></>}
        {activeApp === "projects" && (currentProject ? <><button className="jb-back-link" onClick={() => setSelectedProject(null)}>‹ ALL PROJECTS</button><div className="jb-project-detail-art"><ProjectArtwork project={currentProject} /></div><h3>{currentProject.category}</h3><h2 className="jb-project-detail-title">{currentProject.name}</h2><p>{currentProject.description || currentProject.summary}</p><div className="jb-chip-row">{currentProject.stack.map((s) => <span key={s}>{s}</span>)}</div><div className="jb-info-row"><span>PERIOD</span><b>{currentProject.period || "—"}</b></div>{currentProject.repo && <a className="jb-project-action" href={currentProject.repo} target="_blank" rel="noreferrer">SOURCE REPOSITORY ↗</a>}{currentProject.liveUrl && <a className="jb-project-action" href={currentProject.liveUrl} target="_blank" rel="noreferrer">LIVE PROJECT ↗</a>}</> : <><h3>SELECTED PROJECTS</h3>{projects.map((p) => <button className="jb-list-card jb-project-list-button" key={p.slug} onClick={() => setSelectedProject(p.slug)}><b>{p.name}</b><small>{p.category} · {p.period}</small><p>{p.summary}</p><span>VIEW DETAILS ›</span></button>)}</>)}
        {activeApp === "experience" && <><h3>EXPERIENCE</h3>{site.experience.map((e, i) => <article className="jb-list-card" key={`${e.title}-${i}`}><b>{e.title}</b><small>{e.organization} · {e.period}</small><p>{e.description}</p></article>)}</>}
        {activeApp === "education" && <><h3>EDUCATION</h3>{site.education.map((e, i) => <article className="jb-list-card" key={`${e.institution}-${i}`}><b>{e.qualification}</b><small>{e.fieldOfStudy} · {e.institution}</small><p>{e.period} · {e.description}</p></article>)}</>}
        {activeApp === "skills" && <><h3>SKILLS & TOOLS</h3>{site.skillGroups.map((g) => <section className="jb-skill-section" key={g.name}><b>{g.name}</b><div className="jb-chip-row">{g.skills.map((s) => <span key={s}>{s}</span>)}</div></section>)}</>}
        {activeApp === "terminal" && <div className="jb-terminal"><div className="jb-terminal-top">Termux <span>bash · portfolio</span></div><div className="jb-terminal-output" ref={terminalOutputRef} aria-live="polite">{terminalLines.map((line, i) => <p key={`${i}-${line}`}>{line}</p>)}</div><form className="jb-termux-prompt" onSubmit={runCommand}><label>bch@portfolio:~$</label><input ref={terminalInputRef} value={terminalInput} onChange={(e) => setTerminalInput(e.target.value)} aria-label="Termux command" autoComplete="off" spellCheck={false} /></form></div>}
        {activeApp === "contact" && <JellyBeanMessaging ownerName={site.owner.name} />}
        {activeApp === "achievements" && <><h3>ACHIEVEMENTS</h3>{site.achievements.map((item, index) => <article className="jb-list-card" key={`${item.title}-${index}`}><b>{item.title}</b><small>{item.label}{item.awardedOn ? ` · ${item.awardedOn}` : ""}</small><p>{item.detail}</p></article>)}</>}
        {activeApp === "journey" && <><h3>MY STORY</h3><p>Android was the starting point. Custom ROMs led to Linux, programming and software engineering.</p>{site.experience.map((item,index)=><article className="jb-list-card" key={`${item.title}-${index}`}><b>{item.title}</b><small>{item.organization} · {item.period}</small><p>{item.description}</p></article>)}</>}
        {activeApp === "email" && <><h3>EMAIL</h3><p>{site.owner.email}</p><a className="jb-project-action" href={`mailto:${site.owner.email}`}>COMPOSE EMAIL ↗</a></>}
        {activeApp === "contactDetails" && <><h3>CONTACT</h3>{[["EMAIL",site.owner.email,`mailto:${site.owner.email}`],["GITHUB",site.owner.github,site.owner.github],["LINKEDIN",site.owner.linkedin,site.owner.linkedin]].filter(item=>item[1]).map(([label,value,url])=><div className="jb-info-row" key={label}><span>{label}</span><a href={url} target={url.startsWith("mailto:")?undefined:"_blank"} rel="noreferrer">{value} ↗</a></div>)}</>}
        {activeApp === "settings" && <div className="jb-settings-screen">{settingsPage === "main" ? <><h3>Settings</h3>{["Wireless & networks","Device","Personal","System"].map((group)=><section key={group}><b>{group}</b>{(group === "System" ? ["Date & time","Accessibility","About phone"] : group === "Device" ? ["Sound","Display","Storage","Battery","Apps"] : group === "Personal" ? ["Location access","Security","Language & input"] : ["Wi-Fi","Bluetooth","Data usage"]).map(item=><button key={item} onClick={()=>item === "About phone" && setSettingsPage("about")}><span>{item}</span><i>›</i></button>)}</section>)}</> : <><button className="jb-settings-back" onClick={()=>setSettingsPage("main")}>‹ Settings</button><h3>About phone</h3>{["Status","Legal information","Model number","Android version","Baseband version","Kernel version"].map(item=><div className="jb-settings-row" key={item}><span>{item}</span><small>{item === "Android version" ? "4.1.2" : item === "Model number" ? "Galaxy Nexus" : ""}</small></div>)}<button className="jb-build-number" onClick={()=>{const next=buildTaps+1;setBuildTaps(next);if(next>=7){setBuildTaps(0);router.push("/admin?source=developer-options");}}}><span>Build number</span><small>JZO54K</small></button></>}</div>}
        {activeApp === "github" && <p>Open GitHub to explore public repositories.</p>}
      </div></div></div>}
    </div>

  </main>;
}

function useClock() {
  const [value, setValue] = useState("--:--");
  useEffect(() => { const update = () => setValue(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false })); update(); const timer = window.setInterval(update, 15_000); return () => window.clearInterval(timer); }, []);
  return value;
}

function useDateLabel() {
  const [value, setValue] = useState(" ");
  useEffect(() => { const update = () => setValue(new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })); update(); const timer = window.setInterval(update, 60_000); return () => window.clearInterval(timer); }, []);
  return value;
}
