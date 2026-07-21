import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { logger } from "@/lib/observability/logger";

export type ApiErrorCode = "BAD_REQUEST" | "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "RATE_LIMITED" | "VALIDATION_FAILED" | "DEPENDENCY_UNAVAILABLE" | "INTERNAL_ERROR";

const STATUS: Record<ApiErrorCode, number> = { BAD_REQUEST: 400, UNAUTHENTICATED: 401, FORBIDDEN: 403, NOT_FOUND: 404, CONFLICT: 409, VALIDATION_FAILED: 422, RATE_LIMITED: 429, DEPENDENCY_UNAVAILABLE: 503, INTERNAL_ERROR: 500 };

export class ApiError extends Error {
  constructor(public readonly code: ApiErrorCode, message: string, public readonly details?: Record<string, unknown>, public readonly status = STATUS[code]) { super(message); this.name = "ApiError"; }
}

export function getCorrelationId(request?: Request) {
  return request?.headers.get("x-correlation-id")?.slice(0, 128) || randomUUID();
}

export function apiErrorResponse(error: unknown, request?: Request, fallback = "The request could not be completed.") {
  const correlationId = getCorrelationId(request);
  const known = error instanceof ApiError;
  const status = known ? error.status : 500;
  const code: ApiErrorCode = known ? error.code : "INTERNAL_ERROR";
  const message = known ? error.message : fallback;
  logger.error("api_request_failed", { correlationId, code, status, error });
  return NextResponse.json({ error: message, code, correlationId, ...(known && error.details && process.env.NODE_ENV !== "production" ? { details: error.details } : {}) }, { status, headers: { "x-correlation-id": correlationId } });
}

export function apiSuccess<T>(data: T, request?: Request, init?: ResponseInit) {
  const correlationId = getCorrelationId(request);
  return NextResponse.json(data, { ...init, headers: { ...init?.headers, "x-correlation-id": correlationId } });
}
