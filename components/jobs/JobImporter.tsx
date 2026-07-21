"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, FileText, Globe2, Loader2, Save, Sparkles } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import PageContainer from "@/components/layout/PageContainer";
import RecruitingAssistant from "@/components/jobs/RecruitingAssistant";
import type { JobImporterDraft } from "@/components/jobs/jobImporterTypes";
import { useAuth } from "@/hooks/useAuth";
import { addHistoryVersion, type HistoryVersion } from "@/lib/ai/history";
import type { JobImprovementResult, RecruitingJobInput } from "@/lib/ai/recruitingTypes";
import { compactAuthHeaders } from "@/lib/compactAuthToken";
import type { ExtractedJobFields, GeneratedJobFields, JobImportSourceType, StructuredJobImportDto } from "@/lib/import/types";

type FieldOrigin = "extracted" | "generated" | "missing" | "edited";

function textValue(value: unknown) {
  if (Array.isArray(value)) return value.join(", ");
  if (value === null || value === undefined) return "";
  return String(value);
}

function createDraft(dto: StructuredJobImportDto): JobImporterDraft {
  return {
    extracted: Object.fromEntries(Object.entries(dto.extracted).map(([key, value]) => [key, textValue(value)])) as JobImporterDraft["extracted"],
    generated: Object.fromEntries(Object.entries(dto.generated).map(([key, value]) => [key, textValue(value)])) as JobImporterDraft["generated"]
  };
}

function splitList(value: string) {
  return Array.from(new Set(value.split(/,|\n|;/).map((item) => item.trim()).filter(Boolean)));
}

function appendSection(parts: string[], title: string, value: string) {
  if (value.trim()) parts.push(`${title}:\n${value.trim()}`);
}

function buildPublishPayload(draft: JobImporterDraft) {
  const extracted = draft.extracted;
  const generated = draft.generated;
  const descriptionParts: string[] = [];
  appendSection(descriptionParts, "Job Summary", generated.summary);
  appendSection(descriptionParts, "Responsibilities", extracted.responsibilities);
  appendSection(descriptionParts, "Benefits", extracted.benefits);
  appendSection(descriptionParts, "Application Method", extracted.applicationMethod);
  appendSection(descriptionParts, "Education", extracted.education);
  appendSection(descriptionParts, "Industry", extracted.industry || generated.suggestedIndustry);
  appendSection(descriptionParts, "Department", extracted.department || generated.suggestedCategory);
  appendSection(descriptionParts, "Vacancies", extracted.vacancies);

  const requirementParts: string[] = [];
  appendSection(requirementParts, "Requirements", extracted.requirements);
  appendSection(requirementParts, "Required Skills", generated.requiredSkills);
  appendSection(requirementParts, "Preferred Skills", generated.preferredSkills);

  return {
    title: extracted.title.trim(),
    company: extracted.company.trim() || "MX Partner Employer",
    location: extracted.location.trim() || generated.suggestedLocation.trim(),
    category: extracted.department.trim() || generated.suggestedCategory.trim() || "Others",
    experience: extracted.jobLevel.trim() || extracted.experience.trim() || "Any Level",
    experienceYears: extracted.experience.trim(),
    jobType: extracted.employmentType.trim() || "Full Time",
    workType: extracted.workArrangement.trim() || "On-site",
    salaryMin: Number(extracted.salaryMin.replace(/[^0-9.]/g, "")) || 0,
    salaryMax: Number(extracted.salaryMax.replace(/[^0-9.]/g, "")) || 0,
    hideSalary: !extracted.salaryMin.trim() && !extracted.salaryMax.trim(),
    deadline: extracted.deadline.trim(),
    skills: Array.from(new Set([...splitList(extracted.skills), ...splitList(generated.requiredSkills)])),
    description: descriptionParts.join("\n\n") || extracted.responsibilities.trim(),
    requirements: requirementParts.join("\n\n") || "Requirements will be shared during screening.",
    importerMetadata: {
      salaryText: extracted.salaryText,
      keywords: splitList(extracted.keywords),
      seoTitle: generated.seoTitle,
      metaDescription: generated.metaDescription,
      suggestedKeywords: splitList(generated.suggestedKeywords),
      shortRecruiterSummary: generated.shortRecruiterSummary
    }
  };
}

