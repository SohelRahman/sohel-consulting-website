use sohel_argon2id_prototype::{MAX_PHC_LEN, verify_phc};

const FIXTURE: &str = "$argon2id$v=19$m=19456,t=2,p=1$AAECAwQFBgcICQoLDA0ODw$HgadzgMogaKvjm4sbwElL0wO9HGwNWhl6ya2mcTteT8";

#[test]
fn rejects_structural_and_canonical_encoding_mutations() {
    let cases = [
        "",
        "$argon2i$v=19$m=19456,t=2,p=1$AAECAwQFBgcICQoLDA0ODw$HgadzgMogaKvjm4sbwElL0wO9HGwNWhl6ya2mcTteT8",
        "$argon2id$v=16$m=19456,t=2,p=1$AAECAwQFBgcICQoLDA0ODw$HgadzgMogaKvjm4sbwElL0wO9HGwNWhl6ya2mcTteT8",
        "$argon2id$v=19$m=19457,t=2,p=1$AAECAwQFBgcICQoLDA0ODw$HgadzgMogaKvjm4sbwElL0wO9HGwNWhl6ya2mcTteT8",
        "$argon2id$v=19$m=19456,t=2,p=1$AAECAwQFBgcICQoLDA0ODw==$HgadzgMogaKvjm4sbwElL0wO9HGwNWhl6ya2mcTteT8",
        "$argon2id$v=19$m=19456,t=2,p=1$AAECAwQFBgcICQoLDA0ODx$HgadzgMogaKvjm4sbwElL0wO9HGwNWhl6ya2mcTteT8",
        "$argon2id$v=19$m=19456,t=2,p=1$AAECAwQFBgcICQoLDA0ODw$HgadzgMogaKvjm4sbwElL0wO9HGwNWhl6ya2mcTteT9",
        "$argon2id$v=19$m=19456,t=2,p=1$%%%$AA",
        "$argon2id$v=19$m=19456,t=2,p=1$AA$AA",
        "$argon2id$v=19$m=19456,t=2,p=1$AAECAwQFBgcICQoLDA0ODw$",
    ];
    for encoded in cases {
        assert!(
            !matches!(
                verify_phc(b"independent PHC interoperability fixture", encoded),
                Ok(true)
            ),
            "mutated or malformed PHC unexpectedly verified: {encoded}"
        );
    }
    assert!(verify_phc(b"independent PHC interoperability fixture", FIXTURE).unwrap());
}

#[test]
fn bounded_arbitrary_ascii_corpus_never_accepts_as_valid_phc() {
    // Deterministic xorshift corpus: exercises arbitrary bounded parser input without a new dependency.
    let mut state = 0x9e37_79b9_u32;
    for case_index in 0..4096usize {
        state ^= state << 13;
        state ^= state >> 17;
        state ^= state << 5;
        let len = (state as usize) % (MAX_PHC_LEN + 1);
        let mut candidate = String::with_capacity(len);
        for _ in 0..len {
            state ^= state << 13;
            state ^= state >> 17;
            state ^= state << 5;
            let byte = 32 + (state % 95) as u8;
            candidate.push(byte as char);
        }
        let result = verify_phc(b"property-corpus-password", &candidate);
        assert!(
            !matches!(result, Ok(true)),
            "arbitrary corpus input #{case_index} unexpectedly verified"
        );
    }
}
