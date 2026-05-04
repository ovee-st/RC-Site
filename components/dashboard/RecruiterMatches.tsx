"use client";

import { useMemo, useState } from "react";
import { Check, Mail, Sparkles } from "lucide-react";
import { demoCandidates, demoJobs } from "@/lib/demoData";
import { matchCandidateToJob } from "@/lib/ai/matching";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import PriorityIndicator from "@/components/ui/PriorityIndicator";
import EmptyState from "@/components/ui/EmptyState";
import { StaggerContainer } from "@/components/motion/MotionSystem";
import CandidateInsightHover from "@/components/insights/CandidateInsightHover";
import { cn } from "@/lib/cn";
import { FilePenLine } from "lucide-react";

type CandidateAction = {
  shortlisted?: boolean;
  invited?: boolean;
};

function scoreVariant(score: number) {
  if (score >= 80) return "match-score";
  if (score >= 60) return "primary";
  return "neutral";
}

function scoreTone(score: number) {
  if (score >= 80) return "bg-success";
  if (score >= 60) return "bg-primary";
  return "bg-text-muted";
}

function recommendationFor(score: number, candidateTitle: string) {
  if (score >= 85) return `Strong fit for ${candidateTitle.toLowerCase()} roles. Prioritize invite or shortlist.`;
  if (score >= 65) return `Good fit with some skill gaps. Review profile before inviting.`;
  return `Needs review before outreach. Consider only if role flexibility is available.`;
}

