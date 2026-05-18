"use client";

import FinalCTA from "./FinalCTA";
import Footer from "./Footer";
import HeroSection from "./HeroSection";
import HiringPaths from "./HiringPaths";
import HowItWorks from "./HowItWorks";
import MatchScoring from "./MatchScoring";
import MetricsBar from "./MetricsBar";
import PricingTeaser from "./PricingTeaser";
import ProblemSolution from "./ProblemSolution";
import ServiceCategories from "./ServiceCategories";
import Testimonials from "./Testimonials";

export default function PublicHome() {
  return (
    <main className="overflow-hidden bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <HeroSection />
      <MetricsBar />
      <HiringPaths />
      <ProblemSolution />
      <HowItWorks />
      <ServiceCategories />
      <MatchScoring />
      <Testimonials />
      <PricingTeaser />
      <FinalCTA />
      <Footer />
    </main>
  );
}
