# Argon2id WASM Build Provenance

**Scope:** `prototypes/argon2id-wasm` only. This record describes the prototype's build inputs and evidence. It is not a security certification or release approval.

## Reproducible inputs

| Input | Pinned value | Evidence |
|---|---|---|
| Rust compiler/toolchain | Rust 1.100.0 | Pinned in both prototype GitHub Actions workflows; compiler verbose version is archived per build |
| Argon2 implementation | RustCrypto `argon2 0.6.0` | Immutable Git revision `dc7e0c25cda9a8421d2604debf548d663886b431` in Cargo.toml and Cargo.lock |
| Cargo dependency graph | Committed Cargo.lock, lock format v4 | All build/test/tree/metadata commands use `--locked` |
| wasm-bindgen crate and CLI | 0.2.130 | CLI version derived from the locked crate graph and installed with `--locked` |
| Node.js | Major version 22 | CI uses setup-node 22; exact runtime version is captured in build provenance |
| Wrangler | 4.160.1 | Exact version in isolated runtime workflow |
| Cargo dependency vulnerability audit | cargo-audit 0.23.0 | Exact version installed with `--locked`; CI runs `cargo audit --file Cargo.lock` against the RustSec advisory database |

## CI evidence

The prototype CI workflow records:
- source commit SHA;
- `rustc --version --verbose` and Cargo version;
- Node.js, wasm-bindgen and cargo-audit versions;
- target triple and build profile/features;
- the locked dependency tree;
- package name, version, license expression and source inventory from `cargo metadata`;
- SHA-256 checksums for Cargo.lock, the compiled WASM module and generated wasm-bindgen JavaScript/WASM outputs.

The resulting `build-provenance.txt` is uploaded with the short-retention CI artifact. The artifact is evidence for that particular CI run and source commit; it is not a long-term signed release attestation.

## Security and license review boundaries

- `cargo audit` checks the locked Rust dependency graph against RustSec advisories at the time of the run. A passing scan is time-bounded and does not establish that all dependencies are safe.
- The license inventory is evidence for manual review. It does not automatically establish license compatibility or satisfy a legal review.
- The audit tool's own build dependencies are not part of the application's Cargo.lock and are not included in the application's dependency inventory.
- GitHub Actions are currently referenced by major-version tags (for example, `actions/checkout@v4`), not immutable commit SHAs. This remains a supply-chain hardening item.
- Node.js is pinned to major version 22, not an exact patch version. Its exact resolved version is recorded in the artifact.
- CI artifact checksums are recorded, but no signed provenance/attestation or reproducible independent rebuild has been completed.

## Current acceptance status

- [x] Application dependency lockfile committed.
- [x] Argon2 implementation pinned to an immutable Git revision.
- [x] Rust toolchain pinned to 1.100.0 in prototype and runtime workflows.
- [x] wasm-bindgen CLI version derived from the lockfile and installed with `--locked`.
- [x] Build metadata, dependency/license inventory and artifact SHA-256 capture added to CI.
- [x] RustSec `cargo-audit` step pinned to 0.23.0 added to CI.
- [ ] Latest CI must pass the new audit step and publish the provenance artifact.
- [ ] Review any RustSec advisories and all license expressions reported by the run.
- [ ] Pin GitHub Actions by immutable commit SHA and Node.js to an exact patch release.
- [ ] Generate and retain a signed build provenance attestation or equivalent release evidence.
- [ ] Perform an independent clean rebuild and compare artifact hashes.

## Release decision

This work improves traceability but does not approve application integration or production deployment. The CPU-time evidence, repeatable performance characterization, independent security assessment and remaining release gates are still separate requirements.
