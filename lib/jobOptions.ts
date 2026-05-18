export const employmentTypeOptions = ["Full Time", "Part Time", "Intern"] as const;

export const workLocationOptions = ["Remote", "Hybrid", "On-site"] as const;

export const bangladeshDivisionOptions = [
  "Dhaka",
  "Chattogram",
  "Rajshahi",
  "Khulna",
  "Barishal",
  "Sylhet",
  "Rangpur",
  "Mymensingh"
] as const;

export const jobLocationOptions = [
  ...workLocationOptions,
  ...bangladeshDivisionOptions
] as const;

export const experienceFilterOptions = ["Intern", "Fresher", "Mid Level", "Senior Level"] as const;
