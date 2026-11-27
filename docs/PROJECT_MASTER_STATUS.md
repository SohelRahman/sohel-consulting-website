

## 2026-11-27 — Admin self-delete integration fixture corrected

The latest Admin API integration run failed because the self-delete test used a request helper that omitted the required same-origin `Origin` header. The route correctly rejected that request with HTTP 403 before reaching its self-delete guard; the test expected HTTP 400. Updated the test to use the JSON request helper, which sends the same-origin header. This is a test-fixture correction, not a Worker behavior change. Validation for commit `a9d0e1c66c1499576f7dab28bb3265d210fff1ef` is pending. No Preview/Production deployment, remote D1 migration, or data write was performed.


## 2026-11-27 — MFA migration compatibility test strengthened

The SQLite challenge test now builds its schema by applying the existing `migrations/0019_admin_mfa.sql` followed by `migrations/0020_admin_mfa_challenge_state.sql`, instead of manually creating simplified MFA tables. It asserts the added `last_factor_claim_id`, `used_by`, and challenge-consumption columns exist, then exercises challenge replay, factor single-use and reset/session-revocation transactions against that migrated schema. This improves migration-order coverage but is still SQLite validation, not a remote Cloudflare D1 migration rehearsal. CI for this latest change is pending. No Preview/Production migration or deployment was performed.


## 2026-11-27 — MFA challenge and disable/reset hardening CI passed

