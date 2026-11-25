"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { SiteContent } from "@/lib/content";
import ProjectArtwork from "@/components/ProjectArtwork";
import JellyBeanMessaging from "@/components/JellyBeanMessaging";
import WaterWallpaper from "@/components/WaterWallpaper";

type AppId = string;
type AppInfo = { id: string; name: string; icon: string; color: string; panel: number; url?: string; iconUrl?: string; folder?: boolean };

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
  { id: "settings", name: "Settings", icon: "settings", color: "#6a9b63", panel: 2 },
  { id: "chess", name: "Chess", icon: "folder", color: "#b59a70", panel: 3, folder: true },
  { id: "achievements", name: "Achievements", icon: "achievements", color: "#d6a34d", panel: 3 },
  { id: "journey", name: "Journey", icon: "journey", color: "#4c9bd6", panel: 3 },
  { id: "email", name: "Email", icon: "email", color: "#668fa9", panel: 4 },
  { id: "contactDetails", name: "Contact", icon: "person", color: "#4c9bd6", panel: 4 }
];

/* eslint-disable @next/next/no-img-element -- custom admin-provided icon URLs are intentionally unoptimized. */
function AppIcon({ app, size = "normal" }: { app: AppInfo; size?: "normal" | "large" }) {
  const assets: Record<string, string> = {
    person: "aosp-4.1.2/contacts.png", gallery: "aosp-4.1.2/gallery.png",
    message: "aosp-4.1.2/messaging.png", settings: "aosp-4.1.2/settings.png", github: "brands/github.svg", terminal: "termux.png"
  };
  const asset = app.iconUrl || assets[app.icon];
  const glyphs: Record<string, string> = {
    email: "M5 11h38v26H5z M5 13l19 15 19-15",
    briefcase: "M8 16h32v24H8z M17 16v-5h14v5 M8 23h32 M20 23v4h8v-4",
    school: "M4 17 24 7l20 10-20 10z M12 22v12c7 5 17 5 24 0V22 M42 20v12",
    skills: "M19 7h10l2 5 5 2 5-2 5 9-4 4 1 5-5 8-6-1-4 3-9-4-1-6-5-3 2-10 6-1z M24 18a7 7 0 1 0 0 14 7 7 0 0 0 0-14",
    terminal: "M7 11l10 9-10 9 M22 31h17",
    github: "M24 5a19 19 0 0 0-6 37c1 0 2-1 2-2v-4c-7 2-9-3-9-3-1-2-2-3-2-3-2-1 0-1 0-1 2 0 3 2 3 2 2 3 5 2 7 1 0-2 1-3 2-4-6-1-12-3-12-13 0-3 1-5 3-7 0-1-1-4 0-7 0 0 3-1 8 3a25 25 0 0 1 14 0c5-4 8-3 8-3 1 3 0 6 0 7 2 2 3 4 3 7 0 10-6 12-12 13 1 1 2 3 2 6v6c0 1 1 2 2 2A19 19 0 0 0 24 5z",
    chess: "M24 5c-5 0-8 4-8 8 0 3 2 5 4 6l-2 5h12l-2-5c3-1 4-3 4-6 0-4-3-8-8-8z M16 26h16l3 5H13z M13 34h22l3 7H10z",
    achievements: "M15 6h18v8c0 8-4 13-9 13s-9-5-9-13z M15 11H7v4c0 6 4 9 10 9 M33 11h8v4c0 6-4 9-10 9 M24 27v8 M16 41h16 M19 35h10",
    journey: "M24 43s-15-14-15-25a15 15 0 1 1 30 0c0 11-15 25-15 25z M24 23a5 5 0 1 0 0-10 5 5 0 0 0 0 10z",
    projects: "M8 8h32v7H8z M8 20h32v7H8z M8 32h32v7H8z",
    folder: "M4 13V9a3 3 0 0 1 3-3h11l4 4h9a3 3 0 0 1 3 3v19a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z M4 15h36l-4 19H8z"
  };
  return <span className={`jb-app-icon jb-app-icon-${size} jb-icon-${app.icon}`} style={{ "--app-color": app.color } as CSSProperties}>
    {app.iconUrl ? <img src={app.iconUrl} alt="" width={size === "large" ? 56 : 48} height={size === "large" ? 56 : 48} draggable={false} /> : asset ? <Image src={asset.startsWith("http") || asset.startsWith("/") ? asset : `/jellybean/icons/${asset}`} alt="" width={size === "large" ? 56 : 48} height={size === "large" ? 56 : 48} unoptimized draggable={false} /> : <svg viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d={glyphs[app.icon] ?? "M8 8h32v32H8z"} /></svg>}
  </span>;
}

