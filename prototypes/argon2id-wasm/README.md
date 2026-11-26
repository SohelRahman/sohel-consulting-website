# Isolated Argon2id prototype

**Status: experimental source prototype; not approved for application use or deployment.**

This crate pins RustCrypto Argon2 to commit `dc7e0c25cda9a8421d2604debf548d663886b431` and uses Argon2id v=19 with fixed parameters: 19,456 KiB, two passes, one lane and a 32-byte output. The host is responsible for generating a unique 16-byte salt with a cryptographically secure random source.

The working matrix is allocated by the wrapper and each 1 KiB block is explicitly zeroized in the owner's `Drop` implementation. The crate deliberately avoids the upstream convenience allocator because its internal matrix owner deallocates without wiping the complete matrix.

## Current scope

- Bounded password and salt inputs.
- Fixed Argon2id parameters; no user-controlled PHC cost values.
- Upstream Argon2id v=19 known-answer test at the upstream vector's test parameters.
- Determinism, password-difference, salt-difference and input-bound tests.
- Host and `wasm32-unknown-unknown` compilation in CI.

## Not yet implemented or approved

- No C/WASM ABI or JavaScript adapter.
- No PHC string encoding/verification or legacy PBKDF2 migration.
- No Cloudflare Worker integration or runtime benchmark.
- No measured CPU-time, peak memory or concurrency result.
- No production authentication changes.

The prototype must pass host tests, Wasm compilation, independent PHC interoperability tests, memory-wipe review and isolated Cloudflare Free-plan runtime tests before any Preview application integration is considered.
