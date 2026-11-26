# Isolated Argon2id prototype

**Status: experimental source prototype; not approved for application use or deployment.**

This crate pins RustCrypto Argon2 to commit `dc7e0c25cda9a8421d2604debf548d663886b431` and uses Argon2id v=19 with fixed parameters: 19,456 KiB, two passes, one lane and a 32-byte output. The host is responsible for generating a unique 16-byte salt with a cryptographically secure random source.

The working matrix is allocated by the wrapper and each 1 KiB block is explicitly zeroized in the owner's `Drop` implementation. The crate deliberately avoids the upstream convenience allocator because its internal matrix owner deallocates without wiping the complete matrix.

## Implemented and CI-verified

- Bounded password and salt inputs.
- Fixed Argon2id parameters; no user-controlled PHC cost values.
- PHC-style string generation and verification, restricted to the exact fixed profile.
- Strict encoded-length, algorithm, version, parameter, base64 and decoded-field-length checks.
- Verification recomputes with fixed costs and compares the complete tag without early exit.
- RustCrypto Argon2id v=19 known-answer test at the upstream vector's test parameters.
- Determinism, password-difference, salt-difference and malformed-input tests.
- CI checks for formatting, five host tests, Clippy with warnings denied, and release compilation for `wasm32-unknown-unknown`.

Latest successful isolated CI: [Run #9](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45781931534), commit `a2809a78ea8f490d206ecaaf03d1bb274a1f4fef`.

## Not yet implemented or approved

- No C/WASM ABI or JavaScript adapter.
- No independently generated PHC interoperability fixture; current round-trip tests use this implementation on both sides.
- No explicit test proving matrix memory is wiped on every exit path.
- No Cloudflare Worker integration or runtime benchmark.
- No measured CPU-time, peak memory or concurrency result.
- No application authentication changes or legacy PBKDF2 migration.

The prototype must pass independent PHC interoperability tests, ABI boundary review, memory-wipe verification and isolated Cloudflare Free-plan runtime tests before any Preview application integration is considered.

## Independent PHC interoperability fixture

Added a fixed Argon2id PHC fixture generated independently with Python `argon2-cffi 25.1.0` using Argon2id v=19, m=19,456 KiB, t=2, p=1, a 16-byte salt containing bytes 0 through 15, and a 32-byte tag. The Rust test verifies the independent encoded string, rejects a wrong password, and checks that Rust-generated PHC output exactly matches the fixture. This establishes cross-implementation interoperability for this vector; it does not replace a broader fuzz/property test suite or runtime Worker validation.
