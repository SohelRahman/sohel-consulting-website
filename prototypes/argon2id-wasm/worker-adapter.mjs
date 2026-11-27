import { initSync, wasm_hash_phc, wasm_verify_phc, wasm_memory_pages } from "./pkg/sohel_argon2id_prototype.js";
import wasmModule from "./pkg/sohel_argon2id_prototype_bg.wasm";
import { createArgon2idAdapter } from "./adapter.mjs";

let adapter;

function getAdapter() {
  if (!adapter) {
    initSync({ module: wasmModule });
    adapter = createArgon2idAdapter({
      wasm: { wasm_hash_phc, wasm_verify_phc },
      cryptoProvider: globalThis.crypto
    });
  }
  return adapter;
}

export const hashPassword = password => getAdapter().hashPassword(password);
export const verifyPassword = (password, phc) => getAdapter().verifyPassword(password, phc);

export const wasmMemoryPages = () => { getAdapter(); return wasm_memory_pages(); };
