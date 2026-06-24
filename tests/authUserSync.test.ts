import { describe, expect, it } from "vitest";
import { employerRoleInsertPayload } from "@/lib/authUserSync";

describe("employer role record compatibility", () => {
  it("supplies every legacy required field when an employer only has a profile row", () => {
    const payload = employerRoleInsertPayload({
      id: "user-abdur",
      email: "abdur@example.com",
      full_name: "Abdur Rahman Ovi",
      role: "employer"
    });

    expect(payload).toMatchObject({
      id: "user-abdur",
      user_id: "user-abdur",
      company_name: "Abdur Rahman Ovi",
      contact_person: "Abdur Rahman Ovi",
      email: "abdur@example.com",
      official_email: "abdur@example.com",
      contact_number: "Not provided",
      monthly_needed_hiring: 0,
      plan_interest: "No subscription",
      talent_categories_role_requirements: "Not provided"
    });
  });
});
