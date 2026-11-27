ALTER TABLE courses ADD COLUMN discount_type TEXT NOT NULL DEFAULT 'none' CHECK (discount_type IN ('none','percentage','fixed'));
ALTER TABLE courses ADD COLUMN discount_value INTEGER;
ALTER TABLE courses ADD COLUMN discount_starts_at TEXT;
ALTER TABLE courses ADD COLUMN discount_ends_at TEXT;
ALTER TABLE courses ADD COLUMN syllabus_url TEXT;
