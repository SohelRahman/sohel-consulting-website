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

The first run with this hold is queued as [#45852694342](https://github.com/SohelRahman/sohel-consulting-website/actions/runs/45852694342). Query the script named `sohel-argon2id-preview-45852694342` during that hold, filter to invocation logs, and capture `CPUTimeMs` and `WallTimeMs` separately for `/hash` and `/verify`. If the log records are absent, record that result and do not infer CPU time from JavaScript `performance.now()`. Temporary Worker cleanup must still complete and be verified with the Cloudflare API.
