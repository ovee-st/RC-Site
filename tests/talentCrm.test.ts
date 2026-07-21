import { describe, expect, it } from "vitest";
import { calculateTalentCrmMetrics, extractOfferVariables, renderOfferTemplate, scoreRediscoveryCandidate, slugifyCareerPage } from "@/lib/talentCrm";

describe("Talent CRM domain", () => {
  it("creates stable career page slugs", () => {
    expect(slugifyCareerPage("  MXVL Global Hiring! ")).toBe("mxvl-global-hiring");
  });

  it("extracts and renders offer variables without removing unresolved values", () => {
    const title = "Offer for {{ candidate_name }}";
    const body = "Join {{company_name}} as {{job_title}} on {{joining_date}}.";
    expect(extractOfferVariables(title, body)).toEqual(["candidate_name", "company_name", "job_title", "joining_date"]);
    expect(renderOfferTemplate(body, { company_name: "MXVL", job_title: "Engineer" })).toBe("Join MXVL as Engineer on {{joining_date}}.");
  });

  it("ranks rediscovery results with explainable evidence", () => {
    const result = scoreRediscoveryCandidate({ query: "Java developer interviewed last year", name: "Samira", title: "Java Developer", skills: ["Java", "Spring"], latestStage: "Interview", latestApplicationAt: new Date().toISOString() });
    expect(result.score).toBeGreaterThanOrEqual(40);
    expect(result.reasons).toContain("Title and profile match");
    expect(result.reasons).toContain("Active within the last year");
  });

  it("uses semantic scores when an embedding provider is available", () => {
    expect(scoreRediscoveryCandidate({ query: "payroll specialist", name: "Nadia", semanticScore: 0.87 }).score).toBe(87);
  });

  it("calculates CRM conversion metrics without divide-by-zero errors", () => {
    const now = new Date("2026-07-21T12:00:00Z");
    const metrics = calculateTalentCrmMetrics({ pools: [{}, { is_archived: true }], members: [{ created_at: "2026-07-10T00:00:00Z" }], referrals: [{ status: "hired" }, { status: "reviewing" }], events: [{ event_type: "view" }, { event_type: "view" }, { event_type: "application_completed" }], messages: [{ status: "sent" }, { status: "draft" }], sources: [{ source: "Referral", hired: true }, { source: "Referral", hired: false }], now });
    expect(metrics.activePools).toBe(1);
    expect(metrics.poolGrowth).toBe(1);
    expect(metrics.referralConversion).toBe(50);
    expect(metrics.applicationConversion).toBe(50);
    expect(metrics.sourceQuality[0]).toEqual({ source: "Referral", candidates: 2, hires: 1, conversion: 50 });
  });
});
