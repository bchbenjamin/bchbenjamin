CREATE TABLE linkedin_authorized_clients (
    principal_name VARCHAR(200) PRIMARY KEY,
    registration_id VARCHAR(80) NOT NULL,
    access_token_ciphertext BYTEA NOT NULL,
    access_token_iv BYTEA NOT NULL,
    refresh_token_ciphertext BYTEA,
    refresh_token_iv BYTEA,
    token_type VARCHAR(40) NOT NULL DEFAULT 'Bearer',
    scopes TEXT NOT NULL DEFAULT '',
    issued_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
