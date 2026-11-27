-- Do not expose a private source repository through the public portfolio.
UPDATE projects
SET repository_url = NULL
WHERE slug = 'ai-ida';
