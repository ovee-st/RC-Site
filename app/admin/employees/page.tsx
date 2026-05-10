import type { Metadata } from "next";
import AdminPanel from "@/components/admin/AdminPanel";

export const metadata: Metadata = {
  title: "Employees | RC Admin",
  description: "Manage internal RC support employees."
};

export default function AdminEmployeesPage() {
  return <AdminPanel section="employees" />;
}
