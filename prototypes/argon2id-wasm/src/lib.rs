//! Isolated Argon2id prototype. Not connected to application authentication.
use argon2::{Algorithm, Argon2, Block, Params, Version};
use zeroize::{Zeroize, Zeroizing};

pub const MEMORY_KIB: u32 = 19_456;
pub const ITERATIONS: u32 = 2;
pub const PARALLELISM: u32 = 1;
pub const OUTPUT_LEN: usize = 32;
pub const SALT_LEN: usize = 16;
pub const MAX_PASSWORD_LEN: usize = 1024;
pub const MAX_PHC_LEN: usize = 128;
const B64: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

struct WipingMemory(Vec<Block>);

impl WipingMemory {
    fn new(block_count: usize) -> Self {
        Self(vec![Block::new(); block_count])
    }
    fn as_mut_slice(&mut self) -> &mut [Block] {
        &mut self.0
    }
    fn wipe(&mut self) {
        for block in &mut self.0 {
            block.zeroize();
        }
    }
}

impl Drop for WipingMemory {
    fn drop(&mut self) {
        self.wipe();
    }
}

/// Validate JS typed-array lengths before copying any caller-controlled bytes into Wasm memory.
#[cfg(any(target_arch = "wasm32", test))]
fn validate_wasm_input_lengths(password_len: u32, salt_len: u32) -> Result<(), &'static str> {
    if password_len == 0 || password_len as usize > MAX_PASSWORD_LEN {
        return Err("password length out of bounds");
    }
    if salt_len as usize != SALT_LEN {
        return Err("salt length must be exactly 16 bytes");
    }
    Ok(())
}

#[cfg(any(target_arch = "wasm32", test))]
fn validate_wasm_phc_length(encoded_len: u32) -> Result<(), &'static str> {
    if encoded_len == 0 || encoded_len as usize > MAX_PHC_LEN {
        return Err("PHC string length out of bounds");
    }
    Ok(())
}

#[cfg(target_arch = "wasm32")]
mod wasm_api {
    use super::*;
    use js_sys::Uint8Array;
    use wasm_bindgen::prelude::*;
    use zeroize::Zeroizing;

    /// Diagnostic export used by the isolated integration test to prove memory growth.
    #[wasm_bindgen]
    pub fn wasm_memory_pages() -> u32 {
        core::arch::wasm32::memory_size(0) as u32
    }

    /// Test-only hook: force linear-memory growth to exercise wasm-bindgen view refresh.
    #[cfg(feature = "test-hooks")]
    #[wasm_bindgen]
    pub fn wasm_test_grow_memory(pages: u32) -> Result<u32, JsValue> {
        if pages == 0 || pages > 16 {
            return Err(JsValue::from_str("test growth must be between 1 and 16 pages"));
        }
        let previous = core::arch::wasm32::memory_grow(0, pages as usize);
        if previous == usize::MAX {
            return Err(JsValue::from_str("WebAssembly memory growth failed"));
        }
        Ok(previous as u32)
    }

    /// Hash bounded JS byte arrays. Lengths are checked before either array is copied.
    #[wasm_bindgen]
    pub fn wasm_hash(password: &Uint8Array, salt: &Uint8Array) -> Result<Box<[u8]>, JsValue> {
        validate_wasm_input_lengths(password.length(), salt.length()).map_err(JsValue::from_str)?;
        let password = Zeroizing::new(password.to_vec());
        let salt = salt.to_vec();
        let tag = Zeroizing::new(derive(&password, &salt).map_err(JsValue::from_str)?);
        Ok(tag.to_vec().into_boxed_slice())
    }

    /// Return the fixed-profile PHC string. The host must supply a CSPRNG salt.
    #[wasm_bindgen]
    pub fn wasm_hash_phc(password: &Uint8Array, salt: &Uint8Array) -> Result<String, JsValue> {
        validate_wasm_input_lengths(password.length(), salt.length()).map_err(JsValue::from_str)?;
        let password = Zeroizing::new(password.to_vec());
        let salt = salt.to_vec();
        hash_phc(&password, &salt).map_err(JsValue::from_str)
    }

    /// Verify bounded PHC bytes. UTF-8 validation happens after the length check and copy.
    #[wasm_bindgen]
    pub fn wasm_verify_phc(password: &Uint8Array, encoded: &Uint8Array) -> Result<bool, JsValue> {
        validate_wasm_phc_length(encoded.length()).map_err(JsValue::from_str)?;
        if password.length() == 0 || password.length() as usize > MAX_PASSWORD_LEN {
            return Err(JsValue::from_str("password length out of bounds"));
        }
        let password = Zeroizing::new(password.to_vec());
        let encoded = encoded.to_vec();
        let encoded = core::str::from_utf8(&encoded)
            .map_err(|_| JsValue::from_str("PHC string must be UTF-8"))?;
        verify_phc(&password, encoded).map_err(JsValue::from_str)
    }
}

