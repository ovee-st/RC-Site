"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, BrainCircuit, CheckCircle2, Download, Gauge, Loader2, Play, RefreshCw, Save, Sparkles, Target } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import { Button, LinkButton } from "@/components/ui/Button";
import type { AppliedJobPreparationDto, InterviewPreparationDto } from "@/types/interviewPreparation";

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
  return `<!doctype html><html><head><title>MXVL Interview Preparation Report</title><style>body{font-family:Arial,sans-serif;color:#101828;max-width:850px;margin:40px auto;line-height:1.55}h1{font-size:28px}h2{margin-top:28px;border-bottom:1px solid #d0d5dd;padding-bottom:8px}.score{font-size:36px;font-weight:800;color:#2563eb}.scores{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.scores div{border:1px solid #d0d5dd;padding:12px}.question{margin:18px 0;padding:16px;border:1px solid #d0d5dd;border-radius:8px}.meta{color:#667085}.feedback{background:#f2f4f7;padding:12px;margin-top:10px}@media print{button{display:none}}</style></head><body><button onclick="window.print()">Save as PDF</button><p class="meta">MX Venture Lab</p><h1>${escapeReportValue(preparation.jobTitle)}</h1><p>${escapeReportValue(preparation.companyName)} | ${preparation.mode === "mock" ? "AI Mock Interview" : "Interview Preparation"}</p><p class="score">${preparation.report.overallReadinessScore}% ready</p><div class="scores"><div><b>Technical</b><br>${preparation.report.technicalScore}%</div><div><b>Behavioral</b><br>${preparation.report.behavioralScore}%</div><div><b>Communication</b><br>${preparation.report.communicationScore}%</div><div><b>Completion</b><br>${preparation.completionPercentage}%</div></div><h2>Strengths</h2>${list(preparation.strengths)}<h2>Missing Skills</h2>${list(preparation.missingSkills)}<h2>Improvement Areas</h2>${list(preparation.improvementAreas)}<h2>Questions & Feedback</h2>${preparation.questions.map((question, index) => { const answer = preparation.answers.find((item) => item.questionId === question.id); return `<div class="question"><strong>${index + 1}. ${escapeReportValue(question.question)}</strong><p class="meta">${escapeReportValue(question.type)} | ${escapeReportValue(question.focus)}</p>${answer ? `<p><b>Your answer:</b> ${escapeReportValue(answer.answer)}</p><div class="feedback"><b>Status: ${answer.status} | Score: ${answer.score ?? "Pending"}</b><p>${escapeReportValue(answer.feedback)}</p><p><b>Suggested improvement:</b> ${escapeReportValue(answer.suggestedImprovement)}</p></div>` : `<p>${escapeReportValue(question.guidance)}</p>`}</div>`; }).join("")}</body></html>`;
}

