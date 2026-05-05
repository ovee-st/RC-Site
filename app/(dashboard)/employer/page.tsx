"use client";

import EmployerProfile from "@/components/dashboard/EmployerProfile";
import AccountSettings from "@/components/account/AccountSettings";
import Badge from "@/components/ui/Badge";
import PageContainer from "@/components/layout/PageContainer";

export default function EmployerDashboard() {
  return (
    <PageContainer>
      <div className="mb-6">
        <Badge variant="primary" className="type-label text-primary">Employer Profile</Badge>
        <h1 className="type-h1 mt-3">Company profile</h1>
        <p className="type-body mt-2 max-w-2xl">Manage company details, profile image, banner, contact links, and account security.</p>
      </div>

      <section>
        <EmployerProfile />
      </section>

      <section className="mt-6">
        <AccountSettings profileStorageKey="mx_employer_profile" title="Employer Account" />
      </section>
    </PageContainer>
  );
}