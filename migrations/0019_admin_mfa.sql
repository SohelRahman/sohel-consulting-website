CREATE TABLE IF NOT EXISTS admin_mfa_credentials (
 user_id TEXT PRIMARY KEY REFERENCES admin_users(id) ON DELETE CASCADE,
 secret_ciphertext TEXT,pending_secret_ciphertext TEXT,pending_expires_at INTEGER,
 last_totp_counter INTEGER NOT NULL DEFAULT -1 CHECK(last_totp_counter>=-1),
 recovery_batch_id TEXT,enabled_at TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CHECK((enabled_at IS NULL AND secret_ciphertext IS NULL) OR (enabled_at IS NOT NULL AND secret_ciphertext IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS idx_admin_mfa_pending_expiry ON admin_mfa_credentials(pending_expires_at);
CREATE TABLE IF NOT EXISTS admin_mfa_recovery_codes (
 user_id TEXT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
 code_hash TEXT NOT NULL,code_salt TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,used_at TEXT,
 PRIMARY KEY(user_id,code_hash)
);
CREATE INDEX IF NOT EXISTS idx_admin_mfa_recovery_unused ON admin_mfa_recovery_codes(user_id,used_at);
