import JellyBeanExperience from "@/components/JellyBeanExperience";
import JsonLd from "@/components/JsonLd";
import { pageSeo, projectSchema } from "@/lib/seo";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSiteContent } from "@/lib/content";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const site = await getSiteContent();
  const project = site.projects.find(item => item.slug === slug);
  if (!project) return {};
  return pageSeo(site, "/projects/" + project.slug, project.name, project.summary || project.description);
}

export const dynamic="force-static";
export const revalidate=60;

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  const site = await getSiteContent();
  const project = site.projects.find(item => item.slug === slug);
  if (!project) notFound();

  return <><JsonLd data={{"@context":"https://schema.org",...projectSchema(project,site)}}/><JellyBeanExperience site={site} initialApp="projects" initialProject={slug}/></>;
}

export async function generateStaticParams(){return [];}
