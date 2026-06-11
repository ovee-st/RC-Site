import { describe, expect, it } from "vitest";
import { validateCandidateProfileAccessPolicy } from "@/lib/candidateProfileAccessPolicy";

type Row = Record<string, any>;

class FakeQuery {
  private filters: Array<(row: Row) => boolean> = [];

  constructor(private readonly rows: Row[]) {}

  select() {
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push((row) => row[column] === value);
    return this;
  }

  maybeSingle() {
    return Promise.resolve({
      data: this.rows.find((row) => this.filters.every((filter) => filter(row))) ?? null,
      error: null
    });
  }
}

function createClient(employers: Row[]) {
  return {
    from(table: string) {
      if (table !== "employers") throw new Error(`Unexpected table ${table}`);
      return new FakeQuery(employers);
    }
  };
}

function createSubscriptionService(allowed: boolean, remaining: number | null, reason: string | null = null) {
  return {
    canViewCandidate() {
      return Promise.resolve({
        feature: "view_candidate",
        allowed,
        planSlug: remaining === null ? "elite" : "growth",
        limit: remaining === null ? null : 500,
        used: remaining === null ? 0 : 500 - remaining,
        remaining,
        unlimited: remaining === null,
        reason
      });
    }
  };
}

describe("validateCandidateProfileAccessPolicy", () => {
  it("allows employers with remaining candidate views and requires usage tracking", async () => {
    const client = createClient([{ id: "employer-1", user_id: "user-1" }]);
    const service = createSubscriptionService(true, 12);

    const result = await validateCandidateProfileAccessPolicy(client as any, service as any, "user-1", "employer");

    expect(result.allowed).toBe(true);
    if (result.allowed) {
      expect(result.shouldTrackUsage).toBe(true);
      expect(result.employer?.id).toBe("employer-1");
      expect(result.usage?.remaining).toBe(12);
    }
  });

  it("returns subscription_limit_reached when candidate view limit is exhausted", async () => {
    const client = createClient([{ id: "employer-1", user_id: "user-1" }]);
    const service = createSubscriptionService(false, 0, "Usage limit reached for the current subscription period.");

    const result = await validateCandidateProfileAccessPolicy(client as any, service as any, "user-1", "employer");

    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.status).toBe(403);
      expect(result.body.error).toBe("subscription_limit_reached");
      expect(result.body.usage?.remaining).toBe(0);
    }
  });

  it("bypasses subscription usage for internal users", async () => {
    const client = createClient([]);
    const service = createSubscriptionService(false, 0);

    const result = await validateCandidateProfileAccessPolicy(client as any, service as any, "user-1", "admin");

    expect(result.allowed).toBe(true);
    if (result.allowed) {
      expect(result.shouldTrackUsage).toBe(false);
      expect(result.employer).toBeNull();
      expect(result.usage).toBeNull();
    }
  });

  it("allows unlimited employer plans", async () => {
    const client = createClient([{ id: "employer-1", user_id: "user-1" }]);
    const service = createSubscriptionService(true, null);

    const result = await validateCandidateProfileAccessPolicy(client as any, service as any, "user-1", "employer");

    expect(result.allowed).toBe(true);
    if (result.allowed) {
      expect(result.usage?.unlimited).toBe(true);
      expect(result.usage?.remaining).toBeNull();
    }
  });
});
