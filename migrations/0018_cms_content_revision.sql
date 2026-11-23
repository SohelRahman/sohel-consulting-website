-- Per-content revision counter for optimistic concurrency in the bilingual CMS.
ALTER TABLE cms_content ADD COLUMN revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1);
