import { describe, expect, it } from "vitest";
import { SubscriptionService } from "@/lib/subscriptionService";

type TableName = "employer_subscriptions" | "subscription_plans" | "employer_usage" | "employers";
type Row = Record<string, any>;

class FakeSupabaseQuery {
  private filters: Array<(row: Row) => boolean> = [];
  private orderBy: { column: string; ascending: boolean } | null = null;
  private rowLimit: number | null = null;
  private insertRow: Row | null = null;
  private updatePatch: Row | null = null;

  constructor(private readonly db: Record<TableName, Row[]>, private readonly table: TableName) {}

  select() {
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push((row) => row[column] === value);
    return this;
  }

  in(column: string, values: unknown[]) {
    this.filters.push((row) => values.includes(row[column]));
    return this;
  }

  lte(column: string, value: string) {
    this.filters.push((row) => row[column] <= value);
    return this;
  }

  gt(column: string, value: string) {
    this.filters.push((row) => row[column] > value);
    return this;
  }

  order(column: string, options: { ascending: boolean }) {
    this.orderBy = { column, ascending: options.ascending };
    return this;
  }

  limit(value: number) {
    this.rowLimit = value;
    return this;
  }

  insert(row: Row) {
    const inserted = {
      id: row.id ?? `usage-${this.db[this.table].length + 1}`,
      created_at: row.created_at ?? "2026-06-11T00:00:00.000Z",
      updated_at: row.updated_at ?? "2026-06-11T00:00:00.000Z",
      ...row
    };
    this.db[this.table].push(inserted);
    this.insertRow = inserted;
    return this;
  }

  update(patch: Row) {
    this.updatePatch = patch;
    return this;
  }

  maybeSingle() {
    const row = this.getRows()[0] ?? null;
    return Promise.resolve({ data: row, error: null });
  }

  single() {
    if (this.insertRow) return Promise.resolve({ data: this.insertRow, error: null });

    if (this.updatePatch) {
      const row = this.getRows()[0];
      if (!row) return Promise.resolve({ data: null, error: { message: "Row not found" } });
      Object.assign(row, this.updatePatch);
      return Promise.resolve({ data: row, error: null });
    }

    const row = this.getRows()[0] ?? null;
    return Promise.resolve({ data: row, error: row ? null : { message: "Row not found" } });
  }

  private getRows() {
    let rows = this.db[this.table].filter((row) => this.filters.every((filter) => filter(row)));

    if (this.orderBy) {
      const { column, ascending } = this.orderBy;
      rows = [...rows].sort((a, b) => {
        if (a[column] === b[column]) return 0;
        return (a[column] > b[column] ? 1 : -1) * (ascending ? 1 : -1);
      });
    }

    if (this.rowLimit !== null) rows = rows.slice(0, this.rowLimit);
    return rows;
  }
}

function createFakeSupabase(overrides: Partial<Record<TableName, Row[]>> = {}) {
  const now = "2026-06-11T00:00:00.000Z";
  const db: Record<TableName, Row[]> = {
    employer_subscriptions: [
      {
        id: "sub-1",
        employer_id: "employer-1",
        employer_user_id: "user-1",
        plan_id: "plan-growth",
        status: "active",
        billing_cycle: "monthly",
        starts_at: "2026-06-01T00:00:00.000Z",
        ends_at: null,
        renews_at: "2026-07-01T00:00:00.000Z",
        cancelled_at: null,
        created_at: now,
        updated_at: now
      }
    ],
    subscription_plans: [
      {
        id: "plan-growth",
        slug: "growth",
        name: "MXVL Growth",
        description: "Built for teams scaling active hiring.",
        billing_type: "recurring",
        job_limit: 10,
        candidate_view_limit: 500,
        ai_credit_limit: 100,
        recruiter_limit: 3,
        monthly_price: 7500,
        one_time_price: null,
        access_days: null,
        is_active: true,
        display_order: 30,
        created_at: now,
        updated_at: now
      }
    ],
    employer_usage: [
      {
        id: "usage-1",
        employer_id: "employer-1",
        subscription_id: "sub-1",
        period_start: "2026-06-01T00:00:00.000Z",
        period_end: "2026-07-01T00:00:00.000Z",
        jobs_used: 2,
        candidate_views_used: 10,
        ai_credits_used: 99,
        recruiters_used: 1,
        created_at: now,
        updated_at: now
      }
    ],
    employers: [
      {
        id: "employer-1",
        email: "team@example.com",
        official_email: "team@example.com"
      }
    ],
    ...overrides
  };

  return {
    db,
    client: {
      from(table: TableName) {
        return new FakeSupabaseQuery(db, table);
      }
    }
  };
}