function SystemStatusIcon({ kind }: { kind: "wifi" | "signal" | "battery" }) {
  return <svg className={`jb-system-status-icon jb-system-status-${kind}`} viewBox="0 0 24 18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    {kind === "wifi" ? <><path d="M2 5.5a15 15 0 0 1 20 0"/><path d="M5.5 9a10 10 0 0 1 13 0"/><path d="M9 12.5a5 5 0 0 1 6 0"/><circle cx="12" cy="16" r="1" fill="currentColor" stroke="none"/></> : kind === "signal" ? <><path d="M3 16V13 M8 16V10 M13 16V7 M18 16V3" strokeWidth="2.2"/></> : <><rect x="2" y="3" width="18" height="12" rx="2"/><path d="M22 7v4"/><path d="M5 6h10v6H5z" fill="currentColor" stroke="none"/></>}
  </svg>;
}

function SystemNavigationIcon({ kind }: { kind: "back" | "home" | "recent" }) {
  return <svg className={`jb-system-nav-icon jb-system-nav-${kind}`} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" strokeLinejoin="miter">
    {kind === "back" ? <path d="M19 12H5m0 0 7-7m-7 7 7 7" /> : kind === "home" ? <circle cx="12" cy="12" r="7.2" /> : <><path d="M7 5h12v14H7z" /><path d="M4 8v13h12" /></>}
  </svg>;
}

