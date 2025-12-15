import http from "k6/http";
import { check, sleep } from "k6";
import { getOptions } from "../lib/options.js";
import { e2eMs, payloadBytes, payloadBytesTotal } from "../lib/metrics.js";
import { bodySize } from "../lib/size.js";
import { buildOutputs } from "../lib/summary.js";

export const options = getOptions();

const baseUrl = (__ENV.BASE_URL || "http://localhost:4000").trim();
const restBase = (__ENV.REST_BASE || `${baseUrl}/api/v0`).trim();
const sleepSeconds = parseFloat(__ENV.SLEEP || "1");

export function setup() {
  const taskId = (__ENV.TASK_ID || "").trim();
  if (taskId) return { taskId };

  const res = http.get(`${restBase}/sample`);
  const ok = check(res, { "sample status 200": (r) => r.status === 200 });
  if (!ok) throw new Error("Failed to load sample IDs");
  const data = res.json();
  return { taskId: String(data.taskId) };
}

export default function (data) {
  const taskUrl = `${restBase}/tasks/${data.taskId}`;
  const projectUrl = `${restBase}/tasks/${data.taskId}/project`;

  const start = Date.now();
  const responses = http.batch([
    ["GET", taskUrl, null, { tags: { name: "task" } }],
    ["GET", projectUrl, null, { tags: { name: "project" } }]
  ]);
  const dur = Date.now() - start;

  const r1 = responses[0];
  const r2 = responses[1];

  e2eMs.add(dur);

  const bytes = bodySize(r1) + bodySize(r2);
  payloadBytes.add(bytes);
  payloadBytesTotal.add(bytes);

  check(r1, { "task 200": (r) => r.status === 200 });
  check(r2, { "project 200": (r) => r.status === 200 });

  sleep(sleepSeconds);
}

export function handleSummary(data) {
  return buildOutputs("task_detail_rest", data);
}
