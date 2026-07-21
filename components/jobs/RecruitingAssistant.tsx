"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Check, Download, History, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { compactAuthHeaders } from "@/lib/compactAuthToken";
import { compareHistoryVersions, type HistoryVersion } from "@/lib/ai/history";
import type { ImproveAction, InterviewPack, JobImprovementResult, JobReviewResult, RecruitingJobInput, ScreeningPack, ScoreResult } from "@/lib/ai/recruitingTypes";
import type { JobImporterDraft } from "@/components/jobs/jobImporterTypes";

type Props = {
  job: RecruitingJobInput;
  draft: JobImporterDraft;
  history: HistoryVersion<JobImporterDraft>[];
  onApplyImprovement: (result: JobImprovementResult) => boolean;
  onRestore: (version: HistoryVersion<JobImporterDraft>) => void;
};

const ACTIONS: Array<{ action: ImproveAction; label: string }> = [
  { action: "title", label: "Improve Title" },
  { action: "description", label: "Improve Description" },
  { action: "requirements", label: "Improve Requirements" },
  { action: "responsibilities", label: "Improve Responsibilities" },
  { action: "benefits", label: "Improve Benefits" },
  { action: "skills", label: "Improve Skills" },
  { action: "seo", label: "Improve SEO" },
  { action: "readability", label: "Improve Readability" },
  { action: "ats", label: "Improve ATS" }
];

async function assistantPost<T>(path: string, body: unknown): Promise<T> {
  const authHeaders = await compactAuthHeaders(`recruiting_assistant_${path}`);
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders },
    body: JSON.stringify(body)
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Recruiting assistance is temporarily unavailable.");
  return payload.result as T;
}

