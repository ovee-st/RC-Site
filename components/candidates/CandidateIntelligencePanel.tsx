"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Brain, CheckCircle2, Loader2, Scale, X } from "lucide-react";
import { compactAuthHeaders } from "@/lib/compactAuthToken";
import type { CandidateComparison, CandidateMatch, CandidateProfileAnalysis, InterviewQuestion } from "@/lib/ai/candidates/types";

type CandidateRef = { id: string; name: string };
type JobRef = { id: string; title: string };
type ApiResult<T> = { result: T; cached: boolean };

async function post<T>(path: string, body: unknown) {
  const auth = await compactAuthHeaders(`candidate_intelligence_${path}`);
  const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json", ...auth }, body: JSON.stringify(body) });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Candidate intelligence could not be loaded.");
  return payload as ApiResult<T>;
}

export default function CandidateIntelligencePanel({ candidates, job, onClose }: { candidates: CandidateRef[]; job: JobRef; onClose: () => void }) {
  const [analysis, setAnalysis] = useState<CandidateProfileAnalysis | null>(null);
  const [match, setMatch] = useState<CandidateMatch | null>(null);
  const [comparison, setComparison] = useState<CandidateComparison | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true); setError("");
      try {
        if (candidates.length > 1) {
          const result = await post<CandidateComparison>("/api/candidates/compare", { candidate_ids: candidates.map((item) => item.id), job_id: job.id });
          if (active) setComparison(result.result);
        } else {
          const candidateId = candidates[0].id;
          const [profileResult, matchResult, interviewResult] = await Promise.all([
            post<CandidateProfileAnalysis>("/api/candidates/analyze", { candidate_id: candidateId }),
            post<CandidateMatch>("/api/candidates/match", { candidate_id: candidateId, job_id: job.id }),
            post<InterviewQuestion[]>("/api/candidates/interview", { candidate_id: candidateId, job_id: job.id })
          ]);
          if (active) { setAnalysis(profileResult.result); setMatch(matchResult.result); setQuestions(interviewResult.result); }
        }
      } catch (loadError) { if (active) setError(loadError instanceof Error ? loadError.message : "Candidate intelligence could not be loaded."); }
      finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, [candidates, job.id]);

  return (
    <div className="fixed inset-0 z-[120] grid place-items-center bg-slate-950/60 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="candidate-intelligence-title">
      <div className="max-h-[94vh] w-full max-w-6xl overflow-y-auto rounded-lg border border-border bg-surface shadow-2xl dark:border-white/10 dark:bg-slate-950">
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-surface/95 p-5 backdrop-blur dark:border-white/10 dark:bg-slate-950/95">
          <div><div className="flex items-center gap-2 text-primary"><Brain className="h-5 w-5" /><span className="text-xs font-black uppercase">Human Review First</span></div><h2 id="candidate-intelligence-title" className="mt-2 text-2xl font-black text-text-main dark:text-white">{candidates.length > 1 ? "Candidate comparison" : candidates[0].name}</h2><p className="mt-1 text-sm text-text-muted">Evidence-based intelligence for {job.title}. Recruiters make every hiring decision.</p></div>
          <button type="button" onClick={onClose} className="focus-ring rounded-md p-2 text-text-muted" aria-label="Close candidate intelligence"><X className="h-5 w-5" /></button>
        </header>

        <div className="p-5">
          {loading ? <div className="grid min-h-72 place-items-center"><div className="text-center text-text-muted"><Loader2 className="mx-auto h-7 w-7 animate-spin text-primary" /><p className="mt-3 text-sm font-bold">Reviewing evidence and unknowns...</p></div></div> : null}
          {error ? <div className="rounded-md border border-danger/20 bg-danger/5 p-4 text-sm font-semibold text-danger">{error}</div> : null}
          {comparison ? <ComparisonView comparison={comparison} /> : null}
          {analysis && match ? <SingleCandidateView analysis={analysis} match={match} questions={questions} /> : null}
        </div>
      </div>
    </div>
  );
}