export default function JobInterviewPreparation({ initialJobId = "", compact = false }: Props) {
  const { role } = useAuth();
  const [catalog, setCatalog] = useState<AppliedJobPreparationDto[]>([]);
  const [selectedJobId, setSelectedJobId] = useState(initialJobId);
  const [preparation, setPreparation] = useState<InterviewPreparationDto | null>(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [lastSaved, setLastSaved] = useState("");

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
        const loadedPreparation = payload.preparation || null;
        setPreparation(loadedPreparation);
        setSelectedQuestionId((current) => current || loadedPreparation?.questions?.find((question: { id: string }) => !loadedPreparation.answers?.some((answer: { questionId: string; status: string }) => answer.questionId === question.id && answer.status === "submitted"))?.id || loadedPreparation?.questions?.[0]?.id || "");
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

  const saveAnswer = async (action: "draft" | "submit") => {
    if (!preparation || !selectedQuestionId) return;
    setSaving(true);
    setMessage("");
    try {
      const payload = await request(`/api/interview-preparation/${preparation.id}/responses`, { method: "POST", body: JSON.stringify({ question_id: selectedQuestionId, answer, action }) });
      setPreparation(payload.preparation);
      setLastSaved(action === "draft" ? "Draft saved." : "Answer submitted and evaluated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save this answer.");
    } finally {
      setSaving(false);
    }
  };

  const selectedQuestion = preparation?.questions.find((question) => question.id === selectedQuestionId) || preparation?.questions[0];
  const selectedFeedback = preparation?.answers.find((item) => item.questionId === selectedQuestion?.id);
  const selectedQuestionIndex = preparation && selectedQuestion ? preparation.questions.findIndex((question) => question.id === selectedQuestion.id) : 0;

  useEffect(() => {
    if (!selectedQuestion) return;
    setAnswer(preparation?.answers.find((item) => item.questionId === selectedQuestion.id)?.answer || "");
    setLastSaved("");
    setMessage("");
  }, [preparation, selectedQuestion?.id]);

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
        <div className="flex flex-wrap gap-2">{preparation.isPro ? <>{preparation.mode === "basic" ? <Button variant="secondary" disabled={saving} onClick={() => startPreparation("mock", true)}><Play className="h-4 w-4" />Start AI Mock Interview</Button> : null}{preparation.submittedAnswers ? <Button variant="secondary" onClick={() => { const report = window.open("", "_blank"); if (report) { report.document.write(reportHtml(preparation)); report.document.close(); } }}><Download className="h-4 w-4" />Download report</Button> : null}</> : <LinkButton href="/subscriptions" variant="secondary">Upgrade for unlimited interviews</LinkButton>}<Button variant="ghost" disabled={saving} onClick={() => startPreparation(preparation.mode, true)}><RefreshCw className="h-4 w-4" />New question set</Button></div>
      </div>
      {message ? <p className="rounded-md bg-danger/10 px-4 py-3 text-sm font-bold text-danger">{message}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5"><CheckCircle2 className="h-5 w-5 text-success" /><p className="mt-3 text-3xl font-black">{preparation.submittedAnswers}</p><p className="text-sm font-bold text-text-muted">Answers completed</p></Card>
        <Card className="p-5"><Target className="h-5 w-5 text-amber-500" /><p className="mt-3 text-3xl font-black">{preparation.remainingQuestions}</p><p className="text-sm font-bold text-text-muted">Questions remaining</p></Card>
        <Card className="p-5"><BrainCircuit className="h-5 w-5 text-cyan-600" /><p className="mt-3 text-3xl font-black">{preparation.completionPercentage}%</p><p className="text-sm font-bold text-text-muted">Interview completion</p></Card>
        <Card className="p-5"><Gauge className="h-5 w-5 text-primary" /><p className="mt-3 text-3xl font-black">{preparation.report.overallReadinessScore}%</p><p className="text-sm font-bold text-text-muted">Overall readiness</p></Card>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-border dark:bg-white/10"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${preparation.completionPercentage}%` }} /></div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div><h2 className="type-h3">Strengths</h2><div className="mt-3 flex flex-wrap gap-2">{preparation.strengths.map((item) => <Badge key={item} variant="success">{item}</Badge>)}{!preparation.strengths.length ? <p className="type-body">Complete your profile to reveal matched strengths.</p> : null}</div></div>
        <div><h2 className="type-h3">Missing skills</h2><div className="mt-3 flex flex-wrap gap-2">{preparation.missingSkills.map((item) => <Badge key={item}>{item}</Badge>)}{!preparation.missingSkills.length ? <p className="type-body">No direct skill gaps detected.</p> : null}</div></div>
        <div><h2 className="type-h3">Improvement areas</h2><ul className="mt-3 space-y-2 text-sm font-semibold text-text-muted">{preparation.improvementAreas.map((item) => <li key={item}>- {item}</li>)}</ul></div>
      </div>

      {selectedQuestion ? (
        <Card className="overflow-hidden p-0">
          <div className="border-b border-border bg-bg px-5 py-4 dark:border-white/10 dark:bg-white/5 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><Badge variant="primary">Interview Mode</Badge><p className="mt-2 text-sm font-black text-text-main dark:text-white">Question {selectedQuestionIndex + 1} of {preparation.questions.length}</p></div><div className="flex items-center gap-2">{selectedFeedback?.status === "draft" ? <Badge>Draft saved</Badge> : null}{selectedFeedback?.status === "submitted" ? <Badge variant="success">Submitted | {selectedFeedback.score}%</Badge> : null}</div></div>
          </div>
          <div className="p-5 sm:p-6">
            <p className="type-label capitalize">{selectedQuestion.type} | {selectedQuestion.focus}</p>
            <h2 className="type-h2 mt-3">{selectedQuestion.question}</h2>
            <p className="type-body mt-3">{selectedQuestion.guidance}</p>
            <label className="mt-6 block text-sm font-black text-text-main dark:text-white" htmlFor={`answer-${selectedQuestion.id}`}>Your answer</label>
            <textarea id={`answer-${selectedQuestion.id}`} value={answer} onChange={(event) => { setAnswer(event.target.value); setLastSaved(""); }} placeholder="Type your interview answer here..." className="mt-2 min-h-48 w-full rounded-md border border-border bg-surface px-4 py-3 text-sm font-medium outline-none focus:border-primary dark:border-white/10 dark:bg-slate-900" />
            {!preparation.isPro ? <p className="mt-2 text-xs font-semibold text-text-muted">Free plan: {Math.max(0, (preparation.freeSubmissionLimit || 0) - preparation.submittedAnswers)} evaluated submission{Math.max(0, (preparation.freeSubmissionLimit || 0) - preparation.submittedAnswers) === 1 ? "" : "s"} remaining. Drafts do not count.</p> : null}
            {lastSaved ? <p className="mt-3 text-sm font-bold text-success">{lastSaved}</p> : null}

            {selectedFeedback?.status === "submitted" ? (
              <div className="mt-5 border-l-4 border-l-success bg-success/5 p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-lg font-black">AI evaluation</h3><Badge variant="success">{selectedFeedback.score}%</Badge></div>
                <p className="mt-3 text-sm font-semibold text-text-muted">{selectedFeedback.feedback}</p>
                <div className="mt-4 grid gap-4 md:grid-cols-2"><div><p className="type-label text-success">Strengths</p><ul className="mt-2 space-y-1 text-sm font-semibold">{selectedFeedback.strengths.map((item) => <li key={item}>- {item}</li>)}</ul></div><div><p className="type-label text-danger">Weaknesses</p><ul className="mt-2 space-y-1 text-sm font-semibold">{selectedFeedback.improvements.map((item) => <li key={item}>- {item}</li>)}</ul></div></div>
                <p className="mt-4 rounded-md bg-surface px-4 py-3 text-sm font-bold dark:bg-slate-900"><span className="text-primary">Suggested improvement:</span> {selectedFeedback.suggestedImprovement}</p>
              </div>
            ) : null}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button variant="secondary" disabled={selectedQuestionIndex === 0 || saving} onClick={() => setSelectedQuestionId(preparation.questions[selectedQuestionIndex - 1].id)}><ArrowLeft className="h-4 w-4" />Previous</Button>
              <div className="flex flex-wrap gap-2 sm:justify-end"><Button variant="secondary" disabled={saving || !answer.trim()} onClick={() => saveAnswer("draft")}><Save className="h-4 w-4" />Save Draft</Button><Button disabled={saving || answer.trim().length < 20 || (!preparation.isPro && preparation.submittedAnswers >= (preparation.freeSubmissionLimit || 0) && selectedFeedback?.status !== "submitted")} onClick={() => saveAnswer("submit")}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}Submit Answer</Button><Button variant="ghost" disabled={selectedQuestionIndex >= preparation.questions.length - 1 || saving} onClick={() => setSelectedQuestionId(preparation.questions[selectedQuestionIndex + 1].id)}>Next Question<ArrowRight className="h-4 w-4" /></Button></div>
            </div>
          </div>
        </Card>
      ) : null}

      {preparation.submittedAnswers ? (
        <section><div className="flex items-end justify-between gap-3"><div><Badge variant="success">Interview Report</Badge><h2 className="type-h2 mt-2">Performance summary</h2></div>{preparation.isPro ? <Button variant="secondary" onClick={() => { const report = window.open("", "_blank"); if (report) { report.document.write(reportHtml(preparation)); report.document.close(); } }}><Download className="h-4 w-4" />Download report</Button> : null}</div><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Card className="p-5"><p className="type-label">Technical score</p><p className="mt-2 text-3xl font-black">{preparation.report.technicalScore}%</p></Card><Card className="p-5"><p className="type-label">Behavioral score</p><p className="mt-2 text-3xl font-black">{preparation.report.behavioralScore}%</p></Card><Card className="p-5"><p className="type-label">Communication score</p><p className="mt-2 text-3xl font-black">{preparation.report.communicationScore}%</p></Card><Card className="p-5"><p className="type-label">Overall readiness</p><p className="mt-2 text-3xl font-black text-primary">{preparation.report.overallReadinessScore}%</p></Card></div></section>
      ) : null}
    </section>
  );
}
