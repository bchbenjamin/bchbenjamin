import type {Metadata} from "next";
import JellyBeanExperience from "@/components/JellyBeanExperience";
import {getSiteContent} from "@/lib/content";
import {pageSeo} from "@/lib/seo";

export const dynamic="force-dynamic";
export async function generateMetadata():Promise<Metadata>{
 const site=await getSiteContent();
 return pageSeo(site,"/links","Profile Links","Official profile and contact links.");
}
export default async function LinksPage(){
 const site=await getSiteContent();
 return <JellyBeanExperience site={site} initialApp="googleplus"/>;
}
