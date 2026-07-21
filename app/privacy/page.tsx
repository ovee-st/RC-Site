import type { Metadata } from "next";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Container from "@/components/layout/Container";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for MX Venture Lab users, candidates, employers, and platform visitors.",
  alternates: { canonical: "/privacy" }
};

const sections = [
  {
    title: "User Accounts",
    body: "When you create an MXVL account, we may collect your name, email address, phone number, role, login activity, profile preferences, and account settings. This information is used to provide secure access, personalize platform experiences, and support account management."
  },
  {
    title: "Employer Accounts",
    body: "Employer accounts may include company details, contact persons, business identity information, job posts, subscription records, payment request details, recruiter accounts, and hiring activity. We use this information to operate employer dashboards, recruitment workflows, subscription services, and support communications."
  },
  {
    title: "Candidate Accounts",
    body: "Candidate accounts may include profile information, skills, work history, education, certificates, application history, interview status, AI match insights, and communication preferences. Candidates control the accuracy of information submitted through their profile."
  },
  {
    title: "Data Collection",
    body: "MXVL collects information directly from users, generated through platform activity, submitted by employers or candidates, and produced by operational systems such as notifications, support tickets, matching workflows, and analytics tools."
  },
  {
    title: "Resume Storage",
    body: "Candidate resumes, CV files, certificates, and profile documents may be stored to support recruitment matching, employer review, candidate dashboard features, and managed hiring services. Users should avoid uploading documents that contain unnecessary sensitive personal information."
  },
  {
    title: "Recruitment Information",
    body: "Recruitment data may include job applications, shortlists, interview notes, employer feedback, candidate match scores, screening notes, and hiring outcomes. MXVL uses this information to provide hiring services and improve recruitment accuracy."
  },
  {
    title: "Cookies",
    body: "MXVL may use cookies, local storage, and similar technologies for authentication, theme preferences, session continuity, security, analytics, and feature reliability. Browser settings may allow users to restrict some storage, but doing so may affect platform functionality."
  },
  {
    title: "Security",
    body: "We apply reasonable technical and organizational safeguards to protect user information, including account authentication, role-aware access, restricted administrative tools, and secure storage practices. No online system can guarantee absolute security."
  },
  {
    title: "User Rights",
    body: "Users may request updates, corrections, or review of their account information where legally and operationally appropriate. Requests may require identity verification and may be limited by legal, security, billing, or recruitment recordkeeping obligations."
  },
  {
    title: "Contact Information",
    body: "For privacy-related questions, account data requests, or security concerns, contact MX Venture Lab through the Contact page. Payment-related questions may reference the official bKash/Nagad number: 01979611120."
  }
];

export default function PrivacyPage() {
  return (
    <main className="bg-bg py-16 dark:bg-slate-950">
      <Container>
        <div className="max-w-3xl">
          <Badge variant="primary">Privacy</Badge>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-text-main dark:text-white md:text-5xl">Privacy Policy</h1>
          <p className="mt-5 text-base leading-8 text-text-muted dark:text-slate-300">This Privacy Policy explains how MX Venture Lab collects, uses, stores, and protects information related to visitors, candidates, employers, support users, and platform accounts.</p>
        </div>
        <div className="mt-10 grid gap-5">
          {sections.map((section) => (
            <Card key={section.title} className="rounded-md p-6">
              <h2 className="text-xl font-black text-text-main dark:text-white">{section.title}</h2>
              <p className="mt-3 text-sm leading-7 text-text-muted dark:text-slate-300">{section.body}</p>
            </Card>
          ))}
        </div>
      </Container>
    </main>
  );
}
