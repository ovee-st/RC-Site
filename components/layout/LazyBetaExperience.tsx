"use client";

import dynamic from "next/dynamic";

const BetaExperience = dynamic(() => import("@/components/onboarding/BetaExperience"), {
  ssr: false,
  loading: () => null
});

export default function LazyBetaExperience() {
  return <BetaExperience />;
}
