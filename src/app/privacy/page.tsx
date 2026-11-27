"use client";
import HoloAuth from "@/components/HoloAuth";
import Link from "next/link";
import {useEffect,useState} from "react";
export default function Privacy(){
 const [disabled,setDisabled]=useState(false);
 useEffect(()=>{const t=setTimeout(()=>setDisabled(localStorage.getItem("analytics-opt-out")==="1"),0);return ()=>clearTimeout(t);},[]);
 return <HoloAuth title="Privacy"><h1>Analytics privacy</h1><p>This website collects aggregate page visits, country, browser, operating system, available device model and campaign tags. It does not store visitor identifiers or IP addresses in its analytics database. Viewing minutes are estimated from visible-page heartbeats. Global Privacy Control and Do Not Track are respected.</p><button className="button" onClick={()=>{localStorage.setItem("analytics-opt-out",disabled?"0":"1");setDisabled(!disabled);}}>{disabled?"Enable analytics":"Disable analytics"}</button><p>Analytics preference: {disabled?"Disabled":"Enabled"}</p><Link href="/">Return to portfolio</Link></HoloAuth>;
}
