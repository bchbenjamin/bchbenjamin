CREATE TABLE linkedin_publish_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL CHECK (length(trim(content)) BETWEEN 1 AND 3000),
    status VARCHAR(32) NOT NULL CHECK (status IN ('PENDING_REVIEW', 'APPROVED', 'REJECTED', 'PUBLISHING', 'PUBLISHED', 'PUBLISH_FAILED')),
    created_by VARCHAR(200) NOT NULL,
    reviewed_by VARCHAR(200),
    reviewed_at TIMESTAMPTZ,
    linkedin_post_id VARCHAR(240),
    failure_code VARCHAR(80),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    published_at TIMESTAMPTZ
);
CREATE INDEX idx_linkedin_drafts_status_time ON linkedin_publish_drafts (status, created_at DESC);
