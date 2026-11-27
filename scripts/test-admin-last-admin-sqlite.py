#!/usr/bin/env python3
"""Exercise the last-active-Admin conditional UPDATE against real SQLite."""
import sqlite3

GUARD = """EXISTS (
  SELECT 1 FROM admin_users AS remaining
  WHERE remaining.role='admin'
    AND remaining.is_active=1
    AND remaining.id<>admin_users.id
)"""


def database():
    db = sqlite3.connect(":memory:")
    db.execute("""CREATE TABLE admin_users (
        id TEXT PRIMARY KEY, role TEXT NOT NULL, is_active INTEGER NOT NULL,
        session_version INTEGER NOT NULL DEFAULT 1
    )""")
    db.executemany("INSERT INTO admin_users(id,role,is_active) VALUES(?,?,?)", [
        ("admin-a", "admin", 1), ("admin-b", "admin", 1)
    ])
    return db


def test_two_removals_cannot_remove_both():
    db = database()
    patch = db.execute(
        "UPDATE admin_users SET role='user',is_active=1,session_version=session_version+1 "
        "WHERE id=? AND role=? AND is_active=? AND " + GUARD,
        ("admin-a", "admin", 1),
    )
    assert patch.rowcount == 1
    delete = db.execute(
        "UPDATE admin_users SET is_active=0,session_version=session_version+1 "
        "WHERE id=? AND role=? AND is_active=? AND " + GUARD,
        ("admin-b", "admin", 1),
    )
    assert delete.rowcount == 0
    assert db.execute(
        "SELECT COUNT(*) FROM admin_users WHERE role='admin' AND is_active=1"
    ).fetchone()[0] == 1


def test_single_admin_is_preserved_for_patch_and_delete():
    for statement, params in [
        ("UPDATE admin_users SET role='user' WHERE id=? AND role=? AND is_active=? AND " + GUARD,
         ("admin-a", "admin", 1)),
        ("UPDATE admin_users SET is_active=0 WHERE id=? AND role=? AND is_active=? AND " + GUARD,
         ("admin-a", "admin", 1)),
    ]:
        db = sqlite3.connect(":memory:")
        db.execute("CREATE TABLE admin_users(id TEXT PRIMARY KEY, role TEXT, is_active INTEGER)")
        db.execute("INSERT INTO admin_users VALUES('admin-a','admin',1)")
        result = db.execute(statement, params)
        assert result.rowcount == 0


if __name__ == "__main__":
    test_two_removals_cannot_remove_both()
    test_single_admin_is_preserved_for_patch_and_delete()
    print("Admin last-active guard SQLite tests passed (3 assertions groups).")
