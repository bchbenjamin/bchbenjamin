import JellyBeanExperience from "@/components/JellyBeanExperience";
import { getSiteContent } from "@/lib/content";

import JsonLd from "@/components/JsonLd";
import { pageSeo, portfolioSchema } from "@/lib/seo";

export async function generateMetadata() {
  const site=await getSiteContent();
  const title=(site.owner.name || "Personal") + " — Portfolio";
  return {...pageSeo(site,"/",title,site.owner.intro || site.owner.headline),title:{absolute:title}};
}

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const site = await getSiteContent();
  return <><JsonLd data={portfolioSchema(site)} /><JellyBeanExperience site={site} /></>;
}
