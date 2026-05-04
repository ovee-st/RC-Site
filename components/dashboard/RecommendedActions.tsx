"use client";

import { useMemo, useState } from "react";
import { Check, Mail, SearchCheck, Sparkles, Wrench } from "lucide-react";
import { demoCandidates, demoJobs } from "@/lib/demoData";
import { matchCandidateToJob } from "@/lib/ai/matching";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { Button, LinkButton } from "@/components/ui/Button";
import PriorityIndicator from "@/components/ui/PriorityIndicator";
import { StaggerContainer } from "@/components/motion/MotionSystem";
import { cn } from "@/lib/cn";

type RecommendationAction = {
  id: string;
  title: string;
  description: string;
  badge: string;
  icon: typeof Mail;
  tone: "primary" | "success" | "danger";
  actionLabel: string;
  href?: string;
};

function buildRecommendations(): RecommendationAction[] {
  const allMatches = demoJobs.flatMap((job) =>
    demoCandidates.map((candidate) => ({
      job,
      candidate,
      match: matchCandidateToJob(candidate, job)
    }))
  );

  const topMatch = [...allMatches].sort((a, b) => b.match.score - a.match.score)[0];
  const strongMatches = allMatches.filter(({ match }) => match.score >= 85);
  const lowPoolJob = demoJobs
    .map((job) => ({
      job,
      strongPool: demoCandidates.filter((candidate) => matchCandidateToJob(candidate, job).score >= 70).length
    }))
    .sort((a, b) => a.strongPool - b.strongPool)[0];

  return [
    {
      id: "invite-top-match",
      title: `Invite ${topMatch.candidate.name}`,
      description: `${topMatch.match.score}% match for "${topMatch.job.title}" with strong skill and experience alignment.`,
      badge: "High match, low friction",
      icon: Mail,
      tone: "success",
      actionLabel: "Invite"
    },
    {
      id: "review-strong-matches",
      title: `Review ${strongMatches.length} candidates above 85% match`,
      description: "These profiles are likely ready for recruiter screening and shortlisting.",
      badge: "Fast shortlist",
      icon: SearchCheck,
      tone: "primary",
      actionLabel: "Review",
      href: "#matches"
    },
    {
      id: "improve-low-pool",
      title: `"${lowPoolJob.job.title}" has a low match pool`,
      description: "Consider broadening required skills or adjusting experience level to improve candidate coverage.",
      badge: "Optimization tip",
      icon: Wrench,
      tone: "danger",
      actionLabel: "Review job",
      href: "/jobs"
    }
  ];
}

const toneStyles = {
  primary: "from-primary/14 via-primary/5 to-transparent",
  success: "from-success/16 via-success/5 to-transparent",
  danger: "from-danger/12 via-danger/5 to-transparent"
};

export default function RecommendedActions() {
  const recommendations = useMemo(() => buildRecommendations(), []);
  const [completedActions, setCompletedActions] = useState<Record<string, boolean>>({});

  return (
    <Card className="depth-primary overflow-hidden">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Badge variant="primary" className="type-label text-primary">
            <Sparkles size={13} className="mr-1.5" />
            AI Recommendations
          </Badge>
          <h2 className="type-h2 mt-3">Recommended actions</h2>
          <p className="type-body mt-2 max-w-2xl">
            Proactive next steps generated from match strength, role coverage, and hiring urgency.
          </p>
        </div>
        <Badge variant="success" className="w-fit">Live hiring assistant</Badge>
      </div>

      <StaggerContainer className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {recommendations.map((item) => {
          const Icon = item.icon;
          const isDone = completedActions[item.id];

          return (
            <Card
              key={item.id}
              variant="interactive"
              className={cn("depth-overlay flex min-h-64 flex-col justify-between overflow-hidden bg-gradient-to-br", toneStyles[item.tone])}
            >
              <div className="depth-content">
                <div className="flex items-start justify-between gap-4">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-surface text-primary shadow-soft ring-1 ring-border dark:bg-white/10 dark:text-blue-300 dark:ring-white/10">
                    <Icon size={19} />
                  </div>
                  <Badge variant={item.tone === "danger" ? "danger" : item.tone}>{item.badge}</Badge>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.id === "invite-top-match" ? <PriorityIndicator variant="top" pulse /> : null}
                  {item.id === "review-strong-matches" ? <PriorityIndicator variant="fast" pulse /> : null}
                  {item.id === "improve-low-pool" ? <PriorityIndicator variant="review" pulse /> : null}
                </div>
                <h3 className="type-h3 mt-5 font-bold leading-snug">{item.title}</h3>
                <p className="type-body mt-3">{item.description}</p>
              </div>

              <div className="depth-content mt-6 flex flex-wrap gap-3">
                {item.href ? (
                  <LinkButton href={item.href} variant={item.tone === "success" ? "success" : "primary"} className="flex-1 px-4 py-2 lg:flex-none">
                    {item.actionLabel}
                  </LinkButton>
                ) : (
                  <Button
                    variant={isDone ? "success" : item.tone === "success" ? "success" : "primary"}
                    className="flex-1 gap-2 px-4 py-2 lg:flex-none"
                    onClick={() => setCompletedActions((current) => ({ ...current, [item.id]: true }))}
                  >
                    {isDone ? <Check size={15} /> : <Icon size={15} />}
                    {isDone ? "Done" : item.actionLabel}
                  </Button>
                )}
                <Button variant="ghost" className="px-4 py-2">Dismiss</Button>
              </div>
            </Card>
          );
        })}
      </StaggerContainer>
    </Card>
  );
}
