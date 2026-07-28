import { describe, expect, it } from "vitest";
import {
  ADOPTION_EXPERIENCES,
  calculateChecklistProgress,
  getAdoptionStorageKey,
  normalizeAdoptionRole
} from "@/lib/adoption";

describe("beta adoption configuration", () => {
  it("normalizes product roles into onboarding experiences", () => {
    expect(normalizeAdoptionRole("candidate")).toBe("candidate");
    expect(normalizeAdoptionRole("employer")).toBe("employer");
    expect(normalizeAdoptionRole("admin")).toBe("admin");
    expect(normalizeAdoptionRole("support_manager")).toBe("support");
    expect(normalizeAdoptionRole("viewer")).toBeNull();
  });

  it("provides complete role-specific tours and checklists", () => {
    Object.values(ADOPTION_EXPERIENCES).forEach((experience) => {
      expect(experience.tour).toHaveLength(4);
      expect(experience.checklist).toHaveLength(4);
      expect(experience.tour.every((step) => step.href.startsWith("/"))).toBe(true);
      expect(experience.checklist.every((item) => item.href.startsWith("/"))).toBe(true);
    });
  });

  it("calculates checklist progress from completed actions", () => {
    const checklist = ADOPTION_EXPERIENCES.candidate.checklist;
    expect(calculateChecklistProgress(checklist, [])).toEqual({ completed: 0, total: 4, percentage: 0 });
    expect(calculateChecklistProgress(checklist, ["candidate_profile_completed", "candidate_resume_uploaded"])).toEqual({
      completed: 2,
      total: 4,
      percentage: 50
    });
  });

  it("scopes persistence by user and role", () => {
    expect(getAdoptionStorageKey("user-1", "candidate")).not.toBe(getAdoptionStorageKey("user-1", "employer"));
    expect(getAdoptionStorageKey("user-1", "candidate")).not.toBe(getAdoptionStorageKey("user-2", "candidate"));
  });
});