function slugify(value: string) { return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

function buildRecruitingInput(draft: JobImporterDraft): RecruitingJobInput {
  const { extracted, generated } = draft;
  return {
    title: extracted.title,
    company: extracted.company,
    location: extracted.location || generated.suggestedLocation,
    salary: extracted.salaryText || [extracted.salaryMin, extracted.salaryMax].filter(Boolean).join(" - "),
    employmentType: extracted.employmentType,
    experience: extracted.experience || extracted.jobLevel,
    education: extracted.education,
    responsibilities: extracted.responsibilities,
    requirements: extracted.requirements,
    skills: Array.from(new Set([...splitList(extracted.skills), ...splitList(generated.requiredSkills), ...splitList(generated.preferredSkills)])),
    benefits: extracted.benefits,
    deadline: extracted.deadline,
    seoTitle: generated.seoTitle,
    metaDescription: generated.metaDescription,
    keywords: Array.from(new Set([...splitList(extracted.keywords), ...splitList(generated.suggestedKeywords)])),
    slug: slugify(extracted.title),
    summary: generated.summary,
    category: extracted.department || generated.suggestedCategory,
    industry: extracted.industry || generated.suggestedIndustry,
    workArrangement: extracted.workArrangement,
    internalLinks: true,
    structuredData: true
  };
}

export default function JobImporter() {
  const router = useRouter();
  const { user, role, loading } = useAuth();
  const [sourceType, setSourceType] = useState<JobImportSourceType>("url");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [dto, setDto] = useState<StructuredJobImportDto | null>(null);
  const [draft, setDraft] = useState<JobImporterDraft | null>(null);
  const [history, setHistory] = useState<HistoryVersion<JobImporterDraft>[]>([]);
  const [edited, setEdited] = useState<Set<string>>(new Set());
  const [duplicateAction, setDuplicateAction] = useState<string>("new");
  const [importing, setImporting] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const canImport = sourceType === "url" ? Boolean(url.trim()) : text.trim().length >= 80;
  const missingRequired = useMemo(() => {
    if (!draft) return [];
    const payload = buildPublishPayload(draft);
    return [
      !payload.title && "Job title",
      !payload.location && "Location",
      !payload.description && "Responsibilities or summary",
      !payload.deadline && "Application deadline"
    ].filter((value): value is string => Boolean(value));
  }, [draft]);

  const importJob = async () => {
    setError("");
    setSuccess("");
    setImporting(true);
    try {
      const authHeaders = await compactAuthHeaders("job_import");
      const response = await fetch("/api/jobs/import", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ sourceType, ...(sourceType === "url" ? { url: url.trim() } : { text: text.trim() }) })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "The job could not be imported.");
      const imported = payload.job as StructuredJobImportDto;
      const importedDraft = createDraft(imported);
      setDto(imported);
      setDraft(importedDraft);
      setHistory(addHistoryVersion([], "Original Import", importedDraft));
      setEdited(new Set());
      setDuplicateAction("new");
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "The job could not be imported.");
    } finally {
      setImporting(false);
    }
  };

  const updateField = (section: keyof JobImporterDraft, key: string, value: string) => {
    setDraft((current) => {
      if (!current) return current;
      const next = { ...current, [section]: { ...current[section], [key]: value } };
      setHistory((versions) => addHistoryVersion(versions, "Recruiter Edited", next, `Edited ${key}`));
      return next;
    });
    setEdited((current) => new Set(current).add(`${section}.${key}`));
  };

  const fieldOrigin = (section: keyof JobImporterDraft, key: string): FieldOrigin => {
    if (!dto || !draft) return "missing";
    if (edited.has(`${section}.${key}`)) return "edited";
    const original = section === "extracted"
      ? dto.extracted[key as keyof ExtractedJobFields]
      : dto.generated[key as keyof GeneratedJobFields];
    if (Array.isArray(original) ? original.length : original !== null && original !== undefined && String(original).trim()) return section;
    return draft[section][key as never] ? section : "missing";
  };

  const applyImprovement = (result: JobImprovementResult) => {
    if (!draft) return false;
    const targets: Record<string, string[]> = {
      title: ["extracted.title"], description: ["generated.summary"], requirements: ["extracted.requirements"], responsibilities: ["extracted.responsibilities"], benefits: ["extracted.benefits"], skills: ["extracted.skills"], seo: ["generated.seoTitle", "generated.metaDescription", "generated.suggestedKeywords"], readability: ["generated.summary"], ats: ["generated.summary"]
    };
    if ((targets[result.action] || []).some((field) => edited.has(field)) && !window.confirm("This section contains recruiter edits. Replace it with the AI-assisted version?")) return false;
    const next: JobImporterDraft = { extracted: { ...draft.extracted }, generated: { ...draft.generated } };
    if (result.updates.title !== undefined) next.extracted.title = result.updates.title;
    if (result.updates.summary !== undefined) next.generated.summary = result.updates.summary;
    if (result.updates.requirements !== undefined) next.extracted.requirements = result.updates.requirements;
    if (result.updates.responsibilities !== undefined) next.extracted.responsibilities = result.updates.responsibilities;
    if (result.updates.benefits !== undefined) next.extracted.benefits = result.updates.benefits;
    if (result.updates.skills !== undefined) next.extracted.skills = result.updates.skills.join(", ");
    if (result.updates.seoTitle !== undefined) next.generated.seoTitle = result.updates.seoTitle;
    if (result.updates.metaDescription !== undefined) next.generated.metaDescription = result.updates.metaDescription;
    if (result.updates.keywords !== undefined) next.generated.suggestedKeywords = result.updates.keywords.join(", ");
    setDraft(next);
    setHistory((versions) => addHistoryVersion(versions, "AI Improved", next, `AI improved ${result.action}`));
    return true;
  };

  const restoreVersion = (version: HistoryVersion<JobImporterDraft>) => {
    const restored = JSON.parse(JSON.stringify(version.snapshot)) as JobImporterDraft;
    setDraft(restored);
    setHistory((versions) => addHistoryVersion(versions, "Recruiter Edited", restored, `Restored ${version.label}`));
  };

  const publishJob = async () => {
    if (!draft || missingRequired.length) return;
    setError("");
    setSuccess("");
    setPublishing(true);
    try {
      const authHeaders = await compactAuthHeaders("job_import_publish");
      const payload = buildPublishPayload(draft);
      const updating = duplicateAction !== "new";
      const response = await fetch(updating ? `/api/jobs/${duplicateAction}` : "/api/jobs", {
        method: updating ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || `Could not ${updating ? "update" : "publish"} the job.`);
      setSuccess(updating ? "Existing job updated successfully." : "Job published successfully.");
      window.setTimeout(() => router.push("/employer"), 900);
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : "The job could not be saved.");
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return <PageContainer><div className="flex min-h-64 items-center justify-center text-text-muted"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Loading importer...</div></PageContainer>;
  }

  if (!user || !new Set(["employer", "admin"]).has(String(role))) {
    return <PageContainer><div className="rounded-lg border border-danger/20 bg-danger/5 p-6 text-sm font-semibold text-danger">Only authenticated employers and administrators can import jobs.</div></PageContainer>;
  }

  return (
    <PageContainer className="max-w-6xl">
      <header className="mb-8">
        <Badge variant="primary">AI Job Importer</Badge>
        <h1 className="mt-3 text-3xl font-black text-text-main dark:text-white sm:text-4xl">Import a job into MXVL</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-text-muted dark:text-slate-300">Bring in a public job page or pasted description, review every field, then publish through the existing employer workflow.</p>
      </header>

      <section className="border-y border-border py-7 dark:border-white/10" aria-labelledby="import-source-heading">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <h2 id="import-source-heading" className="text-xl font-black text-text-main dark:text-white">Job source</h2>
          <div className="inline-flex rounded-md border border-border bg-surface p-1 dark:border-white/10 dark:bg-slate-900" role="tablist" aria-label="Import source">
            <button type="button" role="tab" aria-selected={sourceType === "url"} onClick={() => setSourceType("url")} className={`inline-flex items-center gap-2 rounded px-4 py-2 text-sm font-bold ${sourceType === "url" ? "bg-primary text-white" : "text-text-muted dark:text-slate-300"}`}><Globe2 className="h-4 w-4" />URL</button>
            <button type="button" role="tab" aria-selected={sourceType === "text"} onClick={() => setSourceType("text")} className={`inline-flex items-center gap-2 rounded px-4 py-2 text-sm font-bold ${sourceType === "text" ? "bg-primary text-white" : "text-text-muted dark:text-slate-300"}`}><FileText className="h-4 w-4" />Paste description</button>
          </div>
        </div>

        {sourceType === "url" ? (
          <Input type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://company.com/jobs/role" aria-label="Public job URL" />
        ) : (
          <textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="Paste the complete job description" aria-label="Job description" className="focus-ring min-h-52 w-full rounded-md border border-border bg-surface px-4 py-3 text-sm font-medium text-text-main shadow-soft dark:border-white/10 dark:bg-surface-dark dark:text-white" />
        )}

        <div className="mt-4 flex justify-end">
          <Button type="button" onClick={importJob} disabled={!canImport || importing}>
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {importing ? "Analyzing..." : "Generate Preview"}
          </Button>
        </div>
      </section>

      {error ? <div className="mt-6 flex items-start gap-3 rounded-lg border border-danger/20 bg-danger/5 p-4 text-sm font-semibold text-danger"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div> : null}
      {success ? <div className="mt-6 flex items-start gap-3 rounded-lg border border-success/20 bg-success/5 p-4 text-sm font-semibold text-success"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />{success}</div> : null}

      {dto && draft ? (
        <div className="mt-10 space-y-10">
          {dto.warnings.map((warning) => <div key={warning} className="rounded-lg border border-amber-300/50 bg-amber-50 p-4 text-sm font-semibold text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">{warning}</div>)}

          <EditorSection title="Extracted job details" description="Review the source facts. Missing fields remain blank until you complete them.">
            <div className="grid gap-5 md:grid-cols-2">
              <EditorField label="Title" value={draft.extracted.title} origin={fieldOrigin("extracted", "title")} onChange={(value) => updateField("extracted", "title", value)} />
              <EditorField label="Company" value={draft.extracted.company} origin={fieldOrigin("extracted", "company")} onChange={(value) => updateField("extracted", "company", value)} />
              <EditorField label="Location" value={draft.extracted.location} origin={fieldOrigin("extracted", "location")} onChange={(value) => updateField("extracted", "location", value)} />
              <EditorField label="Employment Type" value={draft.extracted.employmentType} origin={fieldOrigin("extracted", "employmentType")} onChange={(value) => updateField("extracted", "employmentType", value)} />
              <EditorField label="Salary Minimum" type="number" value={draft.extracted.salaryMin} origin={fieldOrigin("extracted", "salaryMin")} onChange={(value) => updateField("extracted", "salaryMin", value)} />
              <EditorField label="Salary Maximum" type="number" value={draft.extracted.salaryMax} origin={fieldOrigin("extracted", "salaryMax")} onChange={(value) => updateField("extracted", "salaryMax", value)} />
              <EditorField label="Salary Details" value={draft.extracted.salaryText} origin={fieldOrigin("extracted", "salaryText")} onChange={(value) => updateField("extracted", "salaryText", value)} />
              <EditorField label="Experience" value={draft.extracted.experience} origin={fieldOrigin("extracted", "experience")} onChange={(value) => updateField("extracted", "experience", value)} />
              <EditorField label="Education" value={draft.extracted.education} origin={fieldOrigin("extracted", "education")} onChange={(value) => updateField("extracted", "education", value)} />
              <EditorField label="Vacancies" type="number" value={draft.extracted.vacancies} origin={fieldOrigin("extracted", "vacancies")} onChange={(value) => updateField("extracted", "vacancies", value)} />
              <EditorField label="Deadline" type="date" value={draft.extracted.deadline} origin={fieldOrigin("extracted", "deadline")} onChange={(value) => updateField("extracted", "deadline", value)} />
              <EditorField label="Industry" value={draft.extracted.industry} origin={fieldOrigin("extracted", "industry")} onChange={(value) => updateField("extracted", "industry", value)} />
              <EditorField label="Department / Category" value={draft.extracted.department} origin={fieldOrigin("extracted", "department")} onChange={(value) => updateField("extracted", "department", value)} />
              <EditorField label="Job Level" value={draft.extracted.jobLevel} origin={fieldOrigin("extracted", "jobLevel")} onChange={(value) => updateField("extracted", "jobLevel", value)} />
              <EditorField label="Work Arrangement" value={draft.extracted.workArrangement} origin={fieldOrigin("extracted", "workArrangement")} onChange={(value) => updateField("extracted", "workArrangement", value)} />
              <EditorField label="Skills" value={draft.extracted.skills} origin={fieldOrigin("extracted", "skills")} onChange={(value) => updateField("extracted", "skills", value)} />
              <EditorField label="Keywords" value={draft.extracted.keywords} origin={fieldOrigin("extracted", "keywords")} onChange={(value) => updateField("extracted", "keywords", value)} />
              <EditorField multiline label="Responsibilities" value={draft.extracted.responsibilities} origin={fieldOrigin("extracted", "responsibilities")} onChange={(value) => updateField("extracted", "responsibilities", value)} />
              <EditorField multiline label="Requirements" value={draft.extracted.requirements} origin={fieldOrigin("extracted", "requirements")} onChange={(value) => updateField("extracted", "requirements", value)} />
              <EditorField multiline label="Benefits" value={draft.extracted.benefits} origin={fieldOrigin("extracted", "benefits")} onChange={(value) => updateField("extracted", "benefits", value)} />
              <EditorField multiline label="Application Method" value={draft.extracted.applicationMethod} origin={fieldOrigin("extracted", "applicationMethod")} onChange={(value) => updateField("extracted", "applicationMethod", value)} />
            </div>
          </EditorSection>

          <EditorSection title="AI enrichment" description="Generated values remain separate from source facts and can be edited before approval.">
            <div className="grid gap-5 md:grid-cols-2">
              {(Object.keys(draft.generated) as Array<keyof GeneratedJobFields>).map((key) => (
                <EditorField key={key} multiline={new Set(["metaDescription", "summary", "shortRecruiterSummary"]).has(key)} label={generatedLabels[key]} value={draft.generated[key]} origin={fieldOrigin("generated", key)} onChange={(value) => updateField("generated", key, value)} />
              ))}
            </div>
          </EditorSection>

          <RecruitingAssistant job={buildRecruitingInput(draft)} draft={draft} history={history} onApplyImprovement={applyImprovement} onRestore={restoreVersion} />

          {dto.duplicates.length ? (
            <section className="border-y border-border py-7 dark:border-white/10">
              <h2 className="text-xl font-black text-text-main dark:text-white">Possible duplicate found</h2>
              <p className="mt-2 text-sm text-text-muted dark:text-slate-300">Choose whether to update one of your existing jobs or publish this as a new role.</p>
              <div className="mt-5 grid gap-3">
                <label className="flex cursor-pointer items-center gap-3 rounded-md border border-border p-4 dark:border-white/10"><input type="radio" name="duplicate-action" value="new" checked={duplicateAction === "new"} onChange={() => setDuplicateAction("new")} className="accent-primary" /><span className="font-bold text-text-main dark:text-white">Create New</span></label>
                {dto.duplicates.map((duplicate) => <label key={duplicate.id} className="flex cursor-pointer items-center justify-between gap-4 rounded-md border border-border p-4 dark:border-white/10"><span className="flex items-center gap-3"><input type="radio" name="duplicate-action" value={duplicate.id} checked={duplicateAction === duplicate.id} onChange={() => setDuplicateAction(duplicate.id)} className="accent-primary" /><span><strong className="block text-text-main dark:text-white">Update Existing: {duplicate.title}</strong><span className="text-xs text-text-muted dark:text-slate-300">{duplicate.company} - {Math.round(duplicate.similarity * 100)}% similar</span></span></span></label>)}
              </div>
            </section>
          ) : null}

          <section className="flex flex-col gap-4 border-t border-border pt-7 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
            <div>{missingRequired.length ? <p className="text-sm font-semibold text-danger">Complete: {missingRequired.join(", ")}</p> : <p className="text-sm font-semibold text-success">Preview is ready for employer approval.</p>}</div>
            <Button type="button" onClick={publishJob} disabled={publishing || Boolean(missingRequired.length)}>
              {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {publishing ? "Saving..." : duplicateAction === "new" ? "Approve & Publish" : "Approve & Update"}
            </Button>
          </section>
        </div>
      ) : null}
    </PageContainer>
  );
}

const generatedLabels: Record<keyof GeneratedJobFields, string> = {
  seoTitle: "SEO Title",
  metaDescription: "Meta Description",
  summary: "Job Summary",
  requiredSkills: "Required Skills",
  preferredSkills: "Preferred Skills",
  suggestedCategory: "Suggested Category",
  suggestedLocation: "Suggested Location",
  suggestedIndustry: "Suggested Industry",
  suggestedKeywords: "Suggested Keywords",
  shortRecruiterSummary: "Short Recruiter Summary"
};

function EditorSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <section><div className="mb-5"><h2 className="text-xl font-black text-text-main dark:text-white">{title}</h2><p className="mt-2 text-sm text-text-muted dark:text-slate-300">{description}</p></div>{children}</section>;
}

