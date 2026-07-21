import type { ExtractedJobFields, GeneratedJobFields } from "@/lib/import/types";

export type JobImporterDraft = {
  extracted: Record<keyof ExtractedJobFields, string>;
  generated: Record<keyof GeneratedJobFields, string>;
};
