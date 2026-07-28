import type { Metadata } from "next";
import AdminPanel from "@/components/admin/AdminPanel";

export const metadata: Metadata = {
  title: "Operations Intelligence | MXVL",
  description: "MXVL private beta operations, analytics, health, and release management."
};

export default function OperationsIntelligencePage() {
  return <AdminPanel section="operations-intelligence" />;
}
