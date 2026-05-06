"use client";

import { Award, CheckCircle2, Code2, GraduationCap } from "lucide-react";
import type { SkillAssessment } from "@/types/candidate";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

export default function AssessmentSection({ assessments }: { assessments: SkillAssessment[] }) {
  return (
    <Card className="h-[330px] overflow-hidden p-4">
      <Badge variant="primary">Skills & assessments</Badge>
      <h2 className="mt-1 text-lg font-black dark:text-white">Skill growth dashboard</h2>
      <div className="mt-4 grid max-h-[260px] gap-3 overflow-y-auto pr-1 md:grid-cols-2 xl:grid-cols-3">
        {assessments.map((assessment) => (
          <div key={assessment.id} className="rounded-2xl border border-border bg-bg p-3 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-start justify-between">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">{assessment.category === "Coding" ? <Code2 className="h-4 w-4" /> : <GraduationCap className="h-4 w-4" />}</div>
              <Badge variant={assessment.status === "Completed" ? "success" : "primary"}>{assessment.status}</Badge>
            </div>
            <h3 className="mt-3 line-clamp-1 text-sm font-black dark:text-white">{assessment.title}</h3>
            <p className="mt-1 line-clamp-2 text-xs text-text-muted dark:text-slate-300">{assessment.summary}</p>
            <div className="mt-3 flex items-center justify-between text-xs font-bold"><span>{assessment.level}</span><span>{assessment.score}%</span></div>
            <div className="mt-1.5 h-1.5 rounded-full bg-border dark:bg-white/10"><div className="h-full rounded-full bg-success" style={{ width: `${assessment.score}%` }} /></div>
            <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-black text-success"><Award className="h-3.5 w-3.5" /> Level progression active</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
