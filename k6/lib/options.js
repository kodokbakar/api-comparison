export function getOptions() {
  const vus = parseInt(__ENV.VUS || "20", 10);
  const duration = __ENV.DURATION || "1m";
  return {
    vus,
    duration,
    thresholds: {
      http_req_failed: ["rate<0.01"]
    }
  };
}
