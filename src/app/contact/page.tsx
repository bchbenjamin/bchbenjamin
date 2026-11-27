import JellyBeanExperience from "@/components/JellyBeanExperience";
import {getSiteContent} from "@/lib/content";
import {pageSeo} from "@/lib/seo";
export const dynamic="force-dynamic";
export async function generateMetadata(){const site=await getSiteContent();return pageSeo(site,"/contact","Contact",site.owner.headline);}
export default async function Page(){const site=await getSiteContent();return <JellyBeanExperience site={site} initialApp="contact"/>;}