/// Derive a 32-byte Argon2id v=19 tag with fixed parameters.
pub fn derive(password: &[u8], salt: &[u8]) -> Result<[u8; OUTPUT_LEN], &'static str> {
    if password.is_empty() || password.len() > MAX_PASSWORD_LEN {
        return Err("password length out of bounds");
    }
    if salt.len() != SALT_LEN {
        return Err("salt length must be exactly 16 bytes");
    }
    let params = Params::new(MEMORY_KIB, ITERATIONS, PARALLELISM, Some(OUTPUT_LEN))
        .map_err(|_| "invalid fixed Argon2 parameters")?;
    let argon2 = Argon2::new(Algorithm::Argon2id, Version::V0x13, params);
    let mut memory = WipingMemory::new(MEMORY_KIB as usize);
    let mut output = Zeroizing::new([0u8; OUTPUT_LEN]);
    argon2
        .hash_password_into_with_memory(password, salt, &mut output[..], memory.as_mut_slice())
        .map_err(|_| "Argon2id derivation failed")?;
    Ok(*output)
}

fn b64_encode(input: &[u8]) -> String {
    let mut out = String::with_capacity((input.len() * 4).div_ceil(3));
    for chunk in input.chunks(3) {
        let a = chunk[0] as usize;
        let b = chunk.get(1).copied().unwrap_or(0) as usize;
        let c = chunk.get(2).copied().unwrap_or(0) as usize;
        out.push(B64[a >> 2] as char);
        out.push(B64[((a & 3) << 4) | (b >> 4)] as char);
        if chunk.len() > 1 {
            out.push(B64[((b & 15) << 2) | (c >> 6)] as char);
        }
        if chunk.len() > 2 {
            out.push(B64[c & 63] as char);
        }
    }
    out
}

fn b64_value(byte: u8) -> Option<u8> {
    B64.iter()
        .position(|candidate| *candidate == byte)
        .map(|v| v as u8)
}

fn b64_decode(input: &str, expected_len: usize) -> Result<Vec<u8>, &'static str> {
    if input.is_empty() || input.len() > 64 || input.len() % 4 == 1 {
        return Err("invalid PHC base64 length");
    }
    let mut out = Vec::with_capacity(expected_len);
    let mut acc = 0u32;
    let mut bits = 0u8;
    for &byte in input.as_bytes() {
        let value = b64_value(byte).ok_or("invalid PHC base64 character")?;
        acc = (acc << 6) | value as u32;
        bits += 6;
        if bits >= 8 {
            bits -= 8;
            out.push((acc >> bits) as u8);
        }
    }
    if bits > 0 && (acc & ((1u32 << bits) - 1)) != 0 {
        return Err("non-canonical PHC base64");
    }
    if out.len() != expected_len {
        return Err("invalid PHC field length");
    }
    Ok(out)
}

/// Create a PHC-compatible string; caller must supply a CSPRNG-generated salt.
pub fn hash_phc(password: &[u8], salt: &[u8]) -> Result<String, &'static str> {
    let tag = Zeroizing::new(derive(password, salt)?);
    let encoded = format!(
        "$argon2id$v=19$m={},t={},p={}${}${}",
        MEMORY_KIB,
        ITERATIONS,
        PARALLELISM,
        b64_encode(salt),
        b64_encode(&tag[..])
    );
    Ok(encoded)
}

/// Verify only the exact fixed PHC profile; attacker-controlled costs are never used.
pub fn verify_phc(password: &[u8], encoded: &str) -> Result<bool, &'static str> {
    if encoded.len() > MAX_PHC_LEN {
        return Err("PHC string too long");
    }
    let fields: Vec<&str> = encoded.split('$').collect();
    if fields.len() != 6
        || !fields[0].is_empty()
        || fields[1] != "argon2id"
        || fields[2] != "v=19"
        || fields[3] != format!("m={},t={},p={}", MEMORY_KIB, ITERATIONS, PARALLELISM)
    {
        return Err("unsupported PHC algorithm, version or parameters");
    }
    let salt = b64_decode(fields[4], SALT_LEN)?;
    let expected = Zeroizing::new(b64_decode(fields[5], OUTPUT_LEN)?);
    let actual = Zeroizing::new(derive(password, &salt)?);
    let mut difference = 0u8;
    for (left, right) in actual.iter().zip(expected.iter()) {
        difference |= left ^ right;
    }
    Ok(difference == 0)
}

#[cfg(test)]
mod tests {
    use super::*;
    use argon2::{AssociatedData, ParamsBuilder};
    use hex_literal::hex;

