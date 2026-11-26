ALTER TABLE media_assets ADD COLUMN storage_path VARCHAR(500) NOT NULL DEFAULT '';
ALTER TABLE media_assets ADD COLUMN follow_record BOOLEAN NOT NULL DEFAULT FALSE;

-- A media record can either have its own publication state or follow its linked content.
-- A draft attachment never becomes visible until its linked content is published.
CREATE VIEW public_media_assets AS
SELECT m.* FROM media_assets m
WHERE m.visibility = 'PUBLIC' AND (
    NOT m.follow_record OR EXISTS (
        SELECT 1 FROM media_relationships mr
        WHERE mr.media_id=m.id AND (
            (mr.resource_type='project' AND EXISTS (SELECT 1 FROM projects p WHERE p.id=mr.resource_id AND p.published)) OR
            (mr.resource_type='achievement' AND EXISTS (SELECT 1 FROM achievements a WHERE a.id=mr.resource_id AND a.published)) OR
            (mr.resource_type='experience' AND EXISTS (SELECT 1 FROM experience e WHERE e.id=mr.resource_id AND e.published)) OR
            (mr.resource_type='education' AND EXISTS (SELECT 1 FROM education d WHERE d.id=mr.resource_id AND d.published)) OR
            (mr.resource_type='profile' AND EXISTS (SELECT 1 FROM profile p WHERE p.id=mr.resource_id AND p.published))
        )
    )
);
