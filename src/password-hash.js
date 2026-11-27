// Cloudflare Workers production Web Crypto rejects PBKDF2 counts above 100,000.
// Keep this limit explicit so local Node tests cannot silently exceed the edge runtime ceiling.
const LEGACY_ITERATIONS = 100000;
const CURRENT_ITERATIONS = 100000;

function encodeBase64Url(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(value) {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new Error("Invalid password hash encoding.");
  }
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(normalized + "=".repeat((4 - normalized.length % 4) % 4)), c => c.charCodeAt(0));
}

function parsePasswordHash(stored) {
  const parts = String(stored || "").split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return null;
  const iterations = Number(parts[1]);
  if (iterations !== LEGACY_ITERATIONS && iterations !== CURRENT_ITERATIONS) return null;
  try {
    const salt = decodeBase64Url(parts[2]);
    const expected = decodeBase64Url(parts[3]);
    if (salt.length !== 16 || expected.length !== 32) return null;
    return { iterations, salt, expected };
  } catch {
    return null;
  }
}

async function derive(password, salt, iterations) {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]
  );
  return new Uint8Array(await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, 256
  ));
}

function constantTimeEqual(left, right) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let i = 0; i < left.length; i++) difference |= left[i] ^ right[i];
  return difference === 0;
}

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const derived = await derive(String(password), salt, CURRENT_ITERATIONS);
  return `pbkdf2$${CURRENT_ITERATIONS}$${encodeBase64Url(salt)}$${encodeBase64Url(derived)}`;
}

export async function verifyPassword(password, stored) {
  const parsed = parsePasswordHash(stored);
  if (!parsed) return false;
  try {
    const actual = await derive(String(password), parsed.salt, parsed.iterations);
    return constantTimeEqual(actual, parsed.expected);
  } catch {
    return false;
  }
}

export function needsPasswordRehash(stored) {
  const parsed = parsePasswordHash(stored);
  return Boolean(parsed && parsed.iterations < CURRENT_ITERATIONS);
}
