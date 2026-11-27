-- Correct the public identity and retire the legacy deployment URL.
-- Awarespan must not send visitors to the unrelated/retired kev-ai-device deployment.
UPDATE projects
SET name = 'Awarespan',
    live_url = NULL,
    updated_at = now()
WHERE slug = 'street-safety-device';
