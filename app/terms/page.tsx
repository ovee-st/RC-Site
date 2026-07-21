import type { Metadata } from "next";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Container from "@/components/layout/Container";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms and Conditions for MX Venture Lab users, employers, candidates, and subscribers.",
  alternates: { canonical: "/terms" }
};

const terms = [
  {
    title: "User Responsibilities",
    body: "Users must provide accurate account information, keep login credentials secure, use the platform lawfully, and avoid submitting misleading, harmful, or unauthorized content. Users are responsible for activity performed through their accounts."
  },
  {
    title: "Employer Responsibilities",
    body: "Employers must post accurate job information, comply with applicable employment laws, treat candidate information confidentially, and use candidate profiles only for legitimate recruitment purposes. Employers must not misuse resumes, contact data, or platform tools."
  },
  {
    title: "Candidate Responsibilities",
    body: "Candidates must provide truthful profile, resume, skill, education, and work history information. Candidates are responsible for keeping their profiles updated and for responding professionally to employer or recruiter communication."
  },
  {
    title: "Subscription Policies",
    body: "Employer subscription plans provide access to defined limits, features, usage allowances, and service periods. MXVL may update plan availability, operational rules, or feature access while preserving already approved subscription records where reasonably possible."
  },
  {
    title: "Manual Payment Verification",
    body: "Manual subscription payments require the employer to submit accurate transaction details unless the final amount is fully discounted by an approved coupon. MXVL administrators verify payment requests before subscription activation."
  },
  {
    title: "Refund Policies",
    body: "Refund requests are reviewed case by case. Approved subscriptions, manual payment verification, consumed services, candidate access, recruiter activity, or platform usage may affect refund eligibility. MXVL may decline refund requests where services have already been delivered."
  },
  {
    title: "Account Termination",
    body: "MXVL may suspend or terminate accounts that violate these terms, misuse candidate or employer information, attempt unauthorized access, submit fraudulent payments, or disrupt platform operations. Users may request account review through support channels."
  },
  {
    title: "Intellectual Property",
    body: "The MXVL platform, brand assets, interface, workflows, content, and technology are owned by or licensed to MX Venture Lab. Users retain ownership of their submitted content but grant MXVL permission to process it for platform and recruitment services."
  },
  {
    title: "Limitation of Liability",
    body: "MXVL provides recruitment technology, managed hiring support, and business services but does not guarantee employment, hiring outcomes, candidate performance, or uninterrupted platform availability. Use of the platform is subject to operational and technical limitations."
  }
];

export default function TermsPage() {
  return (
    <main className="bg-bg py-16 dark:bg-slate-950">
      <Container>
        <div className="max-w-3xl">
          <Badge variant="primary">Terms</Badge>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-text-main dark:text-white md:text-5xl">Terms & Conditions</h1>
          <p className="mt-5 text-base leading-8 text-text-muted dark:text-slate-300">These Terms & Conditions govern access to and use of MX Venture Lab services, including candidate accounts, employer accounts, subscriptions, manual payment verification, and recruitment tools.</p>
        </div>
        <div className="mt-10 grid gap-5">
          {terms.map((term) => (
            <Card key={term.title} className="rounded-md p-6">
              <h2 className="text-xl font-black text-text-main dark:text-white">{term.title}</h2>
              <p className="mt-3 text-sm leading-7 text-text-muted dark:text-slate-300">{term.body}</p>
            </Card>
          ))}
        </div>
      </Container>
    </main>
  );
}
