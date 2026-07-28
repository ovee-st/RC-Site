import { describe, expect, it } from "vitest";
import {
  aggregateFeatureAdoption,
  buildFunnel,
  categorizeFeedback,
  clampPageSize,
  uniqueActiveUsers
} from "@/lib/operationsIntelligence";

const events = [
  { event_name: "visit", user_id: "user-1", anonymous_id: null, duration_ms: 1000, completed: true },
  { event_name: "visit", user_id: null, anonymous_id: "anon-1", duration_ms: 3000, completed: false },
  { event_name: "register", user_id: "user-1", anonymous_id: null, duration_ms: 2000, completed: true }
];

describe("operations intelligence", () => {
  it("counts authenticated and anonymous active users once", () => {
    expect(uniqueActiveUsers(events)).toBe(2);
  });

  it("builds conversion and drop-off percentages", () => {
    expect(buildFunnel(events, [
      { event: "visit", label: "Visit" },
      { event: "register", label: "Register" }
    ])).toEqual([
      { event: "visit", label: "Visit", users: 2, conversion: 100, dropOff: 0 },
      { event: "register", label: "Register", users: 1, conversion: 50, dropOff: 50 }
    ]);
  });

  it("aggregates feature adoption without per-user queries", () => {
    expect(aggregateFeatureAdoption(events)).toEqual([
      { event: "visit", users: 2, events: 2, completionRate: 50, averageDurationMs: 2000 },
      { event: "register", users: 1, events: 1, completionRate: 100, averageDurationMs: 2000 }
    ]);
  });

  it("categorizes feedback deterministically", () => {
    expect(categorizeFeedback("The upload button is broken")).toBe("bug");
    expect(categorizeFeedback("Please add a calendar feature")).toBe("feature_request");
    expect(categorizeFeedback("I have an idea to improve onboarding")).toBe("idea");
  });

  it("keeps operations pagination bounded", () => {
    expect(clampPageSize(0)).toBe(1);
    expect(clampPageSize(25)).toBe(25);
    expect(clampPageSize(1000)).toBe(100);
  });
});
