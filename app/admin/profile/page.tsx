import type { Metadata } from "next";
import AdminProfileSettings from "@/components/admin/AdminProfileSettings";

export const metadata: Metadata = {
  title: "Admin Profile | MXVL",
  description: "Edit MXVL Admin profile settings."
};

export default function AdminProfilePage() {
  return <AdminProfileSettings />;
}

