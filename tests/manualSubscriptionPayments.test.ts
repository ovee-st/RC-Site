import { describe, expect, it } from "vitest";
import {
  buildPlanFromSelectedPlan,
  calculatePaymentBreakdown,
  calculateCouponDiscount,
  createZeroAmountTransactionId,
  getActivePlan,
  isZeroAmountPayment,
  normalizeManualBillingCycle,
  normalizeCouponCode,
  validateExistingCoupon,
  type ExistingCoupon
} from "@/lib/manualSubscriptionPayments";

type Row = Record<string, any>;

class FakeQuery {
  private filters: Array<(row: Row) => boolean> = [];
  private selectedColumns = "*";

  constructor(
    private readonly rows: Row[],
    private readonly options: { failOptionalCouponColumns?: boolean } = {}
  ) {}

  select(columns = "*") {
    this.selectedColumns = columns;
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push((row) => row[column] === value);
    return this;
  }

  maybeSingle() {
    if (this.options.failOptionalCouponColumns && this.selectedColumns === "discount_type,discount_amount") {
      return Promise.resolve({
        data: null,
        error: { message: "column coupons.discount_type does not exist" }
      });
    }

    return Promise.resolve({
      data: this.rows.find((row) => this.filters.every((filter) => filter(row))) ?? null,
      error: null
    });
  }