    #[test]
    fn wasm_length_guards_reject_before_copy() {
        assert!(validate_wasm_input_lengths(1, SALT_LEN as u32).is_ok());
        assert!(validate_wasm_input_lengths(MAX_PASSWORD_LEN as u32, SALT_LEN as u32).is_ok());
        assert!(validate_wasm_input_lengths(0, SALT_LEN as u32).is_err());
        assert!(
            validate_wasm_input_lengths((MAX_PASSWORD_LEN + 1) as u32, SALT_LEN as u32).is_err()
        );
        assert!(validate_wasm_input_lengths(1, (SALT_LEN - 1) as u32).is_err());
        assert!(validate_wasm_input_lengths(1, (SALT_LEN + 1) as u32).is_err());
        assert!(validate_wasm_phc_length(1).is_ok());
        assert!(validate_wasm_phc_length(MAX_PHC_LEN as u32).is_ok());
        assert!(validate_wasm_phc_length(0).is_err());
        assert!(validate_wasm_phc_length((MAX_PHC_LEN + 1) as u32).is_err());
    }

    #[test]
    fn rejects_out_of_bounds_inputs() {
        assert!(derive(b"", &[7u8; SALT_LEN]).is_err());
        assert!(derive(&vec![b'x'; MAX_PASSWORD_LEN + 1], &[7u8; SALT_LEN]).is_err());
        assert!(derive(b"valid password", &[7u8; SALT_LEN - 1]).is_err());
    }

    #[test]
    fn derives_fixed_length_and_is_deterministic_for_same_salt() {
        let salt = [0x42; SALT_LEN];
        let first = derive(b"prototype test password", &salt).unwrap();
        assert_eq!(first.len(), OUTPUT_LEN);
        assert_eq!(first, derive(b"prototype test password", &salt).unwrap());
        assert_ne!(first, derive(b"different password", &salt).unwrap());
        assert_ne!(
            first,
            derive(b"prototype test password", &[0x43; SALT_LEN]).unwrap()
        );
    }

    #[test]
    fn matches_rustcrypto_argon2id_v19_known_answer_vector() {
        let params = ParamsBuilder::new()
            .m_cost(32)
            .t_cost(3)
            .p_cost(4)
            .data(AssociatedData::new(&[0x04; 12]).unwrap())
            .build()
            .unwrap();
        let secret = [0x03; 8];
        let argon2 =
            Argon2::new_with_secret(&secret, Algorithm::Argon2id, Version::V0x13, params).unwrap();
        let password = [0x01; 32];
        let salt = [0x02; 16];
        let expected = hex!("0d640df58d78766c08c037a34a8b53c9d01ef0452d75b65eb52520e96b01e659");
        let mut memory = WipingMemory::new(32);
        let mut output = [0u8; 32];
        argon2
            .hash_password_into_with_memory(&password, &salt, &mut output, memory.as_mut_slice())
            .unwrap();
        assert_eq!(output, expected);
    }

    #[test]
    fn phc_round_trip_accepts_correct_and_rejects_wrong_password() {
        let encoded = hash_phc(b"correct horse battery staple", &[0x5a; SALT_LEN]).unwrap();
        assert!(encoded.starts_with("$argon2id$v=19$m=19456,t=2,p=1$"));
        assert!(verify_phc(b"correct horse battery staple", &encoded).unwrap());
        assert!(!verify_phc(b"incorrect password", &encoded).unwrap());
    }

    #[test]
    fn rejects_malformed_and_unbounded_phc_before_derivation() {
        assert!(verify_phc(b"password", "$argon2id$v=19$m=999999,t=2,p=1$AA$AA").is_err());
        assert!(verify_phc(b"password", "$argon2i$v=19$m=19456,t=2,p=1$AA$AA").is_err());
        assert!(verify_phc(b"password", &"x".repeat(MAX_PHC_LEN + 1)).is_err());
        assert!(verify_phc(b"password", "$argon2id$v=19$m=19456,t=2,p=1$%%%$AA").is_err());
    }

    #[test]
    fn explicitly_zeroizes_every_working_memory_word() {
        let mut memory = WipingMemory::new(3);
        for block in memory.as_mut_slice() {
            let words: &mut [u64] = block.as_mut();
            words.fill(0xa5a5_a5a5_a5a5_a5a5);
        }
        memory.wipe();
        for block in memory.as_mut_slice() {
            let words: &[u64] = block.as_ref();
            assert!(words.iter().all(|word| *word == 0));
        }
    }

    #[test]
    fn matches_independent_argon2_cffi_phc_fixture() {
        // Generated independently with argon2-cffi 25.1.0:
        // Type.ID, version=19, m=19456, t=2, p=1, hash_len=32.
        let encoded = "$argon2id$v=19$m=19456,t=2,p=1$AAECAwQFBgcICQoLDA0ODw$HgadzgMogaKvjm4sbwElL0wO9HGwNWhl6ya2mcTteT8";
        let password = b"independent PHC interoperability fixture";
        assert!(verify_phc(password, encoded).unwrap());
        assert!(!verify_phc(b"wrong password", encoded).unwrap());
        assert_eq!(
            hash_phc(password, &(0u8..16).collect::<Vec<_>>()).unwrap(),
            encoded
        );
    }
}
