import fs from "node:fs";
import path from "node:path";

const resultsDir = path.resolve("k6/results");

function median(arr) {
  const a = arr.filter((x) => typeof x === "number" && Number.isFinite(x)).sort((x, y) => x - y);
  if (a.length === 0) return null;
  const mid = Math.floor(a.length / 2);
  return a.length % 2 === 1 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
}

function pctChange(base, next) {
  if (typeof base !== "number" || typeof next !== "number") return null;
  if (!Number.isFinite(base) || !Number.isFinite(next) || base === 0) return null;
  return ((base - next) / base) * 100;
}

function fmt(n, digits = 2) {
  if (n === null || n === undefined) return "n/a";
  if (typeof n !== "number") return String(n);
  if (!Number.isFinite(n)) return "n/a";
  return n.toFixed(digits);
}

function readSummaries() {
  if (!fs.existsSync(resultsDir)) {
    throw new Error("k6/results directory not found");
  }

  const files = fs.readdirSync(resultsDir).filter((f) => f.endsWith(".summary.json"));
  const rows = [];

  for (const f of files) {
    const p = path.join(resultsDir, f);
    const raw = fs.readFileSync(p, "utf8");
    const j = JSON.parse(raw);
    rows.push(j);
  }

  return rows;
}

function groupByName(rows) {
  const map = new Map();
  for (const r of rows) {
    const name = r.name;
    if (!map.has(name)) map.set(name, []);
    map.get(name).push(r);
  }
  return map;
}

function summarizeGroup(name, rows) {
  const httpP95 = rows.map((r) => r.http_req_duration_p95_ms);
  const e2eP95 = rows.map((r) => r.e2e_p95_ms);
  const httpReqs = rows.map((r) => r.http_reqs);
  const payloadTotal = rows.map((r) => r.payload_bytes_total);
  const errRate = rows.map((r) => r.http_req_failed_rate);

  return {
    name,
    runs: rows.length,
    http_req_duration_p95_ms_median: median(httpP95),
    e2e_p95_ms_median: median(e2eP95),
    http_reqs_median: median(httpReqs),
    payload_bytes_total_median: median(payloadTotal),
    http_req_failed_rate_median: median(errRate)
  };
}

function toCsv(rows) {
  const header = [
    "name",
    "runs",
    "http_req_duration_p95_ms_median",
    "e2e_p95_ms_median",
    "http_reqs_median",
    "payload_bytes_total_median",
    "http_req_failed_rate_median"
  ].join(",");

  const lines = rows.map((r) =>
    [
      r.name,
      r.runs,
      r.http_req_duration_p95_ms_median ?? "",
      r.e2e_p95_ms_median ?? "",
      r.http_reqs_median ?? "",
      r.payload_bytes_total_median ?? "",
      r.http_req_failed_rate_median ?? ""
    ].join(",")
  );

  return [header, ...lines].join("\n");
}

function toMarkdownTable(rows) {
  const header =
    "| Scenario | Runs | http p95 (ms) | e2e p95 (ms) | http_reqs | payload_total (bytes) | error_rate |\n" +
    "|---|---:|---:|---:|---:|---:|---:|\n";

  const lines = rows
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((r) => {
      return (
        `| ${r.name} | ${r.runs} | ${fmt(r.http_req_duration_p95_ms_median)} | ${fmt(r.e2e_p95_ms_median)} | ${fmt(r.http_reqs_median, 0)} | ${fmt(r.payload_bytes_total_median, 0)} | ${fmt(r.http_req_failed_rate_median, 4)} |`
      );
    });

  return header + lines.join("\n") + "\n";
}

function buildImprovements(summaryByName) {
  const pairs = [
    { label: "project_detail", rest: "project_detail_rest", gql: "project_detail_graphql" },
    { label: "task_detail", rest: "task_detail_rest", gql: "task_detail_graphql" }
  ];

  const rows = [];

  for (const p of pairs) {
    const r = summaryByName.get(p.rest);
    const g = summaryByName.get(p.gql);
    if (!r || !g) continue;

    rows.push({
      scenario: p.label,
      req_reduction_pct: pctChange(r.http_reqs_median, g.http_reqs_median),
      payload_reduction_pct: pctChange(r.payload_bytes_total_median, g.payload_bytes_total_median),
      http_p95_improve_pct: pctChange(r.http_req_duration_p95_ms_median, g.http_req_duration_p95_ms_median),
      e2e_p95_improve_pct: pctChange(r.e2e_p95_ms_median, g.e2e_p95_ms_median)
    });
  }

  return rows;
}

function improvementsMarkdown(rows) {
  const header =
    "| Scenario | req_reduction (%) | payload_reduction (%) | http_p95_improve (%) | e2e_p95_improve (%) |\n" +
    "|---|---:|---:|---:|---:|\n";

  const lines = rows.map((r) => {
    return `| ${r.scenario} | ${fmt(r.req_reduction_pct)} | ${fmt(r.payload_reduction_pct)} | ${fmt(r.http_p95_improve_pct)} | ${fmt(r.e2e_p95_improve_pct)} |`;
  });

  return header + lines.join("\n") + "\n";
}

const rows = readSummaries();
const grouped = groupByName(rows);

const summaries = [];
for (const [name, items] of grouped.entries()) {
  summaries.push(summarizeGroup(name, items));
}

const summaryByName = new Map(summaries.map((s) => [s.name, s]));
const improvements = buildImprovements(summaryByName);

fs.writeFileSync(path.join(resultsDir, "aggregate.median.json"), JSON.stringify(summaries, null, 2));
fs.writeFileSync(path.join(resultsDir, "aggregate.median.csv"), toCsv(summaries));
fs.writeFileSync(path.join(resultsDir, "aggregate.median.md"), toMarkdownTable(summaries));
fs.writeFileSync(path.join(resultsDir, "aggregate.improvements.md"), improvementsMarkdown(improvements));

console.log("Wrote:");
console.log("k6/results/aggregate.median.json");
console.log("k6/results/aggregate.median.csv");
console.log("k6/results/aggregate.median.md");
console.log("k6/results/aggregate.improvements.md");
