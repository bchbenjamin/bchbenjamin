"use client";
import {useEffect,useRef,useState} from "react";
import {medianLatency,megabitsPerSecond} from "@/lib/speed-test";

type Result={ping:number;download:number;upload:number};
type ConnectionInfo={type?:string;effectiveType?:string};
export default function JellyBeanWifi(){
 const [phase,setPhase]=useState("");
 const [result,setResult]=useState<Result|null>(null);
 const [error,setError]=useState("");
 const [connection,setConnection]=useState("Checking connection…");
 const controller=useRef<AbortController|null>(null);
 const running=useRef(false);
 useEffect(()=>{
  const info=()=>{const c=(navigator as Navigator&{connection?:ConnectionInfo}).connection;setConnection(!navigator.onLine?"Offline":c?.type==="wifi"?"Wi-Fi connected":c?.type==="cellular"?"Mobile data connected":"Internet connected · network type unavailable");};
  info();window.addEventListener("online",info);window.addEventListener("offline",info);
  return()=>{controller.current?.abort();window.removeEventListener("online",info);window.removeEventListener("offline",info);};
 },[]);
 async function start(){
  if(running.current)return;
  running.current=true;setResult(null);setError("");setPhase("Measuring latency…");
  const abort=new AbortController();controller.current=abort;
  const timeout=window.setTimeout(()=>abort.abort("timeout"),30000);
  const base="/api/speed-test";
  const options={signal:abort.signal,cache:"no-store" as const,credentials:"omit" as const};
  try{
   const ping:number[]=[];
   // Warm up the endpoint first, then measure three round trips.
   for(let i=0;i<4;i++){
    const t=performance.now();
    const response=await fetch(base+"?mode=ping",options);
    if(!response.ok)throw Error("Speed-test server is unavailable.");
    if(i>0)ping.push(performance.now()-t);
   }
   setPhase("Measuring download…");
   const downStart=performance.now();
   const response=await fetch(base+"?mode=download",options);
   if(!response.ok)throw Error("Download test failed.");
   const bytes=(await response.arrayBuffer()).byteLength;
   if(bytes!==2*1024*1024)throw Error("Incomplete test download.");
   const download=megabitsPerSecond(bytes,performance.now()-downStart);
   setPhase("Measuring upload…");
   const data=new Uint8Array(1024*1024);
   for(let i=0;i<data.length;i+=65536)crypto.getRandomValues(data.subarray(i,i+65536));
   const upStart=performance.now();
   const uploadResponse=await fetch(base,{...options,method:"POST",headers:{"Content-Type":"application/octet-stream"},body:data});
   if(!uploadResponse.ok)throw Error("Upload test failed.");
   const uploaded=await uploadResponse.json() as {bytes:number};
   if(uploaded.bytes!==data.length)throw Error("Incomplete test upload.");
   const upload=megabitsPerSecond(uploaded.bytes,performance.now()-upStart);
   setResult({ping:medianLatency(ping),download,upload});
  }catch(e){setError(abort.signal.aborted?(abort.signal.reason==="timeout"?"Test timed out. Try again.":"Test cancelled."):(e instanceof Error?e.message:"Speed test failed."));}
  finally{window.clearTimeout(timeout);running.current=false;controller.current=null;setPhase("");}
 }
 return <div className="jb-wifi-screen">
  <div className="jb-wifi-state"><span className="jb-wifi-indicator" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M2 10a23 23 0 0 1 28 0M7 16a15 15 0 0 1 18 0M12 22a7 7 0 0 1 8 0" fill="none" stroke="currentColor" strokeWidth="2.5"/><circle cx="16" cy="27" r="2" fill="currentColor"/></svg></span><div><b>Network connection</b><small>{connection}</small></div></div>
  <h3>INTERNET SPEED TEST</h3>
  <div className="jb-wifi-metrics" aria-live="polite">
   <div><span>Download</span><b>{result?result.download.toFixed(1):"—"}</b><small>Mbps</small></div>
   <div><span>Upload</span><b>{result?result.upload.toFixed(1):"—"}</b><small>Mbps</small></div>
   <div><span>Latency</span><b>{result?Math.round(result.ping):"—"}</b><small>ms</small></div>
  </div>
  <p className="jb-wifi-phase" role="status">{phase||error||(result?"Test complete":"Ready to test")}</p>
  {phase?<><progress aria-label="Speed test running"/><button onClick={()=>controller.current?.abort()}>Cancel</button></>:<button onClick={()=>void start()}>{result?"Test again":"Start speed test"}</button>}
  <p className="jb-wifi-note">Tests your connection to this website, using about 3 MB of data. Results are estimates, not your router’s maximum link speed. No SSID, device identifier or test result is saved by this feature.</p>
 </div>;
}
