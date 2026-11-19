-- Bilingual static-page CMS. Existing custom pages and page styles remain independent.
CREATE TABLE IF NOT EXISTS cms_content (
  page_key TEXT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('en','bn')),
  content_key TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'text' CHECK (content_type IN ('text','textarea','url','image','richtext')),
  draft_value TEXT NOT NULL,
  published_value TEXT,
  is_deleted INTEGER NOT NULL DEFAULT 0 CHECK (is_deleted IN (0,1)),
  updated_by TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (page_key, language, content_key)
);
CREATE INDEX IF NOT EXISTS idx_cms_content_page_locale ON cms_content(page_key,language,is_deleted);
CREATE TABLE IF NOT EXISTS cms_content_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_key TEXT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('en','bn')),
  content_key TEXT NOT NULL,
  content_type TEXT NOT NULL,
  value TEXT NOT NULL,
  version_type TEXT NOT NULL CHECK (version_type IN ('draft','published')),
  created_by TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_cms_versions_lookup ON cms_content_versions(page_key,language,content_key,id DESC);
INSERT OR IGNORE INTO cms_content(page_key,language,content_key,content_type,draft_value,published_value,updated_by)
SELECT 'home','en',content_key,content_type,content_value,content_value,'migration'
FROM site_content WHERE published=1;
INSERT INTO cms_content_versions(page_key,language,content_key,content_type,value,version_type,created_by)
SELECT 'home','en',content_key,content_type,content_value,'published','migration'
FROM site_content WHERE published=1
AND NOT EXISTS (SELECT 1 FROM cms_content_versions v WHERE v.page_key='home' AND v.language='en' AND v.content_key=site_content.content_key);
