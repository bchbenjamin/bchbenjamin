import Image from "next/image";
import ProjectVisual from "@/components/ProjectVisual";
import type { Project } from "@/lib/content";

export default function ProjectArtwork({ project, priority = false }: { project: Project; priority?: boolean }) {
  if (!project.imageUrl) return <ProjectVisual variant={project.visual} name={project.name} />;
  return (
    <div className="project-visual project-visual-image">
      <Image
        unoptimized
        fill
        priority={priority}
        sizes="(max-width: 700px) 82vw, (max-width: 1100px) 42vw, 390px"
        src={project.imageUrl}
        alt={project.imageAlt || `${project.name} project image`}
      />
    </div>
  );
}