export default function JellyBeanExperience({ site }: { site: SiteContent }) {
  const router = useRouter();
  const [panel, setPanel] = useState(0);
  const [drawer, setDrawer] = useState(false);
  const [drawerTab, setDrawerTab] = useState<"apps" | "widgets">("apps");
  const [drawerPage, setDrawerPage] = useState(0);
  const drawerPointerStart = useRef<{ x: number; y: number } | null>(null);
  const [shade, setShade] = useState(false);
  const [recent, setRecent] = useState(false);
  const [recentApps, setRecentApps] = useState<string[]>([]);
  const [launcherEditMode, setLauncherEditMode] = useState(false);
  const [activeApp, setActiveApp] = useState<AppId | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [settingsPage, setSettingsPage] = useState<"main" | "about">("main");
  const [buildTaps, setBuildTaps] = useState(0);
  const [terminalInput, setTerminalInput] = useState("");
  const [terminalLines, setTerminalLines] = useState<string[]>(["Welcome to Termux!", "This is a read-only portfolio environment. Type help to get started."]);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const pointerStart = useRef<{ x: number; y: number; started: number; appId?: string; panel: number; fromDrawer?: boolean } | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressIconClick = useRef(false);
  const [homePlacements, setHomePlacements] = useState<Record<string, { panel: number; slot: number }>>({});
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
    const builtIns = APPS.filter((item) => !hidden.includes(item.id));
    const custom = (site.launcher.customApps ?? []).filter(item => item && item.id && item.name && item.url).map(item => ({ id: item.id, name: item.name, icon: "custom", color: "#5d8297", panel: 4, url: item.url, iconUrl: item.iconUrl }));
    return [...builtIns, ...custom].sort((a,b) => (order.indexOf(a.id) < 0 ? 999 : order.indexOf(a.id))-(order.indexOf(b.id) < 0 ? 999 : order.indexOf(b.id))).map(item => ({ ...item, name: site.launcher.appLabels[item.id] || item.name }));
  }, [site.launcher.hiddenApps, site.launcher.appOrder, site.launcher.appLabels, site.launcher.customApps]);
  const app = visibleApps.find((item) => item.id === activeApp) ?? APPS.find((item) => item.id === activeApp) ?? null;
  const panels = useMemo(() => [0, 1, 2, 3, 4], []);
  const homeAppsByPanel = useMemo(() => panels.map(index => visibleApps
    .filter(item => (homePlacements[item.id]?.panel ?? item.panel) === index)
    .sort((a, b) => (homePlacements[a.id]?.slot ?? visibleApps.filter(item => item.panel === index).indexOf(a)) - (homePlacements[b.id]?.slot ?? visibleApps.filter(item => item.panel === index).indexOf(b)))), [panels, visibleApps, homePlacements]);
  const drawerPageSize = Math.max(12, site.launcher.appColumns * 4);
  const drawerPages = useMemo(() => Array.from({ length: Math.max(1, Math.ceil(visibleApps.length / drawerPageSize)) }, (_, page) => visibleApps.slice(page * drawerPageSize, (page + 1) * drawerPageSize)), [visibleApps, drawerPageSize]);
  useEffect(() => { const frame = window.requestAnimationFrame(() => { try { const saved = localStorage.getItem("jb-home-icon-layout"); if (saved) setHomePlacements(JSON.parse(saved) as Record<string, { panel: number; slot: number }>); } catch { /* Ignore invalid local launcher layouts. */ } }); return () => window.cancelAnimationFrame(frame); }, []);
  useEffect(() => { if (activeApp === "terminal") { window.scrollTo(0, 0); terminalInputRef.current?.focus({ preventScroll: true }); if (terminalOutputRef.current) terminalOutputRef.current.scrollTop = terminalOutputRef.current.scrollHeight; } }, [activeApp, terminalLines]);

  const goPanel = useCallback((next: number) => setPanel(Math.max(0, Math.min(4, next))), []);
  const closeOverlays = useCallback(() => { setActiveApp(null); setDrawer(false); setShade(false); setRecent(false); }, []);
  const navBack = useCallback(() => {
    if (launcherEditMode) setLauncherEditMode(false);
    else if (shade) setShade(false);
    else if (drawer) setDrawer(false);
    else if (recent) setRecent(false);
    else if (activeApp && selectedProject) setSelectedProject(null);
    else if (activeApp) setActiveApp(null);
    else goPanel(0);
  }, [launcherEditMode, shade, drawer, recent, activeApp, selectedProject, goPanel]);
  const navHome = useCallback(() => { closeOverlays(); setSelectedProject(null); goPanel(0); }, [closeOverlays, goPanel]);
  const navRecent = useCallback(() => { setActiveApp(null); setDrawer(false); setShade(false); setRecent(true); }, []);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") { if (launcherEditMode) setLauncherEditMode(false); else closeOverlays(); }
      if (!activeApp && !drawer && !shade && event.key === "ArrowLeft") goPanel(panel - 1);
      if (!activeApp && !drawer && !shade && event.key === "ArrowRight") goPanel(panel + 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeApp, drawer, shade, panel, closeOverlays, goPanel, launcherEditMode]);

  function open(appId: string) { const external = visibleApps.find(item => item.id === appId && item.url); if (external?.url) { window.open(external.url, "_blank", "noopener,noreferrer"); return; } setLauncherEditMode(false); setDrawer(false); setShade(false); setRecent(false); setSelectedProject(null); setRecentApps(items => [appId, ...items.filter(item => item !== appId)].slice(0, 5)); if (appId === "settings") setSettingsPage("main"); setActiveApp(appId); }
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

  return <main className="jb-world">
    <div className={`jb-device${site.launcher.showLabels ? "" : " jb-hide-labels"}`} aria-label="Micromax Canvas 2 A110 launcher" onContextMenu={(event) => event.preventDefault()} onDragStart={(event) => event.preventDefault()} onPointerDown={(event) => {
      const target = event.target as HTMLElement;
      if (target.closest(".jb-app-overlay,.jb-shade-overlay,.jb-recent-overlay")) return;
      const icon = target.closest<HTMLElement>("[data-home-app],[data-drawer-app]");
      if (target.closest(".jb-drawer-overlay") && !icon) return;
      if (target.closest("button,input,a") && !icon) return;
      pointerStart.current = { x: event.clientX, y: event.clientY, started: Date.now(), appId: icon?.dataset.homeApp ?? icon?.dataset.drawerApp, panel: Number(icon?.dataset.homePanel ?? panel), fromDrawer: Boolean(icon?.dataset.drawerApp) };
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
      if (icon) longPressTimer.current = setTimeout(() => { setLauncherEditMode(true); if (navigator.vibrate) navigator.vibrate(35); }, 450);
    }} onPointerCancel={() => { pointerStart.current = null; if (longPressTimer.current) clearTimeout(longPressTimer.current); longPressTimer.current = null; }} onPointerUp={(event) => {
      const start = pointerStart.current; pointerStart.current = null;
      if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
      if (!start) return;
      const dx = event.clientX - start.x; const dy = event.clientY - start.y;
      const moved = Math.hypot(dx, dy);
      if (start.appId && Date.now() - start.started >= 450) {
        setLauncherEditMode(true);
        const device = event.currentTarget.getBoundingClientRect();
        if (start.fromDrawer) {
          const destinationPanel = Math.max(0, Math.min(4, start.panel));
          const existing = homeAppsByPanel[destinationPanel].map(item => homePlacements[item.id]?.slot ?? homeAppsByPanel[destinationPanel].indexOf(item));
          const firstFree = Array.from({length:16},(_,index)=>index).find(index=>!existing.includes(index)) ?? existing.length;
          const row = Math.max(0, Math.min(3, Math.floor((event.clientY - device.top - 70) / 94)));
          const column = Math.max(0, Math.min(3, Math.floor((event.clientX - device.left) / device.width * 4)));
          const destinationSlot = moved > 18 ? row * 4 + column : firstFree;
          setHomePlacements(current => ({...current,[start.appId!]:{panel:destinationPanel,slot:destinationSlot}}));
          try { localStorage.setItem("jb-home-icon-layout", JSON.stringify({...homePlacements,[start.appId]:{panel:destinationPanel,slot:destinationSlot}})); } catch { /* Keep the in-memory layout. */ }
          setPanel(destinationPanel); setDrawer(false); suppressIconClick.current = true;
          window.setTimeout(() => { suppressIconClick.current = false; }, 450);
          return;
        }
        if (moved <= 18) { suppressIconClick.current = true; return; }
        if (event.clientY < device.top + 68) {
          const next = {...homePlacements,[start.appId]:{panel:-1,slot:-1}};
          setHomePlacements(next); try { localStorage.setItem("jb-home-icon-layout", JSON.stringify(next)); } catch { /* Keep the in-memory layout. */ }
          suppressIconClick.current = true; window.setTimeout(() => { suppressIconClick.current = false; }, 450); return;
        }
        const destinationPanel = Math.max(0, Math.min(4, start.panel + (dx > 100 ? -1 : dx < -100 ? 1 : 0)));
        const row = Math.max(0, Math.min(3, Math.floor((event.clientY - device.top - 70) / 94)));
        const column = Math.max(0, Math.min(2, Math.floor((event.clientX - device.left) / device.width * 4)));
        const destinationSlot = row * 4 + column;
        const sourceSlot = homePlacements[start.appId]?.slot ?? visibleApps.filter(item => item.panel === start.panel).findIndex(item => item.id === start.appId);
        const next = { ...homePlacements, [start.appId]: { panel: destinationPanel, slot: destinationSlot } };
        const displaced = visibleApps.find(item => item.id !== start.appId && (homePlacements[item.id]?.panel ?? item.panel) === destinationPanel && (homePlacements[item.id]?.slot ?? visibleApps.filter(candidate => candidate.panel === destinationPanel).findIndex(candidate => candidate.id === item.id)) === destinationSlot);
        if (displaced) next[displaced.id] = { panel: start.panel, slot: Math.max(0, sourceSlot) };
        setHomePlacements(next);
        try { localStorage.setItem("jb-home-icon-layout", JSON.stringify(next)); } catch { /* Layout still works for this session. */ }
        setPanel(destinationPanel);
        suppressIconClick.current = true;
        window.setTimeout(() => { suppressIconClick.current = false; }, 450);
        return;
      }
      if (drawer && dy > 70 && dy > Math.abs(dx)) { setDrawer(false); return; }
      if (shade && dy < -70 && Math.abs(dy) > Math.abs(dx)) { setShade(false); return; }
      if (activeApp || drawer || recent || shade || launcherEditMode) return;
      const target = event.target as HTMLElement;
      if (!target.closest(".jb-home-viewport")) return;
      if (dy > 65 && dy > Math.abs(dx) * 1.1) setShade(true);
      else if (Math.abs(dx) > 65 && Math.abs(dx) > Math.abs(dy) * 1.15) goPanel(panel + (dx < 0 ? 1 : -1));
    }}>

      {launcherEditMode && <div className="jb-edit-toolbar"><span>Rearrange · drag from drawer to add · drag to top to remove</span><button onClick={() => setLauncherEditMode(false)}>Done</button></div>}
      <div className="jb-status-bar" onClick={() => setShade(true)} role="button" tabIndex={0} aria-label="Open notifications and quick settings">
        <div className="jb-status-left" aria-hidden="true" />
        <div className="jb-status-right"><SystemStatusIcon kind="wifi" /><SystemStatusIcon kind="signal" /><SystemStatusIcon kind="battery" /><span className="jb-status-time">{clock}</span></div>
      </div>

      <div className={`jb-wallpaper${site.launcher.wallpaper === "android-default" ? " jb-wallpaper-static" : site.launcher.wallpaper === "custom" ? " jb-wallpaper-custom" : ""}`} style={site.launcher.wallpaper === "custom" && site.launcher.wallpaperImageUrl ? { backgroundImage: `url("${site.launcher.wallpaperImageUrl}")` } : undefined}>{site.launcher.wallpaper === "water" ? <WaterWallpaper /> : null}</div>
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
              {site.launcher.showGallery && <div className="jb-gallery-widget"><div className="jb-gallery-strip">{site.gallery.slice(0, 5).map((media) => <button key={media.id} onClick={() => open("gallery")} aria-label={`Open ${media.source_caption || media.caption || media.source_title || media.original_filename}`}><span className="jb-gallery-thumb">{media.content_type.startsWith("video/") ? <span className="jb-video-thumb">▶</span> : <Image src={media.url} alt="" width={120} height={72} unoptimized />}</span><span>{media.source_caption || media.caption || media.source_title || media.original_filename}</span></button>)}</div></div>}
              <div className="jb-home-shortcut-row">{homeAppsByPanel[0].map((a, slot) => <button key={a.id} data-home-app={a.id} data-home-panel="0" style={{ gridColumn: (homePlacements[a.id]?.slot ?? slot) % 4 + 1, gridRow: Math.floor((homePlacements[a.id]?.slot ?? slot) / 4) + 1 }} onClick={() => { if (suppressIconClick.current) { suppressIconClick.current = false; return; } open(a.id); }}><AppIcon app={a} /><span>{a.name}</span></button>)}</div>
            </>}
            {index === 1 && <>
              <div className="jb-icon-grid">{homeAppsByPanel[1].map((a, slot) => <button key={a.id} data-home-app={a.id} data-home-panel="1" style={{ gridColumn: (homePlacements[a.id]?.slot ?? slot) % 4 + 1, gridRow: Math.floor((homePlacements[a.id]?.slot ?? slot) / 4) + 1 }} onClick={() => { if (suppressIconClick.current) { suppressIconClick.current = false; return; } open(a.id); }}><AppIcon app={a} /><span>{a.name}</span></button>)}</div>
            </>}
            {index === 2 && <>
              <div className="jb-icon-grid jb-icon-grid-large">{homeAppsByPanel[2].map((a, slot) => <button key={a.id} data-home-app={a.id} data-home-panel="2" style={{ gridColumn: (homePlacements[a.id]?.slot ?? slot) % 4 + 1, gridRow: Math.floor((homePlacements[a.id]?.slot ?? slot) / 4) + 1 }} onClick={() => { if (suppressIconClick.current) { suppressIconClick.current = false; return; } if (a.id === "github") window.open(site.owner.github, "_blank", "noopener,noreferrer"); else open(a.id); }}><AppIcon app={a} size="large" /><span>{a.name}</span></button>)}</div>
            </>}
            {index === 3 && <div className="jb-icon-grid">{homeAppsByPanel[3].map((a, slot) => <button key={a.id} data-home-app={a.id} data-home-panel="3" style={{ gridColumn: (homePlacements[a.id]?.slot ?? slot) % 4 + 1, gridRow: Math.floor((homePlacements[a.id]?.slot ?? slot) / 4) + 1 }} onClick={() => { if (suppressIconClick.current) { suppressIconClick.current = false; return; } open(a.id); }}><AppIcon app={a} /><span>{a.name}</span></button>)}</div>}
            {index === 4 && <div className="jb-icon-grid">{homeAppsByPanel[4].map((a, slot) => <button key={a.id} data-home-app={a.id} data-home-panel="4" style={{ gridColumn: (homePlacements[a.id]?.slot ?? slot) % 4 + 1, gridRow: Math.floor((homePlacements[a.id]?.slot ?? slot) / 4) + 1 }} onClick={() => { if (suppressIconClick.current) { suppressIconClick.current = false; return; } open(a.id); }}><AppIcon app={a} /><span>{a.name}</span></button>)}</div>}
          </section>)}
        </div>
      </div>

      <div className="jb-page-indicator" aria-label="Home screen pages">{panels.map((p) => <button key={p} className={panel === p ? "active" : ""} onClick={() => goPanel(p)} aria-label={`Go to home screen ${p + 1}`} />)}</div>
      <div className="jb-dock">
        <button onClick={() => open("contactDetails")} aria-label="Phone"><Image src="/jellybean/icons/aosp-4.1.2/phone.png" alt="" width={48} height={48} unoptimized /></button>
        <button onClick={() => open("about")} aria-label="People"><Image src="/jellybean/icons/aosp-4.1.2/contacts.png" alt="" width={48} height={48} unoptimized /></button>
        <button className="jb-app-drawer-button" onClick={() => { setDrawerPage(0); setDrawer(value => !value); }} aria-label={drawer ? "Close app drawer" : "Open app drawer"}><Image src="/jellybean/icons/aosp-4.1.2/all-apps.png" alt="" width={48} height={48} unoptimized /></button>
        <button onClick={() => open("contact")} aria-label="Messaging"><Image src="/jellybean/icons/aosp-4.1.2/messaging.png" alt="" width={48} height={48} unoptimized /></button>
        <button onClick={() => window.open(site.owner.github, "_blank", "noopener,noreferrer")} aria-label="Browser"><Image src="/jellybean/icons/aosp-4.1.2/browser.png" alt="" width={48} height={48} unoptimized /></button>
      </div>
      <div className="jb-navigation-bar"><div className="jb-tablet-nav"><button onClick={navBack} aria-label="Back"><SystemNavigationIcon kind="back" /></button><button onClick={navHome} aria-label="Home"><SystemNavigationIcon kind="home" /></button><button onClick={navRecent} aria-label="Recent apps"><SystemNavigationIcon kind="recent" /></button></div><button className="jb-tablet-status" onClick={() => setShade(true)} aria-label="Open notifications"><SystemStatusIcon kind="wifi" /><SystemStatusIcon kind="battery" /><span>{clock}</span><span className="jb-tablet-notification-mark">●</span></button></div>

      {drawer && <div className="jb-overlay jb-drawer-overlay"><div className="jb-drawer" onPointerDown={event => { drawerPointerStart.current = { x: event.clientX, y: event.clientY }; }} onPointerUp={event => { const start = drawerPointerStart.current; drawerPointerStart.current = null; if (!start) return; const dx = event.clientX - start.x; const dy = event.clientY - start.y; if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)) setDrawerPage(page => Math.max(0, Math.min(drawerPages.length - 1, page + (dx < 0 ? 1 : -1)))); else if (dy > 75 && dy > Math.abs(dx)) setDrawer(false); }}><div className="jb-drawer-tabs"><button className={drawerTab === "apps" ? "selected" : ""} onClick={() => { setDrawerTab("apps"); setDrawerPage(0); }}>APPS</button><button className={drawerTab === "widgets" ? "selected" : ""} onClick={() => setDrawerTab("widgets")}>WIDGETS</button><button className="jb-drawer-close" onClick={() => setDrawer(false)} aria-label="Close app drawer">×</button></div>{drawerTab === "apps" ? <><div className="jb-drawer-pages" aria-label={`App drawer page ${drawerPage + 1} of ${drawerPages.length}`}><div className="jb-drawer-page-track" style={{ transform: `translateX(-${drawerPage * 100}%)` }}>{drawerPages.map((pageApps, pageIndex) => <div className="jb-drawer-page" key={pageIndex} style={{ gridTemplateColumns: `repeat(${site.launcher.appColumns}, minmax(0, 1fr))` }}>{pageApps.map((a) => <button key={a.id} data-drawer-app={a.id} onClick={() => a.url ? window.open(a.url, "_blank", "noopener,noreferrer") : a.id === "github" ? window.open(site.owner.github, "_blank", "noopener,noreferrer") : open(a.id)}><AppIcon app={a} size="large" /><span>{a.name}</span></button>)}</div>)}</div></div>{drawerPages.length > 1 && <div className="jb-drawer-page-indicators">{drawerPages.map((_, index) => <button key={index} className={drawerPage === index ? "active" : ""} onClick={() => setDrawerPage(index)} aria-label={`App drawer page ${index + 1}`} />)}</div>}</> : <div className="jb-widget-picker">
        {site.launcher.showClock&&<button onClick={()=>{setDrawer(false);goPanel(0);}}><span className="jb-widget-preview-clock"><span className="jb-analog-clock"><Image src="/jellybean/clock/dial.png" alt="" fill sizes="90px" unoptimized/><Image className="jb-clock-hand" src="/jellybean/clock/hour.png" alt="" fill sizes="90px" unoptimized/><Image className="jb-clock-hand" src="/jellybean/clock/minute.png" alt="" fill sizes="90px" unoptimized/></span></span><b>Analog clock</b><small>2 × 2</small></button>}
        {site.launcher.showSearch&&<button onClick={()=>{setDrawer(false);goPanel(0);}}><span className="jb-widget-preview-search"><Image src="/jellybean/search-widget.png" alt="" width={220} height={20} unoptimized/></span><b>Google Search</b><small>4 × 1</small></button>}
        {site.launcher.showGallery&&<button onClick={()=>{setDrawer(false);goPanel(0);}}><span className="jb-widget-preview-gallery">{projects.slice(0,3).map(project=><ProjectArtwork key={project.slug} project={project}/>)}</span><b>Gallery</b><small>4 × 2</small></button>}
      </div>}</div></div>}

      {shade && <div className="jb-overlay jb-shade-overlay" onClick={() => setShade(false)}><div className="jb-notification-shade" onClick={(e) => e.stopPropagation()} onTouchStart={(e) => { const t=e.touches[0]; touchStart.current={x:t.clientX,y:t.clientY}; }} onTouchEnd={(e) => { if (!touchStart.current) return; const t=e.changedTouches[0]; if (touchStart.current.y-t.clientY>65) setShade(false); touchStart.current=null; }}><div className="jb-shade-head"><div><b>{clock}</b><span>{dateLabel}</span></div><div className="jb-shade-controls"><Image className="jb-shade-rotation" src="/jellybean/ic_notify_rotation_off_normal.png" alt="Rotation lock" width={36} height={36} unoptimized /><Image src="/jellybean/ic_notify_quicksettings_normal.png" alt="Settings" width={36} height={36} unoptimized /><Image className="jb-shade-clear" src="/jellybean/ic_notify_clear_normal.png" alt="Dismiss all notifications" width={36} height={36} unoptimized /></div></div><div className="jb-notification-empty"><span className="jb-notification-symbol"><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 34h28l-4-5V18a10 10 0 0 0-20 0v11z" fill="none" stroke="currentColor" strokeWidth="2.4"/><path d="M19 38q5 6 10 0" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/></svg></span><b>No notifications</b></div></div></div>}

      {recent && <div className="jb-overlay jb-recent-overlay"><div className="jb-recent-stack">{recentApps.length ? recentApps.map(id=>{const item=visibleApps.find(candidate=>candidate.id===id) ?? APPS.find(candidate=>candidate.id===id);return item?<button key={id} onClick={()=>open(id)}><AppIcon app={item} size="large"/><b>{item.name}</b></button>:null;}) : <p>No recent apps</p>}<button onClick={navHome}><span className="jb-recent-home">○</span><b>Home</b></button></div></div>}
      {app && <div className="jb-overlay jb-app-overlay"><div className="jb-app-window"><header className="jb-app-actionbar"><button onClick={navBack} aria-label="Back">‹</button><div><b>{currentProject?.name ?? app.name}</b></div></header><div className="jb-app-content">
        {activeApp === "about" && <><div className="jb-about-hero"><div className="jb-about-avatar">B</div><h2>{site.owner.name}</h2><p>{site.owner.role}</p></div><h3>MY STORY</h3><p>Android 4.1 was my first Android experience. Exploring it led me to custom ROMs, then Linux, programming and eventually engineering. This portfolio is built as a tribute to the interface that started that curiosity.</p><p>{site.owner.intro}</p><div className="jb-info-row"><span>LOCATION</span><b>{site.owner.location}</b></div><div className="jb-info-row"><span>GITHUB</span><a href={site.owner.github} target="_blank" rel="noreferrer">Open profile ↗</a></div></>}
        {activeApp === "gallery" && <><h3>GALLERY</h3>{site.gallery.length ? <div className="jb-media-gallery">{site.gallery.map((media) => <article className="jb-media-card" key={media.id}>{media.content_type.startsWith("video/") ? <video src={media.url} controls playsInline preload="metadata" /> : <Image src={media.url} alt={media.alt_text || media.source_caption || media.caption || media.source_title || media.original_filename} width={640} height={420} unoptimized /> }<div><b>{media.source_caption || media.caption || media.alt_text || media.source_title || media.original_filename}</b>{media.source_title && <small>{media.source_title}</small>}{media.uploaded_at && <small>{new Date(media.uploaded_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</small>}</div></article>)}</div> : <div className="jb-gallery-empty"><span>▧</span><b>No published photos or videos</b><small>Media uploaded and published from the portfolio editor will appear here with its original caption.</small></div>}</>}
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
        {activeApp === "settings" && <div className="jb-settings-screen">{settingsPage === "main" ? <><h3>Settings</h3>{["Wireless & networks","Device","Personal","System"].map((group)=><section key={group}><b>{group}</b>{(group === "System" ? ["Date & time","Accessibility","About phone"] : group === "Device" ? ["Sound","Display","Storage","Battery","Apps"] : group === "Personal" ? ["Location access","Security","Language & input"] : ["Wi-Fi","Bluetooth","Data usage"]).map(item=><button key={item} onClick={()=>item === "About phone" && setSettingsPage("about")}><span>{item}</span><i>›</i></button>)}</section>)}</> : <><button className="jb-settings-back" onClick={()=>setSettingsPage("main")}>‹ Settings</button><h3>About phone</h3>{["Status","Legal information","Model number","Android version","Baseband version","Kernel version"].map(item=><div className="jb-settings-row" key={item}><span>{item}</span><small>{item === "Android version" ? "4.1.1" : item === "Model number" ? "Micromax A110" : item === "Kernel version" ? "3.0.13 · Android 4.1" : ""}</small></div>)}<button className="jb-build-number" onClick={()=>{const next=buildTaps+1;setBuildTaps(next);if(next>=7){setBuildTaps(0);router.push("/admin?source=developer-options");}}}><span>Build number</span><small>JZO54K</small></button></>}</div>}
        {activeApp === "chess" && <><h3>CHESS</h3><p>Choose a chess platform.</p><div className="jb-chess-folder"><a href={site.launcher.chessComProfileUrl} target="_blank" rel="noreferrer"><Image src="/jellybean/icons/brands/chessdotcom.svg" alt="" width={64} height={64} unoptimized draggable={false}/><span>Chess.com profile</span></a><a href={site.launcher.lichessProfileUrl} target="_blank" rel="noreferrer"><Image src="/jellybean/icons/brands/lichess.svg" alt="" width={64} height={64} unoptimized draggable={false}/><span>Lichess profile</span></a></div></>}
        {activeApp === "github" && <><h3>GITHUB</h3><p>Explore public repositories and current engineering work.</p><a className="jb-project-action" href={site.owner.github} target="_blank" rel="noreferrer">OPEN GITHUB ↗</a></>}
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
