import type { Metadata } from "next";
import AdminPanel from "@/components/admin/AdminPanel";

export const metadata: Metadata = {
  title: "Super Admin | MXVL",
  description: "MXVL internal admin command center."
};

export default function AdminDashboardPage() {
  return <AdminPanel section="dashboard" />;
}

