import client from "prom-client";

// Global singleton pattern to prevent re-registering metrics during Next.js HMR
const globalForPrometheus = globalThis as unknown as {
  prometheusInitialized?: boolean;
  httpRequestCounter?: client.Counter<"method" | "route" | "status_code">;
  httpRequestDuration?: client.Histogram<"method" | "route" | "status_code">;
  appErrorsCounter?: client.Counter<"type" | "route" | "organization_id">;
  dbQueryDuration?: client.Histogram<"operation" | "model">;
};

if (!globalForPrometheus.prometheusInitialized) {
  // Collect default system metrics (CPU, memory, event loop, GC, active handles)
  client.collectDefaultMetrics({
    prefix: "crm_",
  });

  globalForPrometheus.httpRequestCounter = new client.Counter({
    name: "crm_http_requests_total",
    help: "Total number of HTTP requests processed by the application",
    labelNames: ["method", "route", "status_code"],
  });

  globalForPrometheus.httpRequestDuration = new client.Histogram({
    name: "crm_http_request_duration_seconds",
    help: "HTTP request latency in seconds",
    labelNames: ["method", "route", "status_code"],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  });

  globalForPrometheus.appErrorsCounter = new client.Counter({
    name: "crm_app_errors_total",
    help: "Total count of application exceptions and system errors",
    labelNames: ["type", "route", "organization_id"],
  });

  globalForPrometheus.dbQueryDuration = new client.Histogram({
    name: "crm_db_query_duration_seconds",
    help: "Database query duration in seconds",
    labelNames: ["operation", "model"],
    buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5],
  });

  globalForPrometheus.prometheusInitialized = true;
}

export const register = client.register;

export const httpRequestCounter = globalForPrometheus.httpRequestCounter!;
export const httpRequestDuration = globalForPrometheus.httpRequestDuration!;
export const appErrorsCounter = globalForPrometheus.appErrorsCounter!;
export const dbQueryDuration = globalForPrometheus.dbQueryDuration!;
