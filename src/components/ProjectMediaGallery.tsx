import Image from "next/image";
import type { ProjectMedia } from "@/lib/content";
import Surface from "@/components/Surface";

export default function ProjectMediaGallery({ media }: { media: ProjectMedia[] }) {
  if (!media?.length) return null;
  return (
    <section className="project-detail-media" aria-label="Project photos, videos and documents">
      <div><p className="eyebrow">PROJECT MEDIA / THE BUILD</p><h2>See it in action.</h2></div>
      <div className="project-media-grid">
        {media.map((asset) => {
          const type = asset.content_type;
          const label = asset.caption || asset.original_filename;
          return (
            <Surface as="article" className="project-media-item" key={asset.id}>
              {type.startsWith("image/") ? (
                <div className="project-media-visual"><Image unoptimized fill sizes="(max-width: 760px) 100vw, 50vw" src={asset.url} alt={asset.alt_text || label} /></div>
              ) : type.startsWith("video/") ? (
                <div className="project-media-visual"><video src={asset.url} controls playsInline preload="metadata" aria-label={label} /></div>
              ) : type === "application/pdf" ? (
                <iframe src={`${asset.url}#view=FitH`} title={label} loading="lazy" />
              ) : null}
              <p className="project-media-caption">{label}</p>
              {type === "application/pdf" && <a className="project-media-open" href={asset.url} target="_blank" rel="noreferrer">Open document ↗</a>}
            </Surface>
          );
        })}
      </div>
    </section>
  );
}
