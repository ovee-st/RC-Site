import { describe, expect, it } from "vitest";
import { calculateTalentCrmMetrics, extractOfferVariables, renderOfferTemplate, scoreRediscoveryCandidate, slugifyCareerPage } from "@/lib/talentCrm";
import { parseCrmSchemaDiagnostic, TALENT_CRM_SCHEMA_REQUIREMENTS } from "@/lib/crm/schema";

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

  it("reports the exact missing CRM table instead of a generic migration warning", () => {
    expect(parseCrmSchemaDiagnostic({ message: "Could not find the table 'public.talent_pool_members' in the schema cache" })).toEqual({
      type: "table",
      object: "talent_pool_members",
      table: "talent_pool_members",
      message: "Missing table: talent_pool_members"
    });
  });

  it("reports the exact missing column", () => {
    expect(parseCrmSchemaDiagnostic({ message: "column candidates.avatar does not exist" })).toEqual({
      type: "column",
      object: "candidates.avatar",
      table: "candidates",
      message: "Missing column: candidates.avatar"
    });
  });

  it("defines health checks for every Talent CRM persistence area", () => {
    const tables = new Set(TALENT_CRM_SCHEMA_REQUIREMENTS.map((requirement) => requirement.table));
    for (const table of ["talent_pools", "talent_pool_members", "employer_contacts", "employee_referrals", "career_pages", "career_page_events", "offer_templates", "talent_messages", "candidate_portal_documents"]) {
      expect(tables.has(table), table).toBe(true);
    }
  });
});
