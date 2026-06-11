import { describe, expect, it } from "vitest";
import { authorizeSubscriptionFeature } from "@/lib/subscriptionFeatureAuthorization";

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

function createService(allowed: boolean) {
  return {
    hasFeature(_employerId: string, feature: string) {
      return Promise.resolve({
        feature,
        allowed,
        planSlug: allowed ? "elite" : "starter",
        limit: null,
        used: 0,
        remaining: null,
        unlimited: allowed,
        reason: allowed ? null : "This feature is not available on the current subscription plan."
      });
    }
  };
}

describe("authorizeSubscriptionFeature", () => {
  it("allows a feature when the employer subscription has it", async () => {
    const client = createClient([{ id: "employer-1", user_id: "user-1" }]);
    const service = createService(true);

    const result = await authorizeSubscriptionFeature(client as any, service as any, "user-1", "talent_pool");

    expect(result.allowed).toBe(true);
    if (result.allowed) {
      expect(result.employer.id).toBe("employer-1");
      expect(result.access.feature).toBe("talent_pool");
    }
  });

  it("returns a reusable unavailable response when the plan lacks the feature", async () => {
    const client = createClient([{ id: "employer-1", user_id: "user-1" }]);
    const service = createService(false);

    const result = await authorizeSubscriptionFeature(client as any, service as any, "user-1", "whatsapp_notifications");

    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.status).toBe(403);
      expect(result.body.error).toBe("subscription_feature_unavailable");
      expect(result.body.feature).toBe("whatsapp_notifications");
    }
  });

  it("requires an employer profile before feature authorization", async () => {
    const client = createClient([]);
    const service = createService(true);

    const result = await authorizeSubscriptionFeature(client as any, service as any, "user-1", "ai_matching");

    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.status).toBe(409);
      expect(result.body.error).toBe("employer_profile_required");
    }
  });
});
