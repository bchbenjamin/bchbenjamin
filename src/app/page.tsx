import JellyBeanExperience from "@/components/JellyBeanExperience";
import { getSiteContent } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const site = await getSiteContent();
  return <JellyBeanExperience site={site} />;
}
