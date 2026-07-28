export type FaqSection = {
  title: string;
  questions: Array<[question: string, answer: string]>;
};

export const faqSections: FaqSection[] = [
  {
    title: "Candidate FAQs",
    questions: [
      ["How do I apply for jobs?", "Create or sign in to your candidate account, complete your profile, open a job, and submit your application through the platform."],
      ["How are candidate profiles used?", "Candidate profiles help employers and recruiters review skills, experience, resumes, applications, and AI-supported match context."],
      ["Can I update my resume?", "Yes. Candidates can update resume and profile information from the candidate dashboard so employers see current details."],
      ["Will employers actually see my profile?", "Profile visibility depends on your settings, applications, and the employer's authorized access. A complete profile gives employers better context when they can view it."],
      ["Can I apply to multiple jobs?", "Yes. Apply to multiple relevant roles and track the progress of each application from your candidate workspace."],
      ["Can I hide or limit my profile visibility?", "Use the available candidate profile and account controls to manage your information. Access remains subject to platform roles and permissions."],
      ["What happens after I apply?", "Your application appears in your workspace and enters the employer's recruitment workflow. Status updates depend on the employer's review and next steps."]
    ]
  },
  {
    title: "Employer FAQs",
    questions: [
      ["How do employer subscriptions work?", "Employers choose a subscription plan, submit payment or a coupon-supported request, and receive access after approval."],
      ["Can employers view candidate profiles?", "Candidate profile access depends on the active subscription plan and available usage limits."],
      ["What is managed hiring?", "Managed hiring means MXVL helps source, shortlist, and coordinate candidates for employers that want recruiter-led support."],
      ["How does AI matching work?", "MXVL compares job requirements with candidate profile signals such as skills, experience, availability, and preferences. The result supports review rather than replacing it."],
      ["Can I manually review or change AI recommendations?", "Yes. Employers can review candidates directly, adjust shortlists, and make every final decision themselves."],
      ["Is AI replacing recruiters?", "No. AI helps organize evidence and surface relevant signals. Recruiters remain responsible for judgment, communication, and hiring decisions."],
      ["Can small businesses use MXVL?", "Yes. Plans support occasional hiring, growing teams, high-volume recruitment, and custom enterprise operations."],
      ["Can employers build talent pools?", "Yes. Talent CRM features help employers organize promising candidates for active roles and future opportunities."],
      ["How long does employer setup take?", "Account setup starts with your employer profile and hiring needs. Timing varies with verification, subscription approval, and the workflow your team chooses."]
    ]
  },
  {
    title: "Subscription FAQs",
    questions: [
      ["What happens when a plan limit is reached?", "The platform may restrict plan-gated actions such as posting jobs, viewing candidates, or using AI matching until the plan is upgraded or renewed."],
      ["Can I use a coupon for subscriptions?", "Yes. Enter the coupon on the subscription payment page and apply it before submitting the request."],
      ["What happens with a full discount coupon?", "If a valid coupon reduces the final amount to zero, no transaction ID or sender number is required."],
      ["Can I switch plans later?", "Yes. Employers can request a different plan as hiring needs change, subject to the available upgrade, downgrade, and approval process."]
    ]
  },
  {
    title: "Payment FAQs",
    questions: [
      ["How does manual payment verification work?", "Employers send payment to the displayed bKash or Nagad number, submit transaction details, and wait for admin verification."],
      ["What payment number should I use?", "The official bKash/Nagad number for subscription payments is 01979611120."],
      ["How long does verification take?", "Verification depends on admin review and transaction confirmation. Employers can monitor payment status from the subscription payment pages."]
    ]
  },
  {
    title: "Account FAQs",
    questions: [
      ["How do I reset my password?", "Use the sign-in flow and choose the password reset option connected to your account email."],
      ["How do I manage account information?", "Use your candidate, employer, support, or admin dashboard profile/account settings based on your role."],
      ["Who can I contact for account issues?", "Use the Contact page for candidate support, employer support, payment support, or business inquiries."],
      ["Is my account data secure?", "MXVL uses authenticated, role-aware access to separate user experiences and restrict protected actions. Never share your password or access token with anyone."]
    ]
  }
];

export const faqItems = faqSections.flatMap((section) =>
  section.questions.map(([question, answer]) => ({ question, answer }))
);