  then<TResult1 = { data: Row[]; error: null }, TResult2 = never>(
    onfulfilled?: ((value: { data: Row[]; error: null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ) {
    return Promise.resolve({
      data: this.rows.filter((row) => this.filters.every((filter) => filter(row))),
      error: null
    }).then(onfulfilled, onrejected);
  }
}

function createClient(tables: Record<string, Row[]>, options: { failOptionalCouponColumns?: boolean } = {}) {
  return {
    from(table: string) {
      return new FakeQuery(tables[table] || [], table === "coupons" ? options : {});
    }
  };
}

const growthPlan = {
  id: "11111111-1111-4111-8111-111111111111",
  slug: "growth",
  name: "MXVL Growth",
  billing_type: "recurring",
  monthly_price: 7500,
  one_time_price: null,
  access_days: null,
  is_active: true
};

const elitePlan = {
  id: "22222222-2222-4222-8222-222222222222",
  slug: "mxvl-elite",
  name: "MXVL Elite",
  billing_type: "recurring",
  monthly_price: 15000,
  one_time_price: null,
  access_days: null,
  is_active: true
};

const validCoupon: ExistingCoupon = {
  id: "coupon-1",
  coupon_name: "Welcome Offer",
  code: "WELCOME20",
  discount_percentage: 20,
  active: true,
  usage_limit: 100,
  used_count: 4,
  expires_at: "2026-12-31T00:00:00.000Z"
};

describe("manual subscription coupon wiring", () => {
  it("normalizes coupon codes to the existing admin coupon format", () => {
    expect(normalizeCouponCode(" welcome20 ")).toBe("WELCOME20");
    expect(normalizeCouponCode("")).toBe("");
    expect(normalizeCouponCode(null)).toBe("");
  });

  it("accepts only monthly and one-time billing cycles", () => {
    expect(normalizeManualBillingCycle(undefined)).toBe("monthly");
    expect(normalizeManualBillingCycle("monthly")).toBe("monthly");
    expect(normalizeManualBillingCycle("one_time")).toBe("one_time");
    expect(() => normalizeManualBillingCycle("yearly")).toThrow("Unsupported billing cycle.");
  });

  it("accepts active coupons that have not expired or reached their usage limit", () => {
    expect(validateExistingCoupon(validCoupon, new Date("2026-06-11T00:00:00.000Z"))).toEqual(validCoupon);
  });

  it("rejects inactive, expired, and exhausted coupons", () => {
    expect(() => validateExistingCoupon({ ...validCoupon, active: false })).toThrow("Coupon code is not active.");
    expect(() => validateExistingCoupon({ ...validCoupon, expires_at: "2026-01-01T00:00:00.000Z" }, new Date("2026-06-11T00:00:00.000Z"))).toThrow("Coupon code has expired.");
    expect(() => validateExistingCoupon({ ...validCoupon, usage_limit: 4, used_count: 4 })).toThrow("Coupon usage limit has been reached.");
  });

  it("calculates discounts from the existing percentage coupon field", () => {
    expect(calculateCouponDiscount(7500, validCoupon)).toBe(1500);
    expect(calculateCouponDiscount(99, { ...validCoupon, discount_percentage: 50 })).toBe(50);
    expect(calculateCouponDiscount(1000, { ...validCoupon, discount_percentage: 100 })).toBe(1000);
  });

  it("detects zero-amount coupon payments and creates valid internal references", () => {
    expect(isZeroAmountPayment(0)).toBe(true);
    expect(isZeroAmountPayment(-1)).toBe(true);
    expect(isZeroAmountPayment(1)).toBe(false);
    expect(createZeroAmountTransactionId()).toMatch(/^FREE[A-Z0-9]{2,28}$/);
  });

  it("looks up pricing plans by slug without querying the uuid id column first", async () => {
    const client = createClient({ subscription_plans: [growthPlan] });

    const plan = await getActivePlan(client as any, "growth");

    expect(plan.id).toBe(growthPlan.id);
    expect(plan.monthly_price).toBe(7500);
  });

  it("keeps selected MXVL plan aliases attached during lookup", async () => {
    const client = createClient({ subscription_plans: [elitePlan] });

    const plan = await getActivePlan(client as any, "elite");

    expect(plan.id).toBe(elitePlan.id);
    expect(plan.name).toBe("MXVL Elite");
  });

  it("builds a coupon calculation fallback from the selected employer plan payload", () => {
    const plan = buildPlanFromSelectedPlan({
      id: "elite",
      name: "MXVL Elite",
      billingType: "recurring",
      monthlyPrice: 15000
    }, "elite");

    expect(plan).toEqual({
      id: "elite",
      slug: "elite",
      name: "MXVL Elite",
      billing_type: "recurring",
      monthly_price: 15000,
      one_time_price: null,
      access_days: null
    });
  });

  it("calculates a 10% coupon from database pricing", async () => {
    const client = createClient({
      subscription_plans: [growthPlan],
      coupons: [{ ...validCoupon, code: "TENOFF", discount_percentage: 10 }]
    });

    const breakdown = await calculatePaymentBreakdown(client as any, growthPlan as any, "tenoff", "monthly");

    expect(breakdown.originalAmount).toBe(7500);
    expect(breakdown.discountAmount).toBe(750);
    expect(breakdown.finalAmount).toBe(6750);
    expect(breakdown.coupon?.code).toBe("TENOFF");
  });

  it("resolves existing coupon rows regardless of stored casing", async () => {
    const client = createClient({
      subscription_plans: [growthPlan],
      coupons: [{ ...validCoupon, code: " mxvlFull ", discount_percentage: 100 }]
    });

    const breakdown = await calculatePaymentBreakdown(client as any, growthPlan as any, "MXVLFULL", "monthly");

    expect(breakdown.originalAmount).toBe(7500);
    expect(breakdown.discountAmount).toBe(7500);
    expect(breakdown.finalAmount).toBe(0);
    expect(breakdown.coupon?.code).toBe("mxvlFull");
  });

  it("keeps percentage coupons working when optional coupon columns are not deployed", async () => {
    const client = createClient({
      subscription_plans: [growthPlan],
      coupons: [{ ...validCoupon, code: "MXVLFULL", discount_percentage: 100 }]
    }, { failOptionalCouponColumns: true });

    const breakdown = await calculatePaymentBreakdown(client as any, growthPlan as any, "MXVLFULL", "monthly");

    expect(breakdown.originalAmount).toBe(7500);
    expect(breakdown.discountAmount).toBe(7500);
    expect(breakdown.finalAmount).toBe(0);
    expect(breakdown.coupon?.discountType).toBe("percentage");
  });

  it("normalizes existing coupon rows with alternate admin field names", async () => {
    const client = createClient({
      subscription_plans: [elitePlan],
      coupons: [{
        id: "coupon-alt",
        name: "Full Discount",
        code: " mxvlFull ",
        value: 100,
        is_active: true,
        usage_limit: null,
        used_count: null,
        expires_at: null
      }]
    });

    const breakdown = await calculatePaymentBreakdown(client as any, elitePlan as any, "MXVLFULL", "monthly");

    expect(breakdown.originalAmount).toBe(15000);
    expect(breakdown.discountAmount).toBe(15000);
    expect(breakdown.finalAmount).toBe(0);
    expect(breakdown.coupon?.code).toBe("mxvlFull");
  });

  it("calculates a fixed amount coupon when configured on the coupon row", async () => {
    const client = createClient({
      subscription_plans: [growthPlan],
      coupons: [{
        ...validCoupon,
        code: "FIXED500",
        discount_type: "fixed",
        discount_amount: 500
      }]
    });

    const breakdown = await calculatePaymentBreakdown(client as any, growthPlan as any, "fixed500", "monthly");

    expect(breakdown.originalAmount).toBe(7500);
    expect(breakdown.discountAmount).toBe(500);
    expect(breakdown.finalAmount).toBe(7000);
    expect(breakdown.coupon?.discountType).toBe("fixed");
  });

  it("uses the legacy percentage value when a fixed coupon has no discount_amount", async () => {
    const client = createClient({
      subscription_plans: [growthPlan],
      coupons: [{
        ...validCoupon,
        code: "FIXEDLEGACY",
        discount_type: "fixed",
        discount_percentage: 100,
        discount_amount: null
      }]
    });

    const breakdown = await calculatePaymentBreakdown(client as any, growthPlan as any, "fixedlegacy", "monthly");

    expect(breakdown.originalAmount).toBe(7500);
    expect(breakdown.discountAmount).toBe(100);
    expect(breakdown.finalAmount).toBe(7400);
    expect(breakdown.coupon?.discountType).toBe("fixed");
  });

  it("rejects expired, inactive, and usage-limit reached coupons during calculation", async () => {
    const missingClient = createClient({ coupons: [] });
    const expiredClient = createClient({ coupons: [{ ...validCoupon, code: "EXPIRED", expires_at: "2026-01-01T00:00:00.000Z" }] });
    const inactiveClient = createClient({ coupons: [{ ...validCoupon, code: "INACTIVE", active: false }] });
    const exhaustedClient = createClient({ coupons: [{ ...validCoupon, code: "USEDUP", usage_limit: 4, used_count: 4 }] });

    await expect(calculatePaymentBreakdown(missingClient as any, growthPlan as any, "missing", "monthly")).rejects.toThrow("Coupon code was not found.");
    await expect(calculatePaymentBreakdown(expiredClient as any, growthPlan as any, "expired", "monthly")).rejects.toThrow("Coupon code has expired.");
    await expect(calculatePaymentBreakdown(inactiveClient as any, growthPlan as any, "inactive", "monthly")).rejects.toThrow("Coupon code is not active.");
    await expect(calculatePaymentBreakdown(exhaustedClient as any, growthPlan as any, "usedup", "monthly")).rejects.toThrow("Coupon usage limit has been reached.");
  });
});
