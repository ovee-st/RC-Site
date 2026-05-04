"use client";

import { DragDropContext, Draggable, Droppable, DropResult } from "@hello-pangea/dnd";
import { useState } from "react";
import type { Application } from "@/types";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { demoJobs } from "@/lib/demoData";
import { cn } from "@/lib/cn";
import { AlertTriangle, ArrowRight, BarChart3, Check, Sparkles, TrendingDown, UsersRound, X } from "lucide-react";

const stages: Application["status"][] = ["Applied", "Shortlisted", "Interview", "Offer", "Hired"];

const initialApplications: Application[] = [
  { id: "app-1", jobId: "job-1", candidateId: "candidate-1", name: "Md Jahid Anwar", title: "Administrative HR", matchScore: 94, status: "Applied", skills: ["Admin", "Excel"] },
  { id: "app-2", jobId: "job-1", candidateId: "candidate-2", name: "Nusrat Jahan", title: "Support Executive", matchScore: 78, status: "Shortlisted", skills: ["CRM", "Communication"] },
  { id: "app-3", jobId: "job-3", candidateId: "candidate-3", name: "Rahim Ahmed", title: "Frontend Developer", matchScore: 91, status: "Interview", skills: ["React", "TypeScript"] }
];

function getAppliedDepartment(application: Application) {
  return demoJobs.find((job) => job.id === application.jobId)?.category || application.title;
}

function nextStage(status: Application["status"]) {
  const index = stages.indexOf(status);
  return stages[Math.min(index + 1, stages.length - 1)];
}

function aiRecommendation(application: Application) {
  if (application.matchScore >= 90) return "Strong AI fit. Move this candidate forward quickly while engagement is warm.";
  if (application.matchScore >= 75) return "Good fit. Shortlist and validate experience before offer.";
  return "Needs review. Check missing skills before moving forward.";
}