describe("SubscriptionService usage tracking", () => {
  it("records a job post by incrementing the current employer usage period", async () => {
    const { client, db } = createFakeSupabase();
    const service = new SubscriptionService(client as any);

    const result = await service.recordJobPost("employer-1");

    expect(result.recorded).toBe(true);
    expect(result.metric).toBe("jobs_posted");
    expect(result.usage?.jobsUsed).toBe(3);
    expect(db.employer_usage[0].jobs_used).toBe(3);
  });

  it("creates a usage row automatically when the subscription has no current usage period", async () => {
    const { client, db } = createFakeSupabase({ employer_usage: [] });
    const service = new SubscriptionService(client as any);

    const result = await service.recordCandidateView("employer-1", 2);

    expect(result.recorded).toBe(true);
    expect(result.metric).toBe("candidate_views");
    expect(result.usage?.candidateViewsUsed).toBe(2);
    expect(db.employer_usage).toHaveLength(1);
    expect(db.employer_usage[0]).toMatchObject({
      employer_id: "employer-1",
      subscription_id: "sub-1",
      candidate_views_used: 2
    });
  });

  it("does not consume AI credits when the requested amount exceeds remaining credits", async () => {
    const { client, db } = createFakeSupabase();
    const service = new SubscriptionService(client as any);

    const result = await service.consumeAiCredit("employer-1", 2);

    expect(result.recorded).toBe(false);
    expect(result.access.allowed).toBe(false);
    expect(result.access.remaining).toBe(1);
    expect(db.employer_usage[0].ai_credits_used).toBe(99);
  });
});

