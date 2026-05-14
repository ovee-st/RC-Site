import type { Metadata } from "next";
import AccountSettings from "@/components/account/AccountSettings";

export const metadata: Metadata = {
  title: "Admin Account Settings | MXVL",
  description: "Update MXVL Admin email and password."
};

export default function AdminAccountPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.14),transparent_34%),linear-gradient(180deg,#f8fafc,#eef2ff)] px-4 py-10 dark:bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.20),transparent_34%),linear-gradient(180deg,#020617,#0f172a)] sm:px-6">
      <div className="mx-auto max-w-4xl">
        <AccountSettings title="Admin Account Settings" id="admin-account-settings" />
      </div>
    </main>
  );
}

