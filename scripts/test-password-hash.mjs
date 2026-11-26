import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { hashPassword, verifyPassword, needsPasswordRehash } from "../src/password-hash.js";

if (!globalThis.crypto) globalThis.crypto = webcrypto;

function encode(bytes) {
  return Buffer.from(bytes).toString("base64url");
}

async function legacyHash(password) {
  const salt = webcrypto.getRandomValues(new Uint8Array(16));
  const key = await webcrypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await webcrypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: 100000 }, key, 256);
  return `pbkdf2$100000$${encode(salt)}$${encode(new Uint8Array(bits))}`;
}

const password = "Correct horse battery staple 2026!";
const legacy = await legacyHash(password);
assert.equal(await verifyPassword(password, legacy), true, "legacy 100,000-iteration hash remains valid");
assert.equal(needsPasswordRehash(legacy), false, "Worker-compatible hash does not require an unsupported upgrade");
assert.equal(await verifyPassword("incorrect password", legacy), false, "wrong password is rejected");

const current = await hashPassword(password);
assert.match(current, /^pbkdf2\$600000\$/);
assert.equal(await verifyPassword(password, current), true, "new Worker-compatible hash verifies");
assert.equal(needsPasswordRehash(current), false, "current hash does not need upgrade");
assert.notEqual(current, await hashPassword(password), "each password hash receives a unique salt");

for (const malformed of ["", "pbkdf2$100000$bad$bad", "pbkdf2$600000$abc$def", "pbkdf2$999999$abc$def", "sha256$600000$abc$def", "pbkdf2$600000$abc$def$extra"]) {
  assert.equal(await verifyPassword(password, malformed), false, `malformed/unsupported hash rejected: ${malformed}`);
  assert.equal(needsPasswordRehash(malformed), false, "malformed hash is not treated as upgradeable");
}

console.log("All password hashing tests passed.");
