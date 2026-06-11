import { describe, expect, it } from "vitest";
import { validateJobCreationPolicy } from "@/lib/jobSubscriptionPolicy";

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

function createSubscriptionService(allowed: boolean, reason: string | null = null) {
  return {
    canPostJob() {
      return Promise.resolve({
        feature: "post_job",
        allowed,
        planSlug: allowed ? "growth" : "starter",
        limit: 3,
        used: allowed ? 1 : 3,
        remaining: allowed ? 2 : 0,
        unlimited: false,
        reason
      });
    }
  };
}

describe("validateJobCreationPolicy", () => {
  it("allows job creation when the employer has remaining job usage", async () => {
    const client = createClient([{ id: "employer-1", user_id: "user-1" }]);
    const service = createSubscriptionService(true);

    const result = await validateJobCreationPolicy(client as any, service as any, "user-1");

    expect(result.allowed).toBe(true);
    if (result.allowed) {
      expect(result.employer.id).toBe("employer-1");
      expect(result.usage.remaining).toBe(2);
    }
  });

  it("returns a meaningful response when the employer profile is missing", async () => {
    const client = createClient([]);
    const service = createSubscriptionService(true);

    const result = await validateJobCreationPolicy(client as any, service as any, "user-1");

    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.status).toBe(409);
      expect(result.body.code).toBe("EMPLOYER_PROFILE_REQUIRED");
    }
  });

  it("blocks job creation when the subscription job limit is reached", async () => {
    const client = createClient([{ id: "employer-1", user_id: "user-1" }]);
    const service = createSubscriptionService(false, "Usage limit reached for the current subscription period.");

    const result = await validateJobCreationPolicy(client as any, service as any, "user-1");

    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.status).toBe(403);
      expect(result.body.code).toBe("JOB_LIMIT_REACHED");
      expect(result.body.usage?.remaining).toBe(0);
    }
  });
});
