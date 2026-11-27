CREATE TABLE contact_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_name VARCHAR(160) NOT NULL,
    organization VARCHAR(180),
    sender_email VARCHAR(320) NOT NULL,
    subject VARCHAR(180) NOT NULL,
    message TEXT NOT NULL CHECK (length(message) BETWEEN 20 AND 5000),
    ai_decision VARCHAR(16) NOT NULL CHECK (ai_decision IN ('APPROVE', 'REVIEW', 'REJECT')),
    ai_confidence NUMERIC(5,4),
    ai_risk_score SMALLINT CHECK (ai_risk_score BETWEEN 0 AND 100),
    ai_identity_assessment VARCHAR(500),
    ai_reason VARCHAR(1000),
    status VARCHAR(32) NOT NULL CHECK (status IN ('PENDING_EMAIL_VERIFICATION', 'PENDING_REVIEW', 'APPROVED', 'NOTIFYING', 'REJECTED', 'NOTIFIED', 'VERIFICATION_FAILED', 'DELIVERY_FAILED')),
    verification_token_hash VARCHAR(64),
    verification_expires_at TIMESTAMPTZ,
    email_verified_at TIMESTAMPTZ,
    notification_sent_at TIMESTAMPTZ,
    notification_attempts INTEGER NOT NULL DEFAULT 0,
    notification_error VARCHAR(500),
    reviewed_by VARCHAR(200),
    reviewed_at TIMESTAMPTZ,
    review_note VARCHAR(500),
    ip_hash VARCHAR(64),
    user_agent VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_contact_status_created ON contact_submissions(status, created_at DESC);
CREATE INDEX idx_contact_email_created ON contact_submissions(sender_email, created_at DESC);
CREATE INDEX idx_contact_verification ON contact_submissions(verification_token_hash, verification_expires_at)
    WHERE verification_token_hash IS NOT NULL;

-- Shared per-IP contact quota so rate limits remain effective across serverless container instances.
CREATE TABLE contact_rate_limits (
    ip_hash VARCHAR(64) NOT NULL,
    window_start BIGINT NOT NULL,
    request_count INTEGER NOT NULL,
    PRIMARY KEY (ip_hash, window_start)
);
CREATE INDEX idx_contact_rate_limits_window ON contact_rate_limits(window_start);