function downloadJson(name: string, data: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function RecruitingAssistant({ job, draft, history, onApplyImprovement, onRestore }: Props) {
  const [review, setReview] = useState<JobReviewResult | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [improving, setImproving] = useState<ImproveAction | null>(null);
  const [interviewPack, setInterviewPack] = useState<InterviewPack | null>(null);
  const [screeningPack, setScreeningPack] = useState<ScreeningPack | null>(null);
  const [generating, setGenerating] = useState<"interview" | "screening" | null>(null);
  const [error, setError] = useState("");
  const [compareId, setCompareId] = useState("");
  const jobKey = useMemo(() => JSON.stringify(job), [job]);

  useEffect(() => {
    let active = true;
    const timeout = window.setTimeout(async () => {
      setReviewing(true);
      setError("");
      try {
        const result = await assistantPost<JobReviewResult>("/api/jobs/review", { job });
        if (active) setReview(result);
      } catch (reviewError) {
        if (active) setError(reviewError instanceof Error ? reviewError.message : "The job review could not be generated.");
      } finally {
        if (active) setReviewing(false);
      }
    }, 500);
    return () => { active = false; window.clearTimeout(timeout); };
  }, [job, jobKey]);

  const improve = async (action: ImproveAction) => {
    setImproving(action);
    setError("");
    try {
      const result = await assistantPost<JobImprovementResult>("/api/jobs/improve", { job, action });
      onApplyImprovement(result);
    } catch (improveError) {
      setError(improveError instanceof Error ? improveError.message : "The selected section could not be improved.");
    } finally {
      setImproving(null);
    }
  };

  const generate = async (kind: "interview" | "screening") => {
    setGenerating(kind);
    setError("");
    try {
      if (kind === "interview") setInterviewPack(await assistantPost<InterviewPack>("/api/jobs/interview-pack", { job }));
      else setScreeningPack(await assistantPost<ScreeningPack>("/api/jobs/screening", { job }));
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : "The recruiting pack could not be generated.");
    } finally {
      setGenerating(null);
    }
  };

  const comparison = useMemo(() => {
    const selected = history.find((version) => version.id === compareId);
    if (!selected) return [];
    return compareHistoryVersions(selected, { id: "current", kind: "Recruiter Edited", createdAt: new Date().toISOString(), label: "Current draft", snapshot: draft });
  }, [compareId, draft, history]);

  return (
    <section className="border-y border-border py-8 dark:border-white/10" aria-labelledby="assistant-heading">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary"><Sparkles className="h-5 w-5" /><span className="text-xs font-black uppercase">AI Recruiting Assistant</span></div>
          <h2 id="assistant-heading" className="mt-2 text-2xl font-black text-text-main dark:text-white">Review before publication</h2>
          <p className="mt-2 max-w-3xl text-sm text-text-muted dark:text-slate-300">Assess completeness, ATS compatibility, SEO, recruiter guidance, and job-specific screening material without changing the publication workflow.</p>
        </div>
        {reviewing ? <span className="inline-flex items-center gap-2 text-sm font-bold text-text-muted"><Loader2 className="h-4 w-4 animate-spin" />Refreshing scores</span> : null}
      </div>

      {error ? <div className="mt-5 flex items-start gap-2 rounded-md border border-danger/20 bg-danger/5 p-3 text-sm font-semibold text-danger"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div> : null}

      {review ? (
        <>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <ScoreCard title="Import Quality" result={review.quality} ring stars />
            <ScoreCard title="ATS Compatibility" result={review.ats} />
            <ScoreCard title="SEO Score" result={review.seo} />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
            <div className="rounded-lg border border-border p-5 dark:border-white/10">
              <h3 className="text-lg font-black text-text-main dark:text-white">Quality recommendations</h3>
              <div className="mt-4 grid gap-3">
                {review.recommendations.length ? review.recommendations.map((item) => (
                  <details key={item.id} className="rounded-md bg-bg p-4 dark:bg-white/5">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3"><strong className="text-sm text-text-main dark:text-white">{item.title}</strong><span className="text-[10px] font-black uppercase text-text-muted">{item.severity}</span></summary>
                    <p className="mt-2 text-sm leading-6 text-text-muted dark:text-slate-300">{item.detail}</p>
                  </details>
                )) : <p className="text-sm text-success">No material quality issues detected.</p>}
              </div>
            </div>

            <div className="rounded-lg border border-border p-5 dark:border-white/10">
              <h3 className="text-lg font-black text-text-main dark:text-white">Recruiter summary</h3>
              <p className="mt-3 text-sm leading-6 text-text-muted dark:text-slate-300">{review.recruiterSummary.executiveSummary}</p>
              <SummaryLine label="Ideal candidate" value={review.recruiterSummary.idealCandidate} />
              <SummaryLine label="Main requirement" value={review.recruiterSummary.mostImportantRequirement} />
              <SummaryLine label="Hiring challenge" value={review.recruiterSummary.biggestHiringChallenge} />
              <div className="mt-4 flex flex-wrap gap-2"><Pill>{review.recruiterSummary.hiringDifficulty} difficulty</Pill><Pill>{review.recruiterSummary.candidateAvailability} availability</Pill>{review.recruiterSummary.topSkills.map((skill) => <Pill key={skill}>{skill}</Pill>)}</div>
            </div>
          </div>
        </>
      ) : null}

      <div className="mt-6 rounded-lg border border-border p-5 dark:border-white/10">
        <h3 className="text-lg font-black text-text-main dark:text-white">One-click improvements</h3>
        <p className="mt-1 text-sm text-text-muted dark:text-slate-300">Each action changes only its named section. Manually edited content requires confirmation.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {ACTIONS.map(({ action, label }) => <Button key={action} type="button" variant="secondary" onClick={() => improve(action)} disabled={Boolean(improving)}>{improving === action ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}{label}</Button>)}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <PackPanel title="Interview pack" loading={generating === "interview"} onGenerate={() => generate("interview")} onDownload={interviewPack ? () => downloadJson("mxvl-interview-pack.json", interviewPack) : undefined}>
          {interviewPack ? <div className="space-y-4"><QuestionGroup title="Technical" questions={interviewPack.technicalQuestions.map((item) => item.question)} /><QuestionGroup title="Behavioral" questions={interviewPack.behavioralQuestions.map((item) => item.question)} /><QuestionGroup title="HR" questions={interviewPack.hrQuestions.map((item) => item.question)} /><QuestionGroup title="Knockout" questions={interviewPack.knockoutQuestions.map((item) => item.question)} /><QuestionGroup title="Scoring rubric" questions={interviewPack.scoringRubric.map((item) => `${item.criterion} (${item.weight}%): ${item.guidance}`)} /><QuestionGroup title="Evaluation checklist" questions={interviewPack.evaluationChecklist} /><QuestionGroup title="Rating matrix" questions={interviewPack.ratingMatrix.map((item) => `${item.rating} - ${item.label}: ${item.description}`)} /></div> : null}
        </PackPanel>
        <PackPanel title="Screening questions" loading={generating === "screening"} onGenerate={() => generate("screening")} onDownload={screeningPack ? () => downloadJson("mxvl-screening-questions.json", screeningPack) : undefined}>
          {screeningPack ? <div className="space-y-4"><QuestionGroup title="Required" questions={screeningPack.requiredQuestions.map((item) => `${item.question} (${item.type.replace("_", " ")})`)} /><QuestionGroup title="Optional" questions={screeningPack.optionalQuestions.map((item) => `${item.question} (${item.type.replace("_", " ")})`)} /></div> : null}
        </PackPanel>
      </div>

      <div className="mt-6 rounded-lg border border-border p-5 dark:border-white/10">
        <div className="flex items-center gap-2"><History className="h-5 w-5 text-primary" /><h3 className="text-lg font-black text-text-main dark:text-white">Version history</h3></div>
        <div className="mt-4 grid gap-3">
          {history.map((version) => (
            <div key={version.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-bg p-3 dark:bg-white/5">
              <div><strong className="text-sm text-text-main dark:text-white">{version.label}</strong><span className="ml-2 text-xs text-text-muted">{new Date(version.createdAt).toLocaleString()}</span></div>
              <div className="flex gap-2"><button type="button" onClick={() => setCompareId(version.id)} className="focus-ring rounded px-3 py-2 text-xs font-bold text-primary">Compare</button><button type="button" onClick={() => onRestore(version)} className="focus-ring inline-flex items-center gap-1 rounded px-3 py-2 text-xs font-bold text-primary"><RotateCcw className="h-3 w-3" />Restore</button></div>
            </div>
          ))}
        </div>
        {compareId ? <div className="mt-4 max-h-72 overflow-auto rounded-md border border-border dark:border-white/10"><table className="w-full min-w-[560px] text-left text-xs"><thead><tr className="border-b border-border dark:border-white/10"><th className="p-3">Field</th><th className="p-3">Selected version</th><th className="p-3">Current draft</th></tr></thead><tbody>{comparison.map((row) => <tr key={row.field} className="border-b border-border/60 align-top dark:border-white/5"><td className="p-3 font-bold">{row.field}</td><td className="max-w-xs p-3 text-text-muted">{row.before || "Empty"}</td><td className="max-w-xs p-3 text-text-muted">{row.after || "Empty"}</td></tr>)}</tbody></table>{!comparison.length ? <p className="p-4 text-sm text-success">No differences from the current draft.</p> : null}</div> : null}
      </div>
    </section>
  );
}

function ScoreCard({ title, result, ring = false, stars = false }: { title: string; result: ScoreResult; ring?: boolean; stars?: boolean }) {
  return <div className="rounded-lg border border-border p-5 dark:border-white/10"><div className="flex items-center justify-between gap-4"><div><span className="text-xs font-black uppercase text-text-muted">{title}</span><div className="mt-2 flex items-baseline gap-2"><strong className="text-3xl font-black text-text-main dark:text-white">{result.score}</strong><span className="text-sm text-text-muted">/100</span></div><p className="mt-1 text-sm font-bold text-primary">{result.band}</p></div>{ring ? <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(#2f6fed ${result.score * 3.6}deg, #e5e7eb 0)` }}><div className="grid h-14 w-14 place-items-center rounded-full bg-surface text-sm font-black text-text-main dark:bg-slate-900 dark:text-white">{result.score}%</div></div> : <Check className="h-7 w-7 text-success" />}</div>{stars ? <p className="mt-3 text-amber-500" aria-label={`${Math.max(1, Math.ceil(result.score / 20))} out of 5 stars`}>{"★".repeat(Math.max(1, Math.ceil(result.score / 20)))}{"☆".repeat(5 - Math.max(1, Math.ceil(result.score / 20)))}</p> : null}{result.missing.length ? <p className="mt-3 text-xs leading-5 text-text-muted">Missing: {result.missing.join(", ")}</p> : null}</div>;
}

function SummaryLine({ label, value }: { label: string; value: string }) { return <div className="mt-4"><span className="text-[10px] font-black uppercase text-text-muted">{label}</span><p className="mt-1 text-sm leading-6 text-text-main dark:text-slate-100">{value}</p></div>; }
function Pill({ children }: { children: React.ReactNode }) { return <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{children}</span>; }
function QuestionGroup({ title, questions }: { title: string; questions: string[] }) { return <div><h4 className="text-sm font-black text-text-main dark:text-white">{title}</h4><ol className="mt-2 space-y-2 pl-5 text-sm leading-6 text-text-muted dark:text-slate-300">{questions.map((item, index) => <li key={`${title}-${index}`} className="list-decimal">{item}</li>)}</ol></div>; }

function PackPanel({ title, loading, onGenerate, onDownload, children }: { title: string; loading: boolean; onGenerate: () => void; onDownload?: () => void; children: React.ReactNode }) {
  return <div className="rounded-lg border border-border p-5 dark:border-white/10"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-lg font-black text-text-main dark:text-white">{title}</h3><div className="flex gap-2"><Button type="button" variant="secondary" onClick={onGenerate} disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}{loading ? "Generating" : "Generate"}</Button>{onDownload ? <Button type="button" variant="secondary" onClick={onDownload}><Download className="h-4 w-4" />JSON</Button> : null}</div></div>{children ? <div className="mt-5">{children}</div> : null}</div>;
}
