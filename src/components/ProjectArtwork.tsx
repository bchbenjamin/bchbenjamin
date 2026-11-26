import Image from "next/image";
import type { Project } from "@/lib/content";

export default function ProjectArtwork({ project, priority = false }: { project: Project; priority?: boolean }) {
  const media = project.media ?? [];
  const video = media.find((asset) => asset.content_type.startsWith("video/"));
  const types = [
    { key: "image", label: "PHOTO", count: media.filter((asset) => asset.content_type.startsWith("image/")).length },
    { key: "video", label: "VIDEO", count: media.filter((asset) => asset.content_type.startsWith("video/")).length },
    { key: "pdf", label: "PDF", count: media.filter((asset) => asset.content_type === "application/pdf").length }
  ].filter((item) => item.count > 0);
  const preview = project.imageUrl ? (
    <Image unoptimized fill priority={priority} sizes="(max-width: 700px) 82vw, (max-width: 1100px) 42vw, 390px" src={project.imageUrl} alt={project.imageAlt || `${project.name} project image`} />
  ) : video ? (
    <video src={video.url} muted autoPlay loop playsInline preload="metadata" aria-label={`${project.name} video preview`} />
  ) : null;
  const mediaBadge = types.length > 0 && <span className="project-media-types" aria-label={`Project media: ${types.map((item) => `${item.count} ${item.label.toLowerCase()}`).join(", ")}`}>{types.map((item) => <i key={item.key}>{item.label} <b>{item.count}</b></i>)}</span>;
  if (!preview) return mediaBadge ? <div className="project-media-summary">{mediaBadge}</div> : null;
  return <div className="project-visual project-visual-image">{preview}{mediaBadge}</div>;
}
