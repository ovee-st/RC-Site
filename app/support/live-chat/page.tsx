import type { Metadata } from "next";
import SupportOperationsCenter from "@/components/support/SupportOperationsCenter";

export const metadata: Metadata = {
  title: "Support live-chat | MXVL",
  description: "Internal support operations route."
};

export default function SupportRoutePage() {
  return <SupportOperationsCenter view="live-chat" />;
}