describe("SubscriptionService feature gates", () => {
  it("allows AI matching when credits remain", async () => {
    const { client } = createFakeSupabase();
    const service = new SubscriptionService(client as any);

    const result = await service.hasFeature("employer-1", "ai_matching");

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(1);
  });

  it("blocks resume search on Starter", async () => {
    const { client } = createFakeSupabase({
      subscription_plans: [
        {
          id: "plan-growth",
          slug: "starter",
          name: "MXVL Starter",
          description: "For occasional hiring.",
          billing_type: "recurring",
          job_limit: 3,
          candidate_view_limit: 50,
          ai_credit_limit: 0,
          recruiter_limit: 1,
          monthly_price: 2500,
          one_time_price: null,
          access_days: null,
          is_active: true,
          display_order: 20,
          created_at: "2026-06-11T00:00:00.000Z",
          updated_at: "2026-06-11T00:00:00.000Z"
        }
      ]
    });
    const service = new SubscriptionService(client as any);

    const result = await service.hasFeature("employer-1", "resume_search");

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("Resume search is not included in the current plan.");
  });

  it("allows talent pool and WhatsApp notifications on unlimited Enterprise plans", async () => {
    const { client } = createFakeSupabase({
      subscription_plans: [
        {
          id: "plan-growth",
          slug: "enterprise",
          name: "MXVL Enterprise",
          description: "Custom recruitment operating system for large teams.",
          billing_type: "custom",
          job_limit: null,
          candidate_view_limit: null,
          ai_credit_limit: null,
          recruiter_limit: null,
          monthly_price: null,
          one_time_price: null,
          access_days: null,
          is_active: true,
          display_order: 50,
          created_at: "2026-06-11T00:00:00.000Z",
          updated_at: "2026-06-11T00:00:00.000Z"
        }
      ]
    });
    const service = new SubscriptionService(client as any);

    const talentPool = await service.hasFeature("employer-1", "talent_pool");
    const whatsapp = await service.hasFeature("employer-1", "whatsapp_notifications");

    expect(talentPool.allowed).toBe(true);
    expect(talentPool.unlimited).toBe(true);
    expect(whatsapp.allowed).toBe(true);
    expect(whatsapp.unlimited).toBe(true);
  });

  it("treats Enterprise as unlimited even when a stale plan row contains finite limits", async () => {
    const { client, db } = createFakeSupabase({
      subscription_plans: [
        {
          id: "plan-growth",
          slug: "enterprise",
          name: "MXVL Enterprise",
          description: "Custom recruitment operating system for large teams.",
          billing_type: "custom",
          job_limit: 0,
          candidate_view_limit: 0,
          ai_credit_limit: 0,
          recruiter_limit: 0,
          monthly_price: null,
          one_time_price: null,
          access_days: null,
          is_active: true,
          display_order: 50,
          created_at: "2026-06-11T00:00:00.000Z",
          updated_at: "2026-06-11T00:00:00.000Z"
        }
      ],
      employer_usage: [
        {
          id: "usage-1",
          employer_id: "employer-1",
          subscription_id: "sub-1",
          period_start: "2026-06-01T00:00:00.000Z",
          period_end: "2026-07-01T00:00:00.000Z",
          jobs_used: 50,
          candidate_views_used: 200,
          ai_credits_used: 500,
          recruiters_used: 25,
          created_at: "2026-06-11T00:00:00.000Z",
          updated_at: "2026-06-11T00:00:00.000Z"
        }
      ]
    });
    const service = new SubscriptionService(client as any);

    const current = await service.getCurrentPlan("employer-1");
    const access = await service.canPostJob("employer-1");
    const tracking = await service.recordJobPost("employer-1");

    expect(current.plan?.jobLimit).toBeNull();
    expect(current.plan?.candidateViewLimit).toBeNull();
    expect(current.plan?.aiCreditLimit).toBeNull();
    expect(current.plan?.recruiterLimit).toBeNull();
    expect(access.allowed).toBe(true);
    expect(access.unlimited).toBe(true);
    expect(tracking.recorded).toBe(true);
    expect(db.employer_usage[0].jobs_used).toBe(51);
  });

  it("bypasses every subscription and usage limit for the MXVL employer admin account", async () => {
    const { client } = createFakeSupabase({
      employers: [{ id: "employer-admin", email: "employer.admin@mxventurelab.com" }],
      employer_subscriptions: [],
      employer_usage: []
    });
    const service = new SubscriptionService(client as any);

    const [jobs, candidates, ai, resumes, talentPool, whatsapp, recruiters, remaining, tracking] = await Promise.all([
      service.canPostJob("employer-admin"),
      service.canViewCandidate("employer-admin"),
      service.canUseAiMatching("employer-admin"),
      service.canSearchResume("employer-admin"),
      service.canAccessTalentPool("employer-admin"),
      service.hasFeature("employer-admin", "whatsapp_notifications"),
      service.canAddRecruiter("employer-admin"),
      service.getRemainingUsage("employer-admin"),
      service.consumeAiCredit("employer-admin", 500)
    ]);

    [jobs, candidates, ai, resumes, talentPool, whatsapp, recruiters].forEach((access) => {
      expect(access.allowed).toBe(true);
      expect(access.unlimited).toBe(true);
      expect(access.remaining).toBeNull();
    });
    expect(remaining.jobs.unlimited).toBe(true);
    expect(remaining.candidateViews.unlimited).toBe(true);
    expect(remaining.aiCredits.unlimited).toBe(true);
    expect(remaining.recruiters.unlimited).toBe(true);
    expect(tracking.recorded).toBe(true);
    expect(tracking.access.unlimited).toBe(true);
  });
});
