import { assertServerEnvironment } from "@/lib/config";
import { logger } from "@/lib/observability/logger";

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  try { const result = assertServerEnvironment(); for (const warning of result.warnings) logger.warn("startup_configuration_warning", { warning }); logger.info("startup_configuration_valid"); }
  catch (error) { logger.error("startup_configuration_invalid", { error }); if (process.env.NODE_ENV === "production") throw error; }
}
