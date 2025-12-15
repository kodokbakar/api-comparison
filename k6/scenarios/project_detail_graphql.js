import http from "k6/http";
import { check, sleep } from "k6";
import { getOptions } from "../lib/options.js";
import { e2eMs, payloadBytes, payloadBytesTotal } from "../lib/metrics.js";
import { bodySize } from "../lib/size.js";
import { buildOutputs } from "../lib/summary.js";

export const options = getOptions();

const baseUrl = (__ENV.BASE_URL || "http://localhost:4000").trim();
const gqlUrl = (__ENV.GQL_URL || `${baseUrl}/api/v1/graphql`).trim();
const take = parseInt(__ENV.TAKE || "50", 10);
const skip = parseInt(__ENV.SKIP || "0", 10);
const sleepSeconds = parseFloat(__ENV.SLEEP || "1");

function gql(query, variables) {
  return http.post(
    gqlUrl,
    JSON.stringify({ query, variables }),
    { headers: { "content-type": "application/json" }, tags: { name: "graphql" } }
  );
}

export function setup() {
  const projectId = (__ENV.PROJECT_ID || "").trim();
  if (projectId) return { projectId };

  const res = gql("query { sample { projectId } }", {});
  const ok = check(res, { "sample status 200": (r) => r.status === 200 });
  if (!ok) throw new Error("Failed to load sample IDs");
  const body = res.json();
  if (body.errors && body.errors.length) throw new Error(String(body.errors[0].message || "GraphQL error"));
  return { projectId: String(body.data.sample.projectId) };
}

export default function (data) {
  const query = `
    query ProjectDetail($id: ID!, $skip: Int!, $take: Int!) {
      projectDetail(id: $id, skip: $skip, take: $take) {
        project { id name description taskCount }
        tasks { projectId skip take items { id title status priority dueDate } }
      }
    }
  `;

  const start = Date.now();
  const res = gql(query, { id: data.projectId, skip, take });
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
  return buildOutputs("project_detail_graphql", data);
}
