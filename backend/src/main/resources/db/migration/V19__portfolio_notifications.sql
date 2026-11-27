CREATE TABLE portfolio_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(160) NOT NULL,
    body VARCHAR(1000) NOT NULL,
    target VARCHAR(1000) NOT NULL,
    published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    CHECK (expires_at > published_at)
);
CREATE INDEX portfolio_notifications_active_idx ON portfolio_notifications(expires_at) WHERE NOT revoked;
