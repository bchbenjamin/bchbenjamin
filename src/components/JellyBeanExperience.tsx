"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { SiteContent } from "@/lib/content";
import ProjectArtwork from "@/components/ProjectArtwork";
import JellyBeanMessaging from "@/components/JellyBeanMessaging";
import { DEFAULT_WIDGET_PLACEMENTS, placeWidgetWithoutOverlap } from "@/lib/launcher-layout";

type AppId = string;
const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");
function isCurrentProjectDeployment(url?: string) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return (parsed.protocol === "https:" || parsed.protocol === "http:") && parsed.hostname !== "kev-ai-device.vercel.app" && !parsed.hostname.endsWith(".kev-ai-device.vercel.app");
  } catch { return false; }
}
type AppInfo = { id: string; name: string; icon: string; color: string; panel: number; url?: string; iconUrl?: string; folder?: boolean };

const APPS: AppInfo[] = [
  { id: "about", name: "About", icon: "person", color: "#4c9bd6", panel: 0 },
  { id: "gallery", name: "Gallery", icon: "gallery", color: "#e8a34c", panel: 0 },
  { id: "projects", name: "Projects", icon: "projects", color: "#48a7a0", panel: 1 },
  { id: "camera", name: "Camera", icon: "camera", color: "#6d8290", panel: 1 },
  { id: "calendar", name: "Calendar", icon: "calendar", color: "#d65b4b", panel: 1 },
  { id: "breach-defend", name: "Project shortcut", icon: "breach", color: "#d65b4b", panel: 1 },
  { id: "hermes-quizzer", name: "Project shortcut", icon: "quizzer", color: "#4b8cc7", panel: 1 },
  { id: "street-safety", name: "Project shortcut", icon: "safety", color: "#d49a3e", panel: 3 },
  { id: "experience", name: "Experience", icon: "briefcase", color: "#8a79c6", panel: 1 },
  { id: "education", name: "Education", icon: "school", color: "#b38a55", panel: 1 },
  { id: "skills", name: "Skills", icon: "skills", color: "#6a9b63", panel: 2 },
  { id: "terminal", name: "Termux", icon: "terminal", color: "#303b43", panel: 2 },
  { id: "github", name: "GitHub", icon: "github", color: "#555b66", panel: 2 },
  { id: "googleplus", name: "Google+", icon: "googleplus", color: "#d34836", panel: 4, url: "/links" },
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
    person: "aosp-4.1.2/contacts.png", camera: "aosp-4.1.2/camera.png", calendar: "aosp-4.1.2/calendar.png", gallery: "aosp-4.1.2/gallery.png", projects: "aosp-4.1.2/market.png", skills: "aosp-4.1.2/calculator.png",
    message: "aosp-4.1.2/messaging.png", settings: "aosp-4.1.2/settings.png", github: "https://github.com/favicon.ico", terminal: "termux-new.png", magisk: "magisk.svg",
    briefcase: "aosp-4.1.2/clock.png", school: "aosp-4.1.2/calendar.png", email: "aosp-4.1.2/email.png", achievements: "aosp-4.1.2/market.png", journey: "aosp-4.1.2/browser.png", googleplus: "google-plus-2012.svg"
  };
  const asset = app.iconUrl || assets[app.icon];
  if (app.folder) return <span className={`jb-app-icon jb-app-icon-${size} jb-icon-folder`} style={{ "--app-color": app.color } as CSSProperties}>
    <span className="jb-folder-preview"><Image src="/jellybean/icons/aosp-4.1.2/folder-ring.png" alt="" width={56} height={56} unoptimized/><span className="jb-folder-preview-items"><Image src="/jellybean/icons/brands/chessdotcom.svg" alt="" width={20} height={20} unoptimized/><Image src="/jellybean/icons/brands/lichess.svg" alt="" width={20} height={20} unoptimized/><Image src="/jellybean/icons/aosp-4.1.2/browser.png" alt="" width={20} height={20} unoptimized/></span></span>
  </span>;
  return <span className={`jb-app-icon jb-app-icon-${size} jb-icon-${app.icon}`} style={{ "--app-color": app.color } as CSSProperties}>
    {app.iconUrl ? <img src={app.iconUrl} alt="" width={size === "large" ? 56 : 48} height={size === "large" ? 56 : 48} draggable={false} /> : asset ? <Image src={asset.startsWith("http") || asset.startsWith("/") ? asset : `/jellybean/icons/${asset}`} alt="" width={size === "large" ? 56 : 48} height={size === "large" ? 56 : 48} unoptimized draggable={false} /> : <span aria-hidden="true">{app.name.slice(0, 1)}</span>}
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
  const [selectionMenu, setSelectionMenu] = useState<{x:number;y:number}|null>(null);
  const [activeApp, setActiveApp] = useState<AppId | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [settingsPage, setSettingsPage] = useState<"main" | "about">("main");
  const [buildTaps, setBuildTaps] = useState(0);
  const [androidVersionTaps, setAndroidVersionTaps] = useState(0);
  const [showJellyBeanEgg, setShowJellyBeanEgg] = useState(false);
  const [beanShower, setBeanShower] = useState(false);
  const eggHoldTimer = useRef<number | null>(null);
  const [ownerElevated, setOwnerElevated] = useState(false);
  const [layoutReady, setLayoutReady] = useState(false);
  const [layoutMessage, setLayoutMessage] = useState("");
  const [terminalInput, setTerminalInput] = useState("");
  const [terminalLines, setTerminalLines] = useState<string[]>(["Welcome to Termux!", "This is a read-only portfolio environment. Type help to get started."]);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const pointerStart = useRef<{ x: number; y: number; started: number; appId?: string; widgetId?: "search" | "clock" | "gallery"; panel: number; fromDrawer?: boolean; fromDrawerWidget?: boolean } | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressIconClick = useRef(false);
  const lastAutoPage = useRef(-1);
  const [homePlacements, setHomePlacements] = useState<Record<string, { panel: number; slot: number }>>(site.launcher.homeLayout?.icons ?? {});
  const [widgetPlacements, setWidgetPlacements] = useState<Record<string, { panel: number; row: number; column: number }>>(site.launcher.homeLayout?.widgets ?? {});
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
    const builtIns = APPS.filter((item) => !hidden.includes(item.id)).flatMap(item => {
      const projectSlug = item.id === "breach-defend" ? "breach-defend" : item.id === "hermes-quizzer" ? "hermes-the-quizzer" : item.id === "street-safety" ? "street-safety-device" : null;
      if (!projectSlug) return [item];
      const project = site.projects.find(candidate => candidate.slug === projectSlug);
      const destination = project?.liveUrl?.trim();
      if (!project || !destination) return [];
      try {
        const host = new URL(destination).hostname.toLowerCase();
        // This legacy Awarespan/Street Safety deployment is retired (404); never surface it.
        if (host === "kev-ai-device.vercel.app" || host.endsWith(".kev-ai-device.vercel.app")) return [];
      } catch { return []; }
      return [{ ...item, name: project.name, url: destination, iconUrl: `https://www.google.com/s2/favicons?sz=128&domain_url=${encodeURIComponent(destination)}` }];
    });
    const custom = (site.launcher.customApps ?? []).filter(item => item && item.id && item.name && item.url).map(item => ({ id: item.id, name: item.name, icon: "custom", color: "#5d8297", panel: 4, url: item.url, iconUrl: item.iconUrl || `https://www.google.com/s2/favicons?sz=128&domain_url=${encodeURIComponent(item.url)}` }));
    return [...builtIns, ...custom].sort((a,b) => (order.indexOf(a.id) < 0 ? 999 : order.indexOf(a.id))-(order.indexOf(b.id) < 0 ? 999 : order.indexOf(b.id))).map(item => ({ ...item, name: site.launcher.appLabels[item.id] || item.name }));
  }, [site.projects, site.launcher.hiddenApps, site.launcher.appOrder, site.launcher.appLabels, site.launcher.customApps]);
  const app = visibleApps.find((item) => item.id === activeApp) ?? APPS.find((item) => item.id === activeApp) ?? null;
  const panels = useMemo(() => [0, 1, 2, 3, 4], []);
  const homeAppsByPanel = useMemo(() => panels.map(index => visibleApps
    .filter(item => (homePlacements[item.id]?.panel ?? item.panel) === index)
    .sort((a, b) => (homePlacements[a.id]?.slot ?? visibleApps.filter(item => item.panel === index).indexOf(a)) - (homePlacements[b.id]?.slot ?? visibleApps.filter(item => item.panel === index).indexOf(b)))), [panels, visibleApps, homePlacements]);
  const widgetsByPanel = useMemo(() => panels.map(index => {
    const ids = (Object.keys(DEFAULT_WIDGET_PLACEMENTS) as Array<keyof typeof DEFAULT_WIDGET_PLACEMENTS>).filter(id => {
      const enabled = id === "search" ? site.launcher.showSearch : id === "clock" ? site.launcher.showClock : site.launcher.showGallery;
      return enabled && (widgetPlacements[id]?.panel ?? DEFAULT_WIDGET_PLACEMENTS[id].panel) === index;
    });
    return ids.map(id => ({ id, ...(widgetPlacements[id] ?? DEFAULT_WIDGET_PLACEMENTS[id]) }));
  }), [panels, widgetPlacements, site.launcher.showSearch, site.launcher.showClock, site.launcher.showGallery]);
  const drawerPageSize = Math.max(12, site.launcher.appColumns * 4);
  const drawerPages = useMemo(() => Array.from({ length: Math.max(1, Math.ceil(visibleApps.length / drawerPageSize)) }, (_, page) => visibleApps.slice(page * drawerPageSize, (page + 1) * drawerPageSize)), [visibleApps, drawerPageSize]);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 2500);
    async function initialiseLayout() {
      let isOwnerSignedIn = false;
      try {
        const response = await fetch(`${apiBase}/api/v1/admin/session`, { credentials: "include", cache: "no-store", headers: { Accept: "application/json" }, signal: controller.signal });
        if (response.ok) {
          const session = await response.json() as { authenticated?: boolean; stepUp?: boolean };
          isOwnerSignedIn = Boolean(session.authenticated);
          if (active && session.authenticated && session.stepUp) {
            setOwnerElevated(true);
            setHomePlacements(site.launcher.homeLayout?.icons ?? {});
            setWidgetPlacements(site.launcher.homeLayout?.widgets ?? {});
            setLayoutMessage("Owner layout · synchronised across devices");
            setLayoutReady(true);
            return;
          }
        }
      } catch { /* An unauthenticated visitor gets a private device layout. */ }
      if (!active) return;
      try {
        const saved = localStorage.getItem("jb-home-layout");
        const legacy = localStorage.getItem("jb-home-icon-layout");
        if (saved) {
          const parsed = JSON.parse(saved) as { icons?: Record<string, { panel: number; slot: number }>; widgets?: Record<string, { panel: number; row: number; column: number }> };
          setHomePlacements(parsed.icons ?? {}); setWidgetPlacements(parsed.widgets ?? {});
        } else if (legacy) setHomePlacements(JSON.parse(legacy) as Record<string, { panel: number; slot: number }>);
      } catch { /* Ignore malformed local launcher settings. */ }
      setLayoutMessage(isOwnerSignedIn ? "Owner signed in · verify the authenticator in Admin to enable shared sync" : "This launcher layout is saved only on this device");
      setLayoutReady(true);
    }
    void initialiseLayout().finally(() => { window.clearTimeout(timeout); });
    return () => { active = false; window.clearTimeout(timeout); controller.abort(); };
  }, [site.launcher.homeLayout]);
  useEffect(() => { if (activeApp === "terminal") { window.scrollTo(0, 0); terminalInputRef.current?.focus({ preventScroll: true }); if (terminalOutputRef.current) terminalOutputRef.current.scrollTop = terminalOutputRef.current.scrollHeight; } }, [activeApp, terminalLines]);

  const goPanel = useCallback((next: number) => setPanel(Math.max(0, Math.min(4, next))), []);
  const closeOverlays = useCallback(() => { setActiveApp(null); setDrawer(false); setShade(false); setRecent(false); }, []);
  const navBack = useCallback(() => {
    if (showJellyBeanEgg) { setShowJellyBeanEgg(false); setBeanShower(false); }
    else if (launcherEditMode) setLauncherEditMode(false);
    else if (shade) setShade(false);
    else if (drawer) setDrawer(false);
    else if (recent) setRecent(false);
    else if (activeApp && selectedProject) setSelectedProject(null);
    else if (activeApp) setActiveApp(null);
    else goPanel(0);
  }, [showJellyBeanEgg, launcherEditMode, shade, drawer, recent, activeApp, selectedProject, goPanel]);
  const navHome = useCallback(() => { closeOverlays(); setSelectedProject(null); goPanel(0); }, [closeOverlays, goPanel]);
  const navBackRef = useRef(navBack);
  useEffect(() => { navBackRef.current = navBack; }, [navBack]);
  useEffect(() => {
    const marker = "jb-phone-navigation";
    window.history.pushState({ marker }, "", window.location.href);
    const onPopState = () => {
      navBackRef.current();
      window.history.pushState({ marker }, "", window.location.href);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);
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

  function open(appId: string) { const external = visibleApps.find(item => item.id === appId && item.url); if (external?.url) { if (external.url.startsWith("/")) router.push(external.url); else window.open(external.url, "_blank", "noopener,noreferrer"); return; } setLauncherEditMode(false); setDrawer(false); setShade(false); setRecent(false); setSelectedProject(null); setRecentApps(items => [appId, ...items.filter(item => item !== appId)].slice(0, 5)); if (appId === "settings") setSettingsPage("main"); setActiveApp(appId); }
  function commitHomeLayout(icons: Record<string, { panel: number; slot: number }>, widgets: Record<string, { panel: number; row: number; column: number }>) {
    setHomePlacements(icons);
    setWidgetPlacements(widgets);
    if (!ownerElevated) {
      try { localStorage.setItem("jb-home-layout", JSON.stringify({ icons, widgets })); setLayoutMessage("Saved on this device"); }
      catch { setLayoutMessage("Could not save this device's launcher layout"); }
      return;
    }
    void (async () => {
      try {
        const csrf = await fetch(`${apiBase}/api/v1/csrf`, { credentials: "include", cache: "no-store" });
        if (!csrf.ok) throw new Error(`Could not initialise a secure owner request (${csrf.status})`);
        const token = (await csrf.json() as { token: string }).token;
        const response = await fetch(`${apiBase}/api/v1/admin/site-configuration/launcher-layout`, {
          method: "PUT", credentials: "include", headers: { "Content-Type": "application/json", "X-XSRF-TOKEN": token },
          body: JSON.stringify({ icons, widgets })
        });
        if (!response.ok) throw new Error(`Shared launcher sync failed (${response.status})`);
        setLayoutMessage("Owner layout synchronised across devices");
      } catch (error) {
        try { localStorage.setItem("jb-home-layout", JSON.stringify({ icons, widgets })); } catch { /* Keep the in-memory layout even when storage is unavailable. */ }
        setLayoutMessage(`${error instanceof Error ? error.message : "Shared sync failed"} · kept locally on this device`);
      }
    })();
  }

  function addWidgetToCurrentPage(widgetId: "search" | "clock" | "gallery") {
    const defaultPosition = DEFAULT_WIDGET_PLACEMENTS[widgetId];
    const next = placeWidgetWithoutOverlap(widgetId, panel, defaultPosition.row, defaultPosition.column, widgetPlacements);
    commitHomeLayout(homePlacements, next);
    setDrawer(false);
    setPanel(panel);
  }

  function runCommand(event: React.FormEvent) {
    event.preventDefault(); const command = terminalInput.trim().toLowerCase(); if (!command) return;
    const output: Record<string, string[]> = {
      help: ["Available commands:", "  help       Show this help", "  whoami     About the portfolio owner", "  projects   List public projects", "  skills     List technologies", "  experience List experience", "  education  List education", "  contact    Show public contact links", "  ls         List available sections", "  pwd        Show current directory", "  uname      Show this environment", "  date       Show local date and time", "  clear      Clear the screen"],
      ls: ["about  projects  experience  education  skills  contact"],
      pwd: ["/home/portfolio"],
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
    else setTerminalLines((lines) => [...lines, `~ $ ${command}`, ...(output[command] ?? [`command not found: ${command}`, "Type help for available commands."])]);
    setTerminalInput("");
  }

  return <main className="jb-world">
    <div className={`jb-device${site.launcher.showLabels ? "" : " jb-hide-labels"}`} aria-label="Micromax Canvas 2 A110 launcher" onContextMenu={(event) => { event.preventDefault(); const selection=window.getSelection()?.toString(); if(selection?.trim()) setSelectionMenu({x:Math.min(event.clientX,window.innerWidth-190),y:Math.max(8,event.clientY-54)}); }} onDragStart={(event) => event.preventDefault()} onClickCapture={(event) => { if (suppressIconClick.current) { event.preventDefault(); event.stopPropagation(); suppressIconClick.current = false; } }} onPointerDown={(event) => {
      if (!layoutReady) return;
      const target = event.target as HTMLElement;
      if (target.closest(".jb-app-overlay,.jb-shade-overlay,.jb-recent-overlay")) return;
      const icon = target.closest<HTMLElement>("[data-home-app],[data-drawer-app]");
      const widget = target.closest<HTMLElement>("[data-home-widget],[data-drawer-widget]");
      if (target.closest(".jb-drawer-overlay") && !icon && !widget) return;
      if (target.closest("button,input,a") && !icon && !widget) return;
      pointerStart.current = { x: event.clientX, y: event.clientY, started: Date.now(), appId: icon?.dataset.homeApp ?? icon?.dataset.drawerApp, widgetId: (widget?.dataset.homeWidget ?? widget?.dataset.drawerWidget) as "search" | "clock" | "gallery" | undefined, panel: Number(icon?.dataset.homePanel ?? widget?.dataset.widgetPanel ?? panel), fromDrawer: Boolean(icon?.dataset.drawerApp), fromDrawerWidget: Boolean(widget?.dataset.drawerWidget) };
      if (icon || widget) event.currentTarget.setPointerCapture(event.pointerId);
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
      if (icon || widget || target.closest(".jb-home-viewport")) longPressTimer.current = setTimeout(() => { setLauncherEditMode(true); if (navigator.vibrate) navigator.vibrate(35); }, 500);
    }} onPointerMove={(event) => { const start=pointerStart.current; if((!start?.appId && !start?.widgetId) || (start.fromDrawer && !start.fromDrawerWidget) || Date.now()-start.started<450) return; const bounds=event.currentTarget.getBoundingClientRect(); const edge=36; if(event.clientX>bounds.right-edge && panel<4 && lastAutoPage.current!==panel){lastAutoPage.current=panel+1;setPanel(panel+1);} else if(event.clientX<bounds.left+edge && panel>0 && lastAutoPage.current!==panel){lastAutoPage.current=panel-1;setPanel(panel-1);} else if(event.clientX>bounds.left+edge && event.clientX<bounds.right-edge){lastAutoPage.current=-1;} }} onPointerCancel={() => { pointerStart.current = null; lastAutoPage.current=-1; if (longPressTimer.current) clearTimeout(longPressTimer.current); longPressTimer.current = null; }} onPointerUp={(event) => {
      const start = pointerStart.current; pointerStart.current = null;
      if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
      if (!start) return;
      if (!start.appId && !start.widgetId && Date.now() - start.started >= 500) { setLauncherEditMode(true); suppressIconClick.current = true; window.setTimeout(() => { suppressIconClick.current = false; }, 450); return; }
      const dx = event.clientX - start.x; const dy = event.clientY - start.y;
      const moved = Math.hypot(dx, dy);
      if (start.widgetId && Date.now() - start.started >= 450) {
        setLauncherEditMode(true);
        if (moved <= 18) { suppressIconClick.current = true; window.setTimeout(() => { suppressIconClick.current = false; }, 450); return; }
        const destinationPanel = Math.max(0, Math.min(4, panel));
        const grid = event.currentTarget.querySelector<HTMLElement>(`[data-widget-grid="${destinationPanel}"]`);
        const bounds = grid?.getBoundingClientRect() ?? event.currentTarget.getBoundingClientRect();
        const column = Math.max(0, Math.min(start.widgetId === "clock" ? 2 : 0, Math.floor((event.clientX - bounds.left) / (bounds.width / 4))));
        const styles = grid ? window.getComputedStyle(grid) : null;
        const rowHeight = Number.parseFloat(styles?.gridAutoRows ?? "72") || 72;
        const rowGap = Number.parseFloat(styles?.rowGap ?? "10") || 10;
        const row = Math.max(0, Math.min(8, Math.floor((event.clientY - bounds.top) / (rowHeight + rowGap))));
        const nextWidgets = placeWidgetWithoutOverlap(start.widgetId, destinationPanel, row, column, widgetPlacements);
        commitHomeLayout(homePlacements, nextWidgets);
        if (start.fromDrawerWidget) setDrawer(false);
        setPanel(destinationPanel);
        suppressIconClick.current = true;
        window.setTimeout(() => { suppressIconClick.current = false; }, 450);
        return;
      }
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
          commitHomeLayout({ ...homePlacements, [start.appId]: { panel: destinationPanel, slot: destinationSlot } }, widgetPlacements);
          setPanel(destinationPanel); setDrawer(false); suppressIconClick.current = true;
          window.setTimeout(() => { suppressIconClick.current = false; }, 450);
          return;
        }
        if (moved <= 18) { suppressIconClick.current = true; window.setTimeout(() => { suppressIconClick.current = false; }, 450); return; }
        if (event.clientY < device.top + 68) {
          commitHomeLayout({ ...homePlacements, [start.appId]: { panel: -1, slot: -1 } }, widgetPlacements);
          suppressIconClick.current = true; window.setTimeout(() => { suppressIconClick.current = false; }, 450); return;
        }
        const destinationPanel = panel !== start.panel ? panel : Math.max(0, Math.min(4, start.panel + (dx < -100 ? 1 : dx > 100 ? -1 : 0)));
        const row = Math.max(0, Math.min(3, Math.floor((event.clientY - device.top - 70) / 94)));
        const column = Math.max(0, Math.min(3, Math.floor((event.clientX - device.left) / device.width * 4)));
        const destinationSlot = row * 4 + column;
        const sourceSlot = homePlacements[start.appId]?.slot ?? visibleApps.filter(item => item.panel === start.panel).findIndex(item => item.id === start.appId);
        const next = { ...homePlacements, [start.appId]: { panel: destinationPanel, slot: destinationSlot } };
        const displaced = visibleApps.find(item => item.id !== start.appId && (homePlacements[item.id]?.panel ?? item.panel) === destinationPanel && (homePlacements[item.id]?.slot ?? visibleApps.filter(candidate => candidate.panel === destinationPanel).findIndex(candidate => candidate.id === item.id)) === destinationSlot);
        if (displaced) next[displaced.id] = { panel: start.panel, slot: Math.max(0, sourceSlot) };
        commitHomeLayout(next, widgetPlacements);
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
      if (dy < -65 && Math.abs(dy) > Math.abs(dx) * 1.1) { setDrawer(true); setDrawerTab("apps"); setDrawerPage(0); }
      else if (dy > 65 && dy > Math.abs(dx) * 1.1) setShade(true);
      else if (Math.abs(dx) > 65 && Math.abs(dx) > Math.abs(dy) * 1.15) goPanel(panel + (dx < 0 ? 1 : -1));
    }}>


      {selectionMenu && <div className="jb-android-selection-menu" style={{left:selectionMenu.x,top:selectionMenu.y}}><button onClick={()=>{void navigator.clipboard.writeText(window.getSelection()?.toString()??"");setSelectionMenu(null);}}>Copy</button><button onClick={()=>{const range=document.createRange();range.selectNodeContents(document.querySelector(".jb-app-content")??document.body);window.getSelection()?.removeAllRanges();window.getSelection()?.addRange(range);setSelectionMenu(null);}}>Select all</button><button onClick={()=>setSelectionMenu(null)}>⋮</button></div>}
      {launcherEditMode && <div className="jb-edit-toolbar"><span>Home screen options <small>Apps live in the app drawer. Long-press an empty area to open these options. {layoutMessage}</small></span><button onClick={() => { setDrawerTab("widgets"); setDrawer(true); setLauncherEditMode(false); }}>Widgets</button><button onClick={() => setLauncherEditMode(false)}>Done</button></div>}
      {site.launcher.showStatusBar !== false && <div className="jb-status-bar" onClick={() => setShade(true)} role="button" tabIndex={0} aria-label="Open notifications and quick settings">
        <div className="jb-status-left" aria-hidden="true" />
        <div className="jb-status-right"><SystemStatusIcon kind="wifi" /><SystemStatusIcon kind="signal" /><SystemStatusIcon kind="battery" /><span className="jb-status-time">{clock}</span></div>
      </div>}

      <div className={`jb-wallpaper${site.launcher.wallpaper === "android-default" ? " jb-wallpaper-static" : site.launcher.wallpaper === "custom" ? " jb-wallpaper-custom" : ""}`} style={site.launcher.wallpaper === "custom" && site.launcher.wallpaperImageUrl ? { backgroundImage: `url("${site.launcher.wallpaperImageUrl}")` } : undefined}></div>
      <div className="jb-home-viewport">
        <div className="jb-panels" style={{ transform: `translateX(-${panel * 100}%)` }}>
          {panels.map((index) => <section className="jb-panel" key={index} aria-label={`Home screen ${index + 1}`}>
            <div className="jb-home-widget-grid" data-widget-grid={index}>
              {widgetsByPanel[index].map(widget => <div key={widget.id} data-home-widget={widget.id} data-widget-panel={index} className={`jb-home-widget jb-home-widget-${widget.id}`} style={{ gridColumn: `${widget.column + 1} / span ${widget.id === "clock" ? 2 : 4}`, gridRow: `${widget.row + 1} / span ${widget.id === "search" ? 1 : 2}` }}>
                {widget.id === "search" && <div className="jb-search-widget" role="img" aria-label="Google Search"><Image src="/jellybean/search-widget.png" alt="" width={680} height={61} unoptimized /></div>}
                {widget.id === "clock" && <div className="jb-clock-widget" aria-label={`Analog clock showing ${clock}`}><div className="jb-analog-clock"><Image src="/jellybean/clock/dial.png" alt="" fill sizes="180px" unoptimized/><Image className="jb-clock-hand jb-clock-hour-hand" src="/jellybean/clock/hour.png" alt="" fill sizes="180px" style={{ transform: `rotate(${hourAngle}deg)` }} unoptimized/><Image className="jb-clock-hand jb-clock-minute-hand" src="/jellybean/clock/minute.png" alt="" fill sizes="180px" style={{ transform: `rotate(${minuteAngle}deg)` }} unoptimized/></div></div>}
                {widget.id === "gallery" && <div className="jb-gallery-widget"><div className="jb-widget-heading"><span>GALLERY</span><button type="button" onClick={() => open("gallery")}>OPEN</button></div><div className="jb-gallery-strip">{site.gallery.slice(0, 5).map(media => <button key={media.id} onClick={() => open("gallery")} aria-label={`Open ${media.source_caption || media.caption || media.source_title || media.original_filename}`}><span className="jb-gallery-thumb">{media.content_type.startsWith("video/") ? <span className="jb-video-thumb">▶</span> : <Image src={media.url} alt="" width={120} height={72} unoptimized/>}</span><span>{media.source_caption || media.caption || media.source_title || media.original_filename}</span></button>)}</div></div>}
              </div>)}
            </div>
          </section>)}
        </div>
      </div>

      {site.launcher.showPageIndicator !== false && <div className="jb-page-indicator" aria-label="Home screen pages">{panels.map((p) => <button key={p} className={panel === p ? "active" : ""} onClick={() => goPanel(p)} aria-label={`Go to home screen ${p + 1}`} />)}</div>}
      {site.launcher.showDock !== false && <div className="jb-dock jb-dock-drawer-only">
        <button className="jb-app-drawer-button" onClick={() => { setDrawerPage(0); setDrawer(value => !value); }} aria-label={drawer ? "Close app drawer" : "Open app drawer"}><Image src="/jellybean/icons/aosp-4.1.2/all-apps.png" alt="" width={48} height={48} unoptimized /></button>
      </div>}
      {site.launcher.showNavigationBar !== false && <div className="jb-navigation-bar"><div className="jb-tablet-nav"><button onClick={navBack} aria-label="Back"><SystemNavigationIcon kind="back" /></button><button onClick={navHome} aria-label="Home"><SystemNavigationIcon kind="home" /></button><button onClick={navRecent} aria-label="Recent apps"><SystemNavigationIcon kind="recent" /></button></div><button className="jb-tablet-status" onClick={() => setShade(true)} aria-label="Open notifications"><SystemStatusIcon kind="wifi" /><SystemStatusIcon kind="battery" /><span>{clock}</span><span className="jb-tablet-notification-mark">●</span></button></div>}

      {drawer && <div className="jb-overlay jb-drawer-overlay"><div className="jb-drawer" onPointerDown={event => { drawerPointerStart.current = { x: event.clientX, y: event.clientY }; }} onPointerUp={event => { const start = drawerPointerStart.current; drawerPointerStart.current = null; if (!start) return; const dx = event.clientX - start.x; const dy = event.clientY - start.y; if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)) setDrawerPage(page => Math.max(0, Math.min(drawerPages.length - 1, page + (dx < 0 ? 1 : -1)))); else if (dy > 75 && dy > Math.abs(dx)) setDrawer(false); }}><div className="jb-drawer-tabs"><button className={drawerTab === "apps" ? "selected" : ""} onClick={() => { setDrawerTab("apps"); setDrawerPage(0); }}>APPS</button><button className={drawerTab === "widgets" ? "selected" : ""} onClick={() => setDrawerTab("widgets")}>WIDGETS</button><button className="jb-drawer-close" onClick={() => setDrawer(false)} aria-label="Close app drawer">×</button></div>{drawerTab === "apps" ? <><div className="jb-drawer-pages" aria-label={`App drawer page ${drawerPage + 1} of ${drawerPages.length}`}><div className="jb-drawer-page-track" style={{ transform: `translateX(-${drawerPage * 100}%)` }}>{drawerPages.map((pageApps, pageIndex) => <div className="jb-drawer-page" key={pageIndex} style={{ gridTemplateColumns: `repeat(${site.launcher.appColumns}, minmax(0, 1fr))` }}>{pageApps.map((a) => <button key={a.id} data-drawer-app={a.id} onClick={() => a.id === "github" ? (site.owner.github && window.open(site.owner.github, "_blank", "noopener,noreferrer")) : open(a.id)}><AppIcon app={a} size="large" /><span className="jb-drawer-app-label">{a.name}</span></button>)}</div>)}</div></div>{drawerPages.length > 1 && <div className="jb-drawer-page-indicators">{drawerPages.map((_, index) => <button key={index} className={drawerPage === index ? "active" : ""} onClick={() => setDrawerPage(index)} aria-label={`App drawer page ${index + 1}`} />)}</div>}</> : <div className="jb-widget-picker">
        {site.launcher.showClock&&<button data-drawer-widget="clock" onClick={()=>addWidgetToCurrentPage("clock")}><span className="jb-widget-preview-clock"><span className="jb-analog-clock"><Image src="/jellybean/clock/dial.png" alt="" fill sizes="90px" unoptimized/><Image className="jb-clock-hand" src="/jellybean/clock/hour.png" alt="" fill sizes="90px" unoptimized/><Image className="jb-clock-hand" src="/jellybean/clock/minute.png" alt="" fill sizes="90px" unoptimized/></span></span><b>Analog clock</b><small>2 × 2 · tap to add, long-press to drag</small></button>}
        {site.launcher.showSearch&&<button data-drawer-widget="search" onClick={()=>addWidgetToCurrentPage("search")}><span className="jb-widget-preview-search"><Image src="/jellybean/search-widget.png" alt="" width={220} height={20} unoptimized/></span><b>Google Search</b><small>4 × 1 · tap to add, long-press to drag</small></button>}
        {site.launcher.showGallery&&<button data-drawer-widget="gallery" onClick={()=>addWidgetToCurrentPage("gallery")}><span className="jb-widget-preview-gallery">{projects.slice(0,3).map(project=><ProjectArtwork key={project.slug} project={project}/>)}</span><b>Gallery</b><small>4 × 2 · tap to add, long-press to drag</small></button>}
      </div>}</div></div>}

      {shade && <div className="jb-overlay jb-shade-overlay" onClick={() => setShade(false)}><div className="jb-notification-shade" onClick={(e) => e.stopPropagation()} onTouchStart={(e) => { const t=e.touches[0]; touchStart.current={x:t.clientX,y:t.clientY}; }} onTouchEnd={(e) => { if (!touchStart.current) return; const t=e.changedTouches[0]; if (touchStart.current.y-t.clientY>65) setShade(false); touchStart.current=null; }}><div className="jb-shade-head"><div><b>{clock}</b><span>{dateLabel}</span></div><div className="jb-shade-controls"><Image className="jb-shade-rotation" src="/jellybean/ic_notify_rotation_off_normal.png" alt="Rotation lock" width={36} height={36} unoptimized /><button type="button" className="jb-shade-settings-button" onClick={() => { setShade(false); setSettingsPage("main"); setActiveApp("settings"); }} aria-label="Open Settings"><Image src="/jellybean/icons/aosp-4.1.2/settings.png" alt="" width={36} height={36} unoptimized /></button><Image className="jb-shade-clear" src="/jellybean/ic_notify_clear_normal.png" alt="Dismiss all notifications" width={36} height={36} unoptimized /></div></div><div className="jb-notification-empty"><span className="jb-notification-symbol"><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 34h28l-4-5V18a10 10 0 0 0-20 0v11z" fill="none" stroke="currentColor" strokeWidth="2.4"/><path d="M19 38q5 6 10 0" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/></svg></span><b>No notifications</b></div></div></div>}

      {recent && <div className="jb-overlay jb-recent-overlay"><div className="jb-recent-stack">{recentApps.length ? recentApps.map(id=>{const item=visibleApps.find(candidate=>candidate.id===id) ?? APPS.find(candidate=>candidate.id===id);return item?<button key={id} onClick={()=>open(id)}><AppIcon app={item} size="large"/><b>{item.name}</b></button>:null;}) : <p>No recent apps</p>}<button onClick={navHome}><span className="jb-recent-home">○</span><b>Home</b></button></div></div>}
      {app && <div className="jb-overlay jb-app-overlay"><div className="jb-app-window"><header className="jb-app-actionbar"><button onClick={navBack} aria-label="Back">‹</button><div><b>{currentProject?.name ?? app.name}</b></div></header><div className="jb-app-content">
        {activeApp === "about" && <><div className="jb-about-hero"><div className="jb-about-avatar">{site.owner.monogram}</div><h2>{site.owner.name}</h2><p>{site.owner.role}</p></div><h3>MY STORY</h3><p>{site.owner.intro}</p>{site.owner.location && <div className="jb-info-row"><span>LOCATION</span><b>{site.owner.location}</b></div>}{site.owner.github && <div className="jb-info-row"><span>GITHUB</span><a href={site.owner.github} target="_blank" rel="noreferrer">Open profile ↗</a></div>}</>}
        {activeApp === "camera" && <LocalCamera />}
        {activeApp === "calendar" && <LocalCalendar birthdayMonthDay="12-13" />}
        {activeApp === "gallery" && <><h3>GALLERY</h3>{site.gallery.length ? <div className="jb-media-gallery">{site.gallery.map((media) => <article className="jb-media-card" key={media.id}>{media.content_type.startsWith("video/") ? <video src={media.url} controls playsInline preload="metadata" /> : <Image src={media.url} alt={media.alt_text || media.source_caption || media.caption || media.source_title || media.original_filename} width={640} height={420} unoptimized /> }<div><b>{media.source_caption || media.caption || media.alt_text || media.source_title || media.original_filename}</b>{media.source_title && <small>{media.source_title}</small>}{media.uploaded_at && <small>{new Date(media.uploaded_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</small>}</div></article>)}</div> : <div className="jb-gallery-empty"><span>▧</span><b>No media found</b><small>No items in this album.</small></div>}</>}
        {activeApp === "projects" && (currentProject ? <><button className="jb-back-link" onClick={() => setSelectedProject(null)}>‹ ALL PROJECTS</button><div className="jb-project-detail-art"><ProjectArtwork project={currentProject} /></div><h3>{currentProject.category}</h3><h2 className="jb-project-detail-title">{currentProject.name}</h2><p>{currentProject.description || currentProject.summary}</p><div className="jb-chip-row">{currentProject.stack.map((s) => <span key={s}>{s}</span>)}</div><div className="jb-info-row"><span>PERIOD</span><b>{currentProject.period || "—"}</b></div>{currentProject.liveUrl && <a className="jb-project-action" href={currentProject.liveUrl} target="_blank" rel="noreferrer">LIVE PROJECT ↗</a>}</> : <><h3>SELECTED PROJECTS</h3>{projects.filter(p => isCurrentProjectDeployment(p.liveUrl)).length ? projects.filter(p => isCurrentProjectDeployment(p.liveUrl)).map((p) => <button className="jb-list-card jb-project-list-button" key={p.slug} onClick={() => setSelectedProject(p.slug)}><span className="jb-project-favicon"><Image src={`https://www.google.com/s2/favicons?sz=96&domain_url=${encodeURIComponent(p.liveUrl!)}`} alt="" width={32} height={32} unoptimized /></span><span className="jb-project-copy"><b>{p.name}</b><small>{p.category} · {p.period}</small><p>{p.summary}</p><span>OPEN DEPLOYMENT ›</span></span></button>) : <p className="jb-project-empty">No active project deployments are configured yet. Source repositories are intentionally not listed here.</p>}</>)}
        {activeApp === "experience" && <><h3>EXPERIENCE</h3>{site.experience.map((e, i) => <article className="jb-list-card" key={`${e.title}-${i}`}><b>{e.title}</b><small>{e.organization} · {e.period}</small><p>{e.description}</p></article>)}</>}
        {activeApp === "education" && <><h3>EDUCATION</h3>{site.education.map((e, i) => <article className="jb-list-card" key={`${e.institution}-${i}`}><b>{e.qualification}</b><small>{e.fieldOfStudy} · {e.institution}</small><p>{e.period} · {e.description}</p></article>)}</>}
        {activeApp === "skills" && <><h3>SKILLS & TOOLS</h3>{site.skillGroups.map((g) => <section className="jb-skill-section" key={g.name}><b>{g.name}</b><div className="jb-chip-row">{g.skills.map((s) => <span key={s}>{s}</span>)}</div></section>)}</>}
        {activeApp === "terminal" && <div className="jb-terminal"><div className="jb-terminal-top"><span className="jb-termux-menu">☰</span><b>~</b><span className="jb-termux-session">bash</span><span className="jb-termux-new">＋</span></div><div className="jb-terminal-output" ref={terminalOutputRef} aria-live="polite">{terminalLines.map((line, i) => <p key={`${i}-${line}`}>{line}</p>)}</div><form className="jb-termux-prompt" onSubmit={runCommand}><label>~ $</label><input ref={terminalInputRef} value={terminalInput} onChange={(e) => setTerminalInput(e.target.value)} aria-label="Termux command" autoComplete="off" spellCheck={false} /></form></div>}
        {activeApp === "contact" && <JellyBeanMessaging ownerName={site.owner.name} />}
        {activeApp === "achievements" && <><h3>ACHIEVEMENTS</h3>{site.achievements.map((item, index) => <article className="jb-list-card" key={`${item.title}-${index}`}><b>{item.title}</b><small>{item.label}{item.awardedOn ? ` · ${item.awardedOn}` : ""}</small><p>{item.detail}</p></article>)}</>}
        {activeApp === "journey" && <><h3>MY STORY</h3><p>{site.owner.intro}</p>{site.experience.map((item,index)=><article className="jb-list-card" key={`${item.title}-${index}`}><b>{item.title}</b><small>{item.organization} · {item.period}</small><p>{item.description}</p></article>)}</>}
        {activeApp === "email" && <><h3>EMAIL</h3>{site.owner.email ? <><p>{site.owner.email}</p><a className="jb-project-action" href={`mailto:${site.owner.email}`}>COMPOSE EMAIL ↗</a></> : <p>No public email address is configured.</p>}</>}
        {activeApp === "contactDetails" && <><h3>CONTACT</h3>{[["EMAIL",site.owner.email,`mailto:${site.owner.email}`],["GITHUB",site.owner.github,site.owner.github],["LINKEDIN",site.owner.linkedin,site.owner.linkedin]].filter(item=>item[1]).map(([label,value,url])=><div className="jb-info-row" key={label}><span>{label}</span><a href={url} target={url.startsWith("mailto:")?undefined:"_blank"} rel="noreferrer">{value} ↗</a></div>)}</>}
        {activeApp === "settings" && <div className="jb-settings-screen">{settingsPage === "main" ? <><h3>Settings</h3>{["Wireless & networks","Device","Personal","System"].map((group)=><section key={group}><b>{group}</b>{(group === "System" ? ["Date & time","Accessibility","About phone"] : group === "Device" ? ["Sound","Display","Storage","Battery","Apps"] : group === "Personal" ? ["Location access","Security","Language & input"] : ["Wi-Fi","Bluetooth","Data usage"]).map(item=><button key={item} onClick={()=>item === "About phone" && setSettingsPage("about")}><span>{item}</span><i>›</i></button>)}</section>)}</> : <><button className="jb-settings-back" onClick={()=>setSettingsPage("main")}>‹ Settings</button><h3>About phone</h3>{["Status","Legal information","Model number","Android version","Baseband version","Kernel version"].map(item=>item === "Android version" ? <button className="jb-settings-row jb-android-version" key={item} onClick={()=>{const next=androidVersionTaps+1;setAndroidVersionTaps(next);if(next>=7){setAndroidVersionTaps(0);setShowJellyBeanEgg(true);setBeanShower(false);}}}><span>{item}</span><small>4.1.1</small></button> : <div className="jb-settings-row" key={item}><span>{item}</span><small>{item === "Model number" ? "Micromax A110" : item === "Kernel version" ? "3.0.13 · Android 4.1" : ""}</small></div>)}<button className="jb-build-number" onClick={()=>{const next=buildTaps+1;setBuildTaps(next);if(next>=7){setBuildTaps(0);router.push("/admin?source=developer-options");}}}><span>Build number</span><small>JZO54K</small></button></>}</div>}
        {showJellyBeanEgg && <div className={`jb-android-easter-egg${beanShower ? " is-bean-shower" : ""}`}><button type="button" className="jb-egg-close" onClick={()=>{setShowJellyBeanEgg(false);setBeanShower(false);}}>‹ About phone</button><p>ANDROID 4.1.1</p><button type="button" className="jb-giant-jellybean" aria-label="Jelly Bean Easter egg" onPointerDown={()=>{eggHoldTimer.current=window.setTimeout(()=>setBeanShower(true),550);}} onPointerUp={()=>{if(eggHoldTimer.current)window.clearTimeout(eggHoldTimer.current);}} onPointerLeave={()=>{if(eggHoldTimer.current)window.clearTimeout(eggHoldTimer.current);}} onPointerCancel={()=>{if(eggHoldTimer.current)window.clearTimeout(eggHoldTimer.current);}} onClick={()=>setBeanShower(true)}><span className="jb-egg-face">☺</span></button><h2>Jelly Bean</h2><small>Touch and hold the bean</small>{beanShower && <div className="jb-floating-beans" aria-hidden="true">{Array.from({length:18},(_,index)=><i key={index} style={{left:`${(index*37)%92+4}%`,animationDelay:`${(index%6)*-.7}s`,background:["#e94e78","#ffc247","#6db7e9","#9b73d3","#5fc79a"][index%5]}}/>)}</div>}</div>}
        {activeApp === "chess" && <><h3>CHESS</h3><p>Choose a chess platform.</p><div className="jb-chess-folder"><a href={site.launcher.chessComProfileUrl} target="_blank" rel="noreferrer"><Image src="/jellybean/icons/brands/chessdotcom.svg" alt="" width={64} height={64} unoptimized draggable={false}/><span>Chess.com profile</span></a><a href={site.launcher.lichessProfileUrl} target="_blank" rel="noreferrer"><Image src="/jellybean/icons/brands/lichess.svg" alt="" width={64} height={64} unoptimized draggable={false}/><span>Lichess profile</span></a></div></>}
        {activeApp === "github" && <><h3>GITHUB</h3>{site.owner.github ? <><p>Explore public repositories and current engineering work.</p><a className="jb-project-action" href={site.owner.github} target="_blank" rel="noreferrer">OPEN GITHUB ↗</a></> : <p>No public GitHub profile is configured.</p>}</>}
        {activeApp === "googleplus" && <><h3>GOOGLE+</h3><p>All public profile and portfolio links in one place.</p><a className="jb-project-action" href="/links" target="_blank" rel="noreferrer">OPEN PROFILE LINKS ↗</a></>}
      </div></div></div>}
    </div>
  </main>;
}

function LocalCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [negative, setNegative] = useState(false);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState("");
  const [facing, setFacing] = useState<"user" | "environment">("environment");
  const stopCamera = useCallback(() => { streamRef.current?.getTracks().forEach(track => track.stop()); streamRef.current = null; setStreaming(false); }, []);
  useEffect(() => () => { recorderRef.current?.stop(); streamRef.current?.getTracks().forEach(track => track.stop()); }, []);
  async function startCamera(nextFacing = facing) {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia) { setError("Camera access requires HTTPS and a browser that supports getUserMedia."); return; }
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: nextFacing }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: true });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      setStreaming(true);
    } catch (e) { setError(e instanceof Error ? e.message : "Camera or microphone permission was denied."); }
  }
  function download(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; document.body.appendChild(anchor); anchor.click(); anchor.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  }
  function takePhoto() {
    const video = videoRef.current; if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas"); canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    const context = canvas.getContext("2d"); if (!context) return;
    context.filter = negative ? "invert(1)" : "none"; context.drawImage(video, 0, 0, canvas.width, canvas.height); context.filter = "none";
    canvas.toBlob(blob => { if (blob) download(blob, `portfolio-camera-${new Date().toISOString().replace(/[:.]/g,"-")}${negative ? "-negative" : ""}.jpg`); }, "image/jpeg", .94);
  }
  function startRecording() {
    if (!streamRef.current) return;
    const mime = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"].find(type => MediaRecorder.isTypeSupported(type));
    try {
      chunksRef.current = []; const recorder = new MediaRecorder(streamRef.current, mime ? { mimeType: mime } : undefined); recorderRef.current = recorder;
      recorder.ondataavailable = event => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onstop = () => { const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "video/webm" }); if (blob.size) download(blob, `portfolio-video-${new Date().toISOString().replace(/[:.]/g,"-")}.webm`); setRecording(false); };
      recorder.start(250); setRecording(true);
    } catch (e) { setError(e instanceof Error ? e.message : "Video recording is not supported by this browser."); }
  }
  return <section className="jb-camera-app"><h3>CAMERA</h3><p>Captured media stays in this browser session and downloads directly to your device. Nothing is uploaded.</p><div className="jb-camera-view"><video ref={videoRef} autoPlay muted playsInline className={negative ? "is-negative" : ""}/>{!streaming && <div className="jb-camera-placeholder">Camera preview</div>}</div><div className="jb-camera-controls">{!streaming ? <button onClick={() => void startCamera()}>Enable camera</button> : <><button onClick={takePhoto}>Take photo</button>{recording ? <button onClick={() => recorderRef.current?.stop()}>Stop & download video</button> : <button onClick={startRecording}>Record video</button>}<button onClick={() => { const next = facing === "user" ? "environment" : "user"; setFacing(next); void startCamera(next); }}>Flip camera</button><button onClick={stopCamera}>Stop camera</button></>}<button className={negative ? "selected" : ""} onClick={() => setNegative(value => !value)}>Negative {negative ? "ON" : "OFF"}</button></div>{error && <p className="jb-camera-error" role="alert">{error}</p>}<small>Photos: JPEG · Videos: WebM · Negative mode is applied to photos and preview.</small></section>;
}

