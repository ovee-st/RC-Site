import { analyzeCandidateProfile, type ProfileAnalysisInput } from "@/lib/ai/profile-analysis";
import type { RecruiterDashboardDto } from "@/types/ats";

export type InsightKind = "Observation" | "Recommendation" | "Estimate" | "Prediction";

export type DailyBriefItem = {
  id: string;
  label: string;
  value: string;
  detail: string;
  kind: InsightKind;
};

export type DailyBriefAction = {
  label: string;
  href: string;
  reason: string;
};

export type DailyBriefProgress = {
  label: string;
  value: number;
  detail: string;
};

export type DailyBriefModel = {
  title: string;
  summary: string;
  items: DailyBriefItem[];
  primaryAction: DailyBriefAction;
  progress: DailyBriefProgress[];
};

export type CandidatePortalSnapshot = {
  applications?: Array<{ id: string; status?: string | null; created_at?: string | null; job?: { job_title?: string | null; company_name?: string | null } | null }>;
  interviews?: Array<{ id: string; status?: string | null; scheduled_at?: string | null; application_id?: string | null }>;
  offers?: Array<{ id: string; status?: string | null }>;
  documents?: Array<{ id: string; document_type?: string | null; created_at?: string | null }>;
};

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function buildCandidateDailyBrief(profile: ProfileAnalysisInput, portal?: CandidatePortalSnapshot | null): DailyBriefModel {
  const analysis = analyzeCandidateProfile(profile);
  const applications = portal?.applications || [];
  const upcomingInterviews = (portal?.interviews || [])
    .filter((item) => item.status === "scheduled" && item.scheduled_at && new Date(item.scheduled_at).getTime() >= Date.now())
    .sort((a, b) => new Date(a.scheduled_at || 0).getTime() - new Date(b.scheduled_at || 0).getTime());
  const activeApplications = applications.filter((item) => !/rejected|closed|withdrawn/i.test(String(item.status || "")));
  const progressedApplications = applications.filter((item) => /review|shortlist|interview|offer|hired/i.test(String(item.status || "")));
  const resumeUploaded = (portal?.documents || []).some((item) => /resume|cv/i.test(String(item.document_type || "")));
  const pendingOffers = (portal?.offers || []).filter((item) => /sent|viewed/i.test(String(item.status || ""))).length;

  const items: DailyBriefItem[] = [
    {
      id: "resume-health",
      label: "Resume health",
      value: `${analysis.atsScore}%`,
      detail: analysis.recommendations[0],
      kind: "Observation"
    },
    {
      id: "profile-completion",
      label: "Profile completion",
      value: `${analysis.profileCompletionScore}%`,
      detail: analysis.missingSections.length
        ? `${analysis.missingSections.length} profile ${analysis.missingSections.length === 1 ? "section needs" : "sections need"} attention.`
        : "All core profile sections contain usable information.",
      kind: "Observation"
    }
  ];

  if (portal) {
    items.push({
      id: "application-status",
      label: "Applications",
      value: `${activeApplications.length} active`,
      detail: progressedApplications.length
        ? `${progressedApplications.length} ${progressedApplications.length === 1 ? "application has" : "applications have"} progressed beyond submission.`
        : applications.length ? "No application status changes require attention yet." : "No applications have been submitted yet.",
      kind: "Observation"
    });

    if (upcomingInterviews[0]?.scheduled_at) {
      items.push({
        id: "next-interview",
        label: "Next interview",
        value: formatDateTime(upcomingInterviews[0].scheduled_at),
        detail: "This schedule comes from your current candidate portal interview record.",
        kind: "Observation"
      });
    } else if (pendingOffers) {
      items.push({
        id: "offer-response",
        label: "Offers awaiting response",
        value: String(pendingOffers),
        detail: "Review the offer details in your candidate portal before the response window closes.",
        kind: "Recommendation"
      });
    }
  }

  if (analysis.missingSkills.length) {
    items.push({
      id: "skill-gap",
      label: "Skill gap summary",
      value: analysis.missingSkills.slice(0, 3).join(", "),
      detail: "These are profile-level gaps detected by the existing candidate profile analyzer, not a hiring decision.",
      kind: "Recommendation"
    });
  }

  let primaryAction: DailyBriefAction;
  if (analysis.profileCompletionScore < 75) {
    primaryAction = { label: "Complete profile", href: "/candidate?view=profile", reason: `Recommended because your profile is ${analysis.profileCompletionScore}% complete and missing information limits matching context.` };
  } else if (portal && !resumeUploaded) {
    primaryAction = { label: "Upload resume", href: "/candidate?tab=resume", reason: "Recommended because no resume is available in your candidate document records." };
  } else if (upcomingInterviews.length) {
    primaryAction = { label: "Prepare for interview", href: "/candidate?tab=interview-prep", reason: "Recommended because a scheduled interview is your nearest time-sensitive career event." };
  } else if (!applications.length) {
    primaryAction = { label: "View recommended jobs", href: "/jobs", reason: "Recommended because you have no recorded applications and your profile can now be used to evaluate open roles." };
  } else {
    primaryAction = { label: "Review applications", href: "/candidate?tab=applied", reason: "Recommended because your active applications are the clearest current source of career progress." };
  }

  const applicationActivity = applications.length ? clamp((progressedApplications.length / applications.length) * 100) : 0;
  const interviewReadiness = upcomingInterviews.length ? clamp(Math.max(analysis.atsScore, 55)) : clamp(analysis.atsScore * 0.75);

  return {
    title: "Today's Career Brief",
    summary: portal
      ? "Verified profile and candidate-portal signals are organized below. Recommendations remain guidance and include their reasoning."
      : "Your profile signals are ready. Activity data will appear as verified records become available.",
    items,
    primaryAction,
    progress: [
      { label: "Career progress", value: clamp((analysis.profileCompletionScore + applicationActivity) / 2), detail: "Profile completion and recorded application movement." },
      { label: "Resume completion", value: analysis.atsScore, detail: "Existing profile-analysis ATS score." },
      { label: "Application activity", value: applicationActivity, detail: "Share of applications that progressed beyond submission." },
      { label: "Interview readiness", value: interviewReadiness, detail: "Profile evidence readiness; interview preparation remains role-specific." }
    ]
  };
}

