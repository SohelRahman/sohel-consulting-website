CREATE TABLE IF NOT EXISTS admin_mfa_challenges (
  nonce TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL CHECK (purpose IN ('enroll','login')),
  expires_at INTEGER NOT NULL,
  consumed_at INTEGER,
  consumed_by TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK ((consumed_at IS NULL AND consumed_by IS NULL) OR (consumed_at IS NOT NULL AND consumed_by IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS idx_admin_mfa_challenges_user_expiry
  ON admin_mfa_challenges(user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_mfa_challenges_expiry
  ON admin_mfa_challenges(expires_at);
