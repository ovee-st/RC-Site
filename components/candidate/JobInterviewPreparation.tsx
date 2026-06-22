"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BrainCircuit, CheckCircle2, Download, Gauge, Loader2, Play, RefreshCw, Sparkles, Target } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import { Button, LinkButton } from "@/components/ui/Button";
import type { AppliedJobPreparationDto, InterviewPreparationDto, InterviewQuestionType } from "@/types/interviewPreparation";

type Props = { initialJobId?: string; compact?: boolean };

function escapeReportValue(value: unknown) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Please sign in as a candidate to prepare for interviews.");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

function reportHtml(preparation: InterviewPreparationDto) {
  const list = (items: string[]) => items.length ? `<ul>${items.map((item) => `<li>${escapeReportValue(item)}</li>`).join("")}</ul>` : "<p>None recorded.</p>";
  return `<!doctype html><html><head><title>MXVL Interview Preparation Report</title><style>body{font-family:Arial,sans-serif;color:#101828;max-width:850px;margin:40px auto;line-height:1.55}h1{font-size:28px}h2{margin-top:28px;border-bottom:1px solid #d0d5dd;padding-bottom:8px}.score{font-size:36px;font-weight:800;color:#2563eb}.question{margin:18px 0;padding:16px;border:1px solid #d0d5dd;border-radius:8px}.meta{color:#667085}.feedback{background:#f2f4f7;padding:12px;margin-top:10px}@media print{button{display:none}}</style></head><body><button onclick="window.print()">Save as PDF</button><p class="meta">MX Venture Lab</p><h1>${escapeReportValue(preparation.jobTitle)}</h1><p>${escapeReportValue(preparation.companyName)} | ${preparation.mode === "mock" ? "AI Mock Interview" : "Interview Preparation"}</p><p class="score">${preparation.readinessScore}% ready</p><h2>Strengths</h2>${list(preparation.strengths)}<h2>Missing Skills</h2>${list(preparation.missingSkills)}<h2>Improvement Areas</h2>${list(preparation.improvementAreas)}<h2>Questions & Feedback</h2>${preparation.questions.map((question, index) => { const answer = preparation.answers.find((item) => item.questionId === question.id); return `<div class="question"><strong>${index + 1}. ${escapeReportValue(question.question)}</strong><p class="meta">${escapeReportValue(question.type)} | ${escapeReportValue(question.focus)}</p>${answer ? `<p><b>Your answer:</b> ${escapeReportValue(answer.answer)}</p><div class="feedback"><b>Score: ${answer.score ?? "Pending"}</b><p>${escapeReportValue(answer.feedback)}</p></div>` : `<p>${escapeReportValue(question.guidance)}</p>`}</div>`; }).join("")}</body></html>`;
}

