import http from "k6/http";
import { check, sleep } from "k6";
import { getOptions } from "../lib/options.js";
import { e2eMs, payloadBytes, payloadBytesTotal } from "../lib/metrics.js";
import { bodySize } from "../lib/size.js";
import { buildOutputs } from "../lib/summary.js";

export const options = getOptions();

const baseUrl = (__ENV.BASE_URL || "http://localhost:4000").trim();
const restBase = (__ENV.REST_BASE || `${baseUrl}/api/v0`).trim();
const take = parseInt(__ENV.TAKE || "50", 10);
const skip = parseInt(__ENV.SKIP || "0", 10);
const sleepSeconds = parseFloat(__ENV.SLEEP || "1");

export function setup() {
  const projectId = (__ENV.PROJECT_ID || "").trim();
  if (projectId) return { projectId };

  const res = http.get(`${restBase}/sample`);
  const ok = check(res, { "sample status 200": (r) => r.status === 200 });
  if (!ok) throw new Error("Failed to load sample IDs");
  const data = res.json();
  return { projectId: String(data.projectId) };
}

export default function (data) {
  const projectUrl = `${restBase}/projects/${data.projectId}`;
  const tasksUrl = `${restBase}/projects/${data.projectId}/tasks?take=${take}&skip=${skip}`;

  const start = Date.now();
  const responses = http.batch([
    ["GET", projectUrl, null, { tags: { name: "project" } }],
    ["GET", tasksUrl, null, { tags: { name: "tasks" } }]
  ]);
  const dur = Date.now() - start;

  const r1 = responses[0];
  const r2 = responses[1];

  e2eMs.add(dur);

  const bytes = bodySize(r1) + bodySize(r2);
  payloadBytes.add(bytes);
  payloadBytesTotal.add(bytes);

  check(r1, { "project 200": (r) => r.status === 200 });
  check(r2, { "tasks 200": (r) => r.status === 200 });

  sleep(sleepSeconds);
}

export function handleSummary(data) {
  return buildOutputs("project_detail_rest", data);
}
