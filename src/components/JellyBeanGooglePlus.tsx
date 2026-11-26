"use client";
import Image from "next/image";
import type {SiteContent} from "@/lib/content";
import {profileLinks} from "@/lib/profile-links";

export default function JellyBeanGooglePlus({site,onHome}:{site:SiteContent;onHome:()=>void}){
 const links=profileLinks(site);
 return <section className="jb-googleplus" aria-label="Google+ profile links">
   <div className="jb-gplus-profile"><Image src="/logo.svg" width={64} height={64} unoptimized alt=""/><div><h2>{site.owner.name||"Portfolio"}</h2>{site.owner.headline&&<p>{site.owner.headline}</p>}</div></div>
   <h3 className="jb-holo-section">Links</h3>
   <div className="jb-holo-link-list">
   {links.map(link=>{const content=<><Image src={link.icon} alt="" width={40} height={40} unoptimized/><span><b>{link.label}</b><small>{link.detail}</small></span></>;
    return link.internal?<button className="jb-holo-link-row" key={link.href} onClick={onHome}>{content}</button>:<a className="jb-holo-link-row" key={link.href} href={link.href} target={link.href.startsWith("mailto:")?undefined:"_blank"} rel="noopener noreferrer">{content}</a>;
   })}
   </div>
 </section>;
}
