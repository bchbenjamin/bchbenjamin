CREATE TABLE agent_api_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    token_prefix VARCHAR(24) NOT NULL,
    name VARCHAR(120) NOT NULL,
    scopes TEXT NOT NULL,
    created_by VARCHAR(200) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ
);
CREATE INDEX idx_agent_tokens_active ON agent_api_tokens (token_hash, expires_at) WHERE revoked_at IS NULL;

CREATE TABLE agent_change_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource VARCHAR(80) NOT NULL,
    operation VARCHAR(20) NOT NULL CHECK (operation IN ('CREATE', 'UPDATE', 'DELETE')),
    target_id UUID,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(24) NOT NULL DEFAULT 'PENDING_REVIEW' CHECK (status IN ('PENDING_REVIEW', 'APPROVED', 'REJECTED')),
    created_by VARCHAR(120) NOT NULL,
    reviewed_by VARCHAR(200),
    review_note VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_at TIMESTAMPTZ
);
CREATE INDEX idx_agent_proposals_review ON agent_change_proposals (status, created_at DESC);