export default function JobInterviewPreparation({ initialJobId = "", compact = false }: Props) {
  const { role } = useAuth();
  const [catalog, setCatalog] = useState<AppliedJobPreparationDto[]>([]);
  const [selectedJobId, setSelectedJobId] = useState(initialJobId);
  const [preparation, setPreparation] = useState<InterviewPreparationDto | null>(null);
  const [questionType, setQuestionType] = useState<InterviewQuestionType | "all">("all");
  const [selectedQuestionId, setSelectedQuestionId] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const request = useCallback(async (url: string, options?: RequestInit) => {
    const headers = await authHeaders();
    const response = await fetch(url, { ...options, headers: { ...headers, ...(options?.headers || {}) } });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Interview preparation request failed.");
    return payload;
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      if (selectedJobId) {
        const payload = await request(`/api/interview-preparation?job_id=${encodeURIComponent(selectedJobId)}`);
        setPreparation(payload.preparation || null);
      } else {
        const payload = await request("/api/interview-preparation");
        setCatalog(payload.appliedJobs || []);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load interview preparation.");
    } finally {
      setLoading(false);
    }
  }, [request, selectedJobId]);

  useEffect(() => { load(); }, [load]);

  const startPreparation = async (mode: "basic" | "mock", regenerate = false) => {
    if (!selectedJobId) return;
    setSaving(true);
    setMessage("");
    try {
      const payload = await request("/api/interview-preparation", { method: "POST", body: JSON.stringify({ job_id: selectedJobId, mode, regenerate }) });
      setPreparation(payload.preparation);
      setSelectedQuestionId(payload.preparation?.questions?.[0]?.id || "");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create interview preparation.");
    } finally {
      setSaving(false);
    }
  };

  const submitAnswer = async () => {
    if (!preparation || !selectedQuestionId) return;
    setSaving(true);
    setMessage("");
    try {
      const payload = await request(`/api/interview-preparation/${preparation.id}/responses`, { method: "POST", body: JSON.stringify({ question_id: selectedQuestionId, answer }) });
      setPreparation(payload.preparation);
      setAnswer("");
      const answeredIds = new Set(payload.preparation.answers.map((item: { questionId: string }) => item.questionId));
      setSelectedQuestionId(payload.preparation.questions.find((item: { id: string }) => !answeredIds.has(item.id))?.id || selectedQuestionId);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not score this answer.");
    } finally {
      setSaving(false);
    }
  };

  const visibleQuestions = useMemo(() => preparation?.questions.filter((question) => questionType === "all" || question.type === questionType) || [], [preparation, questionType]);
  const selectedQuestion = preparation?.questions.find((question) => question.id === selectedQuestionId) || visibleQuestions[0];
  const selectedFeedback = preparation?.answers.find((item) => item.questionId === selectedQuestion?.id);

  if (role && role !== "candidate") return <EmptyState title="Candidate feature" message="Interview preparation is available from candidate accounts." />;
  if (loading) return <Card className="grid min-h-64 place-items-center"><div className="flex items-center gap-3 text-sm font-bold text-text-muted"><Loader2 className="h-5 w-5 animate-spin text-primary" />Loading interview preparation...</div></Card>;

  if (!selectedJobId) {
    return (
      <section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><Badge variant="primary">Interview Preparation</Badge><h2 className="type-h2 mt-2">Prepare for jobs you applied to</h2><p className="type-body mt-2">Practice against each role's actual responsibilities, requirements, and skills.</p></div>
        </div>
        {message ? <p className="mt-4 rounded-md bg-danger/10 px-4 py-3 text-sm font-bold text-danger">{message}</p> : null}
        <div className="mt-5 grid gap-3">
          {catalog.map((job) => (
            <Card key={job.applicationId} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div><h3 className="text-base font-black text-text-main dark:text-white">{job.jobTitle}</h3><p className="mt-1 text-sm font-semibold text-text-muted">{job.companyName} | {job.status}</p>{job.readinessScore != null ? <Badge variant="success" className="mt-3">{job.readinessScore}% ready</Badge> : null}</div>
              <Button onClick={() => setSelectedJobId(job.jobId)}>{job.preparationId ? "Continue preparation" : "Start preparation"}</Button>
            </Card>
          ))}
          {!catalog.length ? <EmptyState icon={<BrainCircuit className="h-6 w-6" />} title="No applied jobs available" message="Applied jobs will appear here when they are connected to an active MXVL job post." /> : null}
        </div>
      </section>
    );
  }

  if (!preparation) {
    return (
      <Card className="p-6 sm:p-8">
        <Badge variant="primary">Job-Specific Prep</Badge><h1 className="type-h2 mt-3">Build your interview plan</h1><p className="type-body mt-2 max-w-2xl">MXVL will analyze the job description, requirements, skills, and your candidate profile to create a focused preparation set.</p>
        {message ? <p className="mt-4 rounded-md bg-danger/10 px-4 py-3 text-sm font-bold text-danger">{message}</p> : null}
        <div className="mt-6 flex flex-wrap gap-3"><Button disabled={saving} onClick={() => startPreparation("basic")}><Sparkles className="h-4 w-4" />{saving ? "Analyzing..." : "Generate preparation"}</Button><Button variant="secondary" disabled={saving} onClick={() => startPreparation("mock")}><Play className="h-4 w-4" />AI Mock Interview</Button>{!initialJobId ? <Button variant="ghost" onClick={() => setSelectedJobId("")}>Back to applied jobs</Button> : null}</div>
      </Card>
    );
  }

  return (
    <section className={compact ? "space-y-5" : "space-y-6"}>
      <div className="flex flex-col gap-4 border-b border-border pb-5 dark:border-white/10 lg:flex-row lg:items-end lg:justify-between">
        <div><Badge variant={preparation.isPro ? "success" : "primary"}>{preparation.isPro ? "Candidate Pro" : "Basic Preparation"}</Badge><h1 className="type-h2 mt-2">{preparation.jobTitle}</h1><p className="type-body mt-1">{preparation.companyName} | {preparation.mode === "mock" ? "AI Mock Interview" : "Question preparation"}</p></div>
        <div className="flex flex-wrap gap-2">{preparation.isPro ? <Button variant="secondary" onClick={() => { const report = window.open("", "_blank"); if (report) { report.document.write(reportHtml(preparation)); report.document.close(); } }}><Download className="h-4 w-4" />Download report</Button> : <LinkButton href="/subscriptions" variant="secondary">Upgrade for mock interviews</LinkButton>}<Button variant="ghost" disabled={saving} onClick={() => startPreparation(preparation.mode, true)}><RefreshCw className="h-4 w-4" />Regenerate</Button></div>
      </div>
      {message ? <p className="rounded-md bg-danger/10 px-4 py-3 text-sm font-bold text-danger">{message}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5"><Gauge className="h-5 w-5 text-primary" /><p className="mt-3 text-3xl font-black">{preparation.readinessScore}%</p><p className="text-sm font-bold text-text-muted">Interview readiness</p></Card>
        <Card className="p-5"><CheckCircle2 className="h-5 w-5 text-success" /><p className="mt-3 text-3xl font-black">{preparation.strengths.length}</p><p className="text-sm font-bold text-text-muted">Matched strengths</p></Card>
        <Card className="p-5"><Target className="h-5 w-5 text-amber-500" /><p className="mt-3 text-3xl font-black">{preparation.missingSkills.length}</p><p className="text-sm font-bold text-text-muted">Skill gaps</p></Card>
        <Card className="p-5"><BrainCircuit className="h-5 w-5 text-cyan-600" /><p className="mt-3 text-3xl font-black">{preparation.answers.length}/{preparation.questions.length}</p><p className="text-sm font-bold text-text-muted">Answers completed</p></Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div><h2 className="type-h3">Strengths</h2><div className="mt-3 flex flex-wrap gap-2">{preparation.strengths.map((item) => <Badge key={item} variant="success">{item}</Badge>)}{!preparation.strengths.length ? <p className="type-body">Complete your profile to reveal matched strengths.</p> : null}</div></div>
        <div><h2 className="type-h3">Missing skills</h2><div className="mt-3 flex flex-wrap gap-2">{preparation.missingSkills.map((item) => <Badge key={item}>{item}</Badge>)}{!preparation.missingSkills.length ? <p className="type-body">No direct skill gaps detected.</p> : null}</div></div>
        <div><h2 className="type-h3">Improvement areas</h2><ul className="mt-3 space-y-2 text-sm font-semibold text-text-muted">{preparation.improvementAreas.map((item) => <li key={item}>- {item}</li>)}</ul></div>
      </div>

      <div>
        <div className="flex flex-wrap gap-2">{(["all", "technical", "behavioral", "situational"] as const).map((type) => <button key={type} type="button" onClick={() => setQuestionType(type)} className={`rounded-md border px-3 py-2 text-sm font-bold capitalize transition ${questionType === type ? "border-primary bg-primary text-white" : "border-border bg-surface text-text-muted dark:border-white/10 dark:bg-slate-900"}`}>{type}</button>)}</div>
        <div className="mt-4 grid gap-3">{visibleQuestions.map((question, index) => { const feedback = preparation.answers.find((item) => item.questionId === question.id); return <button key={question.id} type="button" onClick={() => setSelectedQuestionId(question.id)} className={`w-full border-l-4 px-4 py-4 text-left transition ${selectedQuestion?.id === question.id ? "border-l-primary bg-primary/5" : "border-l-border bg-surface hover:bg-bg dark:bg-slate-900"}`}><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-black text-text-main dark:text-white">{index + 1}. {question.question}</p><p className="mt-2 text-xs font-semibold text-text-muted">{question.type} | Focus: {question.focus}</p></div>{feedback ? <Badge variant="success">{feedback.score}%</Badge> : null}</div></button>; })}</div>
      </div>

      {preparation.mode === "mock" && preparation.isPro && selectedQuestion ? (
        <Card className="p-5 sm:p-6"><Badge variant="primary">AI Mock Interview</Badge><h2 className="type-h3 mt-3">{selectedQuestion.question}</h2><p className="type-body mt-2">{selectedQuestion.guidance}</p><textarea value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Type your interview answer..." className="mt-4 min-h-40 w-full rounded-md border border-border bg-surface px-4 py-3 text-sm font-medium outline-none focus:border-primary dark:border-white/10 dark:bg-slate-900" />{selectedFeedback ? <div className="mt-4 border-l-4 border-l-success bg-success/5 p-4"><p className="font-black">AI score: {selectedFeedback.score}%</p><p className="mt-2 text-sm font-semibold text-text-muted">{selectedFeedback.feedback}</p></div> : null}<div className="mt-4 flex justify-end"><Button disabled={saving || answer.trim().length < 20} onClick={submitAnswer}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}Score my answer</Button></div></Card>
      ) : null}
    </section>
  );
}
