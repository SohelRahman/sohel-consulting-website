ALTER TABLE courses ADD COLUMN syllabus_file_url TEXT;

-- Preserve existing Cloudinary PDF syllabus URLs in the new file field.
UPDATE courses
SET syllabus_file_url = syllabus_url, syllabus_url = NULL
WHERE syllabus_url LIKE 'https://res.cloudinary.com/%/image/upload/%.pdf';
