import { describe, expect, it } from "vitest";
import { buildCandidateDailyBrief, buildEmployerDailyBrief } from "@/lib/ai/dailyBrief";

describe("AI Daily Brief orchestration", () => {
  it("uses existing profile analysis and explains the candidate action", () => {
    const brief = buildCandidateDailyBrief({ title: "Analyst", skills: ["Excel"], profileCompletion: 55, resumeScore: 62 });
    expect(brief.primaryAction.label).toBe("Complete profile");
    expect(brief.primaryAction.reason).toContain("because");
    expect(brief.items.find((item) => item.id === "resume-health")?.value).toBe("62%");
  });

  it("prioritizes a verified scheduled interview", () => {
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString();
    const brief = buildCandidateDailyBrief(
      { title: "Analyst", about: "A".repeat(100), skills: ["Excel", "Reporting", "Communication", "Leadership"], experience: [{ role: "Analyst" }], education: [{ degree: "BSc" }], certifications: [{ name: "Excel" }], salary: { expected: "100" }, availability: { immediate: true }, profileCompletion: 90, resumeScore: 82 },
      { applications: [{ id: "a1", status: "Shortlisted" }], interviews: [{ id: "i1", status: "scheduled", scheduled_at: tomorrow }], documents: [{ id: "d1", document_type: "resume" }] }
    );
    expect(brief.primaryAction.label).toBe("Prepare for interview");
    expect(brief.items.some((item) => item.id === "next-interview")).toBe(true);
  });

  it("uses recruiter dashboard metrics without generating parallel AI results", () => {
    const brief = buildEmployerDailyBrief({ applicationsToday: 3, openInterviews: 1, pendingTasks: 2, activeOffers: 1, hiringVelocityDays: 8, averageTimeToHireDays: 8, aiRecommendationAcceptance: 60, pipelineFunnel: [{ stageId: "1", stage: "Applied", count: 5, conversion: 100 }], timeInStage: [], sourceQuality: [], recruiterWorkload: [] });
    expect(brief.primaryAction.label).toBe("Review hiring tasks");
    expect(brief.items.find((item) => item.id === "new-candidates")?.value).toBe("3");
    expect(brief.progress.find((item) => item.label === "AI recommendation response")?.value).toBe(60);
  });
});
