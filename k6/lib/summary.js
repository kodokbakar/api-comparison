function v(data, metric, stat) {
  const m = data.metrics && data.metrics[metric];
  const values = m && m.values;
  if (!values) return null;
  return values[stat] ?? null;
}

function count(data, metric) {
  const m = data.metrics && data.metrics[metric];
  const values = m && m.values;
  if (!values) return null;
  return values.count ?? null;
}

function runId() {
  const r = (__ENV.RUN_ID || "").trim();
  if (r) return r;
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function fmt(n) {
  if (n === null || n === undefined) return "n/a";
  if (typeof n !== "number") return String(n);
  if (!Number.isFinite(n)) return "n/a";
  return n.toFixed(2);
}

export function buildOutputs(name, data) {
  const rid = runId();
  const out = {
    name,
    runId: rid,
    timestamp: new Date().toISOString(),
    vus: data.options && data.options.vus ? data.options.vus : null,
    duration_ms: data.state && data.state.testRunDurationMs ? data.state.testRunDurationMs : null,
    http_req_failed_rate: v(data, "http_req_failed", "rate"),
    http_req_duration_avg_ms: v(data, "http_req_duration", "avg"),
    http_req_duration_p95_ms: v(data, "http_req_duration", "p(95)"),
    http_reqs: count(data, "http_reqs"),
    iterations: count(data, "iterations"),
    data_received_bytes: count(data, "data_received"),
    data_sent_bytes: count(data, "data_sent"),
    e2e_avg_ms: v(data, "e2e_ms", "avg"),
    e2e_p95_ms: v(data, "e2e_ms", "p(95)"),
    payload_bytes_avg: v(data, "payload_bytes", "avg"),
    payload_bytes_p95: v(data, "payload_bytes", "p(95)"),
    payload_bytes_total: count(data, "payload_bytes_total")
  };

  const txt =
    `test: ${name}\n` +
    `runId: ${rid}\n` +
    `http_req_failed: ${fmt(out.http_req_failed_rate)}\n` +
    `http_req_duration avg(ms): ${fmt(out.http_req_duration_avg_ms)}\n` +
    `http_req_duration p95(ms): ${fmt(out.http_req_duration_p95_ms)}\n` +
    `e2e avg(ms): ${fmt(out.e2e_avg_ms)}\n` +
    `e2e p95(ms): ${fmt(out.e2e_p95_ms)}\n` +
    `payload avg(bytes): ${fmt(out.payload_bytes_avg)}\n` +
    `payload p95(bytes): ${fmt(out.payload_bytes_p95)}\n` +
    `payload total(bytes): ${fmt(out.payload_bytes_total)}\n` +
    `http_reqs: ${out.http_reqs ?? "n/a"}\n` +
    `iterations: ${out.iterations ?? "n/a"}\n`;

  return {
    stdout: txt,
    [`k6/results/${name}.${rid}.summary.json`]: JSON.stringify(out, null, 2),
    [`k6/results/${name}.${rid}.summary.txt`]: txt
  };
}
