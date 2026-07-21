import { expect, test } from "@playwright/test";

test("public hiring journey is reachable", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("body")).toBeVisible();
  await page.goto("/jobs");
  await expect(page).toHaveURL(/\/jobs/);
  await expect(page.getByRole("main")).toContainText(/job/i);
});

test("login preserves candidate and employer entry points", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("button", { name: "Candidate", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Employer", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /google/i })).toBeVisible();
});

test("health endpoint returns a structured report", async ({ request }) => {
  const response = await request.get("/api/health");
  expect([200, 503]).toContain(response.status());
  const body = await response.json();
  expect(body).toMatchObject({ status: expect.any(String), checks: expect.any(Object), correlationId: expect.any(String) });
});

test.describe("authenticated hiring lifecycle", () => {
  test.skip(!process.env.E2E_EMPLOYER_EMAIL || !process.env.E2E_EMPLOYER_PASSWORD, "Dedicated E2E employer credentials are required.");

  test("employer can enter the job import and ATS workspaces", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /employer/i }).click();
    await page.getByLabel(/email/i).fill(process.env.E2E_EMPLOYER_EMAIL!);
    await page.getByLabel(/password/i).fill(process.env.E2E_EMPLOYER_PASSWORD!);
    await page.getByRole("button", { name: /login/i }).click();
    await page.goto("/dashboard/employer/jobs/import");
    await expect(page.locator("body")).toContainText(/import/i);
    await page.goto("/employer/talent-crm");
    await expect(page.getByRole("heading", { name: /talent crm/i })).toBeVisible();
  });
});
