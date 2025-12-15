import http from "k6/http";
import { check, sleep } from "k6";
import { getOptions } from "../lib/options.js";
import { e2eMs, payloadBytes, payloadBytesTotal } from "../lib/metrics.js";
import { bodySize } from "../lib/size.js";
import { buildOutputs } from "../lib/summary.js";

export const options = getOptions();

const baseUrl = (__ENV.BASE_URL || "http://localhost:4000").trim();
const gqlUrl = (__ENV.GQL_URL || `${baseUrl}/api/v1/graphql`).trim();
const sleepSeconds = parseFloat(__ENV.SLEEP || "1");

function gql(query, variables) {
  return http.post(
    gqlUrl,
    JSON.stringify({ query, variables }),
    { headers: { "content-type": "application/json" }, tags: { name: "graphql" } }
  );
}

export function setup() {
  const taskId = (__ENV.TASK_ID || "").trim();
  if (taskId) return { taskId };

  const res = gql("query { sample { taskId } }", {});
  const ok = check(res, { "sample status 200": (r) => r.status === 200 });
  if (!ok) throw new Error("Failed to load sample IDs");
  const body = res.json();
  if (body.errors && body.errors.length) throw new Error(String(body.errors[0].message || "GraphQL error"));
  return { taskId: String(body.data.sample.taskId) };
}

export default function (data) {
  const query = `
    query TaskDetail($id: ID!) {
      taskDetail(id: $id) {
        task { id projectId title status priority dueDate }
        project { id name description taskCount }
      }
    }
  `;

  const start = Date.now();
  const res = gql(query, { id: data.taskId });
  const dur = Date.now() - start;

  e2eMs.add(dur);

  const bytes = bodySize(res);
  payloadBytes.add(bytes);
  payloadBytesTotal.add(bytes);

  const ok = check(res, { "graphql 200": (r) => r.status === 200 });
  if (ok) {
    const body = res.json();
    check(body, { "no graphql errors": (b) => !(b.errors && b.errors.length) });
  }

  sleep(sleepSeconds);
}

export function handleSummary(data) {
  return buildOutputs("task_detail_graphql", data);
}
