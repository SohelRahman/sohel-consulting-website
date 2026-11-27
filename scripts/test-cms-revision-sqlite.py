import sqlite3
import tempfile
import threading
from pathlib import Path

TEMP_DIR = tempfile.TemporaryDirectory(prefix="cms-revision-")
DB_PATH = Path(TEMP_DIR.name) / "cms-revision.sqlite"

def connect():
    db = sqlite3.connect(DB_PATH, timeout=10, isolation_level=None)
    db.execute("PRAGMA foreign_keys=ON")
    db.execute("PRAGMA busy_timeout=10000")
    return db

anchor = connect()
anchor.execute("PRAGMA journal_mode=WAL")
anchor.executescript("""
CREATE TABLE cms_content (
  page_key TEXT NOT NULL, language TEXT NOT NULL, content_key TEXT NOT NULL,
  content_type TEXT NOT NULL, draft_value TEXT NOT NULL, published_value TEXT,
  is_deleted INTEGER NOT NULL DEFAULT 0, updated_by TEXT, updated_at TEXT,
  PRIMARY KEY(page_key, language, content_key)
);
CREATE TABLE cms_static_content_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT, page_key TEXT NOT NULL, language TEXT NOT NULL,
  content_key TEXT NOT NULL, content_type TEXT NOT NULL, value TEXT NOT NULL,
  version_type TEXT NOT NULL, created_by TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY, admin_email TEXT NOT NULL, action TEXT NOT NULL,
  entity_type TEXT NOT NULL, entity_id TEXT NOT NULL, details TEXT
);
""")
migration_path = Path(__file__).resolve().parent.parent / "migrations" / "0018_cms_content_revision.sql"
with migration_path.open("r", encoding="utf-8") as migration:
    anchor.executescript(migration.read())
anchor.execute("INSERT INTO cms_content(page_key,language,content_key,content_type,draft_value,published_value,is_deleted,updated_by,updated_at) VALUES('home','en','hero.title','text','Original','Published',0,'seed',CURRENT_TIMESTAMP)")
anchor.execute("INSERT INTO cms_static_content_versions(page_key,language,content_key,content_type,value,version_type,created_by) VALUES('home','en','hero.title','text','Original','draft','seed')")

# Keep these SQL statements aligned with the Worker handlers and the revision contract test.
UPDATE_DRAFT = "UPDATE cms_content SET content_type=?,draft_value=?,is_deleted=0,revision=revision+1,updated_by=?,updated_at=CURRENT_TIMESTAMP WHERE page_key=? AND language=? AND content_key=? AND revision=?"
INSERT_DRAFT_VERSION = "INSERT INTO cms_static_content_versions(page_key,language,content_key,content_type,value,version_type,created_by) SELECT page_key,language,content_key,content_type,draft_value,'draft',? FROM cms_content WHERE page_key=? AND language=? AND content_key=? AND changes()>0"
INSERT_DRAFT_AUDIT = "INSERT INTO audit_logs (id,admin_email,action,entity_type,entity_id,details) SELECT ?,?,'cms_draft_saved','cms_content',?,? WHERE changes()>0"

def batch(statements):
    db = connect()
    try:
        db.execute("BEGIN IMMEDIATE")
        results = []
        for sql, params in statements:
            cur = db.execute(sql, params)
            results.append(cur.rowcount if cur.rowcount >= 0 else db.execute("SELECT changes()").fetchone()[0])
        db.execute("COMMIT")
        return results
    except Exception:
        if db.in_transaction:
            db.execute("ROLLBACK")
        raise
    finally:
        db.close()

def row():
    return anchor.execute("SELECT draft_value,revision,is_deleted FROM cms_content WHERE page_key='home' AND language='en' AND content_key='hero.title'").fetchone()

def counts():
    return (
      anchor.execute("SELECT COUNT(*) FROM cms_static_content_versions").fetchone()[0],
      anchor.execute("SELECT COUNT(*) FROM audit_logs").fetchone()[0]
    )

def save(revision, value, actor, audit_id):
    return batch([
      (UPDATE_DRAFT, ('text', value, actor, 'home', 'en', 'hero.title', revision)),
      (INSERT_DRAFT_VERSION, (actor, 'home', 'en', 'hero.title')),
      (INSERT_DRAFT_AUDIT, (audit_id, actor, 'home:en:hero.title', 'text'))
    ])[0]

# Two independent editor requests start from the same revision and race to commit.
shared_revision = row()[1]
barrier = threading.Barrier(3)
results = []
errors = []
def competing_save(actor):
    try:
        barrier.wait()
        results.append((actor, save(shared_revision, actor, actor + "@example.test", "audit-" + actor)))
    except Exception as error:
        errors.append(error)
threads = [
    threading.Thread(target=competing_save, args=("editor-a",)),
    threading.Thread(target=competing_save, args=("editor-b",))
]
for thread in threads:
    thread.start()
barrier.wait()
for thread in threads:
    thread.join()
assert not errors, errors
assert sorted(result for _, result in results) == [0, 1], results
assert row()[1] == 2
assert counts() == (2, 1), "Only the winning concurrent save may append history and audit"
print("PASS concurrent editors: exactly one compare-and-swap wins; stale request writes no history/audit")

