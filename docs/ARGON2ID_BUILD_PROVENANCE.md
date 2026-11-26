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
- Prototype CI and runtime workflows pin GitHub Actions to immutable commits: checkout v4.2.2 (`11bd71901bbe5b1630ceea73d27597364c9af683`), setup-node v4.4.0 (`49933ea5288caeca8642d1e84afbd3f7d6820020`), upload-artifact v4.6.2 (`ea165f8d65b6e75b540449e92b4886f43607fa02`), and dtolnay/rust-toolchain stable commit `39008827e6b4319a349e9a42dfc90579dd25f1ca`. The first three SHAs resolve the named upstream release tags; the Rust toolchain action commit was fetched from its stable ref and GitHub reports its signature verified.
- Node.js is pinned to major version 22, not an exact patch version. Its exact resolved version is recorded in the artifact.
- CI artifact checksums are recorded, but no signed provenance/attestation or reproducible independent rebuild has been completed.

## Current acceptance status

- [x] Application dependency lockfile committed.
- [x] Argon2 implementation pinned to an immutable Git revision.
- [x] Rust toolchain pinned to 1.100.0 in prototype and runtime workflows.
- [x] wasm-bindgen CLI version derived from the lockfile and installed with `--locked`.
- [x] Build metadata, dependency/license inventory and artifact SHA-256 capture added to CI.
- [x] RustSec `cargo-audit` step pinned to 0.23.0 added to CI.
- [x] Prototype CI run [#45856402852](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45856402852) passed the RustSec audit step and uploaded the build-provenance artifact (artifact ID `15134694932`; ZIP SHA-256 `23a22e405dbd50f682fe00eb50f5cc6bb8866a7544caf0594c5d83c600399f77`). The audit scanned 34 locked crate dependencies against 1,568 loaded advisories and exited successfully.
- [ ] Manually review all license expressions in the uploaded provenance artifact. The successful audit exit is not a legal/license review.
- [x] Pin the GitHub Actions used by the prototype and runtime workflows to immutable commit SHAs.
- [ ] Pin Node.js to an exact patch release (currently major version 22; exact version is captured in the provenance artifact).
- [ ] Generate and retain a signed build provenance attestation or equivalent release evidence.
- [ ] Perform an independent clean rebuild and compare artifact hashes.

## Release decision

This work improves traceability but does not approve application integration or production deployment. The CPU-time evidence, repeatable performance characterization, independent security assessment and remaining release gates are still separate requirements.


## 2026-11-26 CI provenance checkpoint

Prototype CI #45856402852 completed successfully. `cargo audit --file Cargo.lock` loaded 1,568 RustSec advisories, scanned all 34 locked crate dependencies and exited successfully. The same run generated and uploaded `build-provenance.txt` and the WASM/binding package as artifact ID `15134694932`. The artifact ZIP SHA-256 is `23a22e405dbd50f682fe00eb50f5cc6bb8866a7544caf0594c5d83c600399f77`. This is CI evidence for the run, not a signed attestation. The build emitted a Rust future-incompatibility warning for `buf_redux 0.8.4` and `multipart 0.18.0`; these are noted for dependency-tree review. Node remains major-version pinned only.


## 2026-11-26 — Node.js and action pinning

The observed runtime was Node.js `v22.23.5`. Pinned this exact patch in `.github/workflows/test-argon2id-cloudflare-preview.yml`, `.github/workflows/test-argon2id-prototype.yml` and `.github/workflows/benchmark-password-kdf.yml`. The benchmark workflow's setup-node reference was also changed from the moving `v4` tag to immutable commit `49933ea5288caeca8642d1e84afbd3f7d6820020` (v4.4.0). Prototype CI #45860260434 and runtime rerun #45860426221 are expected to verify the pinned setup; both were not yet complete at documentation time.
