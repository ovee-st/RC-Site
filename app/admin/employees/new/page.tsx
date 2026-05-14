import type { Metadata } from "next";
import AdminPanel from "@/components/admin/AdminPanel";

export const metadata: Metadata = {
  title: "Create Employee | MXVL Admin",
  description: "Create an internal support employee."
};

export default function NewEmployeePage() {
  return <AdminPanel section="users" />;
}