# Archive and restore use the same expected-revision rule.
archive = batch([
 ("UPDATE cms_content SET is_deleted=1,revision=revision+1,updated_by=?,updated_at=CURRENT_TIMESTAMP WHERE page_key=? AND language=? AND content_key=? AND revision=?", ("editor-a@example.test", "home", "en", "hero.title", 2)),
 ("INSERT INTO audit_logs (id,admin_email,action,entity_type,entity_id,details) SELECT ?,?,'cms_content_archived','cms_content',?,'Soft delete' WHERE changes()>0", ("audit-archive", "editor-a@example.test", "home:en:hero.title"))
])[0]
assert archive == 1 and row()[1:] == (3, 1)
stale_restore = batch([
 ("UPDATE cms_content SET is_deleted=0,revision=revision+1,updated_by=?,updated_at=CURRENT_TIMESTAMP WHERE page_key=? AND language=? AND content_key=? AND revision=?", ("editor-b@example.test", "home", "en", "hero.title", 2)),
 ("INSERT INTO audit_logs (id,admin_email,action,entity_type,entity_id,details) SELECT ?,?,'cms_content_restored','cms_content',?,'Restored as draft' WHERE changes()>0", ("audit-stale-restore", "editor-b@example.test", "home:en:hero.title"))
])[0]
assert stale_restore == 0 and row()[1:] == (3, 1)
restore = batch([
 ("UPDATE cms_content SET is_deleted=0,revision=revision+1,updated_by=?,updated_at=CURRENT_TIMESTAMP WHERE page_key=? AND language=? AND content_key=? AND revision=?", ("editor-a@example.test", "home", "en", "hero.title", 3)),
 ("INSERT INTO audit_logs (id,admin_email,action,entity_type,entity_id,details) SELECT ?,?,'cms_content_restored','cms_content',?,'Restored as draft' WHERE changes()>0", ("audit-restore", "editor-a@example.test", "home:en:hero.title"))
])[0]
assert restore == 1 and row()[1:] == (4, 0)
print("PASS archive/restore: valid revisions advance; stale requests cannot reverse newer state")

# Historical restore reads a snapshot, then conditionally writes against the current revision.
version = anchor.execute("SELECT id,content_type,value FROM cms_static_content_versions ORDER BY id LIMIT 1").fetchone()
assert version is not None
historical_restore = batch([
 ("UPDATE cms_content SET content_type=?,draft_value=?,is_deleted=0,revision=revision+1,updated_by=?,updated_at=CURRENT_TIMESTAMP WHERE page_key=? AND language=? AND content_key=? AND revision=?", (version[1], version[2], "editor-a@example.test", "home", "en", "hero.title", 4)),
 (INSERT_DRAFT_VERSION, ("editor-a@example.test", "home", "en", "hero.title")),
 ("INSERT INTO audit_logs (id,admin_email,action,entity_type,entity_id,details) SELECT ?,?,'cms_version_restored','cms_content',?,? WHERE changes()>0", ("audit-history-restore", "editor-a@example.test", "home:en:hero.title", f"Restored version {version[0]} to draft"))
])[0]
assert historical_restore == 1 and row()[1:] == (5, 0)
counts_before = counts()
stale_historical_restore = batch([
 ("UPDATE cms_content SET content_type=?,draft_value=?,is_deleted=0,revision=revision+1,updated_by=?,updated_at=CURRENT_TIMESTAMP WHERE page_key=? AND language=? AND content_key=? AND revision=?", (version[1], "Stale historical write", "editor-b@example.test", "home", "en", "hero.title", 4)),
 (INSERT_DRAFT_VERSION, ("editor-b@example.test", "home", "en", "hero.title")),
 ("INSERT INTO audit_logs (id,admin_email,action,entity_type,entity_id,details) SELECT ?,?,'cms_version_restored','cms_content',?,? WHERE changes()>0", ("audit-stale-history-restore", "editor-b@example.test", "home:en:hero.title", "Stale restore"))
])[0]
assert stale_historical_restore == 0 and row()[1:] == (5, 0) and counts() == counts_before
print("PASS historical restore: snapshot restore is revision-guarded; stale restore adds no records")

# Inject a history write failure and verify the D1-style batch transaction rolls back.
anchor.execute("CREATE TRIGGER fail_cms_history BEFORE INSERT ON cms_static_content_versions WHEN NEW.created_by='failure-test' BEGIN SELECT RAISE(ABORT,'injected history failure'); END")
old_state, old_counts = row(), counts()
try:
    batch([
      (UPDATE_DRAFT, ('text', 'Must roll back', 'failure-test', 'home', 'en', 'hero.title', 5)),
      (INSERT_DRAFT_VERSION, ('failure-test', 'home', 'en', 'hero.title')),
      (INSERT_DRAFT_AUDIT, ('audit-failure', 'failure-test', 'home:en:hero.title', 'text'))
    ])
    raise AssertionError("Expected injected history failure")
except sqlite3.IntegrityError:
    pass
assert row() == old_state and counts() == old_counts
print("PASS failure injection: content, history and audit roll back together")
print("All CMS revision SQLite transaction tests passed. This models the D1 SQL/transaction contract; it is not a live Cloudflare D1 test.")
anchor.close()
TEMP_DIR.cleanup()
