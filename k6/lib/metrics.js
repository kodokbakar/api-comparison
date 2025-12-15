import { Trend, Counter } from "k6/metrics";

export const e2eMs = new Trend("e2e_ms", true);
export const payloadBytes = new Trend("payload_bytes");
export const payloadBytesTotal = new Counter("payload_bytes_total");