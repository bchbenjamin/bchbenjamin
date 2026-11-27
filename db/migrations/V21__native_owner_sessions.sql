CREATE TABLE native_owner_sessions (
 token_hash CHAR(64) PRIMARY KEY,
 issuer TEXT NOT NULL,
 subject TEXT NOT NULL,
 name TEXT NOT NULL DEFAULT '',
 email TEXT NOT NULL DEFAULT '',
 csrf_token CHAR(64) NOT NULL,
 expires_at TIMESTAMPTZ NOT NULL DEFAULT now()+interval '8 hours',
 elevated_until TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX native_owner_sessions_expiry ON native_owner_sessions(expires_at);
CREATE TABLE native_media_uploads (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 issuer TEXT NOT NULL,
 subject TEXT NOT NULL,
 metadata JSONB NOT NULL,
 byte_size INTEGER NOT NULL CHECK (byte_size BETWEEN 1 AND 12582912),
 expires_at TIMESTAMPTZ NOT NULL DEFAULT now()+interval '1 hour',
 completed BOOLEAN NOT NULL DEFAULT false
);
CREATE TABLE native_media_parts (
 upload_id UUID NOT NULL REFERENCES native_media_uploads(id) ON DELETE CASCADE,
 part INTEGER NOT NULL CHECK (part BETWEEN 0 AND 5),
 bytes BYTEA NOT NULL CHECK (octet_length(bytes) BETWEEN 1 AND 2097152),
 PRIMARY KEY(upload_id,part)
);
