//! Isolated Argon2id prototype. Not connected to application authentication.
use argon2::{Algorithm, Argon2, AssociatedData, Block, Params, ParamsBuilder, Version};
use zeroize::Zeroize;

pub const MEMORY_KIB: u32 = 19_456;
pub const ITERATIONS: u32 = 2;
pub const PARALLELISM: u32 = 1;
pub const OUTPUT_LEN: usize = 32;
pub const SALT_LEN: usize = 16;
pub const MAX_PASSWORD_LEN: usize = 1024;

/// Owns the Argon2 working matrix and wipes every block before deallocation.
struct WipingMemory(Vec<Block>);

impl WipingMemory {
    fn new(block_count: usize) -> Self {
        Self(vec![Block::new(); block_count])
    }

    fn as_mut_slice(&mut self) -> &mut [Block] {
        &mut self.0
    }
}

impl Drop for WipingMemory {
    fn drop(&mut self) {
        for block in &mut self.0 {
            block.zeroize();
        }
    }
}

/// Derive a 32-byte Argon2id v=19 tag with fixed OWASP-baseline parameters.
/// The caller supplies a cryptographically random 16-byte salt.
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
    let blocks = (MEMORY_KIB as usize).max(8 * PARALLELISM as usize);
    let mut memory = WipingMemory::new(blocks);
    let mut output = [0u8; OUTPUT_LEN];

    argon2
        .hash_password_into_with_memory(password, salt, &mut output, memory.as_mut_slice())
        .map_err(|_| "Argon2id derivation failed")?;

    Ok(output)
}

#[cfg(test)]
mod tests {
    use super::*;
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
        let second = derive(b"prototype test password", &salt).unwrap();
        assert_eq!(first.len(), OUTPUT_LEN);
        assert_eq!(first, second);
        assert_ne!(first, derive(b"different password", &salt).unwrap());
        assert_ne!(first, derive(b"prototype test password", &[0x43; SALT_LEN]).unwrap());
    }

    #[test]
    fn matches_rustcrypto_argon2id_v19_known_answer_vector() {
        // Upstream RustCrypto KAT: m=32 KiB, t=3, p=4, tag=32 bytes.
        let params = ParamsBuilder::new()
            .m_cost(32)
            .t_cost(3)
            .p_cost(4)
            .data(AssociatedData::new(&[0x04; 12]).unwrap())
            .build()
            .unwrap();
        let secret = [0x03; 8];
        let argon2 = Argon2::new_with_secret(&secret, Algorithm::Argon2id, Version::V0x13, params).unwrap();
        let password = [0x01; 32];
        let salt = [0x02; 16];
        let expected = hex!(
            "0d640df58d78766c08c037a34a8b53c9d01ef0452d75b65eb52520e96b01e659"
        );
        let mut memory = WipingMemory::new(32);
        let mut output = [0u8; 32];
        argon2
            .hash_password_into_with_memory(&password, &salt, &mut output, memory.as_mut_slice())
            .unwrap();
        assert_eq!(output, expected);
    }
}
