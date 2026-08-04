import { describe, expect, it } from "vitest";
import { getPasswordStrength } from "@/lib/passwordStrength";

describe("password strength", () => {
  it("reports every unmet requirement for an empty password", () => {
    const result = getPasswordStrength("");

    expect(result.label).toBe("Very Weak");
    expect(result.progress).toBe(0);
    expect(result.isValid).toBe(false);
    expect(result.requirements.every((requirement) => !requirement.met)).toBe(true);
  });

  it("scores requirements independently", () => {
    const result = getPasswordStrength("Mxvl2026");

    expect(result.score).toBe(4);
    expect(result.label).toBe("Good");
    expect(result.requirements.find((requirement) => requirement.id === "special")?.met).toBe(false);
  });

  it("accepts a password only when every requirement is met", () => {
    const result = getPasswordStrength("Mxvl@2026");

    expect(result.score).toBe(5);
    expect(result.label).toBe("Strong");
    expect(result.progress).toBe(100);
    expect(result.isValid).toBe(true);
  });
});
