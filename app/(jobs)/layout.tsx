import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Jobs",
  description: "Browse current job opportunities and connect with employers through MX Venture Lab.",
  alternates: {
    canonical: "/jobs"
  }
};

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
