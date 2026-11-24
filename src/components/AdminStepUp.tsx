"use client";

import { FormEvent, useState } from "react";
const apiBase=(process.env.NEXT_PUBLIC_API_BASE_URL??"").replace(/\/$/,"");
async function csrf(){const response=await fetch(`${apiBase}/api/v1/csrf`,{credentials:"include",cache:"no-store"});if(!response.ok)throw new Error("Could not start a secure session.");return (await response.json() as {token:string}).token;}

export default function AdminStepUp({configured,onVerified}:{configured:boolean;onVerified:()=>void}){
  const [secret,setSecret]=useState("");
  const [code,setCode]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [enrolling,setEnrolling]=useState(false);
  async function begin(){setBusy(true);setError("");try{const token=await csrf();const response=await fetch(`${apiBase}/api/v1/admin/totp/enroll`,{method:"POST",credentials:"include",headers:{"X-XSRF-TOKEN":token}});const result=await response.json() as {secret?:string;message?:string};if(!response.ok)throw new Error(result.message||"Could not start authenticator setup.");setSecret(result.secret||"");setEnrolling(true);}catch(e){setError(e instanceof Error?e.message:"Authenticator setup failed.");}finally{setBusy(false);}}
  async function submit(event:FormEvent){event.preventDefault();if(code.length!==6)return;setBusy(true);setError("");try{const token=await csrf();const response=await fetch(`${apiBase}/api/v1/admin/totp/${enrolling?"confirm":"verify"}`,{method:"POST",credentials:"include",headers:{"Content-Type":"application/json","X-XSRF-TOKEN":token},body:JSON.stringify({code})});const result=await response.json().catch(()=>({})) as {message?:string};if(!response.ok)throw new Error(result.message||"Code rejected. Check your authenticator and try again.");onVerified();}catch(e){setError(e instanceof Error?e.message:"Verification failed.");setCode("");}finally{setBusy(false);}}
  return <section className="admin-step-up" aria-labelledby="admin-step-title">
    <p className="eyebrow">OWNER SECURITY</p>
    <h2 id="admin-step-title">{configured?"Verify authenticator":"Set up authenticator"}</h2>
    {configured?<p>Enter the current six-digit code from your authenticator app.</p>:<>
      <p>Scan this one-time setup key in your authenticator app. It will generate a new six-digit code every 30 seconds.</p>
      {!secret?<button className="button button-primary" type="button" disabled={busy} onClick={()=>void begin()}>{busy?"Preparing…":"Set up authenticator"}</button>:<div className="admin-totp-secret"><span>Manual setup key</span><code>{secret}</code><button type="button" onClick={()=>void navigator.clipboard.writeText(secret)}>Copy setup key</button></div>}
    </>}
    {(configured||secret)&&<form onSubmit={submit} className="admin-totp-form"><label htmlFor="admin-totp-code">Six-digit code</label><input id="admin-totp-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,"").slice(0,6))} placeholder="000000" required/><button className="button button-primary" type="submit" disabled={busy||code.length!==6}>{busy?"Verifying…":"Verify and continue"}</button></form>}
    {error&&<p className="admin-step-error" role="alert">{error}</p>}
    <p className="admin-step-note">Your authenticator secret is encrypted at rest and is only shown during setup. Administrative APIs remain locked until verification.</p>
  </section>;
}
