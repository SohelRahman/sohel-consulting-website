//! Isolated Argon2id prototype. Not connected to application authentication.
use argon2::{Algorithm, Argon2, Block, Params, Version};
use zeroize::Zeroize;

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
    fn new(block_count: usize) -> Self { Self(vec![Block::new(); block_count]) }
    fn as_mut_slice(&mut self) -> &mut [Block] { &mut self.0 }
}
impl Drop for WipingMemory {
    fn drop(&mut self) { for block in &mut self.0 { block.zeroize(); } }
}

/// Derive a 32-byte Argon2id v=19 tag with fixed parameters.
pub fn derive(password: &[u8], salt: &[u8]) -> Result<[u8; OUTPUT_LEN], &'static str> {
    if password.is_empty() || password.len() > MAX_PASSWORD_LEN { return Err("password length out of bounds"); }
    if salt.len() != SALT_LEN { return Err("salt length must be exactly 16 bytes"); }
    let params = Params::new(MEMORY_KIB, ITERATIONS, PARALLELISM, Some(OUTPUT_LEN))
        .map_err(|_| "invalid fixed Argon2 parameters")?;
    let argon2 = Argon2::new(Algorithm::Argon2id, Version::V0x13, params);
    let mut memory = WipingMemory::new(MEMORY_KIB as usize);
    let mut output = [0u8; OUTPUT_LEN];
    argon2.hash_password_into_with_memory(password, salt, &mut output, memory.as_mut_slice())
        .map_err(|_| "Argon2id derivation failed")?;
    Ok(output)
}

fn b64_encode(input: &[u8]) -> String {
    let mut out = String::with_capacity((input.len() * 4 + 2) / 3);
    for chunk in input.chunks(3) {
        let a = chunk[0] as usize;
        let b = chunk.get(1).copied().unwrap_or(0) as usize;
        let c = chunk.get(2).copied().unwrap_or(0) as usize;
        out.push(B64[a >> 2] as char);
        out.push(B64[((a & 3) << 4) | (b >> 4)] as char);
        if chunk.len() > 1 { out.push(B64[((b & 15) << 2) | (c >> 6)] as char); }
        if chunk.len() > 2 { out.push(B64[c & 63] as char); }
    }
    out
}
fn b64_value(byte: u8) -> Option<u8> {
    B64.iter().position(|candidate| *candidate == byte).map(|v| v as u8)
}
fn b64_decode(input: &str, expected_len: usize) -> Result<Vec<u8>, &'static str> {
    if input.is_empty() || input.len() > 64 || input.len() % 4 == 1 { return Err("invalid PHC base64 length"); }
    let mut out = Vec::with_capacity(expected_len);
    let mut acc = 0u32;
    let mut bits = 0u8;
    for &byte in input.as_bytes() {
        let value = b64_value(byte).ok_or("invalid PHC base64 character")?;
        acc = (acc << 6) | value as u32;
        bits += 6;
        if bits >= 8 { bits -= 8; out.push((acc >> bits) as u8); }
    }
    if bits > 0 && (acc & ((1u32 << bits) - 1)) != 0 { return Err("non-canonical PHC base64"); }
    if out.len() != expected_len { return Err("invalid PHC field length"); }
    Ok(out)
}

/// Create a PHC-compatible string; caller must supply a CSPRNG-generated salt.
pub fn hash_phc(password: &[u8], salt: &[u8]) -> Result<String, &'static str> {
    let mut tag = derive(password, salt)?;
    let encoded = format!(
        "$argon2id$v=19$m={},t={},p={}${}${}",
        MEMORY_KIB, ITERATIONS, PARALLELISM, b64_encode(salt), b64_encode(&tag)
    );
    tag.zeroize();
    Ok(encoded)
}

/// Verify only the exact fixed PHC profile; attacker-controlled costs are never used.
pub fn verify_phc(password: &[u8], encoded: &str) -> Result<bool, &'static str> {
    if encoded.len() > MAX_PHC_LEN { return Err("PHC string too long"); }
    let fields: Vec<&str> = encoded.split('$').collect();
    if fields.len() != 6 || !fields[0].is_empty() || fields[1] != "argon2id"
        || fields[2] != "v=19"
        || fields[3] != format!("m={},t={},p={}", MEMORY_KIB, ITERATIONS, PARALLELISM)
    { return Err("unsupported PHC algorithm, version or parameters"); }
    let salt = b64_decode(fields[4], SALT_LEN)?;
    let expected = b64_decode(fields[5], OUTPUT_LEN)?;
    let mut actual = derive(password, &salt)?;
    let mut difference = 0u8;
    for (left, right) in actual.iter().zip(expected.iter()) { difference |= left ^ right; }
    actual.zeroize();
    Ok(difference == 0)
}

#[cfg(test)]
mod tests {
    use super::*;
    use argon2::{AssociatedData, ParamsBuilder};
    use hex_literal::hex;

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
        assert_ne!(first, derive(b"prototype test password", &[0x43; SALT_LEN]).unwrap());
    }
    #[test]
    fn matches_rustcrypto_argon2id_v19_known_answer_vector() {
        let params = ParamsBuilder::new().m_cost(32).t_cost(3).p_cost(4)
            .data(AssociatedData::new(&[0x04; 12]).unwrap()).build().unwrap();
        let secret = [0x03; 8];
        let argon2 = Argon2::new_with_secret(&secret, Algorithm::Argon2id, Version::V0x13, params).unwrap();
        let password = [0x01; 32];
        let salt = [0x02; 16];
        let expected = hex!("0d640df58d78766c08c037a34a8b53c9d01ef0452d75b65eb52520e96b01e659");
        let mut memory = WipingMemory::new(32);
        let mut output = [0u8; 32];
        argon2.hash_password_into_with_memory(&password, &salt, &mut output, memory.as_mut_slice()).unwrap();
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
}
