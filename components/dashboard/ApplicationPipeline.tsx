"use client";

import { useMemo, useState } from "react";
import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";
import { Clock, FileText, MessageSquare } from "lucide-react";
import type { CandidateApplication, ApplicationStage } from "@/types/application";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

const stages: ApplicationStage[] = ["Applied", "Under Review", "Shortlisted", "Interview", "Offer", "Rejected"];

export default function ApplicationPipeline({ applications: initialApplications }: { applications: CandidateApplication[] }) {
  const [applications, setApplications] = useState(initialApplications);
  const grouped = useMemo(() => Object.fromEntries(stages.map((stage) => [stage, applications.filter((app) => app.status === stage)])) as Record<ApplicationStage, CandidateApplication[]>, [applications]);

  function onDragEnd(result: DropResult) {
    if (!result.destination) return;
    const newStatus = result.destination.droppableId as ApplicationStage;
    const applicationId = result.draggableId;
    setApplications((current) => current.map((app) => app.id === applicationId ? { ...app, status: newStatus, updatedAt: new Date().toISOString() } : app));
  }

  return (
    <Card className="p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <Badge variant="primary">Application tracker</Badge>
          <h2 className="mt-2 text-2xl font-black text-text-main dark:text-white">Hiring progress snapshot</h2>
          <p className="mt-1 text-sm text-text-muted dark:text-slate-300">Drag applications across stages as recruiters move you forward.</p>
        </div>
      </div>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {stages.map((stage) => (
            <Droppable droppableId={stage} key={stage}>
              {(provided, snapshot) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className={`min-h-[280px] w-72 shrink-0 rounded-2xl border border-border bg-bg p-3 dark:border-white/10 dark:bg-white/5 ${snapshot.isDraggingOver ? "ring-2 ring-primary/30" : ""}`}>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-black text-text-main dark:text-white">{stage}</h3>
                    <Badge>{grouped[stage].length}</Badge>
                  </div>
                  <div className="space-y-3">
                    {grouped[stage].map((app, index) => (
                      <Draggable draggableId={app.id} index={index} key={app.id}>
                        {(dragProvided) => (
                          <div ref={dragProvided.innerRef} {...dragProvided.draggableProps} {...dragProvided.dragHandleProps}>
                            <Card className="p-4 shadow-soft">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-black text-text-main dark:text-white">{app.role}</p>
                                  <p className="mt-1 text-xs font-semibold text-text-muted dark:text-slate-300">{app.company}</p>
                                </div>
                                <Badge variant={app.matchScore > 80 ? "match-score" : "primary"}>{app.matchScore}%</Badge>
                              </div>
                              <p className="mt-3 flex items-center gap-2 text-xs text-text-muted dark:text-slate-300"><Clock className="h-3.5 w-3.5" /> Updated {new Date(app.updatedAt).toLocaleDateString()}</p>
                              {app.recruiterNotes ? <p className="mt-3 rounded-xl bg-primary/5 p-3 text-xs font-semibold text-text-muted dark:bg-white/5 dark:text-slate-300"><MessageSquare className="mr-1 inline h-3.5 w-3.5" /> {app.recruiterNotes}</p> : null}
                            </Card>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {!grouped[stage].length ? <div className="grid h-36 place-items-center rounded-2xl border border-dashed border-border text-center text-sm font-semibold text-text-muted dark:border-white/10">No {stage.toLowerCase()} applications</div> : null}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </Card>
  );
}