function SingleCandidateView({ analysis, match, questions }: { analysis: CandidateProfileAnalysis; match: CandidateMatch; questions: InterviewQuestion[] }) {
  return <div className="space-y-6">
    {match.humanReviewRequired ? <HumanReview unknowns={match.unknowns.map((item) => `${item.field}: ${item.reason}`)} /> : null}
    <div className="grid gap-4 md:grid-cols-3"><Metric title="Evidence match" value={`${match.score}%`} /><Metric title="Confidence" value={`${match.confidence.score}%`} note={match.confidence.level} /><Metric title="Assistant recommendation" value={match.recommendation} note="Not a hiring decision" /></div>
    <section className="rounded-lg border border-border p-5 dark:border-white/10"><h3 className="text-lg font-black dark:text-white">Match breakdown</h3><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{match.dimensions.map((item) => <div key={item.name}><div className="flex justify-between text-xs font-black"><span>{item.name}</span><span>{item.score}%</span></div><div className="mt-2 h-2 rounded-full bg-slate-100 dark:bg-white/10"><div className="h-full rounded-full bg-primary" style={{ width: `${item.score}%` }} /></div><p className="mt-2 text-xs text-text-muted">Confidence {item.confidence.score}%{item.unknowns.length ? " | Unknown" : ""}</p></div>)}</div></section>
    <div className="grid gap-6 lg:grid-cols-2"><InsightList title="Strengths" items={analysis.strengths.map((item) => ({ title: item.title, body: item.statement, evidence: item.evidence.map((ev) => ev.quote), confidence: item.confidence.score }))} /><InsightList title="Observations, not conclusions" items={analysis.risks.map((item) => ({ title: item.title, body: `${item.statement} Alternative: ${item.alternativeExplanation}`, evidence: item.evidence.map((ev) => ev.quote), confidence: item.confidence.score }))} /></div>
    <div className="grid gap-6 lg:grid-cols-2"><section className="rounded-lg border border-border p-5 dark:border-white/10"><h3 className="text-lg font-black dark:text-white">Skill gap</h3><TagGroup title="Required" values={match.skillGap.requiredSkills} /><TagGroup title="Candidate evidence" values={match.skillGap.candidateSkills} /><TagGroup title="Transferable" values={match.skillGap.transferableSkills} /><TagGroup title="Not Mentioned" values={match.skillGap.notMentioned} warning /></section><section className="rounded-lg border border-border p-5 dark:border-white/10"><h3 className="text-lg font-black dark:text-white">Unknowns</h3><ul className="mt-3 space-y-2 text-sm text-text-muted">{match.unknowns.map((item, index) => <li key={`${item.field}-${index}`} className="rounded-md bg-amber-50 p-3 text-amber-900 dark:bg-amber-400/10 dark:text-amber-100"><strong>{item.field}:</strong> {item.reason}</li>)}</ul></section></div>
    <section className="rounded-lg border border-border p-5 dark:border-white/10"><h3 className="text-lg font-black dark:text-white">Evidence-linked interview assistant</h3><div className="mt-4 grid gap-3 md:grid-cols-2">{questions.map((item, index) => <div key={`${item.category}-${index}`} className="rounded-md bg-bg p-4 dark:bg-white/5"><span className="text-[10px] font-black uppercase text-primary">{item.category.replace("_", " ")}</span><p className="mt-2 text-sm font-bold dark:text-white">{item.question}</p><p className="mt-2 text-xs text-text-muted">{item.reason}</p></div>)}</div></section>
    <section className="rounded-lg border border-border p-5 dark:border-white/10"><h3 className="text-lg font-black dark:text-white">AI timeline and version</h3><div className="mt-4 grid gap-3 sm:grid-cols-3"><Timeline label="Resume Parsed" /><Timeline label="AI Analysis" /><Timeline label={`AI Version: ${analysis.promptVersion}`} /></div><p className="mt-4 text-xs text-text-muted">Model: {analysis.model}. Audit events are immutable after the database migration is applied.</p></section>
  </div>;
}

