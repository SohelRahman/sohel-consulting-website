# Isolated Argon2id prototype

**Status: experimental source prototype; not approved for application use or deployment.**

This crate pins RustCrypto Argon2 to commit `dc7e0c25cda9a8421d2604debf548d663886b431` and uses Argon2id v=19 with fixed parameters: 19,456 KiB, two passes, one lane and a 32-byte output. The host is responsible for generating a unique 16-byte salt with a cryptographically secure random source.

The working matrix is allocated by the wrapper and each 1 KiB block is explicitly zeroized in the owner's `Drop` implementation. The crate deliberately avoids the upstream convenience allocator because its internal matrix owner deallocates without wiping the complete matrix.

## Implemented and CI-verified

- Bounded password and salt inputs.
- `wasm-bindgen` exports accept JavaScript `Uint8Array` objects; length checks happen before copying inputs into Wasm memory.
- Exported operations are limited to raw fixed-length tag derivation, fixed-profile PHC generation and fixed-profile PHC verification. Password copies inside Wasm are held in `Zeroizing<Vec<u8>>`.
- Fixed Argon2id parameters; no user-controlled PHC cost values.
- PHC-style string generation and verification, restricted to the exact fixed profile.
- Strict encoded-length, algorithm, version, parameter, base64 and decoded-field-length checks.
- Verification recomputes with fixed costs and compares the complete tag without early exit.
- Independent `argon2-cffi` PHC fixture verification and exact encoding agreement.
- Explicit working-memory zeroization test fills every word in a multi-block matrix, invokes the wipe routine and asserts every word is zero.
- RustCrypto Argon2id v=19 known-answer test at the upstream vector's test parameters.
- Determinism, password-difference, salt-difference and malformed-input tests.
- CI checks for formatting, seven host tests, Clippy with warnings denied, and release compilation for `wasm32-unknown-unknown`.

Latest successful host-test/validation CI: [Run #45804064689](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45804064689), including the independent PHC fixture. The current zeroization-test change still requires CI.

## Not yet implemented or approved

- No generated `wasm-bindgen` JavaScript package or Worker adapter yet; the Rust ABI exports are source-implemented and compile validation is pending.
- No runtime test yet proving JS typed-array behavior, memory growth or Worker module instantiation.
- No broad independent PHC interoperability/fuzz suite; the current fixture is a single cross-implementation vector.
- The explicit wipe test verifies the wrapper routine; it does not prove resistance to all compiler, allocator, crash or process-termination behaviors.
- No Cloudflare Worker integration or runtime benchmark.
- No measured CPU-time, peak memory or concurrency result.
- No application authentication changes or legacy PBKDF2 migration.

The prototype must pass independent PHC interoperability tests, ABI boundary review, memory-wipe verification and isolated Cloudflare Free-plan runtime tests before any Preview application integration is considered.

## Independent PHC interoperability fixture

Added a fixed Argon2id PHC fixture generated independently with Python `argon2-cffi 25.1.0` using Argon2id v=19, m=19,456 KiB, t=2, p=1, a 16-byte salt containing bytes 0 through 15, and a 32-byte tag. The Rust test verifies the independent encoded string, rejects a wrong password, and checks that Rust-generated PHC output exactly matches the fixture. This establishes cross-implementation interoperability for this vector; it does not replace a broader fuzz/property test suite or runtime Worker validation.
