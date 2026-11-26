import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createArgon2idAdapter } from "../adapter.mjs";

const require = createRequire(import.meta.url);
const wasm = require("../node-pkg/sohel_argon2id_prototype.js");
const { wasm_memory_pages, wasm_test_grow_memory } = wasm;

test("uses Web Crypto salt generation and verifies generated PHC", () => {
  let calls = 0;
  const cryptoProvider = {
    getRandomValues(bytes) {
      calls += 1;
      bytes.forEach((_, index) => { bytes[index] = index + calls; });
      return bytes;
    }
  };
  const adapter = createArgon2idAdapter({ wasm, cryptoProvider });
  const encoded = adapter.hashPassword("adapter integration password");
  assert.match(encoded, /^\$argon2id\$v=19\$m=19456,t=2,p=1\$/);
  assert.equal(adapter.verifyPassword("adapter integration password", encoded), true);
  assert.equal(adapter.verifyPassword("wrong password", encoded), false);
  assert.equal(calls, 1);
});

test("rejects byte-length and malformed PHC boundaries before WASM calls", () => {
  let hashCalls = 0;
  let verifyCalls = 0;
  const adapter = createArgon2idAdapter({
    wasm: {
      wasm_hash_phc() { hashCalls += 1; return "unused"; },
      wasm_verify_phc() { verifyCalls += 1; return true; }
    },
    cryptoProvider: { getRandomValues(bytes) { return bytes.fill(1); } }
  });
  assert.throws(() => adapter.hashPassword(""), RangeError);
  assert.throws(() => adapter.hashPassword("x".repeat(1025)), RangeError);
  assert.throws(() => adapter.verifyPassword("x", "x".repeat(129)), RangeError);
  assert.equal(hashCalls, 0);
  assert.equal(verifyCalls, 0);
});

test("reuses generated bindings safely after WASM memory growth", () => {
  const adapter = createArgon2idAdapter({
    wasm,
    cryptoProvider: globalThis.crypto
  });
  const before = wasm_memory_pages();
  assert.equal(wasm_test_grow_memory(1), before);
  const afterGrowth = wasm_memory_pages();
  assert.equal(afterGrowth, before + 1);
  const encoded = adapter.hashPassword("memory growth integration password");
  assert.equal(adapter.verifyPassword("memory growth integration password", encoded), true);
  assert.equal(adapter.verifyPassword("incorrect", encoded), false);
  assert.equal(wasm_memory_pages(), afterGrowth);
});