export default function RecruiterMatches() {
  const [selectedJobId, setSelectedJobId] = useState(demoJobs[0].id);
  const [actions, setActions] = useState<Record<string, CandidateAction>>({});
  const selectedJob = demoJobs.find((job) => job.id === selectedJobId) || demoJobs[0];
  const matches = useMemo(
    () => demoCandidates
      .map((candidate) => ({
        candidate,
        match: matchCandidateToJob(candidate, selectedJob)
      }))
      .sort((a, b) => b.match.score - a.match.score),
    [selectedJob]
  );

  const updateAction = (candidateId: string, action: keyof CandidateAction) => {
    setActions((current) => ({
      ...current,
      [candidateId]: {
        ...current[candidateId],
        [action]: true
      }
    }));
  };

  return (
    <Card className="depth-primary">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <Badge variant="primary" className="type-label text-primary">AI Matching</Badge>
          <h2 className="type-h2 mt-3">Top matched candidates</h2>
          <p className="type-body mt-2 max-w-2xl">Select a job and instantly see candidates ranked by skill fit, semantic profile fit, category, and experience level.</p>
        </div>
        <Select value={selectedJobId} onChange={(event) => setSelectedJobId(event.target.value)} className="md:max-w-sm">
          {demoJobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}
        </Select>
      </div>

      <Card className="mt-6 bg-white/70 ring-1 ring-primary/5 dark:bg-white/5">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="type-label">Selected job</p>
            <h3 className="type-h3 mt-1 font-semibold">{selectedJob.title}</h3>
            <p className="type-body mt-1">{selectedJob.company} - {selectedJob.location}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="primary">{selectedJob.category}</Badge>
            <Badge>{selectedJob.experience}</Badge>
            <Badge>{selectedJob.jobType}</Badge>
          </div>
        </div>
      </Card>

      <StaggerContainer className="mt-6 grid gap-4">
        {!matches.length ? (
          <EmptyState
            icon={<FilePenLine size={22} />}
            title="No matches yet"
            message="Improve the job description, add must-have skills, or broaden the category to increase AI matching coverage."
            actionLabel="Review job"
            actionHref="/jobs"
          />
        ) : null}
        {matches.map(({ candidate, match }, index) => {
          const action = actions[candidate.id] || {};
          const topMatch = match.score >= 85;
          const fastMoving = index === 0 || action.invited || action.shortlisted;
          const needsReview = match.score < 60;
          return (
            <CandidateInsightHover
              key={candidate.id}
              strengths={match.matchedSkills.length ? match.matchedSkills : candidate.skills.slice(0, 3)}
              missingSkills={match.missingSkills}
              recommendation={recommendationFor(match.score, candidate.title)}
            >
              <Card
                variant={index === 0 ? "highlighted" : "interactive"}
                className={cn(
                  "grid min-h-[132px] gap-4 bg-white/72 p-4 dark:bg-white/5 lg:grid-cols-[1.1fr_0.95fr_210px]",
                  index === 0 && "border-primary bg-primary/5 ring-4 ring-primary/10 dark:bg-primary/10"
                )}
              >
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-success text-xs font-bold text-white">{candidate.name.slice(0, 2).toUpperCase()}</div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h3 className="text-base font-black text-text-main dark:text-white">{candidate.name}</h3>
                    {index < 3 ? <Badge variant={index === 0 ? "success" : "primary"}>#{index + 1}</Badge> : null}
                    {topMatch ? <PriorityIndicator variant="top" pulse={index === 0} /> : null}
                    {fastMoving ? <PriorityIndicator variant="fast" pulse={index === 0} /> : null}
                    {needsReview ? <PriorityIndicator variant="review" /> : null}
                  </div>
                  <p className="type-body mt-1 text-sm">{candidate.title}</p>
                  <p className="type-body mt-1 text-xs font-semibold">Matched for: {selectedJob.title}</p>
                </div>
              </div>

              <div className="grid content-start gap-3">
                <div>
                  <p className="type-label">Matched skills</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {match.matchedSkills.length ? match.matchedSkills.slice(0, 3).map((skill) => <Badge key={skill} variant="success" className="px-2 py-1">{skill}</Badge>) : <Badge className="px-2 py-1">No direct skill overlap</Badge>}
                  </div>
                </div>
                <div>
                  <p className="type-label">Missing skills</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {match.missingSkills.length ? match.missingSkills.slice(0, 2).map((skill) => <Badge key={skill} className="px-2 py-1">{skill}</Badge>) : <Badge variant="success" className="px-2 py-1">No major gaps</Badge>}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 lg:items-end">
                <Badge variant={scoreVariant(match.score)} className="justify-center px-3 py-1.5 text-xs">{match.score}% match</Badge>
                <div className="w-full lg:max-w-40">
                  <div className="h-1.5 overflow-hidden rounded-full bg-border/70 dark:bg-white/10">
                    <div
                      className={cn("h-full rounded-full transition-all duration-500", scoreTone(match.score))}
                      style={{ width: `${match.score}%` }}
                    />
                  </div>
                </div>
                <div className="grid w-full gap-1 text-[11px] font-bold text-text-muted lg:max-w-40">
                  <div className="flex justify-between gap-2">
                    <span>Skills</span>
                    <span className="text-success">{match.breakdown.skills}%</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span>Experience</span>
                    <span className="text-success">{match.breakdown.experience}%</span>
                  </div>
                </div>
                <div className="mt-auto flex w-full flex-wrap gap-2 transition lg:justify-end lg:opacity-0 lg:group-hover/insight:opacity-100 lg:group-focus-within/insight:opacity-100">
                  <Button
                    variant={action.invited ? "success" : "primary"}
                    className="flex-1 gap-1.5 px-3 py-1.5 text-xs lg:flex-none"
                    onClick={() => updateAction(candidate.id, "invited")}
                  >
                    {action.invited ? <Check size={15} /> : <Mail size={15} />}
                    {action.invited ? "Invited" : "Invite"}
                  </Button>
                  <Button
                    variant={action.shortlisted ? "success" : "secondary"}
                    className="flex-1 gap-1.5 px-3 py-1.5 text-xs lg:flex-none"
                    onClick={() => updateAction(candidate.id, "shortlisted")}
                  >
                    {action.shortlisted ? <Check size={15} /> : <Sparkles size={15} />}
                    {action.shortlisted ? "Shortlisted" : "Shortlist"}
                  </Button>
                </div>
              </div>
              </Card>
            </CandidateInsightHover>
          );
        })}
      </StaggerContainer>
    </Card>
  );
}
