import { describe, expect, it } from "vitest";
import {
  calculateCouponDiscount,
  normalizeCouponCode,
  validateExistingCoupon,
  type ExistingCoupon
} from "@/lib/manualSubscriptionPayments";

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
});
