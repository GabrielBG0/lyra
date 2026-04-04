CREATE TABLE IF NOT EXISTS "songs" (
    "id"          TEXT PRIMARY KEY,
    "title"       TEXT NOT NULL,
    "status"      TEXT NOT NULL,
    "bpm"         INTEGER,
    "key_sig"     TEXT,
    "genre"       TEXT NOT NULL DEFAULT '[]',
    "file_path"   TEXT NOT NULL UNIQUE,
    "created_at"  TEXT NOT NULL,
    "updated_at"  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_songs_status" ON "songs" ("status");
CREATE INDEX IF NOT EXISTS "idx_updated_at" ON "songs" ("updated_at" DESC);