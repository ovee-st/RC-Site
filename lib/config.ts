export type ConfigStatus = { valid: boolean; missing: string[]; warnings: string[] };
export type Environment = Record<string, string | undefined>;

const REQUIRED_SERVER = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"] as const;
const SERVICE_KEY_ALIASES = ["SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SERVICE_KEY", "SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE"] as const;

export function validateEnvironment(env: Environment = process.env): ConfigStatus {
  const missing: string[] = REQUIRED_SERVER.filter((key) => !env[key]);
  if (!SERVICE_KEY_ALIASES.some((key) => env[key])) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  const warnings: string[] = [];
  if (!env.OPENAI_API_KEY) warnings.push("OPENAI_API_KEY is not configured; deterministic AI fallbacks will be used.");
  if (!env.NEXT_PUBLIC_GA_MEASUREMENT_ID) warnings.push("NEXT_PUBLIC_GA_MEASUREMENT_ID is not configured; browser analytics is disabled.");
  if (!env.GA4_API_SECRET) warnings.push("GA4_API_SECRET is not configured; first-party analytics forwarding is disabled.");
  return { valid: missing.length === 0, missing: Array.from(new Set(missing)), warnings };
}

export function assertServerEnvironment(env: Environment = process.env) {
  const result = validateEnvironment(env);
  if (!result.valid) throw new Error(`Missing required server configuration: ${result.missing.join(", ")}`);
  return result;
}