function LocalCalendar({ birthdayMonthDay }: { birthdayMonthDay: string }) {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selected, setSelected] = useState(() => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`; });
  const year = month.getFullYear(), monthIndex = month.getMonth();
  const events = [
    { date: "2011-06-28", title: "Google+ launched", detail: "Google introduced Google+ to the public in an initial field-test phase." },
    { date: "2012-06-27", title: "Android 4.1 Jelly Bean announced", detail: "Jelly Bean was announced at Google I/O 2012." },
    { date: "2012-07-09", title: "Android 4.1 rollout began", detail: "The Android 4.1 update began rolling out to Galaxy Nexus devices." },
    { date: "2012-10-29", title: "Android 4.2 announced", detail: "Android 4.2 was announced as the next Jelly Bean release." }
  ];
  // Keep only the recurring month/day in the public calendar; do not expose the birth year.
  const birthdayEvent = { date: `${year}-${birthdayMonthDay}`, title: "Birthday", detail: "Annual birthday" };
  const allEvents = [...events, birthdayEvent];
  const first = new Date(year, monthIndex, 1).getDay(); const days = new Date(year, monthIndex + 1, 0).getDate();
  const selectedEvents = allEvents.filter(event => event.date === selected);
  return <section className="jb-calendar-app"><h3>CALENDAR</h3><div className="jb-calendar-toolbar"><button onClick={() => setMonth(new Date(year,monthIndex-1,1))}>‹</button><b>{month.toLocaleDateString("en-IN",{month:"long",year:"numeric"})}</b><button onClick={() => setMonth(new Date(year,monthIndex+1,1))}>›</button></div><div className="jb-calendar-grid">{["S","M","T","W","T","F","S"].map((day,i)=><b key={`${day}-${i}`}>{day}</b>)}{Array.from({length:first},(_,i)=><span key={`blank-${i}`}/>)}{Array.from({length:days},(_,i)=>{const date=`${year}-${String(monthIndex+1).padStart(2,"0")}-${String(i+1).padStart(2,"0")}`;const has=allEvents.some(event=>event.date===date);return <button key={date} className={`${selected===date?"selected":""} ${has?"has-event":""}`} onClick={()=>setSelected(date)}>{i+1}{has&&<i/>}</button>;})}</div><div className="jb-calendar-events"><b>{new Date(`${selected}T12:00:00`).toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</b>{selectedEvents.length ? selectedEvents.map(event=><article key={event.title}><strong>{event.title}</strong><p>{event.detail}</p></article>) : <p>No saved events for this date.</p>}</div><small>Public historical dates are fixed references. Birthday repeats every year on 13 December.</small></section>;
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
