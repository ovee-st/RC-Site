import "server-only";

export type LogLevel = "debug" | "info" | "warn" | "error";
export type LogContext = Record<string, unknown>;

const SENSITIVE_KEY = /password|secret|token|authorization|cookie|email|phone|jwt|key/i;
const BEARER = /Bearer\s+[A-Za-z0-9._~+/=-]+/gi;
const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE = /(?:\+?\d[\d\s()-]{7,}\d)/g;

function maskString(value: string) {
  return value.replace(BEARER, "Bearer [REDACTED]").replace(EMAIL, "[EMAIL_REDACTED]").replace(PHONE, "[PHONE_REDACTED]").slice(0, 4_000);
}

export function redactSensitive(value: unknown, depth = 0): unknown {
  if (depth > 5) return "[MAX_DEPTH]";
  if (typeof value === "string") return maskString(value);
  if (Array.isArray(value)) return value.slice(0, 100).map((item) => redactSensitive(item, depth + 1));
  if (value instanceof Error) return { name: value.name, message: maskString(value.message), stack: process.env.NODE_ENV === "development" ? maskString(value.stack || "") : undefined };
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value as Record<string, unknown>).slice(0, 100).map(([key, item]) => [key, SENSITIVE_KEY.test(key) ? "[REDACTED]" : redactSensitive(item, depth + 1)]));
  return value;
}

export function log(level: LogLevel, message: string, context: LogContext = {}) {
  if (level === "debug" && process.env.NODE_ENV === "production") return;
  const payload = JSON.stringify({ timestamp: new Date().toISOString(), level, message: maskString(message), ...redactSensitive(context) as object });
  if (level === "error") console.error(payload);
  else if (level === "warn") console.warn(payload);
  else console.log(payload);
}

export const logger = {
  debug: (message: string, context?: LogContext) => log("debug", message, context),
  info: (message: string, context?: LogContext) => log("info", message, context),
  warn: (message: string, context?: LogContext) => log("warn", message, context),
  error: (message: string, context?: LogContext) => log("error", message, context)
};

export const operationalLogger = {
  apiFailure: (context: LogContext) => logger.error("api_failure", context),
  databaseFailure: (context: LogContext) => logger.error("database_failure", context),
  permissionDenied: (context: LogContext) => logger.warn("permission_denied", context),
  storageFailure: (context: LogContext) => logger.error("storage_failure", context),
  aiFailure: (context: LogContext) => logger.error("ai_failure", context)
};
