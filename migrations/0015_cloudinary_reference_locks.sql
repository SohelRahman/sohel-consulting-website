-- Prevent new content references from racing an asset deletion.
-- Pending/failed journal entries reserve the Cloudinary public ID until recovery completes.

CREATE TRIGGER IF NOT EXISTS trg_cloudinary_lock_site_content_insert
BEFORE INSERT ON site_content
WHEN EXISTS (SELECT 1 FROM cloudinary_delete_operations d WHERE d.status IN ('pending','failed') AND instr(NEW.content_value,d.public_id)>0)
BEGIN SELECT RAISE(ABORT,'Cloudinary asset is pending deletion'); END;
CREATE TRIGGER IF NOT EXISTS trg_cloudinary_lock_site_content_update
BEFORE UPDATE OF content_value,published ON site_content
WHEN EXISTS (SELECT 1 FROM cloudinary_delete_operations d WHERE d.status IN ('pending','failed') AND instr(NEW.content_value,d.public_id)>0)
BEGIN SELECT RAISE(ABORT,'Cloudinary asset is pending deletion'); END;

CREATE TRIGGER IF NOT EXISTS trg_cloudinary_lock_cms_content_insert
BEFORE INSERT ON cms_content
WHEN EXISTS (SELECT 1 FROM cloudinary_delete_operations d WHERE d.status IN ('pending','failed') AND (instr(NEW.draft_value,d.public_id)>0 OR instr(COALESCE(NEW.published_value,''),d.public_id)>0))
BEGIN SELECT RAISE(ABORT,'Cloudinary asset is pending deletion'); END;
CREATE TRIGGER IF NOT EXISTS trg_cloudinary_lock_cms_content_update
BEFORE UPDATE OF draft_value,published_value,is_deleted ON cms_content
WHEN EXISTS (SELECT 1 FROM cloudinary_delete_operations d WHERE d.status IN ('pending','failed') AND (instr(NEW.draft_value,d.public_id)>0 OR instr(COALESCE(NEW.published_value,''),d.public_id)>0))
BEGIN SELECT RAISE(ABORT,'Cloudinary asset is pending deletion'); END;

CREATE TRIGGER IF NOT EXISTS trg_cloudinary_lock_cms_versions_insert
BEFORE INSERT ON cms_static_content_versions
WHEN EXISTS (SELECT 1 FROM cloudinary_delete_operations d WHERE d.status IN ('pending','failed') AND instr(NEW.value,d.public_id)>0)
BEGIN SELECT RAISE(ABORT,'Cloudinary asset is pending deletion'); END;

CREATE TRIGGER IF NOT EXISTS trg_cloudinary_lock_pages_insert
BEFORE INSERT ON pages
WHEN EXISTS (SELECT 1 FROM cloudinary_delete_operations d WHERE d.status IN ('pending','failed') AND (instr(NEW.draft_json,d.public_id)>0 OR instr(COALESCE(NEW.published_json,''),d.public_id)>0))
BEGIN SELECT RAISE(ABORT,'Cloudinary asset is pending deletion'); END;
CREATE TRIGGER IF NOT EXISTS trg_cloudinary_lock_pages_update
BEFORE UPDATE OF draft_json,published_json ON pages
WHEN EXISTS (SELECT 1 FROM cloudinary_delete_operations d WHERE d.status IN ('pending','failed') AND (instr(NEW.draft_json,d.public_id)>0 OR instr(COALESCE(NEW.published_json,''),d.public_id)>0))
BEGIN SELECT RAISE(ABORT,'Cloudinary asset is pending deletion'); END;

CREATE TRIGGER IF NOT EXISTS trg_cloudinary_lock_page_styles_insert
BEFORE INSERT ON page_styles
WHEN EXISTS (SELECT 1 FROM cloudinary_delete_operations d WHERE d.status IN ('pending','failed') AND (instr(NEW.draft_json,d.public_id)>0 OR instr(COALESCE(NEW.published_json,''),d.public_id)>0))
BEGIN SELECT RAISE(ABORT,'Cloudinary asset is pending deletion'); END;
CREATE TRIGGER IF NOT EXISTS trg_cloudinary_lock_page_styles_update
BEFORE UPDATE OF draft_json,published_json ON page_styles
WHEN EXISTS (SELECT 1 FROM cloudinary_delete_operations d WHERE d.status IN ('pending','failed') AND (instr(NEW.draft_json,d.public_id)>0 OR instr(COALESCE(NEW.published_json,''),d.public_id)>0))
BEGIN SELECT RAISE(ABORT,'Cloudinary asset is pending deletion'); END;

CREATE TRIGGER IF NOT EXISTS trg_cloudinary_lock_courses_insert
BEFORE INSERT ON courses
WHEN EXISTS (SELECT 1 FROM cloudinary_delete_operations d WHERE d.status IN ('pending','failed') AND instr(COALESCE(NEW.syllabus_file_url,''),d.public_id)>0)
BEGIN SELECT RAISE(ABORT,'Cloudinary asset is pending deletion'); END;
CREATE TRIGGER IF NOT EXISTS trg_cloudinary_lock_courses_update
BEFORE UPDATE OF syllabus_file_url ON courses
WHEN EXISTS (SELECT 1 FROM cloudinary_delete_operations d WHERE d.status IN ('pending','failed') AND instr(COALESCE(NEW.syllabus_file_url,''),d.public_id)>0)
BEGIN SELECT RAISE(ABORT,'Cloudinary asset is pending deletion'); END;
