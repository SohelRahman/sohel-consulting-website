CREATE TABLE IF NOT EXISTS cloudinary_delete_operations (
  id TEXT PRIMARY KEY,
  public_id TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('media','course_syllabus')),
  target_id TEXT NOT NULL,
  previous_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','failed','completed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_cloudinary_delete_operations_status
  ON cloudinary_delete_operations(status, updated_at);
