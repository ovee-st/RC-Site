export type PasswordRequirement = {
  id: "length" | "uppercase" | "lowercase" | "number" | "special";
  label: string;
  met: boolean;
};

export type PasswordStrength = "Very Weak" | "Weak" | "Fair" | "Good" | "Strong";

const SPECIAL_CHARACTER = /[^A-Za-z0-9]/;

export function getPasswordRequirements(password: string): PasswordRequirement[] {
  return [
    { id: "length", label: "At least 8 characters", met: password.length >= 8 },
    { id: "uppercase", label: "One uppercase letter", met: /[A-Z]/.test(password) },
    { id: "lowercase", label: "One lowercase letter", met: /[a-z]/.test(password) },
    { id: "number", label: "One number", met: /\d/.test(password) },
    { id: "special", label: "One special character", met: SPECIAL_CHARACTER.test(password) }
  ];
}

export function getPasswordStrength(password: string) {
  const requirements = getPasswordRequirements(password);
  const score = requirements.filter((requirement) => requirement.met).length;
  const labels: PasswordStrength[] = ["Very Weak", "Weak", "Fair", "Good", "Good", "Strong"];

  return {
    requirements,
    score,
    label: labels[score],
    progress: score * 20,
    isValid: score === requirements.length
  };
}
