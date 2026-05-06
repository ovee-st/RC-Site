"use client";

import { Award, CheckCircle2, Code2, GraduationCap } from "lucide-react";
import type { SkillAssessment } from "@/types/candidate";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

export default function AssessmentSection({ assessments }: { assessments: SkillAssessment[] }) {
  return (
    <Card className="p-6">
      <Badge variant="primary">Skills & assessments</Badge>
      <h2 className="mt-2 text-2xl font-black dark:text-white">Skill growth dashboard</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {assessments.map((assessment) => (
          <div key={assessment.id} className="rounded-3xl border border-border bg-bg p-5 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-start justify-between">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">{assessment.category === "Coding" ? <Code2 /> : <GraduationCap />}</div>
              <Badge variant={assessment.status === "Completed" ? "success" : "primary"}>{assessment.status}</Badge>
            </div>
            <h3 className="mt-4 font-black dark:text-white">{assessment.title}</h3>
            <p className="mt-1 text-sm text-text-muted dark:text-slate-300">{assessment.summary}</p>
            <div className="mt-4 flex items-center justify-between text-sm font-bold"><span>{assessment.level}</span><span>{assessment.score}%</span></div>
            <div className="mt-2 h-2 rounded-full bg-border dark:bg-white/10"><div className="h-full rounded-full bg-success" style={{ width: `${assessment.score}%` }} /></div>
            <p className="mt-4 inline-flex items-center gap-2 text-xs font-black text-success"><Award className="h-4 w-4" /> Level progression active</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