function EditorField({ label, value, origin, onChange, multiline = false, type = "text" }: { label: string; value: string; origin: FieldOrigin; onChange: (value: string) => void; multiline?: boolean; type?: string }) {
  const controlClass = "focus-ring w-full rounded-md border border-border bg-surface px-4 py-3 text-sm font-medium text-text-main shadow-soft dark:border-white/10 dark:bg-surface-dark dark:text-white";
  return (
    <label className={multiline ? "md:col-span-2" : ""}>
      <span className="mb-2 flex items-center justify-between gap-3"><span className="text-xs font-black uppercase text-text-muted dark:text-slate-300">{label}</span><OriginBadge origin={origin} /></span>
      {multiline ? <textarea className={`${controlClass} min-h-32`} value={value} onChange={(event) => onChange(event.target.value)} /> : <input className={controlClass} type={type} value={value} onChange={(event) => onChange(event.target.value)} />}
    </label>
  );
}

function OriginBadge({ origin }: { origin: FieldOrigin }) {
  const labels: Record<FieldOrigin, string> = { extracted: "Extracted", generated: "AI generated", missing: "Missing", edited: "Employer edited" };
  const styles: Record<FieldOrigin, string> = { extracted: "bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-200", generated: "bg-violet-50 text-violet-700 dark:bg-violet-400/10 dark:text-violet-200", missing: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300", edited: "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200" };
  return <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${styles[origin]}`}>{labels[origin]}</span>;
}
