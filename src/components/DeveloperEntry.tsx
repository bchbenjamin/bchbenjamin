"use client";
import {useEffect,useState,type ReactNode} from "react";
import HoloAuth from "@/components/HoloAuth";
import {hasAdminEntry} from "@/lib/admin-entry";
export default function DeveloperEntry({children}:{children:ReactNode}){
 const [allowed,setAllowed]=useState(false);
 useEffect(()=>{
  if(!hasAdminEntry()){window.location.replace("/");return;}
  const id=requestAnimationFrame(()=>setAllowed(true));
  return ()=>cancelAnimationFrame(id);
 },[]);
 return <div className="kippo-admin">{allowed?children:<HoloAuth><p role="status">Checking entry…</p></HoloAuth>}</div>;
}
