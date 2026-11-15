CREATE TABLE IF NOT EXISTS media_assets (
  public_id TEXT PRIMARY KEY,
  secure_url TEXT NOT NULL,
  bytes INTEGER NOT NULL,
  format TEXT NOT NULL DEFAULT '',
  width INTEGER,
  height INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_media_assets_created ON media_assets(created_at DESC);
