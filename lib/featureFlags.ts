export const FEATURE_FLAGS = ["talentCrm", "careerPages", "aiRecruiter", "workflowAutomation", "candidatePortal", "semanticRediscovery"] as const;
export type FeatureFlag = (typeof FEATURE_FLAGS)[number];
type FeatureEnvironment = Record<string, string | undefined>;

const DEFAULTS: Record<FeatureFlag, boolean> = { talentCrm: true, careerPages: true, aiRecruiter: true, workflowAutomation: true, candidatePortal: true, semanticRediscovery: false };

export function isFeatureEnabled(flag: FeatureFlag, env: FeatureEnvironment = process.env) {
  const key = `FEATURE_${flag.replace(/([a-z])([A-Z])/g, "$1_$2").toUpperCase()}`;
  const value = env[key];
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  return DEFAULTS[flag];
}

export function getFeatureFlags(env: FeatureEnvironment = process.env) {
  return Object.fromEntries(FEATURE_FLAGS.map((flag) => [flag, isFeatureEnabled(flag, env)])) as Record<FeatureFlag, boolean>;
}
