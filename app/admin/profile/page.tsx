import type { Metadata } from "next";
import AdminProfileSettings from "@/components/admin/AdminProfileSettings";

export const metadata: Metadata = {
  title: "Admin Profile | RC",
  description: "Edit RC admin profile settings."
};

export default function AdminProfilePage() {
  return <AdminProfileSettings />;
}
