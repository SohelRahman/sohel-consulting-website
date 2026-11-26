# Isolated Argon2id prototype

**Status: experimental source prototype; not approved for application use or deployment.**

This crate pins RustCrypto Argon2 to commit `dc7e0c25cda9a8421d2604debf548d663886b431` and uses Argon2id v=19 with fixed parameters: 19,456 KiB, two passes, one lane and a 32-byte output. The JavaScript host generates a unique 16-byte salt with `crypto.getRandomValues`.

## Implemented and CI-verified

- Bounded password, salt and PHC inputs; length checks occur before copying data into Wasm memory.
- `wasm-bindgen` exports for fixed-profile tag derivation, PHC generation and PHC verification.
- JavaScript adapter with CSPRNG salt generation, byte-length validation and best-effort clearing of mutable JavaScript byte buffers.
- Password copies inside Wasm use `Zeroizing<Vec<u8>>`; output and verification tag buffers use zeroizing wrappers.
- Fixed Argon2id parameters; PHC cost values cannot be selected by the caller.
- Strict PHC algorithm, version, parameter, base64 and decoded-field-length validation.
- Independent `argon2-cffi 25.1.0` PHC fixture verification, wrong-password rejection and exact encoding agreement.
- Working-memory wipe test that fills a multi-block matrix, invokes the wipe routine and asserts every word is zero.
- RustCrypto Argon2id v=19 known-answer test, determinism/differentiation tests, malformed-input tests and ABI boundary tests.
- Generated `wasm-bindgen` web and Node.js glue in CI.
- JavaScript adapter tests covering CSPRNG handling, input boundaries, PHC operations and explicit Wasm memory growth.

Latest successful CI: [Run #45818799624](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45818799624). Formatting, host tests, Clippy with warnings denied, release Wasm compilation, binding generation, JavaScript integration/memory-growth tests and artifact upload all passed.

## Not yet verified or approved

- The isolated Cloudflare Workers runtime workflow has not yet passed. Wrangler's precompiled-Wasm import and actual Worker instantiation therefore remain unverified.
- No Cloudflare runtime hash/verify measurements or CPU-time evidence have been collected.
- No concurrency or production-like load test has been completed.
- No application authentication integration, stored-password migration or production deployment is authorized.
- The independent interoperability evidence is one cross-implementation fixture, not a broad fuzz/property test suite.

## Security limitations

The explicit zeroization test verifies the wrapper's wipe routine. It does not prove resistance to compiler transformations, allocator copies, runtime snapshots, crashes or process termination. Clearing mutable JavaScript buffers is best effort; JavaScript strings are immutable and cannot be reliably zeroized. Do not describe this implementation as guaranteeing complete password erasure.

## Runtime gate

The next gate is the isolated Cloudflare Workers test using the compiled module import in `wrangler.toml`. The test must prove Worker startup, hash generation, correct-password acceptance, wrong-password rejection, memory-growth handling and successful deletion of the temporary Worker. Wall-clock timing must not be presented as Cloudflare CPU time.

This prototype remains separate from the website's authentication path until runtime compatibility, security review and release assessment are complete.
