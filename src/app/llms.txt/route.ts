import {getSiteContent} from "@/lib/content";
import {SITE_ORIGIN} from "@/lib/seo";
export const dynamic="force-static";
export const revalidate=60;
export async function GET(){
 const s=await getSiteContent();
 const text=["# "+(s.owner.name||"Portfolio"),s.owner.headline,s.owner.intro,"## Public projects",...s.projects.map(p=>"- ["+p.name+"]("+SITE_ORIGIN+"/projects/"+p.slug+"): "+p.summary),"## Experience",...s.experience.map(e=>"- "+e.title+" — "+e.organization+" ("+e.period+") "+e.description),"## Certifications and achievements",...s.achievements.map(a=>"- "+a.title+" — "+(a.issuer||"")+" "+a.detail),"## Pages",...["about","projects","experience","links"].map(x=>"- ["+x+"]("+SITE_ORIGIN+"/"+x+")")].filter(Boolean).join("\n\n");
 return new Response(text,{headers:{"Content-Type":"text/plain; charset=utf-8","Cache-Control":"no-store"}});
}