export default function PipelineBoard() {
  const [applications, setApplications] = useState(initialApplications);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const selectedApplication = applications.find((item) => item.id === selectedApplicationId) || null;
  const stageCounts = stages.reduce<Record<Application["status"], number>>((counts, stage) => {
    counts[stage] = applications.filter((item) => item.status === stage).length;
    return counts;
  }, {} as Record<Application["status"], number>);
  const totalApplications = applications.length || 1;
  const largestStage = stages.reduce((largest, stage) => stageCounts[stage] > stageCounts[largest] ? stage : largest, stages[0]);
  const interviewDrop = stageCounts.Interview
    ? Math.max(0, Math.round(((stageCounts.Interview - stageCounts.Offer) / stageCounts.Interview) * 100))
    : 0;
  const shortlistShare = Math.round((stageCounts.Shortlisted / totalApplications) * 100);
  const bottleneckStage = stageCounts[largestStage] >= 2 ? largestStage : null;

  const updateStage = async (applicationId: string, status: Application["status"]) => {
    setApplications((items) => items.map((item) => item.id === applicationId ? { ...item, status } : item));
    await fetch("/api/application/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ application_id: applicationId, new_status: status.toLowerCase() })
    }).catch(() => null);
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    if (result.destination.droppableId === result.source.droppableId) return;
    updateStage(result.draggableId, result.destination.droppableId as Application["status"]);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="mb-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="depth-overlay bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
          <div className="depth-content flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
              <BarChart3 size={20} />
            </div>
            <div>
              <Badge variant={bottleneckStage ? "danger" : "success"} className="mb-3">
                {bottleneckStage ? "Bottleneck detected" : "Pipeline healthy"}
              </Badge>
              <h3 className="type-h3 font-bold">
                {bottleneckStage === "Shortlisted"
                  ? "Too many candidates stuck in shortlist"
                  : bottleneckStage
                    ? `${bottleneckStage} stage needs attention`
                    : "Candidate flow is moving steadily"}
              </h3>
              <p className="type-body mt-2">
                {bottleneckStage === "Shortlisted"
                  ? "Move strong profiles forward or decline weak fits to keep hiring momentum."
                  : bottleneckStage
                    ? `Review candidates in ${bottleneckStage.toLowerCase()} and decide the next action.`
                    : "Keep advancing high-match candidates while the pool is warm."}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-orange-400/10 text-orange-600 ring-1 ring-orange-400/20 dark:text-orange-300">
              <TrendingDown size={20} />
            </div>
            <div>
              <Badge variant={interviewDrop >= 50 ? "danger" : "primary"} className="mb-3">
                Stage conversion insight
              </Badge>
              <h3 className="type-h3 font-bold">{interviewDrop}% drop after interview stage</h3>
              <p className="type-body mt-2">
                {interviewDrop >= 50
                  ? "Review interview criteria or calibrate screening before candidates reach this stage."
                  : "Interview conversion is acceptable. Watch for delays if candidate volume rises."}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        {stages.map((stage) => {
          const count = stageCounts[stage];
          const share = Math.round((count / totalApplications) * 100);
          const bottleneck = stage === largestStage && count >= 2;
          return (
            <Card key={stage} className={cn("p-4", bottleneck && "border-orange-400/30 bg-orange-400/5 dark:bg-orange-400/10")}>
              <div className="flex items-center justify-between gap-2">
                <p className="type-label">{stage}</p>
                {bottleneck ? <AlertTriangle size={15} className="text-orange-500" /> : null}
              </div>
              <strong className="mt-2 block text-2xl font-bold text-text-main dark:text-white">{count}</strong>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-border/70 dark:bg-white/10">
                <div
                  className={cn("h-full rounded-full transition-all duration-500", bottleneck ? "bg-orange-400" : "bg-primary")}
                  style={{ width: `${share}%` }}
                />
              </div>
            </Card>
          );
        })}
      </div>

      {shortlistShare >= 30 ? (
        <div className="mb-6 rounded-2xl border border-orange-400/20 bg-orange-400/8 p-4 text-sm font-semibold text-orange-700 shadow-soft dark:bg-orange-400/10 dark:text-orange-300">
          Too many candidates stuck in shortlist — move forward or decline low-priority profiles to reduce decision drag.
        </div>
      ) : null}

      <div className="grid grid-cols-5 gap-3">
        {stages.map((stage) => {
          const stageApplications = applications.filter((item) => item.status === stage);
          const stageBottleneck = stage === largestStage && stageApplications.length >= 2;
          return (
            <Droppable droppableId={stage} key={stage}>
              {(provided, snapshot) => (
                <Card
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    "flex h-full min-h-[330px] min-w-0 flex-col bg-white/72 p-4 transition dark:bg-white/5",
                    stageBottleneck && "border-orange-400/35 bg-orange-400/5 ring-4 ring-orange-400/10 dark:bg-orange-400/10",
                    snapshot.isDraggingOver && "border-primary ring-4 ring-primary/10"
                  )}
                >
                  <div className="mb-3 flex items-center justify-between gap-2 px-1">
                    <div>
                      <h3 className="text-base font-black text-text-main dark:text-white">{stage}</h3>
                      <p className="type-body mt-1 text-[11px]">{Math.round((stageApplications.length / totalApplications) * 100)}% of pipeline</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {stageBottleneck ? <Badge variant="danger" className="hidden px-2 py-1 text-[10px] xl:inline-flex">Bottleneck</Badge> : null}
                      <Badge className="px-2 py-1 text-[11px]">{stageApplications.length}</Badge>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    {stageApplications.map((application, index) => (
                      <Draggable draggableId={application.id} index={index} key={application.id}>
                        {(dragProvided, dragSnapshot) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            {...dragProvided.dragHandleProps}
                          >
                            <Card
                              variant="interactive"
                              onClick={() => setSelectedApplicationId(application.id)}
                              className={cn(
                                "cursor-pointer bg-surface p-3 active:cursor-grabbing dark:bg-slate-900/90",
                                dragSnapshot.isDragging && "shadow-md ring-4 ring-primary/10"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-success text-[11px] font-bold text-white">
                                  {application.name.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h4 className="truncate text-sm font-black text-text-main dark:text-white">{application.name}</h4>
                                  <p className="truncate text-xs font-semibold text-text-muted dark:text-slate-300">
                                    {getAppliedDepartment(application)}
                                  </p>
                                </div>
                              </div>
                            </Card>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {!stageApplications.length ? (
                      <EmptyState
                        icon={<UsersRound size={20} />}
                        title={`No ${stage.toLowerCase()}`}
                        message="Candidates appear here as they move."
                        className="p-3"
                      />
                    ) : null}
                  </div>
                </Card>
              )}
            </Droppable>
          );
        })}
      </div>
      {selectedApplication ? (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-transparent p-4">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="Close pipeline candidate details"
            onClick={() => setSelectedApplicationId(null)}
          />
          <Card className="relative w-full max-w-xl p-5 shadow-elevated">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <Badge variant="primary" className="type-label text-primary">AI Overview</Badge>
                <h3 className="type-h2 mt-3">{selectedApplication.name}</h3>
                <p className="type-body mt-1">{getAppliedDepartment(selectedApplication)}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApplicationId(null)}
                className="rounded-full p-2 text-text-muted transition hover:bg-primary/5 hover:text-primary"
                aria-label="Close overview"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4">
              <div className="rounded-xl border border-border bg-bg p-4 dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-center justify-between gap-3">
                  <p className="type-label">AI Match Score</p>
                  <Badge variant={selectedApplication.matchScore >= 85 ? "match-score" : "primary"}>{selectedApplication.matchScore}%</Badge>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-border/70 dark:bg-slate-800">
                  <div
                    className={cn("h-full rounded-full", selectedApplication.matchScore >= 85 ? "bg-success" : "bg-primary")}
                    style={{ width: `${selectedApplication.matchScore}%` }}
                  />
                </div>
                <p className="type-body mt-3">{aiRecommendation(selectedApplication)}</p>
              </div>

              <div className="rounded-xl border border-border bg-bg p-4 dark:border-slate-700 dark:bg-slate-900">
                <p className="type-label">Matched Skills</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedApplication.skills.map((skill) => <Badge key={skill} variant="success">{skill}</Badge>)}
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-4">
              <Button
                type="button"
                variant={selectedApplication.status === "Shortlisted" ? "success" : "secondary"}
                className="gap-1.5 px-3 py-2 text-xs"
                onClick={() => updateStage(selectedApplication.id, "Shortlisted")}
              >
                {selectedApplication.status === "Shortlisted" ? <Check className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                Shortlist
              </Button>
              <Button
                type="button"
                className="gap-1.5 px-3 py-2 text-xs"
                disabled={selectedApplication.status === "Hired"}
                onClick={() => updateStage(selectedApplication.id, nextStage(selectedApplication.status))}
              >
                <ArrowRight className="h-3.5 w-3.5" />
                Move
              </Button>
              <Button
                type="button"
                variant={selectedApplication.status === "Offer" ? "success" : "secondary"}
                className="gap-1.5 px-3 py-2 text-xs"
                onClick={() => updateStage(selectedApplication.id, "Offer")}
              >
                Offer
              </Button>
              <Button
                type="button"
                variant={selectedApplication.status === "Hired" ? "success" : "primary"}
                className="gap-1.5 px-3 py-2 text-xs"
                onClick={() => updateStage(selectedApplication.id, "Hired")}
              >
                Hire
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </DragDropContext>
  );
}
