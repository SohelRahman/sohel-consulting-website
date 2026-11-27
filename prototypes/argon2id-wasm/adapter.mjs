const PASSWORD_MAX_BYTES = 1024;
const PHC_MAX_BYTES = 128;
const SALT_BYTES = 16;
const encoder = new TextEncoder();

function copyPassword(value) {
  if (typeof value === "string") return encoder.encode(value);
  if (value instanceof Uint8Array) return new Uint8Array(value);
  throw new TypeError("Password must be a string or Uint8Array.");
}

export function createArgon2idAdapter({ wasm, cryptoProvider = globalThis.crypto }) {
  if (typeof wasm?.wasm_hash_phc !== "function" || typeof wasm?.wasm_verify_phc !== "function") {
    throw new TypeError("The Argon2id WASM bindings are incomplete.");
  }
  if (typeof cryptoProvider?.getRandomValues !== "function") {
    throw new TypeError("A Web Crypto getRandomValues implementation is required.");
  }

  return Object.freeze({
    hashPassword(password) {
      const passwordBytes = copyPassword(password);
      const salt = new Uint8Array(SALT_BYTES);
      try {
        if (passwordBytes.length === 0 || passwordBytes.length > PASSWORD_MAX_BYTES) {
          throw new RangeError("Password length must be between 1 and 1024 UTF-8 bytes.");
        }
        cryptoProvider.getRandomValues(salt);
        return wasm.wasm_hash_phc(passwordBytes, salt);
      } finally {
        passwordBytes.fill(0);
        salt.fill(0);
      }
    },

    verifyPassword(password, phc) {
      const passwordBytes = copyPassword(password);
      let encoded;
      try {
        if (passwordBytes.length === 0 || passwordBytes.length > PASSWORD_MAX_BYTES) {
          throw new RangeError("Password length must be between 1 and 1024 UTF-8 bytes.");
        }
        if (typeof phc !== "string") throw new TypeError("PHC value must be a string.");
        encoded = encoder.encode(phc);
        if (encoded.length === 0 || encoded.length > PHC_MAX_BYTES) {
          throw new RangeError("PHC value must be between 1 and 128 UTF-8 bytes.");
        }
        return wasm.wasm_verify_phc(passwordBytes, encoded);
      } finally {
        passwordBytes.fill(0);
        encoded?.fill(0);
      }
    }
  });
}
