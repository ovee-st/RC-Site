import { describe, expect, it } from "vitest";
import {
  generateBreadcrumbSchema,
  generateFaqSchema,
  generateOrganizationSchema,
  generateServiceSchema,
  generateWebsiteSchema,
  serializeJsonLd
} from "@/lib/schema";
import { buildGeneratedJobFields, generateJobContent, generateJobSeo, preferCustomSeo } from "@/lib/seoGenerator";
import { defaultRelatedJobRanker } from "@/lib/relatedJobs";

const jobInput = {
  title: "Senior Finance Analyst",
  company: "MX Finance",
  location: "Dhaka",
  category: "Finance",
  employmentType: "Full Time",
  experience: "Senior",
  description: "Lead financial analysis, planning, and reporting for a growing team.",
  requirements: "Excel and financial modelling required. CPA preferred.",
  skills: ["Excel", "Financial Modelling", "Reporting"]
};

describe("enterprise schema generators", () => {
  it("creates global Organization and WebSite schemas", () => {
    const organization = generateOrganizationSchema({ name: "MXVL", url: "https://www.mxvlab.com", logo: "https://www.mxvlab.com/logo.png", description: "Recruitment", sameAs: [] });
    const website = generateWebsiteSchema({ name: "MXVL", url: "https://www.mxvlab.com", searchTarget: "https://www.mxvlab.com/jobs?search={search_term_string}" });
    expect(organization["@type"]).toBe("Organization");
    expect(organization.sameAs).toEqual([]);
    expect(website["@type"]).toBe("WebSite");
  });

  it("creates Service, FAQPage, and Breadcrumb schemas", () => {
    expect(generateServiceSchema({ name: "Hiring", description: "Managed hiring", url: "https://www.mxvlab.com/services", serviceType: "Recruitment", provider: { name: "MXVL", url: "https://www.mxvlab.com" }, audience: "Employers", areaServed: "Worldwide" })["@type"]).toBe("Service");
    expect(generateFaqSchema([{ question: "How?", answer: "Carefully." }])["@type"]).toBe("FAQPage");
    expect(generateBreadcrumbSchema([{ name: "Home", url: "https://www.mxvlab.com" }])["@type"]).toBe("BreadcrumbList");
  });

  it("escapes markup in serialized JSON-LD", () => {
    expect(serializeJsonLd({ value: "</script>" })).not.toContain("</script>");
  });
});

describe("AI SEO foundation", () => {
  it("generates bounded SEO fields and readable summaries", () => {
    const seo = generateJobSeo(jobInput);
    const content = generateJobContent(jobInput);
    expect(seo.title.length).toBeLessThanOrEqual(60);
    expect(seo.description.length).toBeLessThanOrEqual(157);
    expect(seo.keywords).toContain("Finance");
    expect(content.highlights.length).toBeGreaterThanOrEqual(3);
    expect(content.preferredSkillsSummary).toContain("CPA preferred");
  });

  it("stores generated fields separately and preserves custom values", () => {
    const fields = buildGeneratedJobFields(jobInput);
    expect(fields.seo_title_generated).toBeTruthy();
    expect(preferCustomSeo("Recruiter title", fields.seo_title_generated, "Fallback")).toBe("Recruiter title");
  });
});

describe("related job ranking", () => {
  it("ranks jobs using multiple relevance signals", () => {
    const source = { id: "1", company_name: "A", job_title: "Finance Analyst", job_location: "Dhaka", employment_type: "Full Time", job_type: "On-site", category: "Finance", experience_level: "Senior", job_level: "Senior", required_skills: "Excel, Reporting", required_skills_array: ["Excel", "Reporting"], description: "Financial reporting", requirements: "Excel" };
    const close = { ...source, id: "2", company_name: "B", job_title: "Senior Finance Analyst" };
    const distant = { ...source, id: "3", company_name: "C", job_title: "Warehouse Assistant", job_location: "Khulna", category: "Operations", experience_level: "Entry", required_skills: "Inventory", required_skills_array: ["Inventory"], description: "Warehouse work", requirements: "Inventory" };
    expect(defaultRelatedJobRanker.rank(source, [distant, close])[0].id).toBe("2");
  });
});
