import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { retryDelayMs, nextJobState } from "@/lib/backgroundJobs";
import { validateEnvironment } from "@/lib/config";
import { getFeatureFlags } from "@/lib/featureFlags";
import { redactSensitive } from "@/lib/observability/logger";

describe("platform hardening primitives", () => {
  it("redacts secrets and personal data from structured logs", () => {
    const result = redactSensitive({ authorization: "Bearer abc", email: "person@example.com", nested: { phone: "+8801712345678", note: "Email person@example.com" } });
    expect(result).toEqual({ authorization: "[REDACTED]", email: "[REDACTED]", nested: { phone: "[REDACTED]", note: "Email [EMAIL_REDACTED]" } });
  });

  it("validates required configuration without exposing values", () => {
    const invalid = validateEnvironment({ NODE_ENV: "test" });
    expect(invalid.valid).toBe(false);
    expect(invalid.missing).toContain("NEXT_PUBLIC_SUPABASE_URL");
    const valid = validateEnvironment({ NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co", NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon", SUPABASE_SERVICE_ROLE_KEY: "service" });
    expect(valid.valid).toBe(true);
  });

  it("supports environment-aware feature flags", () => {
    const flags = getFeatureFlags({ FEATURE_TALENT_CRM: "false", FEATURE_CAREER_PAGES: "true" });
    expect(flags.talentCrm).toBe(false);
    expect(flags.careerPages).toBe(true);
  });

  it("provides bounded retries and dead-letter behavior", () => {
    expect(retryDelayMs(1)).toBe(1_000);
    expect(retryDelayMs(20)).toBe(900_000);
    expect(nextJobState(2, 3, false)).toBe("retrying");
    expect(nextJobState(3, 3, false)).toBe("dead_letter");
    expect(nextJobState(3, 3, true)).toBe("completed");
  });

  it("creates typed API errors with stable status codes", () => {
    const error = new ApiError("FORBIDDEN", "You cannot perform this action.");
    expect(error.status).toBe(403);
    expect(error.code).toBe("FORBIDDEN");
  });
});