function ComparisonView({ comparison }: { comparison: CandidateComparison }) { return <div className="space-y-6">{comparison.humanReviewRequired ? <HumanReview unknowns={comparison.unknowns.map((item) => `${item.field}: ${item.reason}`)} /> : null}<div className="flex items-center gap-3"><Scale className="h-6 w-6 text-primary" /><div><h3 className="text-lg font-black dark:text-white">Evidence-only comparison</h3><p className="text-sm text-text-muted">{comparison.reasoning}</p></div></div><div className="grid gap-4 lg:grid-cols-2">{comparison.candidates.map((item) => <section key={item.candidateId} className={`rounded-lg border p-5 ${comparison.winner === item.candidateId ? "border-success bg-success/5" : "border-border dark:border-white/10"}`}><div className="flex items-center justify-between gap-3"><h4 className="text-lg font-black dark:text-white">{item.candidateName}</h4><strong className="text-2xl text-primary">{item.match.score}%</strong></div><p className="mt-2 text-sm font-bold text-text-muted">{item.match.recommendation} | Confidence {item.match.confidence.score}%</p><div className="mt-4 space-y-2">{item.match.dimensions.map((dimension) => <div key={dimension.name} className="flex justify-between text-xs"><span>{dimension.name}</span><strong>{dimension.score}%</strong></div>)}</div><p className="mt-4 text-xs text-text-muted">Unknowns: {item.match.unknowns.length}</p></section>)}</div><p className="rounded-md bg-primary/5 p-4 text-sm text-text-muted">{comparison.winner ? "A leading evidence match is shown for recruiter review. This is not an automated hiring decision." : "No reliable single leader is declared. Gather missing information and conduct structured interviews."}</p></div>; }
function HumanReview({ unknowns }: { unknowns: string[] }) { return <div className="rounded-lg border border-amber-300 bg-amber-50 p-5 text-amber-950 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100"><div className="flex items-center gap-2 font-black"><AlertTriangle className="h-5 w-5" />Human Review Required</div><p className="mt-2 text-sm">Confidence is below the configured threshold. The assistant has stopped short of a hiring recommendation.</p><p className="mt-2 text-xs">Missing information: {unknowns.slice(0, 6).join("; ") || "Additional recruiter validation required."}</p></div>; }
function Metric({ title, value, note }: { title: string; value: string; note?: string }) { return <div className="rounded-lg border border-border p-5 dark:border-white/10"><span className="text-xs font-black uppercase text-text-muted">{title}</span><strong className="mt-3 block text-2xl font-black text-text-main dark:text-white">{value}</strong>{note ? <p className="mt-1 text-xs text-text-muted">{note}</p> : null}</div>; }
function InsightList({ title, items }: { title: string; items: Array<{ title: string; body: string; evidence: string[]; confidence: number }> }) { return <section className="rounded-lg border border-border p-5 dark:border-white/10"><h3 className="text-lg font-black dark:text-white">{title}</h3><div className="mt-4 space-y-3">{items.length ? items.map((item, index) => <details key={`${item.title}-${index}`} className="rounded-md bg-bg p-4 dark:bg-white/5"><summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-black"><span>{item.title}</span><span className="text-xs text-primary">{item.confidence}%</span></summary><p className="mt-2 text-sm text-text-muted">{item.body}</p>{item.evidence.map((quote, quoteIndex) => <p key={quoteIndex} className="mt-2 border-l-2 border-primary pl-3 text-xs italic text-text-muted">Evidence: {quote}</p>)}</details>) : <p className="text-sm text-text-muted">No grounded evidence available.</p>}</div></section>; }
function TagGroup({ title, values, warning = false }: { title: string; values: string[]; warning?: boolean }) { return <div className="mt-4"><span className="text-xs font-black uppercase text-text-muted">{title}</span><div className="mt-2 flex flex-wrap gap-2">{values.length ? values.map((item) => <span key={item} className={`rounded-full px-3 py-1 text-xs font-bold ${warning ? "bg-amber-100 text-amber-900 dark:bg-amber-400/10 dark:text-amber-100" : "bg-primary/10 text-primary"}`}>{item}</span>) : <span className="text-xs text-text-muted">None evidenced</span>}</div></div>; }
function Timeline({ label }: { label: string }) { return <div className="flex items-center gap-2 rounded-md bg-bg p-3 text-xs font-bold text-text-main dark:bg-white/5 dark:text-white"><CheckCircle2 className="h-4 w-4 text-success" />{label}</div>; }
