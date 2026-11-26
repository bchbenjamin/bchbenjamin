"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
export default function PortfolioTelemetry(){
 const path=usePathname();

 useEffect(()=>{
  if(window.top!==window.self || /^\/(admin|login|api|privacy)(\/|$)/.test(path) || navigator.doNotTrack==="1" || (navigator as Navigator & {globalPrivacyControl?:boolean}).globalPrivacyControl || localStorage.getItem("analytics-opt-out")==="1") return;
  let cancelled=false;
  const ua=navigator.userAgent;
  const hints=(navigator as Navigator & {userAgentData?:{getHighEntropyValues:(keys:string[])=>Promise<{model?:string;platform?:string}>}}).userAgentData;
  const params=new URLSearchParams(location.search);
  const data={model:"Unknown",os:/Android/.test(ua)?"Android":/iPhone|iPad/.test(ua)?"iOS":/Windows/.test(ua)?"Windows":/Macintosh/.test(ua)?"macOS":/Linux/.test(ua)?"Linux":"Unknown",browser:/Edg/.test(ua)?"Edge":/Firefox/.test(ua)?"Firefox":/Chrome/.test(ua)?"Chrome":/Safari/.test(ua)?"Safari":"Unknown",source:params.get("utm_source")||"Direct",medium:params.get("utm_medium")||"Unknown",campaign:params.get("utm_campaign")||"Unknown"};
  let first=true;
  const send=()=>{if(cancelled||document.visibilityState!=="visible"||localStorage.getItem("analytics-opt-out")==="1")return; const event=first?"visit":"heartbeat";first=false;void fetch("/api/v1/public/analytics",{method:"POST",credentials:"omit",headers:{"Content-Type":"application/json"},body:JSON.stringify({...data,event}),keepalive:true}).catch(()=>{});};
  void (async()=>{try{const h=await hints?.getHighEntropyValues(["model","platform"]);if(h?.model)data.model=h.model;}catch{}send();})();
  const timer=setInterval(send,30000);
  return()=>{cancelled=true;clearInterval(timer);};
 },[path]);
 return null;
}
