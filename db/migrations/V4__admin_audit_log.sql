CREATE TABLE admin_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_issuer TEXT NOT NULL,
    actor_subject TEXT NOT NULL,
    action VARCHAR(40) NOT NULL,
    resource VARCHAR(80) NOT NULL,
    resource_id UUID,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_admin_audit_actor_time ON admin_audit_log (actor_issuer, actor_subject, occurred_at DESC);
CREATE INDEX idx_admin_audit_resource_time ON admin_audit_log (resource, resource_id, occurred_at DESC);
