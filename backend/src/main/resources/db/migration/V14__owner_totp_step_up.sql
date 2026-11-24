CREATE TABLE admin_totp_credentials (
    issuer VARCHAR(512) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    secret_ciphertext BYTEA NOT NULL,
    secret_iv BYTEA NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT FALSE,
    last_counter BIGINT NOT NULL DEFAULT -1,
    failed_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (issuer, subject)
);
