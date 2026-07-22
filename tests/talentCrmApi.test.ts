import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { GET as health } from "@/app/api/talent-crm/health/route";
import { DELETE as deletePool, GET as getPools, PATCH as patchPool, POST as postPool } from "@/app/api/talent-pools/route";

describe("Talent CRM API", () => {
  it.each([
    ["GET", getPools],
    ["POST", postPool],
    ["PATCH", patchPool],
    ["DELETE", deletePool],
    ["HEALTH", health]
  ])("rejects unauthenticated %s requests", async (_, handler) => {
    const response = await handler(new Request("http://localhost/api/talent-pools"));
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Authentication is required." });
  });

  it("uses canonical candidate columns in pool and rediscovery queries", () => {
    const root = resolve(process.cwd());
    const pools = readFileSync(resolve(root, "app/api/talent-pools/route.ts"), "utf8");
    const rediscovery = readFileSync(resolve(root, "app/api/talent-rediscovery/route.ts"), "utf8");
    const analytics = readFileSync(resolve(root, "app/api/talent-analytics/route.ts"), "utf8");

    expect(pools).toContain('select("id,full_name,name,target_role,photo_url")');
    expect(rediscovery).toContain('select("id,user_id,full_name,name,target_role,skills,skills_array,experience,about")');
    expect(pools).not.toMatch(/candidates"\)\.select\([^\n]*(?:title|avatar)/);
    expect(rediscovery).not.toMatch(/candidates"\)\.select\([^\n]*title/);
    expect(analytics).toContain('rpc("crm_talent_metrics"');
    expect(analytics).toContain("loadCompatibilityMetrics");
    expect(analytics).not.toMatch(/applications"\)\.select\([^\n]*source/);
  });

  it("paginates CRM list endpoints and exposes pool deletion", () => {
    const root = resolve(process.cwd());
    for (const file of ["app/api/talent-pools/route.ts", "app/api/employer-contacts/route.ts", "app/api/referrals/route.ts", "app/api/offer-templates/route.ts", "app/api/talent-messages/route.ts"]) {
      expect(readFileSync(resolve(root, file), "utf8"), file).toContain(".range(");
    }
    expect(readFileSync(resolve(root, "app/api/talent-pools/route.ts"), "utf8")).toContain("export async function DELETE");
  });
});
