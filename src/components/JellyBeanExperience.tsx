"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import type { SiteContent } from "@/lib/content";
import ProjectArtwork from "@/components/ProjectArtwork";
import ContactForm from "@/components/ContactForm";

type AppId = "about" | "gallery" | "projects" | "experience" | "education" | "skills" | "terminal" | "contact" | "github";
type AppInfo = { id: AppId; name: string; icon: string; color: string; panel: number };

const APPS: AppInfo[] = [
  { id: "about", name: "About", icon: "person", color: "#4c9bd6", panel: 0 },
  { id: "gallery", name: "Gallery", icon: "gallery", color: "#e8a34c", panel: 0 },
  { id: "projects", name: "Projects", icon: "projects", color: "#48a7a0", panel: 1 },
  { id: "experience", name: "Experience", icon: "briefcase", color: "#8a79c6", panel: 1 },
  { id: "education", name: "Education", icon: "school", color: "#b38a55", panel: 1 },
  { id: "skills", name: "Skills", icon: "skills", color: "#6a9b63", panel: 2 },
  { id: "terminal", name: "Terminal", icon: "terminal", color: "#303b43", panel: 2 },
  { id: "github", name: "GitHub", icon: "github", color: "#555b66", panel: 2 },
  { id: "contact", name: "Messaging", icon: "message", color: "#6eaa61", panel: 4 }
];

function AppIcon({ app, size = "normal" }: { app: AppInfo; size?: "normal" | "large" }) {
  const glyph: Record<string, string> = { person: "●", gallery: "▧", projects: "▦", briefcase: "▣", school: "◆", skills: "✳", terminal: ">_", github: "◉", message: "▰" };
  return <span className={`jb-app-icon jb-app-icon-${size}`} style={{ "--app-color": app.color } as React.CSSProperties}><span>{glyph[app.icon] ?? "●"}</span></span>;
}

