import { describe, expect, it } from "vitest";
import { buildJobSlug, getJobIdFromSlug, slugifyJobTitle } from "@/lib/jobSeo";

const jobId = "48f2956f-ff66-4da9-b3f1-bbc7d610e6aa";

describe("job SEO slugs", () => {
  it("creates readable, stable slugs with the job UUID", () => {
    expect(buildJobSlug("Senior React & TypeScript Engineer", jobId)).toBe(
      `senior-react-and-typescript-engineer-${jobId}`
    );
  });

  it("extracts the job UUID from a canonical slug", () => {
    expect(getJobIdFromSlug(`growth-marketing-lead-${jobId}`)).toBe(jobId);
  });

  it("rejects slugs without a valid UUID", () => {
    expect(getJobIdFromSlug("growth-marketing-lead")).toBeNull();
  });

  it("normalizes punctuation and empty titles", () => {
    expect(slugifyJobTitle("  UI/UX Designer (Remote)  ")).toBe("ui-ux-designer-remote");
    expect(slugifyJobTitle("---")).toBe("job");
  });
});
