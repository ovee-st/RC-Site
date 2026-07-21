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
      ["Can I update my resume?", "Yes. Candidates can update resume and profile information from the candidate dashboard so employers see current details."]
    ]
  },
  {
    title: "Employer FAQs",
    questions: [
      ["How do employer subscriptions work?", "Employers choose a subscription plan, submit payment or a coupon-supported request, and receive access after approval."],
      ["Can employers view candidate profiles?", "Candidate profile access depends on the active subscription plan and available usage limits."],
      ["What is managed hiring?", "Managed hiring means MXVL helps source, shortlist, and coordinate candidates for employers that want recruiter-led support."]
    ]
  },
  {
    title: "Subscription FAQs",
    questions: [
      ["What happens when a plan limit is reached?", "The platform may restrict plan-gated actions such as posting jobs, viewing candidates, or using AI matching until the plan is upgraded or renewed."],
      ["Can I use a coupon for subscriptions?", "Yes. Enter the coupon on the subscription payment page and apply it before submitting the request."],
      ["What happens with a full discount coupon?", "If a valid coupon reduces the final amount to zero, no transaction ID or sender number is required."]
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
      ["Who can I contact for account issues?", "Use the Contact page for candidate support, employer support, payment support, or business inquiries."]
    ]
  }
];

export const faqItems = faqSections.flatMap((section) =>
  section.questions.map(([question, answer]) => ({ question, answer }))
);
