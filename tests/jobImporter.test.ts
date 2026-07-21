import { afterEach, describe, expect, it } from "vitest";
import { findDuplicateJobs, textSimilarity } from "@/lib/import/duplicateChecker";
import { extractReadableContent } from "@/lib/import/extractContent";
import { validateImportUrl } from "@/lib/import/fetchPage";
import { createDeterministicEnrichment } from "@/lib/import/jobEnricher";
import { extractAndEnrichJob, extractJobFieldsDeterministically } from "@/lib/import/jobExtractor";
import type { ExtractedJobFields } from "@/lib/import/types";

const originalApiKey = process.env.OPENAI_API_KEY;

afterEach(() => {
  if (originalApiKey === undefined) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = originalApiKey;
});

describe("job import URL validation", () => {
  it("accepts public HTTP and HTTPS URLs", () => {
    expect(validateImportUrl("https://jobs.example.com/openings/engineer#apply").toString()).toBe("https://jobs.example.com/openings/engineer");
    expect(validateImportUrl("http://example.com/job").protocol).toBe("http:");
  });

  it.each([
    "ftp://example.com/job",
    "http://localhost/job",
    "http://127.0.0.1/job",
    "http://10.0.0.2/job",
    "http://192.168.1.4/job",
    "http://[::1]/job",
    "https://jobs.internal/role",
    "https://user:password@example.com/job",
    "https://example.com:8080/job"
  ])("rejects unsafe URL %s", (url) => {
    expect(() => validateImportUrl(url)).toThrow();
  });
});

describe("job content extraction", () => {
  it("removes navigation, scripts, styles, and cookie prompts", () => {
    const html = `
      <html><head><style>.hidden{display:none}</style><script>alert(1)</script></head>
      <body><header>Global navigation</header><nav>Jobs menu</nav>
      <main><h1>Software Engineer</h1><p>Company: MX Venture Lab</p><p>Location: Dhaka</p>
      <h2>Responsibilities</h2><ul><li>Build reliable applications</li></ul></main>
      <div class="cookie-banner">Accept all cookies</div><footer>Footer links</footer></body></html>`;
    const content = extractReadableContent(html);
    expect(content).toContain("Software Engineer");
    expect(content).toContain("Build reliable applications");
    expect(content).not.toContain("Global navigation");
    expect(content).not.toContain("alert(1)");
    expect(content).not.toContain("Accept all cookies");
  });

  it("uses valid JobPosting JSON-LD as structured source content", () => {
    const html = `<script type="application/ld+json">${JSON.stringify({
      "@context": "https://schema.org",
      "@type": "JobPosting",
      title: "Finance Manager",
      hiringOrganization: { "@type": "Organization", name: "Example Ltd" },
      jobLocation: { address: { addressLocality: "Chattogram" } }
    })}</script>`;
    const content = extractReadableContent(html);
    expect(content).toContain("Job Title: Finance Manager");
    expect(content).toContain("Company: Example Ltd");
    expect(content).toContain("Location: Chattogram");
  });
});

describe("structured job parsing and fallback", () => {
  const text = `Job Title: Senior Accountant
Company: Example Ltd
Location: Dhaka
Employment Type: Full Time
Salary: BDT 60,000 - 80,000
Experience: 5 years
Deadline: 2030-12-31
Skills: Excel, Financial Reporting, ERP
Responsibilities:
- Lead month-end reporting
- Review reconciliations
Requirements:
- Five years of accounting experience
Benefits:
- Health coverage`;

  it("extracts labelled job facts without inventing missing values", () => {
    const job = extractJobFieldsDeterministically(text);
    expect(job.title).toBe("Senior Accountant");
    expect(job.company).toBe("Example Ltd");
    expect(job.salaryMin).toBe(60000);
    expect(job.salaryMax).toBe(80000);
    expect(job.skills).toEqual(["Excel", "Financial Reporting", "ERP"]);
    expect(job.education).toBeNull();
  });

  it("returns a deterministic preview when OpenAI is unavailable", async () => {
    delete process.env.OPENAI_API_KEY;
    const result = await extractAndEnrichJob(text);
    expect(result.aiEnabled).toBe(false);
    expect(result.extracted.title).toBe("Senior Accountant");
    expect(result.generated.seoTitle).toContain("Senior Accountant");
    expect(result.warning).toContain("structured fallback");
  });
});

describe("job duplicate detection", () => {
  const imported: ExtractedJobFields = {
    title: "Senior Accountant",
    company: "Example Ltd",
    location: "Dhaka",
    employmentType: "Full Time",
    salaryMin: null,
    salaryMax: null,
    salaryText: null,
    experience: "5 years",
    education: null,
    vacancies: null,
    deadline: null,
    responsibilities: "Lead month end reporting and review reconciliations",
    requirements: "Accounting experience and ERP knowledge",
    benefits: null,
    skills: ["Accounting", "ERP"],
    industry: "Finance",
    department: "Accounting/Finance",
    jobLevel: "Senior Level",
    workArrangement: "On-site",
    applicationMethod: null,
    keywords: []
  };

  it("ranks a matching company, title, location, and description as a duplicate", () => {
    const duplicates = findDuplicateJobs(imported, [{
      id: "job-1",
      title: "Senior Accountant",
      company: "Example Ltd",
      location: "Dhaka",
      description: "Lead month end reporting and review reconciliations",
      requirements: "Accounting experience and ERP knowledge"
    }]);
    expect(duplicates).toHaveLength(1);
    expect(duplicates[0].similarity).toBeGreaterThanOrEqual(0.82);
  });

  it("does not flag unrelated roles", () => {
    const duplicates = findDuplicateJobs(imported, [{
      id: "job-2",
      title: "Frontend Developer",
      company: "Another Company",
      location: "Remote",
      description: "Build React interfaces",
      requirements: "JavaScript and CSS"
    }]);
    expect(duplicates).toEqual([]);
    expect(textSimilarity("accounting ERP", "React CSS")).toBe(0);
  });

  it("keeps deterministic enrichment separate from extracted data", () => {
    const generated = createDeterministicEnrichment(imported);
    expect(generated.seoTitle).toBe("Senior Accountant at Example Ltd");
    expect(imported).not.toHaveProperty("seoTitle");
  });
});

