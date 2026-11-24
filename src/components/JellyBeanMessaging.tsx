"use client";

import { FormEvent, useEffect, useState } from "react";
type Profile={name:string;email:string;organization:string};
const apiBase=(process.env.NEXT_PUBLIC_API_BASE_URL||"").replace(/\/$/,"");
const emptyProfile:Profile={name:"",email:"",organization:""};

export default function JellyBeanMessaging({ownerName}:{ownerName:string}){
  const [profile,setProfile]=useState<Profile>(emptyProfile);
  const [profileSetup,setProfileSetup]=useState(false);
  const [compose,setCompose]=useState(false);
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState(false);
  const [status,setStatus]=useState<{kind:"success"|"error";text:string}|null>(null);
  useEffect(()=>{let saved:Profile|undefined;try{const raw=localStorage.getItem("jb-messaging-profile");if(raw)saved={...emptyProfile,...JSON.parse(raw) as Profile};}catch{}if(saved)window.requestAnimationFrame(()=>setProfile(saved!));},[]);
  function update<K extends keyof Profile>(key:K,value:Profile[K]){setProfile(current=>({...current,[key]:value}));}
  function startMessage(){setCompose(true);setStatus(null);if(!profile.name||!profile.email)setProfileSetup(true);}
  function saveProfile(event:FormEvent){event.preventDefault();try{localStorage.setItem("jb-messaging-profile",JSON.stringify(profile));setProfileSetup(false);}catch{setStatus({kind:"error",text:"Could not save contact details on this device."});}}
  async function submit(event:FormEvent){event.preventDefault();if(busy)return;setBusy(true);setStatus(null);
    try{
      localStorage.setItem("jb-messaging-profile",JSON.stringify(profile));
      const response=await fetch(`${apiBase}/api/v1/public/contact`,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify({...profile,subject:"Portfolio enquiry",message:message.trim(),website:""})});
      const result=await response.json().catch(()=>({})) as {message?:string};
      if(!response.ok)throw new Error(result.message||(response.status===429?"Please wait before sending another message.":"Message could not be sent."));
      setStatus({kind:"success",text:"Message submitted. Check your email for the verification link."});setMessage("");
    }catch(error){setStatus({kind:"error",text:error instanceof Error?error.message:"Message could not be sent."});}
    finally{setBusy(false);}
  }
  return <section className="jb-messaging">
    <header className="jb-msg-toolbar">
      {compose&&<button type="button" className="jb-msg-back" onClick={()=>{setCompose(false);setProfileSetup(false);setStatus(null);}} aria-label="Back">‹</button>}
      <div><b>{compose?"New message":"Messaging"}</b>{compose&&<small>To: {ownerName}</small>}</div>
      {compose&&<button type="button" className="jb-msg-menu" aria-label="Edit contact details" onClick={()=>setProfileSetup(true)}>⋮</button>}
    </header>
    {!compose?<>
      <div className="jb-msg-inbox"><div className="jb-msg-empty"><span className="jb-msg-empty-icon" aria-hidden="true"><svg viewBox="0 0 48 48"><path d="M8 11h32v23H20l-8 6v-6H8z"/><path d="M15 19h18M15 25h12"/></svg></span><b>No conversations</b><small>Start a message to {ownerName}</small></div><div className="jb-msg-bottom-bar"><span>Messaging</span><span>SMS</span></div></div>
      <button type="button" className="jb-msg-fab" onClick={startMessage} aria-label="New message"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 17.5V20h2.5L18.8 7.7l-2.5-2.5L4 17.5zM20 6.5a1 1 0 0 0 0-1.4l-1.1-1.1a1 1 0 0 0-1.4 0l-1.2 1.2 2.5 2.5L20 6.5z"/></svg></button>
    </>:<>
      <div className="jb-msg-thread">
        <div className="jb-msg-recipient"><span className="jb-msg-avatar">{ownerName.slice(0,1).toUpperCase()}</span><div><small>To</small><b>{ownerName}</b><small>{profile.email || "Portfolio contact"}</small></div></div>
        {status&&<p className={`jb-msg-status ${status.kind}`} role="status">{status.text}</p>}
      </div>
      <form className="jb-msg-compose" onSubmit={submit}>
        <div className="jb-msg-composer"><textarea value={message} onChange={e=>setMessage(e.target.value)} minLength={20} maxLength={5000} required rows={2} placeholder="Compose message"/><button type="submit" disabled={busy||message.trim().length<20||!profile.name.trim()||!profile.email.trim()} aria-label="Send message">{busy?"…":<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 20.5 21 12 3 3.5 3 10l12 2-12 2z"/></svg>}</button></div>
      </form>
      {profileSetup&&<div className="jb-msg-dialog-backdrop"><form className="jb-msg-profile-dialog" onSubmit={saveProfile}><h3>Your contact</h3><label><span>Name</span><input value={profile.name} onChange={e=>update("name",e.target.value)} autoComplete="name" required minLength={2} maxLength={160} placeholder="Name"/></label><label><span>Email</span><input type="email" value={profile.email} onChange={e=>update("email",e.target.value)} autoComplete="email" required maxLength={320} placeholder="Email address"/></label><label><span>Organisation</span><input value={profile.organization} onChange={e=>update("organization",e.target.value)} autoComplete="organization" maxLength={180} placeholder="Optional"/></label><div><button type="button" onClick={()=>{setProfileSetup(false);setCompose(false);}}>Cancel</button><button type="submit">Save</button></div></form></div>}
    </>}
  </section>;
}
