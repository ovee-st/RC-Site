import type { Metadata } from "next";
import SupportOperationsCenter from "@/components/support/SupportOperationsCenter";

export const metadata: Metadata = {
  title: "Support knowledge-base | MXVL",
  description: "Internal support operations route."
};

export default function SupportRoutePage() {
  return <SupportOperationsCenter view="knowledge-base" />;
}
