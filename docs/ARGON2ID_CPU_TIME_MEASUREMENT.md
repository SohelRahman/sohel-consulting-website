

## 2026-11-27 — Second Cloudflare telemetry run; repeatability still open

Isolated runtime [#45877435363](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45877435363) passed after the telemetry retry/validation change. The Cloudflare Observability query returned **2 invocation records** for the exact disposable Worker `sohel-argon2id-preview-45877435363`:

- Record 1: **59 ms CPU / 60 ms wall time**.
- Record 2: **0 ms CPU / 0 ms wall time**.
- Both records matched the disposable Worker script name; query completed successfully.
- The workflow exercised health, four sequential hash samples, four sequential verify samples and two concurrent hashes. However, the telemetry response does not map either invocation record to a specific route or KDF operation. Do not label 59 ms as a hash-only or verify-only cost. Treat the zero/zero record as a returned platform record, not proof that the full workflow performed no work.
- The JavaScript response timing fields for the sequential hash/verify samples were all 0 ms at the current timer resolution. They are not CPU measurements and are too coarse to characterize per-operation latency.
- Two concurrent hashes took **134.572 ms combined client wall time**. WASM memory grew from 17 to 323 pages and remained at 323 after sequential and concurrent requests.
- Temporary Worker cleanup was confirmed: DELETE HTTP 200 followed by GET HTTP 404.

This provides a second run with one non-zero invocation sample, but not a statistically useful distribution or endpoint attribution. The first run [#45876662415](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45876662415) returned 58 ms CPU / 60 ms wall time in one event. These two non-zero values are similar but remain invocation-level observations from separate runs, not a performance guarantee. Continue with multiple runs and improve request-to-invocation correlation before comparing against plan CPU limits or considering integration.
## 2026-11-27 — First Cloudflare CPU-time sample captured

Runtime #45876662415 completed successfully after correcting the Observability query. The query returned one invocation event for the exact disposable Worker `sohel-argon2id-preview-45876662415`:

- Cloudflare `$workers.cpuTimeMs`: **58 ms**
- Cloudflare `$workers.wallTimeMs`: **60 ms**
- Event count: **1**
- Worker script name matched the per-run disposable Worker.
- Temporary Worker cleanup was confirmed (DELETE HTTP 200; subsequent GET HTTP 404).

This is the first genuine Cloudflare telemetry sample, not a JavaScript timer. It is an invocation-level measurement; the single event is not enough to attribute the cost to an individual `/hash` or `/verify` request, establish a stable distribution, or claim CPU-limit compliance. Collect multiple independent runs and correlate invocation events before drawing performance conclusions.

Runtime wall-clock benchmark from the same run: two concurrent hash requests completed in 126.997 ms combined; WASM memory grew from 17 to 323 pages and remained stable. This client-side duration is distinct from the Cloudflare 58 ms CPU sample.

Run: https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45876662415
## 2026-11-27 — Observability query correction

The first successful runtime after the harness fix (#45875891768) still returned zero invocation groups. The query body had placed `view: "invocations"` inside `parameters`; Cloudflare's current API schema defines `view` as a top-level query property. The corrected request now sets top-level `view: "invocations"`, retains `parameters.datasets`, and filters by the exact disposable Worker using `$workers.scriptName`.

- Fix commit: `09e84882e5eac8099dddbf3cc15dd5bf1f6ee090`.
- Rerun: https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45876662415 (pending at update time).
- API reference: https://developers.cloudflare.com/api/resources/workers/subresources/observability/subresources/telemetry/methods/query/.
- Do not substitute JavaScript wall-clock timing for Cloudflare CPU time. Record CPU/wall-time samples only from returned invocation events.

## 2026-11-27 — Runtime harness follow-up correction

- The health-probe correction worked: runtime #45875591303 successfully deployed the isolated Worker, uploaded its temporary test token, passed the health probe and proceeded through hash/verify and sequential/concurrent request checks.
- The run then failed in its result-reporting code with `ReferenceError: concurrent is not defined`; the harness declared `concurrentBodies` but reported `concurrent.length`. The EXIT cleanup still deleted the temporary Worker (HTTP 200) and verified absence (HTTP 404).
- Corrected `.github/workflows/test-argon2id-cloudflare-preview.yml` to report `concurrentBodies.length`. Commit: `fa48da65de2aec6d34c0611ba834fda0dced8976`.
- A fresh runtime run and final prototype CI result are required. No CPU-time evidence was captured; do not treat this as runtime acceptance.
- No application authentication, existing Preview, D1, Production or `main` changes.

## Deployment checkpoint — 2026-11-26

The observability configuration is committed on `current-focus-development` (commit `a73e1de`, subsequently retained in the branch head). A marked runtime deployment was triggered as [workflow #45841415366](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45841415366). Its build stage is in progress; deployment and invocation-log collection have not yet completed. This workflow run is expected to deploy the observability-enabled temporary Worker. Do not mark the CPU-time gate complete until the actual invocation records have been inspected.

# Argon2id Cloudflare CPU-Time Measurement

**Scope:** isolated prototype Worker only. No application Worker, D1 database, Production environment or external log destination is configured by this procedure.

## Why this is needed

The prototype's `performance.now()` measurements are elapsed wall-clock time. They are not Cloudflare's billed/execution CPU-time metric. Cloudflare exposes invocation CPU time and wall time separately in Workers Logs and Workers Trace Events.

## Configuration

`prototypes/argon2id-wasm/wrangler.toml` enables native invocation logs:

```toml
[observability]
enabled = true
head_sampling_rate = 1.0

[observability.logs]
enabled = true
invocation_logs = true
head_sampling_rate = 1.0
```

This is enabled only for the short-lived isolated benchmark Worker. No Logpush job, R2 bucket, third-party destination or paid observability service is configured. Cloudflare's documentation lists Workers Logs as included on Workers Free, with three-day retention and a 200,000-event daily allowance (check current account limits before sustained use).

## Measurement procedure

1. Run the isolated Argon2id Cloudflare runtime workflow. It creates a uniquely named temporary Worker and deletes it at the end.
2. In the Cloudflare dashboard, open **Workers & Pages**, select the temporary `sohel-argon2id-preview-<run-id>` Worker, then open **Observability** / **Logs**.
3. Locate invocation records for the test requests. Record the CPU-time and wall-time fields separately for:
   - `POST /hash`
   - `POST /verify`
   - Any health or unrelated requests separately; do not mix them into KDF measurements.
4. Confirm the log's script name and version correspond to the workflow run being evaluated. Use the invocation timestamp and request trigger to associate samples.
5. Capture enough repeated hash and verify invocations to report sample count, median, p95 and maximum CPU time. If the UI's grouping cannot distinguish the routes, use the Workers Observability Query Builder with filters for the temporary script name and request trigger.
6. Save the numeric results and relevant run ID in the project status and security review. Do not infer CPU time from wall time.

## API/query route

Cloudflare documents the Workers Observability telemetry API:
- `POST /accounts/{account_id}/workers/observability/telemetry/keys`
- `POST /accounts/{account_id}/workers/observability/telemetry/query`
- `POST /accounts/{account_id}/workers/observability/telemetry/values`

Use the keys endpoint to discover the account's actual field names before constructing a query. The query API supports numeric aggregations such as median, p95, maximum and average. Do not hard-code guessed field names or assume the existing deployment token has observability-read permission. If API permission is absent, use the dashboard UI; do not broaden or replace API-token permissions without approval.

## Acceptance criteria

- [ ] Invocation logs are enabled for the temporary Worker and samples appear.
- [ ] CPU time is captured separately for hash and verify invocations.
- [ ] Samples are associated with the correct temporary Worker and workflow run.
- [ ] Median, p95 and maximum are reported with sample counts.
- [ ] CPU-time results are compared with the account's actual Workers plan limit before any integration decision.
- [ ] Temporary Worker deletion is independently verified.

## Current status

Configuration has been added to the isolated Wrangler file. Actual invocation CPU-time values have **not** yet been collected. This document is a measurement procedure, not evidence of compliance or release approval.

## Official references

- Workers Logs: https://developers.cloudflare.com/workers/observability/logs/workers-logs/
- Query Builder: https://developers.cloudflare.com/workers/observability/query-builder/
- Workers Trace Events fields: https://developers.cloudflare.com/logs/logpush/logpush-job/datasets/account/workers_trace_events/
- Workers limits: https://developers.cloudflare.com/workers/platform/limits/
- Workers Observability telemetry API: https://developers.cloudflare.com/api/resources/workers/subresources/observability/subresources/telemetry/

## 2026-11-26 execution update

The isolated runtime workflow now uses the committed prototype lockfile with `cargo build --locked` and `cargo tree --locked`. After successful hash/verify and concurrency checks, it waits for 150 seconds before the existing EXIT trap deletes the temporary Worker. This creates a bounded window for Cloudflare Dashboard → Workers & Pages → Observability → Logs inspection while the script still exists. The wait is automatic and cleanup remains enabled even if a preceding step fails.

The first active run with this hold is [#45852923128](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45852923128). Query the script named `sohel-argon2id-preview-45852923128` during that hold, filter to invocation logs, and capture `CPUTimeMs` and `WallTimeMs` separately for `/hash` and `/verify`. If the log records are absent, record that result and do not infer CPU time from JavaScript `performance.now()`. Temporary Worker cleanup must still complete and be verified with the Cloudflare API.


## 2026-11-26 telemetry query correction

The observability-enabled runtime [#45856609844](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45856609844) passed Worker health, Argon2id hash/verify, correct/wrong password checks, sequential/concurrent requests and cleanup. It did **not** return CPU/wall-time keys: the key-discovery response exposed only `$metadata.service`. Review of Cloudflare's current API schema showed that the keys endpoint supports an unfiltered `limit` and that `$metadata.service` is a documented common indexed filter. The runtime workflow was corrected to request up to 1,000 keys without a `$workers.scriptName` filter and to filter invocation queries by `$metadata.service`. This query correction is committed as `8ee6e9ecc05fd36466f1412b0ddb7dde981d9336`; a new isolated run is required. No CPU-time result is claimed.

Official API references: [List keys](https://developers.cloudflare.com/api/resources/workers/subresources/observability/subresources/telemetry/methods/keys/) and [Run a query](https://developers.cloudflare.com/api/resources/workers/subresources/observability/subresources/telemetry/methods/query/). The invocation response schema includes `$workers.cpuTimeMs` and `$workers.wallTimeMs`; their presence in the schema does not prove that this account's current query returned them.


## 2026-11-26 — invocation query diagnostic

Runtime run [#45857773930](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45857773930) discovered both `$workers.cpuTimeMs` and `$workers.wallTimeMs` through the keys API. The invocation query returned HTTP 200 and `run_status=COMPLETED`, but `result.invocations` contained zero groups. This confirms the field names are available but does not establish that matching invocation records were returned. The previous query filtered `$metadata.service` using the temporary Worker script name; that field's semantics were not established, so the filter has been removed rather than assumed correct. A new run [#45859485701](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45859485701) is executing an unfiltered, narrowly time-bounded invocation query and will emit sanitized event/metadata field names to identify the correct script-name field. CPU-time acceptance remains open until real hash/verify invocation samples are captured.


## 2026-11-26 — unfiltered query run blocked by transient edge response

The unfiltered invocation diagnostic [#45859485701](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45859485701) built and deployed the temporary Worker, but runtime verification stopped when a `/verify` request returned an HTML response where JSON was expected. The log did not record the HTTP status/content-type before attempting JSON parsing, so the precise edge response class is unknown. The EXIT cleanup still deleted the Worker (HTTP 200) and confirmed absence (HTTP 404). The runtime adapter now uses bounded retries for transient non-JSON/5xx/429 responses and reports status/content-type on persistent failures. Rerun [#45859898860](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45859898860) is queued; no invocation data or CPU-time samples were captured in #45859485701.
