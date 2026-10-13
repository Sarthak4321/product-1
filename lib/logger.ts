import { prisma } from "./prisma";
import { appErrorsCounter } from "./metrics";

export interface LogContext {
  userId?: string;
  organizationId?: string;
  role?: string;
  route?: string;
  leadId?: string;
  [key: string]: any;
}

export function logError(error: unknown, message?: string, context?: LogContext) {
  const errObject = error instanceof Error ? error : new Error(String(error));
  const errMessage = message || errObject.message || "Unhandled system exception";
  const errStack = errObject.stack || null;
  const jsonContext = context ? JSON.stringify(context) : null;

  // 1. Console server output
  console.error(`[SYSTEM ERROR] ${errMessage}`, {
    error: errStack,
    context,
    timestamp: new Date().toISOString(),
  });

  // 2. Increment Prometheus Error Metric
  try {
    appErrorsCounter.inc({
      type: errObject.name || "UnhandledError",
      route: context?.route || "unknown",
      organization_id: context?.organizationId || "global",
    });
  } catch {
    // Prometheus metric fallback
  }

  // 3. Persist error to database for in-app Dashboard viewing (/admin/logs)
  try {
    prisma.systemErrorLog
      .create({
        data: {
          organizationId: context?.organizationId || null,
          message: errMessage,
          stack: errStack,
          context: jsonContext,
          level: "ERROR",
        },
      })
      .catch((e) => console.error("Failed to persist SystemErrorLog to DB:", e));
  } catch {
    // Ignore DB error logging loop
  }
}

export function logInfo(message: string, context?: LogContext) {
  console.log(`[INFO] ${message}`, {
    context,
    timestamp: new Date().toISOString(),
  });
}
