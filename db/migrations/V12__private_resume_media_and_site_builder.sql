-- Per-record public field allowlists and extensible metadata.
ALTER TABLE profile ADD COLUMN public_fields JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE profile ADD COLUMN custom_fields JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE projects ADD COLUMN public_fields JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE projects ADD COLUMN custom_fields JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE experience ADD COLUMN public_fields JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE experience ADD COLUMN custom_fields JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE education ADD COLUMN public_fields JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE education ADD COLUMN custom_fields JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE skill_groups ADD COLUMN public_fields JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE skill_groups ADD COLUMN custom_fields JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE achievements ADD COLUMN public_fields JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE achievements ADD COLUMN custom_fields JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE skills ADD COLUMN public_fields JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE skills ADD COLUMN custom_fields JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Preserve the current published portfolio while making new records private by default.
UPDATE profile SET public_fields = '{"fullName":true,"headline":true,"summary":true,"location":true,"email":true,"websiteUrl":true,"githubUrl":true}'::jsonb WHERE published = TRUE;
UPDATE projects SET public_fields = '{"slug":true,"name":true,"tagline":true,"summary":true,"description":true,"role":true,"status":true,"repositoryUrl":true,"liveUrl":true,"featured":true,"startedOn":true,"completedOn":true}'::jsonb WHERE published = TRUE;
UPDATE experience SET public_fields = '{"roleTitle":true,"organization":true,"employmentType":true,"location":true,"description":true,"startedOn":true,"endedOn":true,"isCurrent":true}'::jsonb WHERE published = TRUE;
UPDATE education SET public_fields = '{"institution":true,"qualification":true,"fieldOfStudy":true,"location":true,"description":true,"startedOn":true,"endedOn":true,"grade":true}'::jsonb WHERE published = TRUE;
UPDATE skill_groups SET public_fields = '{"name":true,"description":true}'::jsonb WHERE published = TRUE;
UPDATE achievements SET public_fields = '{"category":true,"title":true,"detail":true,"awardedOn":true,"issuer":true,"credentialUrl":true}'::jsonb WHERE published = TRUE;
UPDATE skills SET public_fields = '{"name":true,"proficiency":true}'::jsonb;

-- Media bytes are private by default; the public route serves only explicitly published assets.
CREATE TABLE custom_field_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_type VARCHAR(40) NOT NULL CHECK (resource_type IN ('profile', 'project', 'experience', 'education', 'skill-group', 'skill', 'achievement')),
    field_key VARCHAR(80) NOT NULL,
    label VARCHAR(120) NOT NULL,
    field_type VARCHAR(24) NOT NULL CHECK (field_type IN ('text', 'long-text', 'url', 'date', 'number', 'boolean', 'select', 'multi-select', 'rich-text', 'media')),
    options JSONB NOT NULL DEFAULT '[]'::jsonb,
    public_by_default BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (resource_type, field_key)
);

CREATE TABLE media_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_filename VARCHAR(255) NOT NULL,
    content_type VARCHAR(120) NOT NULL,
    byte_size BIGINT NOT NULL CHECK (byte_size >= 0 AND byte_size <= 12582912),
    alt_text VARCHAR(300) NOT NULL DEFAULT '',
    caption VARCHAR(500) NOT NULL DEFAULT '',
    visibility VARCHAR(16) NOT NULL DEFAULT 'PRIVATE' CHECK (visibility IN ('PRIVATE', 'PUBLIC')),
    file_bytes BYTEA NOT NULL,
    uploaded_by VARCHAR(200) NOT NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_media_visibility_uploaded ON media_assets (visibility, uploaded_at DESC);

CREATE TABLE media_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    media_id UUID NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
    resource_type VARCHAR(40) NOT NULL CHECK (resource_type IN ('project', 'achievement', 'experience', 'education', 'profile')),
    resource_id UUID NOT NULL,
    purpose VARCHAR(40) NOT NULL DEFAULT 'gallery',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (media_id, resource_type, resource_id, purpose)
);
CREATE INDEX idx_media_relationship_resource ON media_relationships (resource_type, resource_id, purpose, sort_order);

