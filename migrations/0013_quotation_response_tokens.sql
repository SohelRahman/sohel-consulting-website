-- One-time bearer links for learner quotation responses. Only SHA-256 token hashes are stored.
CREATE TABLE IF NOT EXISTS quotation_response_tokens (
  id TEXT PRIMARY KEY,
  quote_id TEXT NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  revoked_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_quotation_response_tokens_quote ON quotation_response_tokens(quote_id,used_at,revoked_at);
CREATE INDEX IF NOT EXISTS idx_quotation_response_tokens_expiry ON quotation_response_tokens(expires_at);
