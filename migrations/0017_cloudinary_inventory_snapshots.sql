-- Persistent, resumable snapshots for bounded Cloudinary image/raw inventory scans.
CREATE TABLE IF NOT EXISTS cloudinary_inventory_scans (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running','complete','failed','stale')),
  image_cursor TEXT,
  raw_cursor TEXT,
  image_complete INTEGER NOT NULL DEFAULT 0 CHECK (image_complete IN (0,1)),
  raw_complete INTEGER NOT NULL DEFAULT 0 CHECK (raw_complete IN (0,1)),
  image_pages INTEGER NOT NULL DEFAULT 0,
  raw_pages INTEGER NOT NULL DEFAULT 0,
  image_lease_until TEXT,
  raw_lease_until TEXT,
  last_error TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_cloudinary_inventory_scans_status
  ON cloudinary_inventory_scans(status, updated_at);

CREATE TABLE IF NOT EXISTS cloudinary_inventory_assets (
  scan_id TEXT NOT NULL REFERENCES cloudinary_inventory_scans(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('image','raw')),
  public_id TEXT NOT NULL,
  secure_url TEXT,
  bytes INTEGER,
  format TEXT,
  PRIMARY KEY (scan_id, resource_type, public_id)
);
CREATE INDEX IF NOT EXISTS idx_cloudinary_inventory_assets_public_id
  ON cloudinary_inventory_assets(scan_id, public_id);