-- Per-owner page configuration. Public APIs expose only this sanitized JSON document.
CREATE TABLE site_configuration (
    id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    draft_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    published_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    published_at TIMESTAMPTZ
);
INSERT INTO site_configuration (id, draft_config, published_config)
VALUES (1,
  '{"home":{"sections":[{"id":"hero","type":"hero","enabled":true,"order":10},{"id":"principles","type":"principles","enabled":true,"order":15},{"id":"achievement-gallery","type":"achievement-gallery","enabled":true,"order":20},{"id":"projects","type":"projects","enabled":true,"order":30},{"id":"about","type":"about","enabled":true,"order":40},{"id":"skills","type":"skills","enabled":true,"order":50},{"id":"contact","type":"contact","enabled":true,"order":60}],"content":{"heroEyebrow":"INDEPENDENT BUILDER / SOFTWARE & SYSTEMS","focus":"AI · Data · Edge · Web","aboutTitle":"Curious by default.\nPractical by design.","aboutParagraphs":["I enjoy working where software meets the physical world: an application that people can rely on, a model that runs within a real hardware budget, or a data pipeline that turns messy inputs into something useful.","I care about the details behind the interface too — architecture, performance, maintainability and the trade-offs that make a product dependable."],"projectsTitle":"Projects with a purpose.","projectsDescription":"A snapshot of things I’m building, exploring and learning from.","skillsTitle":"A toolkit that keeps evolving.","skillsDescription":"I choose tools around the problem, not the other way around.","contactTitle":"Have a thoughtful problem worth solving?","contactDescription":"I’m always interested in good engineering conversations and worthwhile collaborations."}}}'::jsonb,
  '{"home":{"sections":[{"id":"hero","type":"hero","enabled":true,"order":10},{"id":"principles","type":"principles","enabled":true,"order":15},{"id":"achievement-gallery","type":"achievement-gallery","enabled":true,"order":20},{"id":"projects","type":"projects","enabled":true,"order":30},{"id":"about","type":"about","enabled":true,"order":40},{"id":"skills","type":"skills","enabled":true,"order":50},{"id":"contact","type":"contact","enabled":true,"order":60}],"content":{"heroEyebrow":"INDEPENDENT BUILDER / SOFTWARE & SYSTEMS","focus":"AI · Data · Edge · Web","aboutTitle":"Curious by default.\nPractical by design.","aboutParagraphs":["I enjoy working where software meets the physical world: an application that people can rely on, a model that runs within a real hardware budget, or a data pipeline that turns messy inputs into something useful.","I care about the details behind the interface too — architecture, performance, maintainability and the trade-offs that make a product dependable."],"projectsTitle":"Projects with a purpose.","projectsDescription":"A snapshot of things I’m building, exploring and learning from.","skillsTitle":"A toolkit that keeps evolving.","skillsDescription":"I choose tools around the problem, not the other way around.","contactTitle":"Have a thoughtful problem worth solving?","contactDescription":"I’m always interested in good engineering conversations and worthwhile collaborations."}}}'::jsonb
);

-- Generated resume records and PDFs remain in the authenticated owner data plane.
CREATE TABLE resume_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mode VARCHAR(16) NOT NULL CHECK (mode IN ('GENERAL', 'JOB_DESCRIPTION')),
    template_id VARCHAR(32) NOT NULL DEFAULT 'ats',
    job_description TEXT,
    source_snapshot JSONB NOT NULL,
    selection JSONB NOT NULL,
    match_report JSONB NOT NULL DEFAULT '{}'::jsonb,
    model_used VARCHAR(160),
    pdf_bytes BYTEA NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_resume_generations_created ON resume_generations (created_at DESC);
