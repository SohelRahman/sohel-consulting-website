import sqlite3
from pathlib import Path

root = Path(__file__).resolve().parents[1]
db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys=ON")
db.execute("CREATE TABLE admin_users (id TEXT PRIMARY KEY)")
db.execute("CREATE TABLE admin_mfa_credentials (user_id TEXT PRIMARY KEY, last_totp_counter INTEGER NOT NULL DEFAULT -1, enabled_at TEXT, pending_secret_ciphertext TEXT, secret_ciphertext TEXT, recovery_batch_id TEXT)")
db.execute("CREATE TABLE admin_mfa_recovery_codes (user_id TEXT, code_hash TEXT, code_salt TEXT, used_at TEXT)")
db.executescript((root / "migrations/0020_admin_mfa_challenge_state.sql").read_text())
db.execute("INSERT INTO admin_users(id) VALUES ('u1')")
db.execute("INSERT INTO admin_mfa_credentials(user_id,last_totp_counter) VALUES ('u1',10)")

def add_challenge(nonce, purpose="login", expiry=9999999999999):
    db.execute("INSERT INTO admin_mfa_challenges(nonce,user_id,purpose,expires_at) VALUES (?,?,?,?)", (nonce,"u1",purpose,expiry))

def claim_login(nonce, claim, counter):
    with db:
        claimed = db.execute(
            "UPDATE admin_mfa_challenges SET consumed_at=1,consumed_by=? "
            "WHERE nonce=? AND user_id='u1' AND purpose='login' AND expires_at>0 AND consumed_at IS NULL",
            (claim,nonce)
        ).rowcount
        factor = db.execute(
            "UPDATE admin_mfa_credentials SET last_totp_counter=? WHERE user_id='u1' "
            "AND last_totp_counter<? AND EXISTS "
            "(SELECT 1 FROM admin_mfa_challenges WHERE nonce=? AND consumed_by=?)",
            (counter,counter,nonce,claim)
        ).rowcount
    return claimed == 1 and factor == 1

add_challenge("login-1")
assert claim_login("login-1","claim-a",11), "first valid challenge claim should succeed"
assert not claim_login("login-1","claim-b",12), "replayed challenge with a different valid factor must fail"
assert db.execute("SELECT last_totp_counter FROM admin_mfa_credentials WHERE user_id='u1'").fetchone()[0] == 11

add_challenge("recovery-1")
db.execute("INSERT INTO admin_mfa_recovery_codes(user_id,code_hash,code_salt) VALUES ('u1','hash-a','salt-a')")
def claim_recovery(nonce, claim):
    with db:
        claimed = db.execute(
            "UPDATE admin_mfa_challenges SET consumed_at=2,consumed_by=? "
            "WHERE nonce=? AND user_id='u1' AND purpose='login' AND expires_at>0 AND consumed_at IS NULL",
            (claim,nonce)
        ).rowcount
        factor = db.execute(
            "UPDATE admin_mfa_recovery_codes SET used_at='used' WHERE user_id='u1' AND code_hash='hash-a' "
            "AND used_at IS NULL AND EXISTS "
            "(SELECT 1 FROM admin_mfa_challenges WHERE nonce=? AND consumed_by=?)",
            (nonce,claim)
        ).rowcount
    return claimed == 1 and factor == 1

assert claim_recovery("recovery-1","claim-r1"), "first recovery-code challenge should succeed"
assert not claim_recovery("recovery-1","claim-r2"), "same challenge must not consume another recovery code"
assert db.execute("SELECT COUNT(*) FROM admin_mfa_recovery_codes WHERE used_at IS NOT NULL").fetchone()[0] == 1

add_challenge("enroll-1","enroll")
with db:
    claim = db.execute(
        "UPDATE admin_mfa_challenges SET consumed_at=3,consumed_by='enroll-claim' "
        "WHERE nonce='enroll-1' AND purpose='enroll' AND consumed_at IS NULL"
    ).rowcount
    enabled = db.execute(
        "UPDATE admin_mfa_credentials SET enabled_at='enabled',secret_ciphertext='cipher' "
        "WHERE user_id='u1' AND enabled_at IS NULL AND EXISTS "
        "(SELECT 1 FROM admin_mfa_challenges WHERE nonce='enroll-1' AND consumed_by='enroll-claim')"
    ).rowcount
assert claim == 1 and enabled == 1
with db:
    replay_claim = db.execute(
        "UPDATE admin_mfa_challenges SET consumed_at=4,consumed_by='enroll-replay' "
        "WHERE nonce='enroll-1' AND purpose='enroll' AND consumed_at IS NULL"
    ).rowcount
    replay_enable = db.execute(
        "UPDATE admin_mfa_credentials SET secret_ciphertext='other' WHERE user_id='u1' AND EXISTS "
        "(SELECT 1 FROM admin_mfa_challenges WHERE nonce='enroll-1' AND consumed_by='enroll-replay')"
    ).rowcount
assert replay_claim == 0 and replay_enable == 0

add_challenge("expired-1","login",0)
assert not claim_login("expired-1","expired-claim",13), "expired challenge must not be claimable"
add_challenge("wrong-purpose","enroll")
assert not claim_login("wrong-purpose","wrong-purpose-claim",13), "enrollment challenge must not authorize login"

print("Admin MFA challenge persistence and replay transaction tests passed.")

db.execute("ALTER TABLE admin_users ADD COLUMN session_version INTEGER NOT NULL DEFAULT 1")
db.execute("UPDATE admin_mfa_credentials SET enabled_at='enabled' WHERE user_id='u1'")
with db:
    factor = db.execute(
        "UPDATE admin_mfa_credentials SET last_totp_counter=12 WHERE user_id='u1' "
        "AND last_totp_counter<12 AND enabled_at IS NOT NULL "
        "AND EXISTS (SELECT 1 FROM admin_users WHERE id='u1' AND session_version=1)"
    ).rowcount
    revoked = db.execute(
        "UPDATE admin_users SET session_version=session_version+1 WHERE id='u1' AND session_version=1 "
        "AND EXISTS (SELECT 1 FROM admin_mfa_credentials WHERE user_id='u1' AND last_totp_counter=12 AND enabled_at IS NOT NULL)"
    ).rowcount
    db.execute("DELETE FROM admin_mfa_credentials WHERE user_id='u1' AND EXISTS (SELECT 1 FROM admin_users WHERE id='u1' AND session_version=2)")
assert factor == 1 and revoked == 1
assert db.execute("SELECT session_version FROM admin_users WHERE id='u1'").fetchone()[0] == 2
assert db.execute("SELECT COUNT(*) FROM admin_mfa_credentials WHERE user_id='u1'").fetchone()[0] == 0
print("Admin MFA disable factor/session atomicity transaction test passed.")
