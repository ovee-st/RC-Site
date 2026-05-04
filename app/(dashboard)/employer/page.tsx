import RecruiterMatches from "@/components/dashboard/RecruiterMatches";
import RecommendedActions from "@/components/dashboard/RecommendedActions";
import EmployerProfile from "@/components/dashboard/EmployerProfile";
import EmployerPostJob from "@/components/dashboard/EmployerPostJob";
import PipelineBoard from "@/components/pipeline/PipelineBoard";
import AccountSettings from "@/components/account/AccountSettings";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import PageContainer from "@/components/layout/PageContainer";
import { StaggerContainer } from "@/components/motion/MotionSystem";

const stats = [
  { label: "Active Jobs", value: 3, note: "Live roles", gradient: "from-blue-500/12 via-blue-500/5 to-transparent" },
  { label: "Top Matches", value: 12, note: "Above 80% fit", gradient: "from-emerald-500/14 via-emerald-500/5 to-transparent" },
  { label: "Applications", value: 8, note: "This week", gradient: "from-cyan-500/12 via-cyan-500/5 to-transparent" },
  { label: "Hired", value: 2, note: "Closed roles", gradient: "from-violet-500/12 via-violet-500/5 to-transparent" }
];

export default function EmployerDashboard() {
  return (
    <PageContainer>
      <div className="mb-6 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <Badge variant="primary" className="type-label text-primary">Recruiter Dashboard</Badge>
          <h1 className="type-h1 mt-3">Hiring command center</h1>
        </div>
        <EmployerPostJob />
      </div>
      <StaggerContainer className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <Card key={item.label} variant="interactive" className={`depth-overlay min-h-32 overflow-hidden bg-gradient-to-br ${item.gradient}`}>
            <div className="depth-content">
              <p className="type-label">{item.label}</p>
              <strong className="mt-3 block text-3xl font-bold text-text-main dark:text-white">{item.value}</strong>
              <p className="type-body mt-2 text-xs">{item.note}</p>
            </div>
          </Card>
        ))}
      </StaggerContainer>
      <section className="mt-6">
        <EmployerProfile />
      </section>
      <section className="mt-6">
        <AccountSettings profileStorageKey="mx_employer_profile" title="Employer Account" />
      </section>
      <section className="mt-6">
        <RecommendedActions />
      </section>
      <div id="matches" className="mt-6"><RecruiterMatches /></div>
      <section id="pipeline" className="mt-6">
        <Card className="depth-primary">
          <div className="mb-6">
            <Badge variant="primary" className="type-label text-primary">ATS Pipeline</Badge>
            <h2 className="type-h2 mt-3">Hiring progress</h2>
          </div>
          <PipelineBoard />
        </Card>
      </section>
    </PageContainer>
  );
}
