PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title_en TEXT NOT NULL,
  title_bn TEXT,
  summary_en TEXT,
  summary_bn TEXT,
  level TEXT NOT NULL DEFAULT 'beginner_intermediate',
  delivery_modes TEXT NOT NULL DEFAULT 'online,classroom',
  languages TEXT NOT NULL DEFAULT 'en,bn',
  pricing_type TEXT NOT NULL DEFAULT 'fixed' CHECK (pricing_type IN ('fixed','custom','both')),
  fixed_fee_minor INTEGER,
  currency TEXT NOT NULL DEFAULT 'BDT',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS learners (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  organisation TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS registrations (
  id TEXT PRIMARY KEY,
  reference_code TEXT NOT NULL UNIQUE,
  learner_id TEXT NOT NULL REFERENCES learners(id),
  course_id TEXT NOT NULL REFERENCES courses(id),
  batch_preference TEXT,
  language_preference TEXT NOT NULL DEFAULT 'en',
  delivery_preference TEXT NOT NULL DEFAULT 'online',
  pricing_type TEXT NOT NULL DEFAULT 'fixed' CHECK (pricing_type IN ('fixed','custom')),
  quoted_fee_minor INTEGER,
  currency TEXT NOT NULL DEFAULT 'BDT',
  learner_message TEXT,
  registration_status TEXT NOT NULL DEFAULT 'pending_review'
    CHECK (registration_status IN ('pending_review','approved','rejected','cancelled')),
  payment_status TEXT NOT NULL DEFAULT 'not_configured'
    CHECK (payment_status IN ('not_configured','pending','paid','failed','refunded')),
  enrollment_status TEXT NOT NULL DEFAULT 'awaiting_confirmation'
    CHECK (enrollment_status IN ('awaiting_confirmation','confirmed','cancelled')),
  admin_note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inquiries (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  organisation TEXT,
  inquiry_type TEXT NOT NULL DEFAULT 'training',
  topic TEXT,
  learner_level TEXT,
  preferred_language TEXT DEFAULT 'en',
  delivery_preference TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','in_progress','responded','closed')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quotations (
  id TEXT PRIMARY KEY,
  registration_id TEXT REFERENCES registrations(id),
  inquiry_id TEXT REFERENCES inquiries(id),
  amount_minor INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BDT',
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','accepted','declined','expired')),
  valid_until TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(registration_status, created_at);
CREATE INDEX IF NOT EXISTS idx_registrations_learner ON registrations(learner_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status, created_at);

INSERT OR IGNORE INTO courses
(id,slug,title_en,title_bn,summary_en,summary_bn,level,pricing_type,currency)
VALUES
('course-pm','project-management','Project Management','প্রজেক্ট ম্যানেজমেন্ট','Practical project planning, scheduling, monitoring and delivery fundamentals.','প্রকল্প পরিকল্পনা, সময়সূচি, পর্যবেক্ষণ ও বাস্তবায়নের মৌলিক বিষয়।','beginner_intermediate','both','BDT'),
('course-sap','sap-s4hana','SAP S/4HANA','এসএপি এস/৪হানা','Foundational SAP S/4HANA, SAP MM and procurement process learning.','SAP S/4HANA, SAP MM ও ক্রয় প্রক্রিয়ার প্রাথমিক প্রশিক্ষণ।','beginner_intermediate','both','BDT'),
('course-ba','business-analysis','Business Analysis','বিজনেস অ্যানালাইসিস','Requirements, stakeholder analysis, process mapping and UAT fundamentals.','রিকোয়ারমেন্ট, স্টেকহোল্ডার বিশ্লেষণ, প্রসেস ম্যাপিং ও UAT-এর মৌলিক বিষয়।','beginner_intermediate','both','BDT');
