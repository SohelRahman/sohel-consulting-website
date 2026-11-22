CREATE TABLE IF NOT EXISTS cloudinary_upload_operations (
  id TEXT PRIMARY KEY,
  public_id TEXT NOT NULL UNIQUE,
  purpose TEXT NOT NULL CHECK (purpose IN ('media','syllabus')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','uploaded','registered','attached','failed','needs_review','deleted')),
  secure_url TEXT,
  bytes INTEGER,
  format TEXT,
  last_error TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_cloudinary_upload_operations_status
  ON cloudinary_upload_operations(status, updated_at);
