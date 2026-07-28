"use client";

import FinalCTA from "./FinalCTA";
import HeroSection from "./HeroSection";
import HiringPaths from "./HiringPaths";
import HowItWorks from "./HowItWorks";
import MatchScoring from "./MatchScoring";
import MetricsBar from "./MetricsBar";
import PricingTeaser from "./PricingTeaser";
import ProblemSolution from "./ProblemSolution";
import PlatformPreview from "./PlatformPreview";
import ServiceCategories from "./ServiceCategories";
import SocialProof from "./SocialProof";
import Testimonials from "./Testimonials";
import ConversionFAQ from "./ConversionFAQ";

export default function PublicHome() {
  return (
    <main className="overflow-hidden bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <HeroSection />
      <MetricsBar />
      <HiringPaths />
      <ProblemSolution />
      <HowItWorks />
      <PlatformPreview />
      <ServiceCategories />
      <MatchScoring />
      <SocialProof />
      <Testimonials />
      <PricingTeaser />
      <ConversionFAQ />
      <FinalCTA />
    </main>
  );
}
