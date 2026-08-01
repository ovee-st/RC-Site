import { describe, expect, it } from "vitest";
import { getSmartEngagement } from "@/lib/communications/smartEngagement";

describe("smart engagement guidance", () => {
  it("recommends interview preparation for candidates", () => {
    const result = getSmartEngagement({ role: "candidate", category: "interview", title: "Interview invitation" });
    expect(result.signal).toBe("Recommendation");
    expect(result.recommendedAction).toEqual({ label: "Prepare for interview", href: "/candidate/interview-prep" });
    expect(result.whyItMatters).toContain("Preparation");
  });

  it("prioritizes active offers", () => {
    const result = getSmartEngagement({ role: "candidate", category: "offer", title: "Offer received", status: "sent" });
    expect(result.priority).toBe("urgent");
    expect(result.recommendedAction.href).toBe("/candidate/portal");
  });

  it("labels AI candidate matching as an estimate", () => {
    const result = getSmartEngagement({ role: "employer", category: "ai recommendation", title: "Top AI candidate match" });
    expect(result.signal).toBe("Estimate");
    expect(result.recommendedAction.label).toBe("Review candidates");
  });

  it("routes employer task bottlenecks to the existing pipeline", () => {
    const result = getSmartEngagement({ role: "employer", category: "pipeline bottleneck", title: "Follow-up overdue" });
    expect(result.priority).toBe("urgent");
    expect(result.recommendedAction.href).toBe("/employer#pipeline");
  });
});
