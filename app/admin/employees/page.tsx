import type { Metadata } from "next";
import AdminPanel from "@/components/admin/AdminPanel";

export const metadata: Metadata = {
  title: "Employees | MXVL Admin",
  description: "Manage internal Live Support employees."
};

export default function AdminEmployeesPage() {
  return <AdminPanel section="employees" />;
}

