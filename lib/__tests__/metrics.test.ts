/**
 * @jest-environment node
 */
import {
  register,
  httpRequestCounter,
  httpRequestDuration,
  appErrorsCounter,
  dbQueryDuration,
} from "../metrics";

describe("Prometheus Metrics Telemetry Unit Tests", () => {
  it("should have Prometheus registry defined with default and custom metrics", async () => {
    expect(register).toBeDefined();
    const metricsOutput = await register.metrics();
    expect(typeof metricsOutput).toBe("string");
    expect(metricsOutput).toContain("crm_");
  });

  it("should increment httpRequestCounter with labels correctly", async () => {
    httpRequestCounter.inc({
      method: "GET",
      route: "/api/leads",
      status_code: "200",
    });

    const metricsOutput = await register.metrics();
    expect(metricsOutput).toContain("crm_http_requests_total");
    expect(metricsOutput).toContain('method="GET"');
    expect(metricsOutput).toContain('route="/api/leads"');
    expect(metricsOutput).toContain('status_code="200"');
  });

  it("should record latency in httpRequestDuration histogram", async () => {
    const endTimer = httpRequestDuration.startTimer({
      method: "POST",
      route: "/api/leads",
      status_code: "201",
    });
    endTimer();

    const metricsOutput = await register.metrics();
    expect(metricsOutput).toContain("crm_http_request_duration_seconds");
  });

  it("should increment appErrorsCounter", async () => {
    appErrorsCounter.inc({
      type: "ValidationError",
      route: "/api/leads/import",
      organization_id: "org-metric-test",
    });

    const metricsOutput = await register.metrics();
    expect(metricsOutput).toContain("crm_app_errors_total");
    expect(metricsOutput).toContain('type="ValidationError"');
  });

  it("should record dbQueryDuration histogram", async () => {
    dbQueryDuration.observe({ operation: "findUnique", model: "Lead" }, 0.045);

    const metricsOutput = await register.metrics();
    expect(metricsOutput).toContain("crm_db_query_duration_seconds");
    expect(metricsOutput).toContain('operation="findUnique"');
    expect(metricsOutput).toContain('model="Lead"');
  });
});
