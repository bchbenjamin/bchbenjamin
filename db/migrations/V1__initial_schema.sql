CREATE TABLE schema_metadata (
    id SMALLINT PRIMARY KEY CHECK (id = 1),
    schema_version VARCHAR(32) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO schema_metadata (id, schema_version) VALUES (1, 'phase-1-foundation');
