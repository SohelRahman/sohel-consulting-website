CREATE TABLE IF NOT EXISTS site_content (
  content_key TEXT PRIMARY KEY,
  content_value TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'text' CHECK (content_type IN ('text','textarea','url')),
  published INTEGER NOT NULL DEFAULT 1 CHECK (published IN (0,1)),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO site_content (content_key,content_value,content_type) VALUES
('home.hero.eyebrow','CONSULTING & PROFESSIONAL TRAINING · DHAKA, BANGLADESH','text'),
('home.hero.title','Build professional skills. Improve business performance.','text'),
('home.hero.lead','Practical consulting and professional training in Project Management, SAP S/4HANA and Business Analysis for individuals and organisations.','textarea'),
('home.hero.note','Online and classroom learning · English and Bangla delivery','text');
