/**
 * @jest-environment node
 */
import { logError, logInfo } from "../logger";
import { prisma } from "../prisma";
import { appErrorsCounter } from "../metrics";

jest.mock("../prisma", () => ({
  prisma: {
    systemErrorLog: {
      create: jest.fn().mockReturnValue({
        catch: jest.fn(),
      }),
    },
  },
}));

jest.mock("../metrics", () => ({
  appErrorsCounter: {
    inc: jest.fn(),
  },
}));

describe("Structured Logger & Error Telemetry Unit Tests", () => {
  let consoleErrorSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  describe("1. logError Function", () => {
    it("should log standard Error instances to console with timestamp and context", () => {
      const error = new Error("Database connection timed out");
      logError(error, "DB Timeout Error", {
        organizationId: "org-123",
        route: "/api/leads",
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[SYSTEM ERROR] DB Timeout Error",
        expect.objectContaining({
          context: { organizationId: "org-123", route: "/api/leads" },
        })
      );
    });

    it("should convert non-Error strings or objects into Error instances safely", () => {
      logError("Raw error string", undefined, { userId: "user-456" });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[SYSTEM ERROR] Raw error string",
        expect.objectContaining({
          context: { userId: "user-456" },
        })
      );
    });

    it("should increment Prometheus appErrorsCounter metric", () => {
      const customErr = new TypeError("Invalid parameter type");
      logError(customErr, undefined, {
        route: "/api/leads/import",
        organizationId: "org-456",
      });

      expect(appErrorsCounter.inc).toHaveBeenCalledWith({
        type: "TypeError",
        route: "/api/leads/import",
        organization_id: "org-456",
      });
    });

    it("should use fallback label values when context is omitted", () => {
      const err = new Error("Generic failure");
      logError(err);

      expect(appErrorsCounter.inc).toHaveBeenCalledWith({
        type: "Error",
        route: "unknown",
        organization_id: "global",
      });
    });

    it("should persist error log to database via Prisma SystemErrorLog model", () => {
      const error = new Error("Query failed");
      logError(error, "Custom message", {
        organizationId: "org-789",
        leadId: "lead-001",
      });

      expect(prisma.systemErrorLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: "org-789",
          message: "Custom message",
          level: "ERROR",
        }),
      });
    });

    it("should handle Prometheus or DB logging errors gracefully without crashing", () => {
      (appErrorsCounter.inc as jest.Mock).mockImplementationOnce(() => {
        throw new Error("Prometheus registry locked");
      });

      expect(() => {
        logError(new Error("Another error"));
      }).not.toThrow();
    });
  });

  describe("2. logInfo Function", () => {
    it("should log informational messages with structured context to console", () => {
      logInfo("Lead assigned successfully", {
        leadId: "lead-999",
        counsellorId: "user-888",
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "[INFO] Lead assigned successfully",
        expect.objectContaining({
          context: { leadId: "lead-999", counsellorId: "user-888" },
        })
      );
    });

    it("should log informational messages without context", () => {
      logInfo("CRM Server initialized");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        "[INFO] CRM Server initialized",
        expect.objectContaining({
          context: undefined,
        })
      );
    });
  });
});
