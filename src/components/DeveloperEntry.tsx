"use client";
import {useEffect,useState,type ReactNode} from "react";
import {hasAdminEntry} from "@/lib/admin-entry";
export default function DeveloperEntry({children}:{children:ReactNode}){
 const [allowed,setAllowed]=useState(false);
 useEffect(()=>{
  if(!hasAdminEntry()){window.location.replace("/");return;}
  const id=requestAnimationFrame(()=>setAllowed(true));
  return ()=>cancelAnimationFrame(id);
 },[]);
 return <div className="kippo-admin">{allowed?children:<p className="kippo-loading" role="status">Checking entry…</p>}</div>;
}
