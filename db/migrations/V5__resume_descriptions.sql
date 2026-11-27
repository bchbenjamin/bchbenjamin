ALTER TABLE projects
    ADD COLUMN short_description VARCHAR(500),
    ADD COLUMN resume_description VARCHAR(700);

UPDATE projects
SET short_description = summary,
    resume_description = summary;

ALTER TABLE projects
    ALTER COLUMN short_description SET NOT NULL,
    ALTER COLUMN resume_description SET NOT NULL;
