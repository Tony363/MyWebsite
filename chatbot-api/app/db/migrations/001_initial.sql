CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repo_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    language TEXT,
    chunk_type TEXT NOT NULL,
    function_name TEXT,
    class_name TEXT,
    heading_path TEXT,
    content TEXT NOT NULL,
    start_line INTEGER,
    end_line INTEGER,
    token_count INTEGER,
    sha TEXT NOT NULL,
    embedding vector(1024),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chunks_embedding ON chunks
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);
CREATE INDEX idx_chunks_repo ON chunks(repo_name);
CREATE INDEX idx_chunks_type ON chunks(chunk_type);
CREATE UNIQUE INDEX idx_chunks_dedup ON chunks(repo_name, file_path, sha, start_line);

CREATE TABLE indexing_state (
    repo_name TEXT PRIMARY KEY,
    last_indexed_sha TEXT,
    last_indexed_at TIMESTAMPTZ,
    file_count INTEGER,
    chunk_count INTEGER,
    status TEXT DEFAULT 'pending'
);