- Development validation [#45997274827](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45997274827) completed successfully for branch head `a4f93af07ac9df33ad19cc8a4c8a722ec7910d37`.
- The passing job includes Worker syntax, site validation, RBAC, CMS/Page Builder atomicity, CMS revision SQL, password compatibility, MFA cryptographic/source-contract tests, SQLite challenge replay/expiry/purpose tests, and MFA disable/reset factor-claim transaction checks, plus course pricing, registration and quotation tests.
- The MFA disable route now assigns a unique factor claim marker to the consumed TOTP counter or recovery-code row. Session-version revocation is conditional on that exact marker, then MFA credential and recovery-code state are removed. This prevents a competing reset request from relying only on a factor value already consumed by another request.
- This remains CI/source-level evidence. No authenticated D1 runtime replay/reset test has run. Migration 0020 has not been applied remotely and Preview deployment was skipped.
- Next gate requires explicit authorization to apply migration 0020 and deploy the development Worker to Preview, then test fresh enrollment, MFA login, sequential/concurrent challenge replay, recovery-code single use, MFA reset and RBAC using a controlled Preview account. No Production action is included.


## 2026-11-27 — MFA disable/reset atomicity hardening added

A further source review found MFA disable previously consumed the TOTP counter or recovery code before the separate session-revocation/deletion batch. The route now updates the factor and assigns a unique `factorClaimId` in the same guarded batch sequence; session-version increment is permitted only when that exact claim marker is present, followed by recovery-code and credential deletion. Migration 0020 adds `last_factor_claim_id` and `used_by` columns for these claim markers. Added source assertions and SQLite transaction coverage. CI result is pending for this additional change. No remote migration or deployment has occurred.


## 2026-11-27 — MFA single-use challenge CI validation passed

- Development validation [#45996901546](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45996901546) completed successfully for branch head `782cec9dfd2951d0571d64e5baaf9d6f321b35e5`.
- Passed Worker syntax, site validation, RBAC, CMS/Page Builder atomicity, CMS revision SQL, password compatibility, Admin MFA cryptographic/source-contract checks, the new MFA challenge SQLite transaction/replay test, course pricing, registration and quotation response tests.
- This is CI/source-level evidence only. It does not prove remote D1 migration compatibility or authenticated Preview replay resistance.
- Migration 0020 remains unapplied remotely; Preview deploy job was skipped. No D1 write, Preview deployment, Production action, `main` update or PR merge occurred.
## 2026-11-27 — MFA challenge single-use remediation implemented in source

- Added additive migration `migrations/0020_admin_mfa_challenge_state.sql` to persist challenge nonce, user, purpose, expiry and one-time consumption claim.
- Updated `src/worker.js`: issue a database-backed challenge, reject absent/expired/consumed or purpose-mismatched challenge state, and atomically claim the challenge with the TOTP counter or recovery-code consumption in a D1 batch. Enrollment confirmation consumes its challenge in the same batch as credential activation and recovery-code issuance. Expired challenge rows are cleaned when a new challenge is issued.
- Added source-contract checks to `scripts/test-admin-mfa.mjs` and SQLite transaction/replay tests in `scripts/test-admin-mfa-challenge.py`; wired the latter into `.github/workflows/validate-development.yml`.
- **Status: source implementation complete; CI result pending.** Migration 0020 has not been applied to Preview or Production. No Preview deployment, D1 write, Production action, `main` update or PR merge was performed.
- Required next gates: confirm CI passes; independently review D1 batch semantics and migration; obtain explicit approval before Preview migration/deployment; then test sequential and concurrent replay against the deployed Preview Worker with controlled test account.
## 2026-11-27 — MFA challenge replay gap found in source review

- Read-only review of `src/worker.js` found the signed five-minute MFA challenge nonce is not persisted or consumed. A successful MFA verification issues a session without invalidating that challenge. TOTP counter and recovery-code one-time checks do not prevent using a different valid factor against the same challenge during its lifetime.
- This is a high-priority source-review finding, not a live exploit demonstration. MFA acceptance is blocked until challenge state is persisted and consumed atomically with factor consumption; add sequential and concurrent replay tests.
- Next code task: implement single-use MFA challenge persistence/consumption on `current-focus-development`, with a new additive migration and deterministic tests. No migration application or Preview deployment without explicit approval.


### Additional Cloudflare usage-model finding (official docs checked 2026-11-27)

Cloudflare's current limits documentation also lists the deprecated legacy **Bundled** usage model, whose HTTP-request CPU limit is 50 ms; legacy Unbound has limits matching Workers Paid. This is another possible explanation to investigate, but it does not resolve the observed 51–97 ms samples or establish which model applies to this Worker. Confirm the exact Worker Usage Model in the Dashboard. Official source: https://developers.cloudflare.com/workers/platform/limits/ (sections “CPU time” and “Unbound and Bundled plan limits”).


## 2026-11-27 — Argon2id CPU-limit discrepancy blocks integration

- Runtime #45879657641 passed and returned route-identifiable invocation CPU metrics: /hash 44–78 ms (6 events), /verify 51–97 ms (5 events), health 0 ms (1 event). These are Worker invocation metrics, not isolated KDF primitive timings.
- This conflicts with the prior recorded assumption that the linked account was Workers Free at 10 ms/request. Current Cloudflare documentation still states Free 10 ms/request, Paid Standard 30-second default (up to 5 minutes), and limited flexibility only for infrequent over-limit invocations. Eleven non-zero route samples exceeded 10 ms.
- The prototype Wrangler config has no explicit `limits.cpu_ms`; effective account/Worker usage model remains unverified. Do not infer that the account upgraded or that the 10 ms limit was exceeded/ignored without dashboard evidence.
- **Blocker:** obtain read-only Cloudflare Dashboard evidence for account plan/usage model, disposable Worker Usage Model and CPU limit, invocation outcome details, and the application Preview Worker's own effective limit. No plan upgrade, charge, CPU-limit change or config change is authorized.
- Argon2id remains isolated and not approved for application authentication. See `docs/PASSWORD_STORAGE_DESIGN_ASSESSMENT.md` and `docs/ARGON2ID_CPU_TIME_MEASUREMENT.md`.


## 2026-11-27 — Argon2id request-level telemetry verified; project records expanded

- Isolated runtime workflow [#45879657641](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45879657641) passed at commit `275c122fd11019670823902e4e41a1e9bde86543`. The corrected jq telemetry reporter succeeded and Cloudflare returned 12 invocation records for the exact disposable Worker.
- Event source URLs provided request paths: 6 `POST /hash` invocations (CPU ms: 45, 48, 44, 51, 78, 66), 5 `POST /verify` invocations (CPU ms: 84, 73, 63, 51, 97), and one `GET /health` invocation (0 ms). These are route-level Worker invocation metrics, not isolated Argon2 primitive timings; sample sizes are small and do not establish a stable distribution.
- CPU values of 44–97 ms must be reconciled with the account's actual Cloudflare plan and effective per-request CPU limit. Do not claim CPU-limit compliance. Resolve this before any KDF integration decision.
- Cleanup verified: disposable Worker DELETE HTTP 200 and follow-up GET HTTP 404. No application authentication integration, existing Preview deployment, D1 operation, Production change, `main` update or PR merge.
- Created `NEXT_CHAT_HANDOVER.md`, `DEVELOPMENT_STRATEGY_WBS.md`, `docs/TEST_REPORT.md` and `docs/SECURITY_BASELINE.md`; updated `README.md` with the project-document index. The six requested project-control documents now exist on `current-focus-development`.
- Next engineering gate: verify current Cloudflare plan/CPU limit against the observed invocation metrics, then resume authenticated Preview MFA/RBAC and CMS/workflow acceptance. Formal OWASP ASVS Level 2 remains incomplete.


## 2026-11-27 — Argon2id telemetry reporter correction; TinyFish ground rule

- Corrected the isolated Argon2id runtime workflow's jq field access quoting for the Cloudflare invocation report. Commit: `6a776de5e9f6cd58462d0dd086d1845aebfcd99e`.
- This is a reporting-only source correction. A fresh workflow run is required before claiming the parser is fixed or telemetry correlation is validated; the previous run remains failed.
- TinyFish operating rule: use it when it materially improves engineering execution, browser testing, Preview inspection or research; avoid unnecessary calls and avoidable charges. Never perform unauthorized data mutations, authenticated actions, Production changes or configuration changes. Record meaningful evidence in project docs.
- Existing boundaries remain: work on `current-focus-development`; do not merge PR #1 or update `main`; no Production, D1 write/migration, existing Preview deployment or secret changes without explicit approval.


## 2026-11-27 — Third Argon2id telemetry run; correlation improvement queued

- Isolated runtime [#45878008941](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45878008941) passed on current-focus-development at commit 69a68d0af39f705dcb722bb408e2657ae2383893.
- Cloudflare returned two invocation records for the exact disposable Worker: **59 ms CPU / 59 ms wall** and **96 ms CPU / 99 ms wall**. Event keys were $metadata, $workers, dataset, source and timestamp; no request path/method appeared in the inspected fields. Endpoint attribution remains unproven.
- Two concurrent hashes took 123.828 ms combined client wall time. WASM memory stabilized at 323 pages after growth from 17. Cleanup was verified (DELETE 200, GET 404).
- Runtime workflow commit 065c0e16cc99d621508ab8a2b35dbb3bc56dc243 adds a client request timeline and exposes invocation timestamp/source/dataset plus nested field names to test timestamp-based correlation. Runtime validation is pending.
- These remain invocation-level samples only. No per-operation CPU claim, CPU-limit compliance claim, application authentication integration, Production deployment, D1 operation, main update or PR merge.


## 2026-11-27 — Second isolated Cloudflare telemetry run

- Runtime [#45877435363](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45877435363) passed on `current-focus-development` at commit `db0b46bec19cda5c78080d86963ea9060aeb00fd`.
- Cloudflare Observability returned two records for the exact disposable Worker: **59 ms CPU / 60 ms wall** and **0 ms / 0 ms**. The records are invocation-level and cannot be attributed to individual hash or verify routes. Do not claim per-operation CPU cost or CPU-limit compliance.
- Sequential JavaScript hash/verify timing fields rounded to 0 ms; two concurrent hashes took 134.572 ms combined client wall time. WASM memory grew 17 → 323 pages and remained stable.
- Cleanup verified: temporary Worker DELETE HTTP 200; subsequent GET HTTP 404.
- Together with run #45876662415 (58 ms CPU / 60 ms wall in one event), this is a second independent runtime with a non-zero invocation sample, not a sufficient distribution. Request-level correlation and additional samples remain the next gate.
- No application authentication integration, existing Preview deployment, D1 operation, Production change, `main` update or PR merge.
## 2026-11-27 — First Cloudflare CPU-time sample captured

- Runtime #45876662415 passed and returned one Cloudflare invocation event filtered to the exact disposable Worker. Platform telemetry: **58 ms CPU time**, **60 ms wall time**. This is the first actual CPU-time sample; it is not derived from JavaScript timers.
- One invocation event is insufficient for endpoint attribution, stable performance characterization, or CPU-limit compliance claims. Repeat independent runs and collect a distribution.
- Same run: two concurrent hash requests took 126.997 ms combined client wall-clock; WASM memory grew 17 → 323 pages and remained stable; temporary Worker deletion and absence were verified.
- Website validation #45876662428 passed. CPU-time characterization remains open.
## 2026-11-27 — Argon2id runtime passed; Observability query corrected

- Isolated runtime run [#45875891768](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45875891768) passed precompiled WASM build, temporary Worker deployment, health, hash/verify, correct/wrong password checks, sequential/concurrent requests and cleanup (delete HTTP 200; absence HTTP 404).
- Runtime observations: two concurrent hash requests; 683.469 ms combined wall-clock; WASM memory 17 → 323 pages and stable after subsequent requests. JS `performance.now()` samples rounded to 0 ms and are not CPU-time measurements.
- Cloudflare Observability keys discovery exposed CPU and wall-time fields, but the query returned zero invocation groups. Review against current Cloudflare API documentation identified a query-shape error: `view` belongs at the top level of the query request, not inside `parameters`. The query also lacked a script-name filter.
- Corrected `.github/workflows/test-argon2id-cloudflare-preview.yml` to use top-level `view: "invocations"`, dataset parameters and a `$workers.scriptName` equality filter for the exact disposable Worker. Commit `09e84882e5eac8099dddbf3cc15dd5bf1f6ee090`.
- Runtime rerun [#45876662415](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45876662415) and website validation [#45876662428](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45876662428) were in progress at documentation time. CPU-time evidence remains unverified until actual invocation samples are returned.
- Reference: https://developers.cloudflare.com/api/resources/workers/subresources/observability/subresources/telemetry/methods/query/ .
- No application authentication integration, existing Preview deployment, D1 operation, Production change, `main` update or PR merge.

## 2026-11-27 — Runtime harness follow-up correction

- The health-probe correction worked: runtime #45875591303 successfully deployed the isolated Worker, uploaded its temporary test token, passed the health probe and proceeded through hash/verify and sequential/concurrent request checks.
- The run then failed in its result-reporting code with `ReferenceError: concurrent is not defined`; the harness declared `concurrentBodies` but reported `concurrent.length`. The EXIT cleanup still deleted the temporary Worker (HTTP 200) and verified absence (HTTP 404).
- Corrected `.github/workflows/test-argon2id-cloudflare-preview.yml` to report `concurrentBodies.length`. Commit: `fa48da65de2aec6d34c0611ba834fda0dced8976`.
- A fresh runtime run and final prototype CI result are required. No CPU-time evidence was captured; do not treat this as runtime acceptance.
- No application authentication, existing Preview, D1, Production or `main` changes.

## 2026-11-26 — Argon2id runtime health probe diagnostic correction

- Inspected failed isolated runtime #45860426221. Precompiled WASM build and deployment succeeded, temporary test secret upload succeeded, but the health probe received HTTP 404 after ten retries. The Worker intentionally returned the same 404 for unauthorized requests and unknown routes, preventing the harness from distinguishing a token/configuration issue from route propagation.
- Changed only `prototypes/argon2id-wasm/worker.mjs`: the non-sensitive `GET /health` response now runs before the test-token guard. `POST /hash` and `POST /verify` remain protected by the temporary test token. This is limited to the isolated prototype Worker.
- Commit: `4d513470159e48e3a7f18790974fa56c8c110dcc` on `current-focus-development`.
- Website validation run #45875591292 passed. Prototype CI #45875591553 and isolated runtime run #45875591303 were in progress at documentation time; their results must be checked before marking this correction verified.
- No application authentication integration, D1 operation, existing Preview deployment, Production change, `main` update, branch reconciliation or PR merge occurred.
- CPU-time evidence remains outstanding and must not be inferred from JavaScript wall-clock timing.

## 2026-11-26 — Node.js toolchain patch pin

- Pinned Node.js `22.23.5` across the Argon2id prototype CI, isolated Cloudflare runtime workflow and password-KDF benchmark workflow.
- Pinned the benchmark workflow's setup-node action to immutable v4.4.0 commit `49933ea5288caeca8642d1e84afbd3f7d6820020`.
- Prototype CI #45860260434 is running the audit/test pipeline; isolated runtime rerun #45860426221 is queued. Exact-patch CI verification remains pending.

## 2026-11-26 — Argon2id runtime transient response handling

- Unfiltered diagnostic run #45859485701 deployed the Worker but a `/verify` request returned HTML instead of JSON. The exact HTTP status/content type was not captured by the previous client. The run failed before telemetry query; no invocation samples were captured.
- Cleanup still passed: temporary Worker deletion HTTP 200 and absence check HTTP 404.
- Updated the isolated runtime harness with bounded retry/backoff for transient non-JSON, HTTP 5xx and HTTP 429 responses, and clearer persistent-error diagnostics. Rerun #45859898860 is queued.
- CPU-time evidence remains outstanding. Cloudflare exposes CPU/wall-time keys, but a usable invocation query has not yet returned records.

## 2026-11-26 — Argon2id invocation query diagnostic

- Runtime #45857773930 passed deployment, hash/verify, correct/wrong password, sequential/concurrent checks and cleanup (HTTP 200 deletion; HTTP 404 absence verification). Two concurrent hashes: 124.138 ms combined wall-clock; WASM memory grew from 17 to 323 pages and remained stable.
- Cloudflare keys API exposed `$workers.cpuTimeMs` and `$workers.wallTimeMs`. Invocation query completed successfully but returned zero invocation groups. No CPU-time result is claimed.
- Removed the unverified `$metadata.service` script-name filter and added sanitized event/metadata inspection. Unfiltered diagnostic runtime #45859485701 is in progress.
- Prototype CI #45856402852 passed locked RustSec audit (34 dependencies, 1,568 advisories loaded), full tests/build and provenance artifact upload (ID `15134694932`).
- No application authentication, D1, `main`, existing Preview or Production resources changed. Integration remains blocked pending CPU-time evidence, independent rebuild, signed provenance, dependency/license review and external security assessment.

## 2026-11-26 — Argon2id CI and isolated runtime verification update

- Prototype CI [#45856402852](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45856402852) passed formatting, host tests, Clippy, WASM compilation/bindings, Node integration/memory-growth tests, locked RustSec audit and provenance artifact upload. `cargo audit` scanned 34 locked dependencies against 1,568 loaded advisories and exited successfully.
- Provenance artifact ID `15134694932`; uploaded ZIP SHA-256 `23a22e405dbd50f682fe00eb50f5cc6bb8866a7544caf0594c5d83c600399f77`. License inventory is captured but still needs manual review; signed attestation and independent clean rebuild remain open.
- Isolated runtime [#45856609844](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45856609844) passed deployment, health, PHC hash/verify, correct/wrong password checks, sequential/concurrent checks and cleanup (deletion HTTP 200; absence HTTP 404).
- WASM memory grew from 17 to 323 pages and remained stable. Two concurrent hashes took 160.404 ms combined wall-clock; per-operation timer samples were 0 ms. These are not CPU-time measurements.
- The telemetry API key discovery returned only `$metadata.service`. Current Cloudflare API docs confirm `$metadata.service` as a common filter field and support full key discovery with a limit. Runtime workflow corrected in commit `8ee6e9e`; rerun is required before CPU-time can be measured.
- Rust build emitted a future-incompatibility warning for `buf_redux 0.8.4` and `multipart 0.18.0`; inspect their dependency paths. Node is still pinned only to major version 22.
- No application authentication, D1, `main`, existing Preview or Production resources changed. Prototype remains isolated and not approved for integration.

## 2026-11-26 — CPU-time logging deployment queued

- Native invocation logging configuration and measurement procedure are committed.
- Logging-enabled isolated runtime workflow [#45841415366](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45841415366) is in progress at the precompiled-WASM build stage.
- No CPU-time values have been collected yet. Next step after deployment is to inspect the temporary Worker invocation records in Cloudflare Workers Observability and record separate hash/verify CPU-time samples.

## 2026-11-26 — PHC corpus CI and failure-path cleanup verified

- Prototype CI [#45838494936](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45838494936) passed formatting, host tests including the deterministic PHC corpus, Clippy, release WASM compilation, wasm-bindgen bindings, Node adapter/memory-growth tests and artifact upload.
- Controlled failure-path Cloudflare runtime [#45840895843](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45840895843) passed: after runtime checks, the workflow injected the expected failure; cleanup deleted the temporary Worker (HTTP 200), and a follow-up Cloudflare API GET verified absence (HTTP 404).
- In that run, the two-request concurrent batch took 201.874 ms wall-clock; per-operation timer samples remained 0 ms. Memory grew from 17 to 323 Wasm pages and remained stable. No CPU-time value was captured.
- Native Workers invocation logging is now configured in the isolated Wrangler file. Added `docs/ARGON2ID_CPU_TIME_MEASUREMENT.md` with dashboard and API steps. A new runtime deployment is required to activate logging before CPU-time samples can be inspected.
- Failure-path cleanup is resolved for the tested workflow; actual invocation CPU-time evidence remains the next release blocker.

## 2026-11-26 — Native CPU-time observability enabled for isolated Argon2id Worker

- Added native Workers invocation logging at 100% head sampling to `prototypes/argon2id-wasm/wrangler.toml`.
- Added `docs/ARGON2ID_CPU_TIME_MEASUREMENT.md` describing dashboard and Observability API steps, sample association and acceptance criteria.
- Cloudflare documentation confirms invocation CPU time and wall time are separate fields; Workers Logs is included on Workers Free. No Logpush job, external log destination or paid service was configured.
- Actual hash/verify CPU-time samples have not yet been collected. This is instrumentation setup, not CPU-limit compliance evidence.
- The failure-injection workflow #45840895843 status must be checked independently; no failure-path cleanup result is recorded by this documentation change.

## 2026-11-26 — Second Argon2id runtime exercise passed

- Isolated runtime run [#45837980987](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45837980987) passed compiled-WASM build/deploy, Worker health, hash/verify, correct/wrong password checks, sequential and concurrent request checks, and temporary Worker deletion (HTTP 200).
- Memory grew from 17 to 323 Wasm pages and remained stable. Two-request concurrent batch wall-clock was 145.017 ms. Per-operation hash/verify timer samples were again 0 ms; no CPU-time metric was captured.
- This was an ordinary runtime run, not the controlled failure-injection test. Failure-path cleanup remains open.

## 2026-11-26 — Cleanup failure-injection run status correction

- The first opt-in failure-injection runtime run #45838191990 was canceled before execution when a newer push superseded it. No failure-path cleanup result is claimed.
- The latest ordinary runtime run #45838254764 is queued; it does not activate the failure injection.
- The cleanup trap implementation is committed, but failure-path behavior remains unverified until a dedicated marker run completes.

## 2026-11-26 — PHC corpus and failure-path cleanup tests added

- Added deterministic PHC structural/canonical-Base64 mutations and 4,096 arbitrary bounded ASCII parser inputs in `prototypes/argon2id-wasm/tests/phc_input_corpus.rs`.
- Prototype CI #45837980772 passed formatting, host tests (including the corpus) and Clippy; WASM binding generation and Node integration tests were still in progress at this checkpoint.
- Added opt-in post-deployment failure injection to the isolated Cloudflare runtime workflow. Its EXIT trap deletes the temporary Worker and verifies a follow-up Cloudflare API GET returns 404. Runtime CI #45838191990 is pending.
- No Production or application authentication changes.

## 2026-11-26 — Argon2id runtime benchmark completed; next gates opened

- Dedicated prototype CI [Run #45836658113](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45836658113) passed formatting, host tests, Clippy, release WASM build, wasm-bindgen web/Node binding generation, adapter/memory-growth tests and artifact upload.
- Isolated Cloudflare runtime/benchmark [Run #45836666885](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45836666885) passed precompiled-WASM deployment, health, PHC hash/verify, correct/wrong password checks, repeated sequential requests, two concurrent hash requests and temporary Worker deletion (HTTP 200).
- Memory grew from 17 to 323 Wasm pages and remained at 323 pages after the sequential/concurrent exercise.
- Concurrent batch wall-clock was 108.956 ms. Per-operation `performance.now()` samples were all 0 ms, so the per-operation timer did not provide usable resolution. This single run is not a stable latency/load characterization and is not Cloudflare CPU time.
- README and source-level security review were updated. CPU-time evidence (`CPUTimeMs`), meaningful repeated load/memory characterization, broader PHC interoperability, failure-path cleanup and provenance review remain open.
- **Next priority started:** added a deterministic malformed-PHC and arbitrary bounded-input corpus in `prototypes/argon2id-wasm/tests/phc_input_corpus.rs`. CI verification is pending.
- No application authentication, D1, existing Preview, Production or `main` changes.

## 2026-11-26 — Cloudflare Workers runtime compatibility passed

- Isolated runtime CI [Run #45827375696](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45827375696) passed compiled-Wasm import, Worker startup/health, hash generation, correct-password acceptance, wrong-password rejection, memory growth (17 to 323 pages), and temporary Worker cleanup.
- The first attempt failed because the health request raced Worker propagation and Wrangler cleanup hit an authentication API error. The retry added propagation retries and direct Cloudflare API deletion. It confirmed the previous Worker name was already absent and deleted the current Worker with HTTP 200.
- The runtime harness now reports higher-precision `performance.now()` wall-clock durations and tests repeated sequential hash/verify requests plus a two-request concurrent hash batch. These timings are wall-clock measurements, not Cloudflare CPU time.
- A new benchmark/runtime workflow is running at [Run #45836666885](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45836666885). Do not record performance results until the job completes and logs are inspected.
- Cloudflare's Workers Trace Events dataset exposes `CPUTimeMs`; obtaining that metric requires the relevant observability/log access. No CPU-time figure has been verified yet.
- The prototype remains isolated. No application authentication, D1, existing Preview or Production changes.

## 2026-11-26 — Argon2id WASM source-level security review

- Added `docs/ARGON2ID_WASM_SECURITY_REVIEW.md` covering the Rust implementation, JavaScript adapter, temporary Worker harness and CI workflows.
- Positive controls include fixed Argon2id costs, bounded inputs, Web Crypto salt generation, owned working-memory wiping, mutable-buffer cleanup and full-tag comparison.
- Release blockers remain: Cloudflare runtime acceptance, actual invocation CPU-time evidence, concurrency/memory testing and broader interoperability/fuzz coverage.
- The review is source-level only, not an external audit. The prototype remains isolated; no application authentication, stored hashes, D1, existing Preview or Production resources changed.

## 2026-11-26 — Argon2id WASM binding and adapter CI passed

- Development head at this checkpoint: `2c7ceaf635b737694c826b77865c6b2816b0d1d0` on `current-focus-development`.
- Dedicated CI [Run #45818799624](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45818799624) passed formatting, Rust host tests, Clippy, release Wasm compilation, `wasm-bindgen` web/Node binding generation, JavaScript adapter integration tests, explicit Wasm memory-growth testing and artifact upload.
- The Node integration build uses a feature-gated test-only memory-growth export; the ordinary release Worker build does not enable this feature.
- The adapter uses `crypto.getRandomValues` for salt generation and validates input bounds. JavaScript buffer clearing is best effort; immutable strings and runtime/allocator copies cannot be guaranteed erased.
- Independent PHC fixture and working-memory wipe tests are included in the passing host test suite. Interoperability coverage remains a single independent fixture, not a broad fuzz suite.
- The precompiled module is built and bindings are generated in CI. Wrangler compiled-Wasm import, Cloudflare Workers runtime compatibility, CPU-time measurement and temporary Worker cleanup still require a successful isolated runtime workflow.
- No application authentication change, D1 operation, existing Preview deployment, Production action or `main` modification occurred.

## 2026-11-26 — Follow-up rustfmt correction for Argon2id ABI

- The first formatting correction did not cover the second `wasm_hash_phc` export; dedicated CI Run [#14](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45815086593) still failed only at `cargo fmt --all -- --check` for that remaining line wrap. Host tests, Clippy and WASM compilation were skipped.
- Corrected the remaining formatter difference. The next dedicated run must pass before the ABI source is considered verified.

## 2026-11-26 — Argon2id ABI CI formatting failure corrected

- Inspected dedicated prototype CI Run [#13](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45812972475) and its job log. The failure was exclusively `cargo fmt --all -- --check`; host tests, Clippy and WASM compilation were skipped, not failed.
- Applied the exact rustfmt changes reported by the runner. A new dedicated CI run is required before treating the ABI source as verified.
- The next technical gates remain generated wasm-bindgen glue, a JavaScript adapter with CSPRNG salt generation and memory-growth-safe handling, Worker precompiled-module import, and runtime validation. No Preview/Production deployment or application authentication change.

## 2026-11-26 — Bounded wasm-bindgen ABI source added (CI pending)

- Added wasm32-only `wasm-bindgen` exports for fixed-output tag derivation, PHC generation and PHC verification.
- Exports accept `Uint8Array`; password/salt/PHC lengths are checked before copying into Wasm memory. Password copies use `Zeroizing<Vec<u8>>`.
- Added host tests for accepted/rejected ABI lengths. Actual generated JS glue, JS memory-growth tests and Cloudflare Worker module instantiation remain pending.
- No deployment or application authentication change.

## 2026-11-26 — Working-memory zeroization test added (CI pending)

- Refactored the owned matrix wipe into one explicit method used by `Drop`.
- Added a unit test that fills every word in a three-block working matrix with a non-zero pattern, invokes the wipe method and asserts every word is zero.
- This tests the wrapper's zeroization routine; it does not establish guarantees against compiler, allocator, crash or process-termination behavior.
- CI must pass before this source change is considered verified. No WASM ABI, Worker integration, deployment or application authentication change.
## 2026-11-26 — Independent Argon2id PHC fixture added

- Generated a fixed Argon2id PHC string independently using Python `argon2-cffi 25.1.0`, with the prototype's exact v=19 / m=19,456 KiB / t=2 / p=1 profile.
- Added a Rust test that verifies the independent fixture, rejects a wrong password, and requires Rust-generated PHC output to match the independent encoding exactly.
- This is one cross-implementation fixture; CI must pass before it is considered verified. It does not establish WASM ABI safety, memory-wipe correctness, Cloudflare runtime compatibility or performance.
- No application authentication, stored password hashes, Preview Worker, D1 database, secrets or Production resources were changed.

## 2026-11-26 — Argon2id prototype source validation passed

Dedicated CI [#45777843556](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45777843556) passed formatting, three host tests including the Argon2id v=19 KAT, Clippy with warnings denied and optimized wasm32 compilation. Broader development validation [#45777849748](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45777849748) passed. Preview deployment and runtime benchmark were skipped. No Worker or application authentication was deployed or changed. PHC compatibility, ABI, independent interop, memory-wipe test coverage and Worker runtime benchmarks remain pending.

## 2026-11-26 — Argon2id isolated prototype source stage

- Added `prototypes/argon2id-wasm`, pinned to RustCrypto Argon2 0.6.0 immutable commit `dc7e0c25cda9a8421d2604debf548d663886b431`.
- Source implements fixed Argon2id v=19 baseline parameters, bounded password/salt inputs and explicit working-matrix block zeroization on Drop.
- Added upstream KAT, deterministic/differentiation/input-bound tests and dedicated CI for host tests, formatting, Clippy and wasm32 compilation.
- **CI is pending.** No ABI, PHC compatibility, Cloudflare Worker benchmark or app integration is complete. No Preview/Production resources or app auth code changed.
- Release decision: keep this as an isolated source-only prototype until CI, interoperability, memory cleanup and Worker runtime gates pass. Deploy only when the relevant stage is verified and safe.

# Project Master Status

**Latest handover update:** 2026-11-26
**Repository:** `SohelRahman/sohel-consulting-website`  
**Development branch:** `current-focus-development`  
**Latest development head before this status refresh:** `2691600c665e2fbd6703be5264b1ded17ea7fd55` (`current-focus-development`).
**Latest verified source CI:** [Run #1076](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45756744386) passed on application-equivalent merge commit `4aed95bba0af650f3e8c913405852d62dc88e5a0`.

## Active priority — Authenticated Preview acceptance and Production readiness

**Status:** Development validation and Preview HTTP/responsive browser smoke checks have passed. The PBKDF2 runtime compatibility fix is deployed to Preview. The user explicitly confirmed access to the authenticated Admin dashboard with management navigation on 2026-11-26. This is user-confirmed authenticated access; MFA enrollment and recovery-code consumption have not been independently verified from server-side evidence. RBAC and management workflows remain to be tested. Production D1, secrets, environment protections and backup readiness remain unverified. PR #1 remains draft with no recorded reviews.

### Deployment evidence
- Preview URL: https://current-focus-development.sohelrahman118.workers.dev
- Deployment workflow [Run #16](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45319857793) succeeded.
- Deployed source commit: `dd58978d36e1014c3bd99772fe681521d4aa3458`.
- Worker version: `bd3a71ff-a09c-46f1-897c-8b9a07a6d214`.
- Preview D1 identity verified; migrations 0018 and 0019 are applied.
- Source validation, CMS revision contract/SQLite tests and Admin MFA tests passed during deployment.
- Preview-only `MFA_ENCRYPTION_KEY` was provisioned without exposing its value.
- No Production deployment or `main` modification occurred.

### Runtime smoke tests
- Added `.github/workflows/preview-runtime-smoke.yml`, gated to `current-focus-development` commits containing `[preview-smoke]`.
- Checks English and Bangla homepage delivery, Admin and quotation-response pages, unauthenticated Admin API rejection, source/migration/config path denial, and quotation-response privacy headers.
- Workflow [run](https://github.com/SohelRahman/sohel-consulting-website/actions/workflows/preview-runtime-smoke.yml) must pass before marking these HTTP checks accepted.

### Remaining acceptance sequence
1. Confirm whether the opened Admin page is the authenticated dashboard, not only the login/enrollment screen.
2. Complete MFA enrollment and test a fresh MFA login, recovery-code single use and RBAC using the authorized Preview account.
3. Execute two-session CMS concurrency tests and verify stale-write HTTP 409, revision increments and history/audit consistency.
4. Test Page Builder, Media Library/Cloudinary, course, registration, inquiry, quotation and chat workflows.
5. Complete formal OWASP ASVS Level 2 verification and release-readiness review.
6. Complete Production D1 identity/backup/migration-ledger and runtime-secret/environment preflight, obtain required PR review, then merge and deploy.

Do not treat deployment success or CI as browser/runtime acceptance. Keep all tests on Preview and preserve the Production/`main` boundary.

## Completed source priority — Bulk CMS initialization recovery
- Admin preflight blocks more than 400 eligible items before network submission.
- Ambiguous network failures explain safe retry behavior; existing keys are preserved.
- Initialization remains draft-only and content/history/audit writes use one D1 batch.
- Previous development CI run [#45149919998](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45149919998) passed.

## Completed source priority — Admin MFA
MFA source implementation and automated checks passed in [CI run #45149126646](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45149126646). Migration `0019_admin_mfa.sql` is applied to Preview D1 by Run #11. The development Preview deployment workflow provisions `MFA_ENCRYPTION_KEY` if absent without rotating an existing value and runs the CMS/MFA tests. It now has an explicit commit-message-gated push trigger on `current-focus-development`, avoiding changes to `main`. Actual secret provisioning, Preview deployment and browser acceptance remain pending.

## Mandatory operating gates
- Work only on `current-focus-development`; do not modify, merge, rebase or reconcile `main`.
- Never access or expose secret values.
- No migration, D1 write, Cloudflare configuration change or deployment without explicit approval.
- Distinguish source implementation, CI, Preview deployment, Preview runtime acceptance and Production release.
- Update this file, relevant technical documentation and `CHANGELOG.md` in the same implementation commit.


## 2026-11-24 — Preview D1 migrations applied and verified

The authorized Preview migration workflow [Run #11](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/4516057616) completed successfully. Job `migrate-preview` verified the dedicated remote Preview D1 ID `e0317397-77cb-4f36-9d19-2594ff75b0c2` before migration activity. The pre-apply migration list contained `0018_cms_content_revision.sql` and `0019_admin_mfa.sql`. Wrangler reported both migrations with successful status after execution. The final remote migration-list step returned **No migrations to apply!** The job steps `Apply pending migrations to Preview D1 only` and `Verify Preview migration state` both completed successfully.

This is direct GitHub Actions execution evidence for the Preview D1 migration ledger. It confirms the two migrations were applied to the dedicated Preview database. It does not establish that a Worker containing the corresponding source code has been deployed or that runtime/browser acceptance has passed. Production and `main` were not targeted by this workflow.


## Preview deployment trigger gate — 2026-11-24

The guarded Preview deployment workflow now supports a branch-scoped `push` trigger on `current-focus-development` in addition to manual `workflow_dispatch`. The job runs only when the pushed commit message contains the exact marker `[deploy-preview]` or when the event is a manual workflow dispatch. Ordinary pushes to the development branch skip the deployment job. This avoids modifying `main` merely to expose the workflow in the Actions UI, while retaining an explicit deployment gate. The trigger itself does not authorize or execute deployment. No marker commit has been created and no deployment has been run.


## 2026-11-24 — Preview runtime smoke testing initiated

A marker-gated HTTP smoke workflow was added to test the deployed Preview origin. The checks cover the English/Bangla homepage, Admin and quotation-response static pages, unauthenticated Admin API rejection, sensitive source/config path denial, and quotation-response privacy headers. The workflow does not mutate D1 or deploy code. Browser-based functional acceptance remains pending.


### Runtime smoke checkpoint — 2026-11-24

Initial Preview HTTP smoke execution confirmed static page delivery (English/Bangla home, Admin and quotation page), unauthenticated Admin API rejection, and denial of source/migration/config paths. The first run failed only at the quotation-response privacy-header assertion; the workflow's header parser and diagnostic output were corrected. Rerun is pending. Do not mark quotation privacy headers or overall runtime acceptance passed until the rerun succeeds.


### Quotation-response privacy routing remediation — 2026-11-24

The Preview smoke run found that `/quote-response.html` bypassed Worker middleware because it was absent from `wrangler.preview.toml`'s `run_worker_first` list. The response therefore lacked the intended no-store, no-referrer and noindex headers. Added the exact path to the Preview-only Worker-first route list. Deployment and a passing smoke rerun are pending; do not mark this privacy control accepted until both complete.


### Preview privacy routing deployment — 2026-11-24

The Preview-only routing correction for `/quote-response.html` was deployed successfully via [Run #34](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45320348541). Deployed commit `55585c4fa3f6927df14776eac508c2eed6efd290`; Worker version `8f6489b1-7ef9-4423-a01a-6bdf63a48755`. Deployment source/CMS/MFA checks passed. Final HTTP smoke confirmation of the no-store, no-referrer and noindex headers remains pending.


### Preview HTTP smoke acceptance — 2026-11-24

Guarded Preview runtime smoke [Run #20](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45320457740) passed. It confirmed public English/Bangla homepage, Admin and quotation page HTTP delivery; unauthenticated Admin summary rejection (401); direct source/migration/config path denial (404); and quotation-response no-store, no-referrer and noindex headers. The Preview-only Worker-first route correction for `/quote-response.html` was deployed in Run #34. This closes the listed HTTP smoke gate only. Browser interaction, responsive/accessibility QA, authenticated Admin/MFA, CMS concurrency, Page Builder, Cloudinary/media and business workflow acceptance remain open.


### Responsive browser smoke expansion — 2026-11-24

Expanded the guarded Preview runtime smoke workflow with Playwright/Chromium checks at 390px and 1440px for the English homepage, Bangla homepage, Admin and quotation-response pages. Checks cover successful load, title/body presence, uncaught page errors and horizontal overflow. This provides automated browser smoke evidence but not full manual visual/accessibility or authenticated functional acceptance. The expanded workflow is pending execution.


### Playwright runner adjustment — 2026-11-24

Responsive Chromium smoke execution reached the browser-install step but failed because `ubuntu-latest` resolved to Ubuntu 26.04, unsupported by Playwright 1.55.0. The workflow now uses `ubuntu-24.04`. HTTP smoke checks remain passed; responsive browser results remain pending the rerun.


### Browser smoke workflow checkout correction — 2026-11-24

Playwright/Chromium installed successfully on Ubuntu 24.04, but the browser test failed because the workflow had not checked out the repository containing `scripts/test-preview-browser.py`. Added `actions/checkout@v4` before the smoke steps. Responsive browser assertions remain pending the next run.


### Responsive Preview browser smoke accepted — 2026-11-24

Preview smoke [Run #39](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45320815398) passed for the English homepage, Bangla homepage, Admin page and quotation-response page at mobile (390px) and desktop (1440px) viewports. All eight combinations loaded successfully, had title/body content, produced no uncaught browser page errors and had no horizontal overflow. HTTP/API/path/privacy checks passed in the same run. This is public-page smoke acceptance only, not full visual/accessibility or authenticated functional acceptance.

### Next acceptance job — Admin login/MFA entry-state UI

Added read-only browser assertions for visible Admin login controls, required email/password fields, hidden unauthenticated dashboard/MFA panels, and bilingual MFA enrollment/recovery guidance. The next guarded smoke run will execute these checks. Live authenticated MFA enrollment, recovery-code lifecycle and RBAC verification remain blocked on a separately authorized test Admin account; no password or TOTP seed will be requested in chat or committed to GitHub.


### Admin MFA entry-state smoke diagnosis — 2026-11-24

Preview smoke [Run #44](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45321214679) failed only two new MFA copy assertions. All HTTP/security checks, eight responsive page/viewport checks and the development validation workflow passed. The test incorrectly searched visible body text for copy inside panels intentionally hidden before authentication. Corrected the browser test to inspect the enrollment and recovery panels' DOM text directly, including English and Bangla wording. Correction commit: 72d5c51a2b038445943a5b32ea442ed0d1eb4eaa. Guarded Preview smoke rerun is pending. This was a test-only change; no application deployment, D1 mutation, or main-branch change occurred.


### Admin unauthenticated/MFA entry-state smoke accepted — 2026-11-24

Preview runtime smoke [Run #45](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45322065022) passed. HTTP/security checks and all eight responsive page/viewport checks succeeded. Admin assertions verified the visible login panel and email/password fields, hidden dashboard/enrollment/verification/recovery panels before authentication, and English/Bangla MFA enrollment and recovery wording in the hidden-panel DOM. The prior Run #44 failure was a test assertion visibility mistake and has been corrected. This does not establish authenticated MFA, recovery-code lifecycle, replay prevention or RBAC acceptance. No credentials, Worker deployment, D1 mutation or main-branch change was involved.


## 2026-11-26 — Website 8 startup audit and continuity update

### Repository baseline
- Repository: `SohelRahman/sohel-consulting-website` (public; default branch `main`).
- Development branch: `current-focus-development` at `48f87901f2609db8d8b82050087ec67490c43312` (latest branch head observed during this audit).
- Production branch: `main` at `cae9a07bb20b509459231ee43be9f0601770c664` (latest branch head observed during this audit).
- Open PR #1: `current-focus-development` to `main`, title “Build bilingual training registration and admin platform foundation”; it remains open and unmerged in the inspected GitHub response.
- The development branch contains the application, 19 numbered D1 migrations (0001–0019), Worker/API code, English and Bangla pages, Admin UI, CMS, Cloudinary integration, tests, workflows and technical documentation.
- `docs/PROJECT_MASTER_STATUS.md` exists on the development branch. A root-level `PROJECT_MASTER_STATUS.md` does not exist; the authoritative path remains `docs/PROJECT_MASTER_STATUS.md`.

### Fresh CI/runtime evidence
- Development validation [Run #1068](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45322210311), commit `48f87901f2609db8d8b82050087ec67490c43312`, completed successfully on 2026-11-24.
- Preview runtime smoke [Run #45](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45322065022), commit `72d5c51a2b038445943a5b32ea442ed0d1eb4eaa`, completed successfully. Job steps confirmed public page/security checks and responsive Chromium smoke for English homepage, Bangla homepage, Admin and quotation-response pages at 390px and 1440px.
- These are CI and Preview smoke results. They do not establish authenticated Admin/MFA workflow acceptance, complete CMS/business workflow acceptance, or Production release.
- The latest `main` commit found is `cae9a07` (“Fix false-positive read-only migration audit guard”). This is not evidence that the development PR was merged.

### Reconciled current status
- **Implemented on development branch:** bilingual public site, Worker API, D1 migrations 0001–0019, Admin/CMS and documented module capabilities; consult module documents for details.
- **CI passed:** latest source validation run #1068.
- **Preview smoke passed:** HTTP/security checks and public-page responsive smoke run #45.
- **Preview deployment:** previous documentation records Preview Worker deployment and Preview D1 migration application. This audit did not independently re-confirm the live Worker version or re-read the remote D1 migration ledger.
- **Not accepted yet:** authenticated Admin login/MFA enrollment and verification, recovery-code lifecycle/replay prevention, live RBAC, deployed CMS stale-write/concurrency, full Page Builder/Cloudinary and business workflows, comprehensive accessibility/browser QA, and formal ASVS Level 2 sign-off.
- **Production:** no Production deployment or migration is authorized by this audit. The open PR is not merged; keep `main` untouched during routine development.

### Immediate next execution priority
1. Inspect Preview workflow history and deployed Preview commit/version against the current development branch head; read-only only.
2. Review the latest test scripts/workflows and run or extend automated checks that do not require credentials or mutate remote data.
3. Prepare authenticated Admin/MFA acceptance using a designated test account; never request credentials or secrets in chat.
4. Execute CMS concurrency and module-level Preview acceptance only when required test access and explicit remote-action approvals exist.
5. Update this status and changelog after each verified milestone.

### Operational boundary
- Work only on `current-focus-development` for Website 8 development.
- Do not merge, rebase, force-push, alter, or commit to `main` without explicit separate authorization.
- Do not run remote migrations, D1 writes, Cloudflare secret/configuration changes, or Worker deployments without explicit approval.
- Never read, print, request, or commit secret values.
- No work from other projects is in scope for this repository or chat.


## 2026-11-26 — Preview deployment reconciliation (read-only)

- Latest confirmed successful Preview deployment found in the inspected GitHub Actions history: [Deploy run #34](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45320348541), deploying commit `55585c4fa3f6927df14776eac508c2eed6efd290` to the isolated Preview Worker. All deployment job steps completed successfully, including Preview Worker/D1 identity verification, source and CMS/MFA checks, secret-presence handling, and Preview-only Worker/static-asset deployment.
- Subsequent deployment workflow runs inspected for commits `02cb4ef`, `72d5c51`, `48f8790`, `adb5dff` and `45fed5a` were skipped by the commit-message/manual-dispatch gate. No later successful deployment was identified in the inspected run history.
- GitHub compare from deployed commit `55585c4` to current development head `45fed5a` reports 39 commits ahead and 0 behind. The changed paths are limited to the Preview smoke workflow, changelog, Preview deployment/status/testing documentation, and `scripts/test-preview-browser.py`. No Worker source, public site asset, Wrangler configuration, or migration file changed in this range. This supports source-level application parity between the last confirmed deployment and current development head; it does not prove that no manual Cloudflare-side change occurred.
- Preview smoke [Run #45](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45322065022) passed against the Preview origin after the #34 deployment. It confirms the specified HTTP/security and responsive public-page smoke assertions at that time, not a current live-edge check on 2026-11-26.
- A direct live-origin check could not be completed in this audit because the web retrieval service could not access either documented Worker hostname. Therefore **current live Worker availability/version remains unverified**; do not report the current live deployment as freshly confirmed.
- No deployment was triggered. The deployment workflow can bootstrap/deploy the Preview Worker and create the Preview-only `MFA_ENCRYPTION_KEY` if missing, so it is a mutating operation. Obtain explicit user approval before running it. No remote D1 read/write, migration, secret read, secret change, Worker deployment, or Production action was performed.

### D1 reconciliation result
- **Source parity:** confirmed for application/runtime files relative to the last confirmed deployment.
- **Last confirmed deployed source:** `55585c4fa3f6927df14776eac508c2eed6efd290` (Run #34).
- **Current development head:** `45fed5af355be5b4bf7a52f539ac5c1b44f361f7` (documentation/test-only changes since deployment).
- **Live Worker state:** pending independent current-origin verification.
- **Next priority:** perform an approved Preview deployment only if a fresh live deployment is required; otherwise continue with non-mutating automated acceptance work and authenticated test-plan preparation.


## 2026-11-26 — Production release authorization and preflight

The project owner authorized the Production release, including the required merge to `main`, Production D1 migrations and Worker deployment, provided release safeguards are met. This authorization does not waive review, database backup/identity checks, migration verification, authenticated acceptance or release gates.

### Current GitHub release state
- PR #1 remains open and marked draft; GitHub reports it is not mergeable. No approvals or review threads are recorded.
- Development head: `9a3548b86bf9a94ed5c7c860767f974eb4f38b1e`.
- Main head at audit: `cae9a07bb20b509459231ee43be9f0601770c664`.
- Branch comparison reports development 833 commits ahead and 14 commits behind; six workflow files changed on both branches. The overlapping workflow contents are not identical in all cases. Do not merge until the branch divergence and conflicts are reconciled and the final diff is reviewed.
- The Production deployment workflow `.github/workflows/deploy-cloudflare.yml` exists on the development branch but is absent from `main`. Production Worker configuration and application files are likewise not present at the checked paths on `main`; the current PR is the first proposed introduction of this application to the production branch.
- The development-branch Production workflow only invokes `wrangler deploy`; it does not itself run application validation, verify the Production D1 migration ledger, or apply migrations.
- No PR review approvals or commit status checks were returned for the current head through the connected GitHub integration. Cloudflare's latest PR comment reports Preview build/deployment success for commit `9a3548b`; this is Preview deployment evidence, not Production release acceptance.

### Production release blockers
- Production D1 database identity, backup/restore readiness and remote migration ledger have not been independently verified.
- Production runtime secret presence and the protected GitHub `production` environment/reviewer configuration are not verified.
- Authenticated Admin/MFA, RBAC, CMS concurrency and full business workflows remain unaccepted on Preview.
- Business content, course fees and policy copy still require owner approval as recorded in the launch checklist.

### Actions taken
- Read-only inspection of repository metadata, PR #1, branch comparison, release workflow and Wrangler configuration.
- No PR merge, branch rewrite, Production D1 operation, secret change or Production deployment was performed.

### Next release action
Reconcile the 14-commit branch divergence and six overlapping workflow files without force-pushing; then rerun required validation and complete the Production D1/secret/environment preflight before merge and deployment.


## 2026-11-26 — Development/main ancestry reconciliation

### Completed
- Reconciled the development branch with the current `main` history using a non-force-forward merge commit: `4aed95bba0af650f3e8c913405852d62dc88e5a0`.
- The merge commit retains the audited development tree and adds the exact current `main` head as its second parent. The branch update used an expected-head lease; no force push was used.
- Re-audit of all six files changed on both sides found two identical files and four where the development version contains the safer/fixed logic: correct Cloudflare token whitespace normalization and strict parsing of the Preview D1 array-of-table configuration. Those development versions were retained.
- Branch comparison now reports development is 0 commits behind `main`; PR #1 is reported mergeable by GitHub.
- PR #1 remains a draft. The current diff contains 110 files. Development validation workflow Run #1076 was observed in progress at the time of this update; final result remains pending.

### Not yet complete
- No merge to `main` has occurred.
- PR review/approval and readiness transition remain outstanding.
- Production D1 identity, backup, migration ledger, protected environment and secret readiness remain unverified.
- Authenticated Admin/MFA and end-to-end acceptance remain outstanding.
- Final owner approval of business content, pricing and policies remains outstanding.

### Safety
No Production deployment, Production D1 operation, secret mutation, or change to the `main` ref was performed.

### Next action
Wait for the validation run on the reconciled head, inspect its jobs and results, then address any failures before proceeding with the remaining release gates.


## 2026-11-26 — Current MFA and release acceptance checkpoint

- The Admin MFA implementation is present in `src/worker.js`, `src/admin-mfa.js`, `admin.html` and migration `0019_admin_mfa.sql`. The historical assessment dated 2026-11-23 below describes an earlier commit and must not be read as the current implementation state.
- Development validation Run #1076 passed. Its workflow explicitly ran `scripts/test-admin-mfa.mjs`, which covers TOTP vectors, verification windows, encrypted-secret round-trip and associated-data binding, recovery-code generation/hash normalization, restricted password-login challenge, MFA replay/recovery SQL guards, challenge-cookie properties and bilingual Admin UI source contracts.
- Project history records Preview migration 0019 applied by migration Run #11. This is historical workflow evidence; current remote ledger has not been re-read during this checkpoint.
- Preview browser smoke Run #45 passed unauthenticated entry-state checks only. It did not submit credentials or exercise authenticated MFA enrollment, second-factor verification, recovery-code consumption or role-specific access.
- The latest development branch head includes documentation and ancestry commits after Run #1076; no application source changed in those commits. The successful run was on the reconciled merge commit.
- Production remains blocked pending current Production D1 identity/backup/ledger verification, secret/environment verification, authenticated Preview acceptance, content approval and authorized PR review.

### Next acceptance action
Complete authenticated Preview Admin/MFA acceptance using an authorized test account through a secure browser/session workflow. Do not send passwords, TOTP values, recovery codes or secret values in chat. If no test account exists, provision one only through a reviewed Preview-only procedure and record the state change.


## 2026-11-26 — Preview Admin login configuration remediation

The Preview deployment workflow now checks the Worker secret-name list for `SESSION_SECRET`. If absent, it generates a cryptographically random 32-byte base64url signing secret and stores it only on the Preview Worker. Existing values are preserved and never printed. This complements the existing non-rotating `MFA_ENCRYPTION_KEY` provisioning.

The change is committed to `current-focus-development`. It is not yet evidence of a successful Preview deployment or a working Admin login. The next guarded Preview deployment must complete, then the login endpoint must be rechecked. If login proceeds to MFA enrollment, the bootstrap Admin account still requires valid Preview bootstrap credentials or an existing active account. No credentials are included in source or documentation. Production and `main` remain untouched.


## 2026-11-26 — Preview sign-in PBKDF2 failure diagnosed

The Preview Admin diagnostic exposed the exact failure: Cloudflare Workers production Web Crypto rejects PBKDF2 iteration counts above 100,000, while the application requested 600,000. The password-hash module now uses 100,000 iterations, and its parser rejects unsupported stored iteration counts. The updated password-hash tests pass in development CI [Run #45758627145](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45758627145).

**Security qualification:** 100,000 PBKDF2-SHA-256 iterations are below OWASP's current 600,000 recommendation. This is a Workers runtime compatibility workaround, not the final preferred password-storage posture. A stronger production design requires a Worker-compatible memory-hard KDF or a dedicated authentication service. Preview deployment and live login acceptance remain pending; no Production changes have been made.


## 2026-11-26 — PBKDF2 compatibility fix deployed to Preview

- Preview deployment workflow Run [#45758679816](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45758679816) completed successfully for commit `df6b7a311c1d92e3091a6b3c80f0aa142afd43be`.
- The Worker now has the Workers-compatible 100,000-iteration PBKDF2 implementation. Development validation passed on the tested code commit `90a47a50f3d052eceda82d97a67d6095ec1bb2d6`; subsequent changes were documentation only.
- The existing Preview smoke workflow was skipped because its explicit `[preview-smoke]` commit-message gate was not met. A docs-only commit will trigger that smoke workflow without redeploying the Worker.
- Admin sign-in has not yet been retested after this deployment. The 100,000-iteration PBKDF2 setting remains a documented security compromise requiring a stronger future KDF design.


## 2026-11-26 — Preview runtime acceptance and Production gate audit

### Verified
- Preview deployment Run [#45758679816](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45758679816) succeeded for PBKDF2 compatibility fix commit `df6b7a311c1d92e3091a6b3c80f0aa142afd43be`.
- Development validation Run [#45759504101](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45759504101) passed.
- Preview runtime smoke Run [#45759498860](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45759498860) passed, including public page delivery, unauthenticated Admin API rejection, sensitive path denial, privacy headers and responsive Chromium checks.
- The user reports that the Preview Admin link opens. This is not sufficient evidence of a completed authenticated session; a dashboard screenshot or successful authenticated API check is still required.
- PBKDF2 at 100,000 iterations is a compatibility workaround and remains below OWASP's current 600,000 PBKDF2-SHA-256 recommendation. Do not treat this as the final password-storage security design.

### Production release gate audit
- PR #1 is still **open and draft**, with 856 commits ahead of `main`, 0 behind, 110 changed files, and no recorded PR reviews or review threads.
- The current Production workflow `.github/workflows/deploy-cloudflare.yml` only runs `wrangler deploy` from `main`. It does not run the repository validation suite, verify the exact Production D1 identity, check the remote migration ledger, or apply/verify pending migrations.
- Production D1 identity is configured in `wrangler.toml` as `consulting-db` / `3a4f765a-46c2-4040-9753-36e9483893a4`; this is configuration evidence, not independent confirmation of the live Cloudflare database.
- Production backups/restore readiness, remote migration ledger, runtime secret presence and GitHub `production` environment protection/reviewer configuration remain unverified.
- No merge, Production D1 operation, Production secret mutation or Production deployment was performed.

### Next engineering priority
Complete authenticated Preview Admin/MFA acceptance, then harden the Production deployment workflow with validation and read-only target/migration preflight. Do not merge or deploy while PR review, Production database/backup and secret/environment gates remain open.


## 2026-11-26 — User-confirmed authenticated Admin dashboard access

The user explicitly confirmed that the Preview Admin dashboard opens with management navigation after the MFA setup and sign-in troubleshooting. Record this as user-confirmed successful authenticated dashboard access. Do not overstate it as independent server-side evidence of every MFA, recovery-code or RBAC control. Those controls and role-specific authorization still require explicit acceptance tests.

### Next engineering priority
1. Verify Admin and limited-User permission boundaries at the Worker API layer, including direct API requests and denied mutations.
2. Test the Admin dashboard's read/write management workflows on Preview using authorized test data.
3. Resolve the password-hashing security limitation: Preview currently uses 100,000 PBKDF2-SHA-256 iterations for Cloudflare Workers compatibility, below OWASP's 600,000 iteration recommendation. Do not release this compromise as final Production password storage without an approved stronger Worker-compatible design.
4. Harden Production deployment workflow with source validation, exact Production D1 identity verification, read-only migration-ledger inspection, and explicit backup/restore readiness checks.
5. Verify Production secrets by name/presence only and inspect the GitHub `production` environment protection/reviewer configuration.
6. Obtain required PR review and approvals before merge; then deploy Production and run live smoke tests.

No Production resource was changed.
## 2026-11-26 — RBAC acceptance record clarified

`docs/TESTING.md` now records the user's confirmation of authenticated Preview Admin dashboard access separately from the still-pending live permission-limited User acceptance. The Worker source review confirms that Admin API requests reload the active account/session version, require MFA enrollment, apply route-to-permission mapping, and deny unauthorized non-Admin requests with HTTP 403. Unknown Admin API routes fail closed for limited Users; account-management routes are handled separately.

These are source-review findings backed by existing static contract tests, not live limited-User API acceptance. No Preview account or D1 data was changed. A live limited-User account and direct read/write denial tests remain required before RBAC acceptance can be marked complete.

Latest documentation commit: `3db5302519ceeb8e3dcfdc87f793451a452fb5b9` (`docs/TESTING.md`). Production and `main` remain unchanged.
## 2026-11-26 — Production deployment workflow validation gate added

The manual Production deployment workflow now runs the repository's development validation suite before the deployment job. The Production job remains restricted to `main` and the GitHub `production` environment, and now runs `wrangler deploy --dry-run` before the actual deploy command. This is a workflow-source change on `current-focus-development`; it has not been executed against Production.

Important remaining gates: validate the workflow through GitHub Actions; independently verify the Production D1 identity and remote migration ledger; confirm backup/restore readiness, runtime secret presence and environment protection; complete stronger password-storage design and live RBAC/MFA acceptance; obtain PR review and approval. The dry-run is not a substitute for D1 migration or backup preflight. No Production resource was changed.

Latest workflow commit: `24a6480d20baa34807733ab378f6e90cc6e93a7a`.
## 2026-11-26 — Password-storage architecture assessment

Added `docs/PASSWORD_STORAGE_DESIGN_ASSESSMENT.md` after reviewing current OWASP, Cloudflare Workers, WebAssembly and Argon2 references. The assessment confirms that the current 100,000-iteration PBKDF2-HMAC-SHA-256 setting is below OWASP's recommended 600,000 iterations. Argon2id via WebAssembly is a plausible candidate, but it is not approved until actual Preview CPU-time, isolate-memory, concurrency, compatibility and dependency checks pass. Cloudflare documents a 10 ms CPU limit per HTTP request on Workers Free and 128 MB per isolate; this account's plan and Worker CPU configuration remain unverified.

Decision: do not alter the current hash format yet, do not treat a pepper as a replacement for a suitable KDF, and do not release the 100,000-iteration workaround as the final Production design. A controlled Preview benchmark and architecture decision remain required. No Preview Worker, database, secret or Production resource was changed.

Validation workflow commit `9bc1fb47b5156cd155ae46e355858e77f1155162` also adds a YAML parse step for the Production deployment workflow; its run result is pending.
## 2026-11-26 — Isolated Argon2id benchmark harness prepared

Added a separate, short-lived Cloudflare Worker benchmark using pinned `hash-wasm` 4.12.0 and OWASP's Argon2id baseline (19,456 KiB, 2 passes, parallelism 1). The harness performs a single hash/verify and a two-operation concurrent test. It has no D1 binding, no Admin routes, and requires a random ephemeral bearer token. The workflow deletes the benchmark Worker on exit, including failure paths.

The benchmark Worker explicitly sets a 10 ms CPU budget to test the Cloudflare Workers Free constraint; this is not the production Worker and cannot modify the production application. The response reports wall-clock durations only; these are not represented as CPU-time or memory measurements. If the request exceeds the runtime limit, the workflow will report the failure and remove the Worker.

The benchmark workflow is tagged to run only on a development commit containing `[kdf-benchmark]` or by manual dispatch. Workflow YAML validation was added to development CI. No password hash implementation or existing Admin credential was changed.

Benchmark harness execution trigger commit. The isolated workflow is configured to run for this tagged development commit and remove its temporary Worker after the test.
## 2026-11-26 — Cloudflare Free plan confirmed; benchmark configuration corrected

The first isolated benchmark deployment was rejected by Cloudflare with API error 100328: CPU limits are not supported for the Free plan. This is direct account-plan evidence that the linked Cloudflare deployment account is on Workers Free. The benchmark did not deploy or execute in that attempt. The failure was caused by setting an explicit `cpu_ms` limit in the benchmark Wrangler config, not by Argon2 execution.

Removed the explicit CPU limit from the isolated benchmark config so the Worker uses the Free plan's default 10 ms request CPU limit. The benchmark remains isolated, authenticated with an ephemeral token, has no D1 binding, and is configured for automatic deletion. Its next tagged run will determine whether the Argon2id baseline fits the Free runtime. No application Worker or database was changed.

The isolated benchmark is now configured to use the default Workers Free CPU budget. A tagged development commit triggers the corrected run; the temporary benchmark Worker will be removed automatically after execution.
## 2026-11-26 — Isolated benchmark deployment path verified; request retry added

The corrected benchmark deployment successfully uploaded the isolated Worker and its temporary bearer secret. The first authenticated request returned HTTP 401 immediately after secret creation, consistent with a deployment/secret propagation delay; the benchmark did not run. The workflow's exit cleanup ran. Added bounded retries for HTTP 401 to allow the new Worker version and secret to propagate. The next tagged run will verify this. No existing Worker, Admin credential, D1 database or Production resource was changed.

Retry-enabled isolated Argon2id benchmark execution trigger.
## 2026-11-26 — Argon2id Free-tier runtime test requires error detail

The isolated benchmark Worker deployed successfully on Workers Free, and the ephemeral authentication secret was accepted after bounded retries. The benchmark request then returned HTTP 500 with a sanitized generic KDF failure; no timing data was produced. The workflow's cleanup trap ran. The failure does not yet establish whether the cause is WebAssembly initialization, Argon2 parameter handling, or a runtime resource limit.

Added a bounded, non-secret error reason to the isolated benchmark response so the next run can distinguish initialization/parameter errors from runtime resource failures. This diagnostic exists only in the temporary benchmark Worker source; no Admin password hashes or application authentication behavior were changed.

Retry trigger for the isolated Argon2id benchmark with sanitized runtime diagnostics.
## 2026-11-26 — Argon2id benchmark compatibility finding

The isolated benchmark ran on the Cloudflare Workers Free plan. The selected `hash-wasm` implementation failed before hashing with `WebAssembly.compile(): Wasm code generation disallowed by embedder`. Cloudflare's current Workers documentation states that Worker code must instantiate precompiled WebAssembly modules; Wrangler can import `.wasm` assets as `WebAssembly.Module` values. Therefore this result identifies a library packaging/runtime incompatibility, not proof that Argon2id cannot run on Workers.

Next candidate: inspect a maintained Argon2id implementation that ships a precompiled `.wasm` module and imports it through Wrangler's compiled-Wasm module mechanism. Review source, license, release provenance, API, PHC format and test coverage before benchmarking it. Do not integrate a package into Admin authentication solely because its README claims Workers compatibility.

The benchmark workflow cleanup now reports success/failure for deletion rather than silently ignoring delete errors. The prior benchmark run's cleanup attempt was not independently verified because its delete output was suppressed. No application authentication code or existing password hashes were changed.


## 2026-11-26 — Precompiled-Wasm Argon2id candidate review

Reviewed the public README for `@hallaxius/argon2w`. Its documented standalone SIMD Wasm asset and Cloudflare Workers compiled-module import make it a technically relevant candidate, but the package is not approved: the exact published tarball, npm provenance, source/build workflow, release-to-commit correspondence, maintainer identity and upstream tests were not independently verified. A third-party listing reports version 0.0.1, Apache-2.0, zero dependencies, zero weekly downloads and an incomplete health report; this is a weak adoption signal, not a security finding. The README's `m16t2` profile is below OWASP's 19 MiB / 2-pass / p=1 baseline; its `standard` profile is documented as 19,456 KiB / 3 passes. No package was added and no password/authentication code changed.

Next: verify the exact registry artifact and provenance, inspect the source and licences, run known-answer tests, then benchmark a verified 19,456 KiB / 2-pass / p=1 configuration in the isolated Worker. If package provenance cannot be established, reject it and build a reproducible precompiled module from the PHC reference implementation. Production and the `main` branch remain untouched.


## 2026-11-26 — Argon2id fallback source review

The unverified `@hallaxius/argon2w` candidate remains rejected pending exact npm artifact, signature/provenance and source-to-build verification. As a fallback, inspected the official PHC reference Argon2 C source: it supports Argon2id, provides PHC encoded hash handling and known-answer tests, includes memory-clearing code, and offers a `NO_THREADS=1` build option. Its licence permits use under CC0 1.0 or Apache 2.0. This was source inspection only; the upstream branch has not yet been pinned to an immutable commit and no Emscripten build or Workers benchmark has been run.

**Next build gate:** pin the upstream commit and source manifest; create a minimal single-thread hash/verify wrapper; compile a standalone prebuilt Wasm module; verify upstream vectors, PHC compatibility, malformed input and memory handling; then test Wrangler import and the isolated Free-plan OWASP-baseline benchmark. Do not modify application authentication or stored hashes before all gates pass. No application, Preview or Production resources were changed.


## 2026-11-26 — Preferred Argon2id prototype candidate updated

The PHC reference C repository remains useful as a reference and known-answer source, but its latest published release is shown as 2019-07-02 and the inspected master commit is dated 2021-06-25. Its maintenance gap is a concern for a new security-critical integration.

Preferred isolated prototype candidate is RustCrypto Argon2 0.6.0 pinned to signed commit `dc7e0c25cda9a8421d2604debf548d663886b431` (2026-11-05). Source review confirms pure Rust/no_std, Argon2id, PHC interfaces, single-thread default, optional zeroize support and MIT OR Apache-2.0 licensing. Its documented default matches OWASP's m=19,456 KiB, t=2, p=1 baseline. **Important:** the inspected allocated block-buffer Drop deallocates without wiping the full matrix; a wrapper must explicitly zeroize its owned matrix on all exit paths. Do not assume enabling the optional zeroize feature solves that issue.

Next: build a bounded single-thread `wasm32-unknown-unknown` prototype with fixed Argon2id v=19 parameters, PHC-compatible input/output, pre-allocation PHC parameter limits, RAII full-matrix wiping and KAT/interop/ABI tests. Then import the precompiled module in the isolated Workers Free benchmark and measure CPU/memory. This is candidate selection only: no dependency or application code was changed; Production remains blocked.

## 2026-11-26 — Isolated Argon2id prototype CI milestone

The isolated Rust Argon2id prototype now includes bounded PHC-style generation and fixed-profile verification. Commit `a2809a78ea8f490d206ecaaf03d1bb274a1f4fef` passed CI Run [#9](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45781931534): formatting, five host tests, Clippy with warnings denied and release `wasm32-unknown-unknown` compilation.

**Evidence boundary:** the local PHC round-trip is not independent interoperability testing; the C/WASM ABI, JavaScript adapter, explicit memory-wipe test, precompiled Wrangler module import and isolated Workers Free runtime benchmark remain open. The Preview deployment and benchmark workflows were skipped for this source-only commit. No application authentication, stored password hash, D1, secret or Production resource changed. No deployment was performed.

### Next execution gate

1. Design and implement a bounded WASM ABI with checked pointer/length ranges, explicit buffer capacities and status codes; prevent panics crossing the ABI.
2. Add a JavaScript adapter that uses `crypto.getRandomValues` for 16-byte salts and handles WASM memory growth safely.
3. Add independent PHC fixtures and a test proving matrix zeroization on all exits.
4. Verify the compiled module is imported as a precompiled Wrangler Wasm module, then benchmark only in the isolated Worker.
5. Keep application authentication and stored hashes unchanged until every gate passes.


## 2026-11-26 — Argon2id prototype verification update

- Prototype CI [#45843299302](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45843299302) passed formatting, host tests, Clippy, WASM compilation, wasm-bindgen bindings, JS adapter/memory-growth tests and artifact upload.
- Host-test evidence confirms both independent PHC fixtures (argon2-cffi and libsodium) and the deterministic malformed-PHC corpus (including 4,096 bounded arbitrary ASCII inputs) passed.
- Adapter tests passed Web Crypto salt generation, input-boundary rejection, memory-growth handling and best-effort cleanup of adapter-owned mutable buffers on success and controlled WASM failures.
- Controlled Worker cleanup failure-path test [#45840895843](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45840895843) passed: injected post-runtime failure, deletion HTTP 200 and follow-up API absence HTTP 404.
- Runtime test [#45843299379](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45843299379) passed hash/verify and cleanup. Cloudflare Logs query for that Worker over the last 24 hours returned zero records; CPUTimeMs and WallTimeMs remain unmeasured.

**Current gate:** the prototype remains isolated and not approved for application integration or Production. Remaining work: obtain invocation CPU-time evidence while the Worker is live; perform repeatable load/latency and memory characterization; review dependency lockfile and generated artifact provenance; complete security review. No application password hashes, authentication routes, D1 data or Production resources have been changed.


## Dependency reproducibility checkpoint — 2026-11-26

- Retrieved the generated lockfile from successful prototype CI artifact `argon2id-wasm-f541b2a72b4aba872c294af035c9aa3257ae3a96` (GitHub Actions artifact ID `15131972377`).
- Committed it as `prototypes/argon2id-wasm/Cargo.lock` in commit `e67b6e669be50fe6922c3df3bf1b01979ba51aa2`. The committed file is 7,682 bytes, 293 lines and contains 34 package entries including the prototype root package.
- Prototype CI now uses `--locked` for host tests, Clippy, WebAssembly builds and wasm-bindgen crate resolution; the CLI installation itself uses `--locked`.
- The post-commit clean-checkout workflow [#45852609412](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45852609412) completed successfully: lockfile setup, formatting, host tests, Clippy, locked WebAssembly compilation, wasm-bindgen generation, Node adapter/memory-growth tests and artifact upload all passed. The dependency reproducibility CI gate is closed for the currently pinned graph; provenance documentation and security review remain separate work.
- The Cloudflare runtime workflow was also updated to use the committed lockfile with `--locked`. Its next run [#45852694342](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45852694342) is queued. It includes a bounded 150-second post-test hold so Cloudflare invocation telemetry can be inspected before the existing EXIT cleanup removes the temporary Worker.

The Argon2 source remains pinned to immutable revision `dc7e0c25cda9a8421d2604debf548d663886b431`. Dependency version pinning is now implemented; full reproducibility remains pending until the post-commit CI completes all steps, and provenance review must still record the Rust toolchain, wasm-bindgen CLI version and artifact checksums. This does not constitute an external security audit or approval for application integration.


## 2026-11-26 — Argon2id build provenance and dependency audit

- Added `docs/ARGON2ID_BUILD_PROVENANCE.md` documenting build inputs, artifact evidence and remaining supply-chain risks.
- Pinned Rust to 1.100.0 in the prototype and isolated runtime workflows. Prior CI logs confirm rustc 1.100.0 (commit `0ef1bc386`, dated 2026-11-09).
- The Argon2 implementation remains pinned to immutable revision `dc7e0c25cda9a8421d2604debf548d663886b431`; Cargo.lock is committed and builds use `--locked`.
- Added pinned `cargo-audit 0.23.0` to CI, together with a license/source inventory, build tool versions and SHA-256 artifact checksums.
- Prototype CI [#45855759095](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45855759095) is still running. Vulnerability findings, license review and provenance artifact are not yet verified.
- Remaining supply-chain hardening: immutable GitHub Action SHAs, exact Node.js patch pinning and signed provenance/independent rebuild.
- Cloudflare invocation CPU-time evidence remains open; the latest telemetry-enabled runtime attempt is still in progress.
- No application authentication, D1 or Production changes.

**Decision:** isolated prototype only; no application integration or Production approval.


## Toolchain warning classification — 2026-11-26

The future-incompatibility warning for `buf_redux 0.8.4` and `multipart 0.18.0` was emitted while compiling the separately installed `wasm-bindgen-cli` build tool, not while compiling the Argon2id crate. A direct check of the committed application `Cargo.lock` confirms neither package is present in its 34-package dependency graph. Keep this as a tooling dependency warning for follow-up; do not misclassify it as an application runtime dependency or a RustSec advisory. The pinned `wasm-bindgen-cli` version remains 0.2.130.


## MFA migration CI checkpoint — 2026-11-27

- Fixed the SQLite MFA transaction-test fixture to satisfy the credential-table CHECK constraint introduced by migration 0019.
- Validation run [#46002420731](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/46002420731) completed successfully for `current-focus-development` commit `0832630d1b3dd034db064a7d778df5a5eeaa1ea0`.
- Migration 0019 followed by 0020 now passes the SQLite schema/transaction test path, including challenge replay and factor/session claim checks.
- This does not establish live Cloudflare D1 compatibility or Preview acceptance. Migration 0020 has not been applied remotely. Preview deployment and Production actions remain unauthorized and untouched.

## Preview deployment MFA gate — 2026-11-27

The guarded Preview deployment workflow now runs `python3 scripts/test-admin-mfa-challenge.py` alongside the existing MFA cryptographic/source-contract checks before any Preview deployment step. This adds the SQLite migration-order, challenge replay, expiry, purpose, recovery-code and factor/session transaction checks to the deployment gate. It does not apply migration 0020 or deploy the Worker. The workflow change is on `current-focus-development`; its CI validation is pending.


## 2026-11-27 — Development validation and Preview gate passed

Validation run [#46002620627](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/46002620627) passed for `current-focus-development` commit `0bf2e16032b97bab504170caa8d1738aded25c74`. The run parsed both the general validation workflow and the guarded Preview deployment workflow; all listed JavaScript, site, RBAC, CMS, MFA (including SQLite challenge replay/migration-order tests), course pricing, registration and quotation checks passed. The Preview deployment workflow now runs the MFA challenge transaction test before any deployment step. This is CI evidence only: no workflow dispatch, Preview D1 migration or Worker deployment occurred. Next gate is a fresh read-only Preview D1 migration audit; applying migration 0020 and deploying remain separately approval-gated.


## 2026-11-27 — Executable Admin RBAC route matrix added

Added an executable test matrix to `scripts/test-rbac-contract.mjs`. It extracts and runs the actual `requiredPermission(path, method)` function from `src/worker.js` and asserts representative read/manage mappings across dashboard, courses, registrations, inquiries, CMS, site content, styles, pages, media, analytics and chat. It also checks Admin-only identity/user routes, unknown paths, the media-audit unsupported-method case, and ensures an unsupported method does not receive a read permission. This is a deterministic unit-level check of the permission mapper, not an authenticated API test: it does not prove role/session enforcement, HTTP status codes or Cloudflare D1 behavior. CI is pending. No Preview deployment, migration, D1 write or Production change was performed.


## 2026-11-27 — Admin and limited-user permission normalization tests added

Extended the RBAC test to execute the actual `permissionsFor()` implementation. New cases assert that Admin receives the complete permission set, limited users retain only allowlisted permissions, malformed JSON grants no permissions, and non-array permission data grants no permissions. Combined with the route-to-permission matrix, this strengthens deterministic unit coverage of the permission model. It still does not exercise authenticated HTTP requests, session revocation, 401/403 responses or live D1. CI is pending. No remote migration, Preview deployment or Production change was performed.


## 2026-11-27 — Read-only Admin route method allowlist tightened

The centralized RBAC permission mapper now grants read permissions on the Admin summary, registrations, inquiries, analytics, and chat-conversation collection routes only for `GET`. Unsupported methods return no permission requirement, so limited users are denied by the existing RBAC guard before reaching route handlers. The RBAC contract test executes the real mapper and checks `POST`, `PUT`, `PATCH`, `DELETE`, and `OPTIONS` are rejected for each read-only collection. This is source-level/isolated-function validation; it is not yet an authenticated HTTP integration test. CI validation is pending. No Preview/Production migration or deployment was performed.


## 2026-11-27 — Authenticated Admin API handler integration test added

Added `scripts/test-admin-api-auth.mjs`, which imports the actual Worker entrypoint and calls its `fetch()` handler with a signed test session and a controlled in-memory D1 mock. It covers six scenarios: missing session (401), valid Admin summary access (200), limited user without `dashboard.view` (403), revoked session-version mismatch (401), disabled account (401), and incomplete MFA enrollment (401). Added the test to the development validation workflow. This exercises the real HTTP handler/authentication guard, but the D1 implementation is mocked; it is not Cloudflare D1 or Preview runtime proof. CI is pending. No Preview deployment, migration 0020 application, or Production action was performed.


## 2026-11-27 — Authenticated Admin API handler integration CI passed

Development validation [#46030635598](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/46030635598) completed successfully. The authenticated Admin API handler integration step passed, along with the workflow's remaining validation steps. The test uses a mocked D1 adapter, so this does not replace remote Preview/D1 runtime verification. The Preview runtime smoke and Preview deployment jobs for this commit were skipped by workflow conditions; no Preview deployment occurred.


## 2026-11-27 — Authenticated Admin API permission boundary coverage expanded

Expanded `scripts/test-admin-api-auth.mjs` beyond the initial six authentication scenarios. New real-Worker-handler cases verify that a limited user with only `courses.view` cannot POST to the course collection, a dashboard-only user cannot read courses, and a limited user is denied GET/POST/PATCH/DELETE access to Admin-only account-management routes even when holding unrelated manage permissions. An Admin account-list GET is also checked. The test now contains 13 scenarios. These checks use signed test sessions and mocked D1; they do not establish live Cloudflare D1 or Preview runtime behavior. CI is pending. No Preview deployment, migration 0020 application, or Production action was performed.


## 2026-11-27 — Authenticated course view/manage boundary tests added

Extended `scripts/test-admin-api-auth.mjs` with three real Worker-handler cases: a `courses.view` user can read the course collection (200); a `courses.manage` user passes the RBAC gate and reaches course input validation (400 for an intentionally empty payload); and a `courses.view`-only user is denied the same POST (403). The invalid manage request is deliberately rejected before any database write, so this tests permission routing without mutating data. The suite now contains 16 scenarios. D1 remains mocked; CI is pending and this is not Preview runtime evidence. No deployment, remote migration, or Production change was performed.


## 2026-11-27 — Authenticated inquiry, registration and chat permission tests added

Extended `scripts/test-admin-api-auth.mjs` with real Worker-handler coverage for inquiry collection read and status mutation boundaries, registration quote-history read and quote-creation boundaries, and chat conversation read/reply boundaries. View-only inquiry/registration users and chat.view users are denied mutation (403); corresponding manage/reply permissions reach handler validation (400 for deliberately invalid input); permitted collection/history reads return 200. The invalid mutation payloads are rejected before writes. The suite now contains 24 scenarios. All use signed test sessions and mocked D1, not live Cloudflare D1 or Preview. CI is pending. No Preview deployment, migration application or Production action was performed.


## 2026-11-28 — Authenticated CMS permission coverage and release status

Added three authenticated Worker-handler cases to `scripts/test-admin-api-auth.mjs`: a `content.view` user can read a CMS page (200) but cannot save a draft (403); a `content.manage` user passes RBAC and reaches draft validation (400 for an intentionally empty payload). The invalid save does not reach D1 writes. The authenticated Admin API suite now contains 27 scenarios. Tests use signed sessions and mocked D1; CI for this update is pending and no Preview runtime proof is claimed.

**Release / Production status:** This is a source-and-test update on `current-focus-development` only. Production Worker, Production D1, secrets and configuration were not changed. No Production deployment or migration was performed. Preview deployment remains gated/skipped; migration 0020 remains unapplied remotely. Production release is not approved and is not complete. Existing release blockers remain: fresh Preview D1 migration audit, explicit approval for Preview migration 0020 and Preview deployment, live Preview acceptance for MFA/RBAC/Admin workflows, and Production readiness review.


## 2026-11-28 — CMS publishing authorization boundary added

Added two further authenticated Worker-handler tests: `content.view` is denied CMS publish (403), while `content.manage` reaches page-identifier validation (400 for an intentionally invalid page identifier). The test rejects before any publishing query or database write. The authenticated Admin API integration suite now contains 29 scenarios. This remains mocked-D1 handler coverage, not live Preview CMS publishing evidence. CI is pending for this latest test change.

**Production update:** No Production feature was deployed. Production Worker, D1, secrets and configuration remain untouched. The Preview deployment job was inspected for the prior documentation/test update and its deploy job was skipped. No migration 0020 was applied. Production release remains blocked pending Preview migration audit, approved Preview migration/deployment, live acceptance and Production readiness checks.

## 2026-11-28 — Admin account self-protection handler tests added

Extended `scripts/test-admin-api-auth.mjs` with three authenticated Worker-handler cases for Admin account management: an administrator cannot disable their own account, demote their own account, or delete their own account. Each request is checked through the real Worker `fetch()` entrypoint with a signed test session and mocked D1. The suite is expected to contain 32 scenarios after this addition, based on the prior documented 29 plus these three cases; verify the emitted test counter in CI before treating the count as confirmed.

**Validation:** CI is pending for commit `240ec22c2cb733db2cba285a09920616c5e0ff00`. This is mocked-D1 handler coverage, not remote D1 or Preview runtime acceptance. No Preview deployment, migration 0020 application, or Production operation was performed. Production remains unreleased and unchanged.

## 2026-11-28 — Admin self-protection test identity correction

The first CI run for the self-protection cases exposed a test-fixture mismatch: the signed test session used a non-UUID user ID while the account route accepts UUID-form target IDs. The test now signs the session with the same UUID used in the request path, so the Worker can reach its self-account guard. This is a test correction, not an application behavior change. Fix commit: `d56c8ecdfecb8b208b109b1f10535ef7230f5066`. Validation is pending; the previous CI run failed at the DELETE self-account assertion (actual 403, expected 400). No Preview or Production changes.