export default function JellyBeanExperience({ site }: { site: SiteContent }) {
  const [panel, setPanel] = useState(0);
  const [drawer, setDrawer] = useState(false);
  const [drawerTab, setDrawerTab] = useState<"apps" | "widgets">("apps");
  const [shade, setShade] = useState(false);
  const [activeApp, setActiveApp] = useState<AppId | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [terminalInput, setTerminalInput] = useState("");
  const [terminalLines, setTerminalLines] = useState<string[]>(["BCH shell [portfolio edition]", "Type 'help' to see available commands."]);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const clock = useClock();
  const dateLabel = useDateLabel();
  const projects = site.projects;
  const app = APPS.find((item) => item.id === activeApp) ?? null;
  const currentProject = projects.find((project) => project.slug === selectedProject) ?? null;
  const panels = useMemo(() => [0, 1, 2, 3, 4], []);

  const goPanel = useCallback((next: number) => setPanel(Math.max(0, Math.min(4, next))), []);
  const closeOverlays = useCallback(() => { setActiveApp(null); setDrawer(false); setShade(false); }, []);
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
    touchStart.current = null;
  }
  function open(appId: AppId) { setDrawer(false); setShade(false); setSelectedProject(null); setActiveApp(appId); }
  function openProject(slug: string) { setDrawer(false); setShade(false); setActiveApp("projects"); setSelectedProject(slug); }
  function runCommand(event: React.FormEvent) {
    event.preventDefault(); const command = terminalInput.trim().toLowerCase(); if (!command) return;
    const output: Record<string, string[]> = {
      help: ["Available: help, whoami, projects, skills, experience, education, contact, clear"],
      whoami: [`${site.owner.name}`, site.owner.role, site.owner.location],
      projects: projects.map((p) => `• ${p.name} — ${p.slug}`),
      skills: site.skillGroups.flatMap((g) => [`${g.name}: ${g.skills.join(", ")}`]),
      experience: site.experience.map((e) => `${e.title} · ${e.organization} (${e.period})`),
      education: site.education.map((e) => `${e.qualification}, ${e.fieldOfStudy} · ${e.institution}`),
      contact: [`Email: ${site.owner.email}`, `GitHub: ${site.owner.github}`, `LinkedIn: ${site.owner.linkedin}`],
      clear: []
    };
    if (command === "clear") setTerminalLines([]);
    else setTerminalLines((lines) => [...lines, `guest@bch:~$ ${command}`, ...(output[command] ?? [`command not found: ${command}`, "Type 'help' for available commands."])]);
    setTerminalInput("");
  }

  return <main className="jb-world" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onPointerDown={(e) => { pointerStart.current = { x: e.clientX, y: e.clientY }; }} onPointerUp={(e) => {
    if (!pointerStart.current || e.pointerType === "touch") return;
    const dx = e.clientX - pointerStart.current.x; const dy = e.clientY - pointerStart.current.y;
    if (Math.abs(dx) > 90 && Math.abs(dx) > Math.abs(dy)) goPanel(panel + (dx < 0 ? 1 : -1));
    pointerStart.current = null;
  }}>
    <div className="jb-device" aria-label="Interactive Android 4.1 Jelly Bean portfolio">
      <div className="jb-status-bar" onClick={() => setShade(true)} role="button" tabIndex={0} aria-label="Open notifications and quick settings">
        <div className="jb-status-left"><span className="jb-status-carrier">BCH</span><span className="jb-status-notification">◆</span></div>
        <div className="jb-status-right"><Image className="jb-status-icon" src="/jellybean/stat_sys_wifi_signal_4_fully.png" alt="Wi-Fi" width={13} height={13} /><Image className="jb-status-icon" src="/jellybean/stat_sys_signal_4_fully.png" alt="Mobile signal" width={13} height={13} /><Image className="jb-status-battery" src="/jellybean/stat_sys_battery_71.png" alt="Battery" width={17} height={13} /><span className="jb-status-time">{clock}</span></div>
      </div>

      <div className="jb-wallpaper" aria-hidden="true"><div className="jb-wallpaper-glow" /><div className="jb-wallpaper-orb" /><div className="jb-wallpaper-horizon" /></div>
      <div className="jb-home-viewport">
        <div className="jb-panels" style={{ transform: `translateX(-${panel * 100}%)` }}>
          {panels.map((index) => <section className="jb-panel" key={index} aria-label={`Home screen ${index + 1}`}>
            {index === 0 && <>
              <div className="jb-search-widget"><span className="jb-google-g">G</span><span>Google</span><span className="jb-search-mic">♩</span></div>
              <div className="jb-clock-widget"><span className="jb-clock-time">{clock}</span><span className="jb-clock-date">{dateLabel}</span></div>
              <div className="jb-gallery-widget"><div className="jb-widget-heading"><span>RECENT WORK</span><button onClick={() => open("gallery")}>OPEN GALLERY ↗</button></div><div className="jb-gallery-strip">{projects.slice(0, 5).map((project) => <button key={project.slug} onClick={() => openProject(project.slug)} aria-label={`Open ${project.name}`}><ProjectArtwork project={project} /><span>{project.name}</span></button>)}</div></div>
              <div className="jb-home-shortcut-row">{APPS.filter((a) => ["about", "gallery", "projects"].includes(a.id)).map((a) => <button key={a.id} onClick={() => open(a.id)}><AppIcon app={a} /><span>{a.name}</span></button>)}</div>
            </>}
            {index === 1 && <>
              <div className="jb-panel-title"><small>WORKSPACE</small><strong>Selected work</strong><span>Projects, experience & education</span></div>
              <div className="jb-project-widget">{projects.slice(0, 3).map((project, i) => <button key={project.slug} onClick={() => open("projects")}><span className="jb-project-index">0{i + 1}</span><span><b>{project.name}</b><small>{project.category}</small></span><i>›</i></button>)}</div>
              <div className="jb-icon-grid">{APPS.filter((a) => a.panel === 1).map((a) => <button key={a.id} onClick={() => open(a.id)}><AppIcon app={a} /><span>{a.name}</span></button>)}</div>
            </>}
            {index === 2 && <>
              <div className="jb-panel-title"><small>WORKSHOP</small><strong>Tools & systems</strong><span>Explore the engineering behind the work</span></div>
              <div className="jb-icon-grid jb-icon-grid-large">{APPS.filter((a) => a.panel === 2).map((a) => <button key={a.id} onClick={() => a.id === "github" ? window.open(site.owner.github, "_blank", "noopener,noreferrer") : open(a.id)}><AppIcon app={a} size="large" /><span>{a.name}</span></button>)}</div>
              <div className="jb-note-widget"><b>FROM ANDROID TO ENGINEERING</b><p>Custom ROMs sparked a curiosity about how systems work. That curiosity grew into Linux, programming and software engineering.</p></div>
            </>}
            {index === 3 && <>
              <div className="jb-panel-title"><small>PERSONAL</small><strong>Beyond the code</strong><span>A few things that make me, me</span></div>
              <div className="jb-personal-card"><div className="jb-chess-mark">♞</div><div><b>Chess</b><span>Peak Chess.com rating · 2200</span></div></div>
              <div className="jb-note-widget"><b>THE JOURNEY</b><p>Android tinkering → Custom ROMs → Linux → Programming → Engineering.</p></div>
              <div className="jb-icon-grid"><button onClick={() => open("about")}><AppIcon app={APPS[0]} /><span>My story</span></button><button onClick={() => open("skills")}><AppIcon app={APPS[5]} /><span>Interests</span></button></div>
            </>}
            {index === 4 && <>
              <div className="jb-panel-title"><small>CONNECT</small><strong>Let&apos;s talk</strong><span>Open a channel</span></div>
              <div className="jb-contact-widget"><div className="jb-contact-avatar">B</div><b>{site.owner.name}</b><span>{site.owner.role}</span><button onClick={() => open("contact")}>＋ NEW MESSAGE</button></div>
              <div className="jb-icon-grid"><button onClick={() => open("contact")}><AppIcon app={APPS[8]} /><span>Messaging</span></button><button onClick={() => window.location.href = `mailto:${site.owner.email}`}><span className="jb-mail-icon">✉</span><span>Email</span></button></div>
            </>}
          </section>)}
        </div>
      </div>

      <div className="jb-page-indicator" aria-label="Home screen pages">{panels.map((p) => <button key={p} className={panel === p ? "active" : ""} onClick={() => goPanel(p)} aria-label={`Go to home screen ${p + 1}`} />)}</div>
      <div className="jb-dock">{[APPS[0], APPS[2], APPS[8], APPS[7]].map((a) => <button key={a.id} onClick={() => a.id === "github" ? window.open(site.owner.github, "_blank", "noopener,noreferrer") : open(a.id)} aria-label={a.name}><AppIcon app={a} /></button>)}<button className="jb-app-drawer-button" onClick={() => setDrawer(true)} aria-label="Open app drawer"><span>•••</span></button></div>
      <div className="jb-navigation-bar"><button onClick={() => setActiveApp(null)} aria-label="Back"><Image src="/jellybean/nav-back.png" alt="" width={20} height={20} /></button><button onClick={() => { setActiveApp(null); goPanel(0); }} aria-label="Home"><Image src="/jellybean/nav-home.png" alt="" width={20} height={20} /></button><button onClick={() => { setActiveApp(null); setDrawer(true); }} aria-label="Recent apps"><Image src="/jellybean/nav-recent.png" alt="" width={20} height={20} /></button></div>

      {drawer && <div className="jb-overlay jb-drawer-overlay"><div className="jb-drawer"><div className="jb-drawer-tabs"><button className={drawerTab === "apps" ? "selected" : ""} onClick={() => setDrawerTab("apps")}>APPS</button><button className={drawerTab === "widgets" ? "selected" : ""} onClick={() => setDrawerTab("widgets")}>WIDGETS</button><button className="jb-drawer-close" onClick={() => setDrawer(false)}>×</button></div>{drawerTab === "apps" ? <div className="jb-drawer-grid">{APPS.map((a) => <button key={a.id} onClick={() => a.id === "github" ? window.open(site.owner.github, "_blank", "noopener,noreferrer") : open(a.id)}><AppIcon app={a} size="large" /><span>{a.name}</span></button>)}</div> : <div className="jb-widget-picker"><button onClick={() => { setDrawer(false); goPanel(0); }}><span className="jb-widget-preview-clock">{clock}</span><b>Digital clock</b><small>Home screen widget</small></button><button onClick={() => open("gallery")}><span className="jb-widget-preview-gallery">▧ ▧ ▧</span><b>Recent projects</b><small>Photo gallery widget</small></button><button onClick={() => open("about")}><span className="jb-widget-preview-profile">B</span><b>Profile</b><small>About widget</small></button></div>}<div className="jb-drawer-foot">B C H · JELLY BEAN EDITION</div></div></div>}

      {shade && <div className="jb-overlay jb-shade-overlay" onClick={() => setShade(false)}><div className="jb-notification-shade" onClick={(e) => e.stopPropagation()}><div className="jb-shade-head"><div><b>{clock}</b><span>{dateLabel}</span></div><button onClick={() => setShade(false)}>×</button></div><div className="jb-notification-empty"><span>✓</span><b>No new notifications</b><small>You&apos;re all caught up</small></div><div className="jb-shade-footer"><span>BCH</span><button className="jb-shade-settings" onClick={() => setShade(false)}>SETTINGS</button></div></div></div>}

      {app && <div className="jb-overlay jb-app-overlay"><div className="jb-app-window"><header className="jb-app-actionbar"><button onClick={() => currentProject ? setSelectedProject(null) : setActiveApp(null)} aria-label="Back">‹</button><div><b>{currentProject?.name ?? app.name}</b><small>{site.owner.name}</small></div><button onClick={() => { setSelectedProject(null); setActiveApp(null); }} aria-label="Close app">×</button></header><div className="jb-app-content">
        {activeApp === "about" && <><div className="jb-about-hero"><div className="jb-about-avatar">B</div><h2>{site.owner.name}</h2><p>{site.owner.role}</p></div><h3>MY STORY</h3><p>Android 4.1 was my first Android experience. Exploring it led me to custom ROMs, then Linux, programming and eventually engineering. This portfolio is built as a tribute to the interface that started that curiosity.</p><p>{site.owner.intro}</p><div className="jb-info-row"><span>LOCATION</span><b>{site.owner.location}</b></div><div className="jb-info-row"><span>GITHUB</span><a href={site.owner.github} target="_blank" rel="noreferrer">Open profile ↗</a></div></>}
        {activeApp === "gallery" && <><h3>RECENT PROJECTS</h3><div className="jb-app-gallery">{projects.map((p) => <button key={p.slug} onClick={() => openProject(p.slug)}><ProjectArtwork project={p} /><b>{p.name}</b><small>{p.summary}</small></button>)}</div></>}
        {activeApp === "projects" && (currentProject ? <><button className="jb-back-link" onClick={() => setSelectedProject(null)}>‹ ALL PROJECTS</button><div className="jb-project-detail-art"><ProjectArtwork project={currentProject} /></div><h3>{currentProject.category}</h3><h2 className="jb-project-detail-title">{currentProject.name}</h2><p>{currentProject.description || currentProject.summary}</p><div className="jb-chip-row">{currentProject.stack.map((s) => <span key={s}>{s}</span>)}</div><div className="jb-info-row"><span>PERIOD</span><b>{currentProject.period || "—"}</b></div>{currentProject.repo && <a className="jb-project-action" href={currentProject.repo} target="_blank" rel="noreferrer">SOURCE REPOSITORY ↗</a>}{currentProject.liveUrl && <a className="jb-project-action" href={currentProject.liveUrl} target="_blank" rel="noreferrer">LIVE PROJECT ↗</a>}</> : <><h3>SELECTED PROJECTS</h3>{projects.map((p) => <button className="jb-list-card jb-project-list-button" key={p.slug} onClick={() => setSelectedProject(p.slug)}><b>{p.name}</b><small>{p.category} · {p.period}</small><p>{p.summary}</p><span>VIEW DETAILS ›</span></button>)}</>)}
        {activeApp === "experience" && <><h3>EXPERIENCE</h3>{site.experience.map((e, i) => <article className="jb-list-card" key={`${e.title}-${i}`}><b>{e.title}</b><small>{e.organization} · {e.period}</small><p>{e.description}</p></article>)}</>}
        {activeApp === "education" && <><h3>EDUCATION</h3>{site.education.map((e, i) => <article className="jb-list-card" key={`${e.institution}-${i}`}><b>{e.qualification}</b><small>{e.fieldOfStudy} · {e.institution}</small><p>{e.period} · {e.description}</p></article>)}</>}
        {activeApp === "skills" && <><h3>SKILLS & TOOLS</h3>{site.skillGroups.map((g) => <section className="jb-skill-section" key={g.name}><b>{g.name}</b><div className="jb-chip-row">{g.skills.map((s) => <span key={s}>{s}</span>)}</div></section>)}</>}
        {activeApp === "terminal" && <div className="jb-terminal"><div className="jb-terminal-top">BCH SHELL <span>● ● ●</span></div><div className="jb-terminal-output">{terminalLines.map((line, i) => <p key={`${i}-${line}`}>{line}</p>)}</div><form onSubmit={runCommand}><label>guest@bch:~$</label><input value={terminalInput} onChange={(e) => setTerminalInput(e.target.value)} autoFocus aria-label="Terminal command" autoComplete="off" spellCheck={false} /></form></div>}
        {activeApp === "contact" && <><h3>NEW MESSAGE</h3><p className="jb-contact-intro">Send a note. Messages are delivered by email; there is no instant chat or automated reply.</p><ContactForm /></>}
        {activeApp === "github" && <p>Open GitHub to explore public repositories.</p>}
      </div></div></div>}
    </div>
    <div className="jb-outside-hint"><span>ANDROID 4.1 · JELLY BEAN</span><span>SWIPE TO EXPLORE · TAP THE DOTS FOR APPS</span></div>
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
