import type { Metadata } from "next";
import SupportOperationsCenter from "@/components/support/SupportOperationsCenter";

export const metadata: Metadata = {
  title: "Support User 360 | MXVL",
  description: "Customer profile context for support agents."
};

export default function SupportUserPage() {
  return <SupportOperationsCenter view="users" />;
}
