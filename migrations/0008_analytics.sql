CREATE TABLE IF NOT EXISTS analytics_events (
  id TEXT PRIMARY KEY,
  visitor_hash TEXT NOT NULL,
  event_name TEXT NOT NULL CHECK (event_name IN ('page_view','chat_open','chat_message','human_support_request')),
  page_path TEXT NOT NULL,
  referrer_host TEXT NOT NULL DEFAULT '',
  device_type TEXT NOT NULL DEFAULT 'unknown' CHECK (device_type IN ('mobile','tablet','desktop','unknown')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_page ON analytics_events(event_name,page_path,created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_visitor ON analytics_events(visitor_hash,created_at);