export function buildEmployerDailyBrief(metrics?: RecruiterDashboardDto | null): DailyBriefModel {
  const hasMetrics = Boolean(metrics);
  const pipeline = metrics?.pipelineFunnel || [];
  const activeCandidates = pipeline.reduce((sum, stage) => sum + stage.count, 0);
  const pipelineHealth = pipeline.length ? clamp(pipeline.reduce((sum, stage) => sum + stage.conversion, 0) / pipeline.length) : 0;
  const slowestStage = [...(metrics?.timeInStage || [])].sort((a, b) => b.averageHours - a.averageHours)[0];
  const responseRate = metrics?.aiRecommendationAcceptance ?? 0;

  const items: DailyBriefItem[] = hasMetrics ? [
    { id: "new-candidates", label: "New candidates", value: String(metrics?.applicationsToday || 0), detail: "Applications recorded since the start of today.", kind: "Observation" },
    { id: "interviews", label: "Upcoming interviews", value: String(metrics?.openInterviews || 0), detail: "Scheduled interviews that have not yet occurred.", kind: "Observation" },
    { id: "offers", label: "Active offers", value: String(metrics?.activeOffers || 0), detail: "Draft, approval-stage, sent, or viewed offers currently requiring workflow attention.", kind: "Observation" },
    { id: "tasks", label: "Pending tasks", value: String(metrics?.pendingTasks || 0), detail: "Open recruiting tasks assigned within the existing ATS workflow.", kind: metrics?.pendingTasks ? "Recommendation" : "Observation" }
  ] : [
    { id: "workspace-ready", label: "Hiring workspace", value: "Ready", detail: "Post or import a role to begin receiving verified pipeline and candidate signals.", kind: "Recommendation" }
  ];

  if (slowestStage?.averageHours > 0) {
    items.push({ id: "bottleneck", label: "Recruitment bottleneck", value: slowestStage.stage, detail: `Candidates spend an average of ${Math.round(slowestStage.averageHours)} hours in this stage.`, kind: "Observation" });
  }

  let primaryAction: DailyBriefAction;
  if (!metrics || (!activeCandidates && !metrics.applicationsToday)) {
    primaryAction = { label: "Create or import a role", href: "/dashboard/employer/jobs/import", reason: "Recommended because the ATS has no active candidate pipeline to review yet." };
  } else if (metrics.pendingTasks > 0) {
    primaryAction = { label: "Review hiring tasks", href: "/employer#pipeline", reason: `Recommended because ${metrics.pendingTasks} recruiting ${metrics.pendingTasks === 1 ? "task is" : "tasks are"} still open.` };
  } else if (metrics.applicationsToday > 0) {
    primaryAction = { label: "Review candidates", href: "/employer/candidates", reason: `Recommended because ${metrics.applicationsToday} new ${metrics.applicationsToday === 1 ? "application arrived" : "applications arrived"} today.` };
  } else if (metrics.openInterviews > 0) {
    primaryAction = { label: "Open interview workflow", href: "/employer#pipeline", reason: "Recommended because scheduled interviews are the nearest active hiring milestone." };
  } else {
    primaryAction = { label: "Build talent pool", href: "/employer/talent-crm", reason: "Recommended because there are no urgent tasks; this is a useful time to retain qualified future candidates." };
  }

  const velocityScore = metrics?.hiringVelocityDays == null ? 0 : clamp(100 - metrics.hiringVelocityDays * 5);
  return {
    title: "Today's Hiring Brief",
    summary: hasMetrics
      ? "Current ATS records are summarized below. Observations are factual; recommendations explain the workflow signal behind them."
      : "Your hiring workspace is ready. Verified activity will appear after your first role or candidate interaction.",
    items,
    primaryAction,
    progress: [
      { label: "Hiring progress", value: pipelineHealth, detail: "Average conversion across current ATS stages." },
      { label: "Pipeline health", value: activeCandidates ? clamp(pipelineHealth + Math.min(20, activeCandidates)) : 0, detail: "Stage conversion with active pipeline coverage." },
      { label: "Recruitment velocity", value: velocityScore, detail: metrics?.hiringVelocityDays == null ? "Available after a complete hire cycle." : `Based on ${metrics.hiringVelocityDays} days average hiring velocity.` },
      { label: "AI recommendation response", value: responseRate, detail: metrics?.aiRecommendationAcceptance == null ? "Available after recruiter decisions are recorded." : "Share of recorded AI recommendations accepted by recruiters." }
    ]
  };
}
