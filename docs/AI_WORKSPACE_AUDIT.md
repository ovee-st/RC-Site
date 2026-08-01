# MXVL AI Workspace Capability Audit

## Orchestration rule

The AI Workspace is an entry point into existing capabilities. It must not introduce a second implementation of matching, resume analysis, candidate intelligence, interview preparation, recruiting assistance, or job importing.

## Existing capability map

| Capability | Existing business logic | Existing API/UI | Daily Brief reuse |
| --- | --- | --- | --- |
| Candidate profile and resume analysis | `lib/ai/profile-analysis.ts`, `lib/ai/atsScore.ts` | `components/candidate/AIProfileCoach.tsx`, `components/dashboard/ResumeSection.tsx` | Uses `analyzeCandidateProfile()` for profile completion, resume health, missing sections, and explainable guidance. |
| Explainable job matching | `lib/ai/matching.ts`, `lib/ai/candidates/matchEngine.ts`, `lib/ai/candidates/evidenceEngine.ts` | `/api/match`, `/api/candidates/match`, `components/dashboard/JobRecommendations.tsx` | Links to the existing jobs/matching experience. It does not calculate a parallel job recommendation set. |
| Candidate intelligence | `lib/ai/candidates/candidateProfiler.ts`, `strengthAssessment.ts`, `riskAssessment.ts`, `skillGap.ts`, `confidenceEngine.ts` | `/api/candidates/analyze`, `/api/candidates/[candidateId]`, `components/candidates/CandidateIntelligencePanel.tsx` | Employer workspace links directly to the existing candidate-intelligence surface. |
| AI Hiring Copilot and rediscovery | `lib/ai/candidates/copilot.ts`, `comparison.ts`, `decisionAudit.ts` | `/api/candidates/copilot`, `/api/candidates/compare`, `/api/candidates/audit`, Talent CRM workspace | Employer workspace links to existing candidate and Talent CRM workflows. |
| Job-specific interview preparation | `lib/interviewPreparation.ts`, `lib/interviewPreparationServer.ts` | `/api/interview-preparation`, `/api/interview-preparation/[sessionId]/responses`, `components/candidate/JobInterviewPreparation.tsx` | Candidate workspace links to the current interview-preparation session flow when an interview is scheduled. |
| Interview pack generation | `lib/ai/interviewGenerator.ts`, `lib/ai/screeningGenerator.ts` | `/api/jobs/interview-pack`, `/api/jobs/screening` | Employer recommendations route recruiters into the existing candidate/pipeline workflow. |
| AI Job Importer | `lib/import/jobExtractor.ts`, `jobEnricher.ts`, `duplicateChecker.ts` | `/api/jobs/import`, `components/jobs/JobImporter.tsx` | Employer workspace links directly to the importer; no extraction logic is duplicated. |
| Recruiting assistant | `lib/ai/recruitingOpenAi.ts`, `recruitingPrompts.ts`, `jobReviewer.ts`, `jobImprover.ts` | `/api/jobs/review`, `/api/jobs/improve`, recruiting assistant tests/history | Daily Brief exposes contextual job actions without generating new job copy. |
| ATS and pipeline intelligence | Existing enterprise workflow and dashboard aggregation | `/api/dashboard/recruiter`, `/api/interviews`, recruitment workflow UI | Employer brief consumes the existing recruiter dashboard DTO for tasks, interviews, offers, velocity, and pipeline health. |
| Candidate application portal | Existing candidate portal aggregation | `/api/candidate-portal`, candidate portal UI | Candidate brief consumes verified applications, interviews, offers, and document records. |

## Daily Brief data policy

- **Observation**: derived only from authenticated profile, candidate portal, or recruiter dashboard records.
- **Recommendation**: deterministic next action with an explicit reason tied to an observed signal.
- **Estimate** and **Prediction**: supported by the UI contract but not emitted unless an existing source provides a defensible estimate or prediction.
- Demo records are not presented as verified Daily Brief activity.
- A failed lower-priority API request does not block the greeting or profile guidance.
- The workspace uses current routes and APIs and creates no new database table, AI prompt, model call, or scoring engine.
