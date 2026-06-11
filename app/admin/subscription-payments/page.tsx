import AdminPanel from "@/components/admin/AdminPanel";

export const metadata = {
  title: "Subscription Payments | MXVL Admin",
  description: "Review manual employer subscription payment requests."
};

export default function AdminSubscriptionPaymentsPage() {
  return <AdminPanel section="subscription-payments" />;
}
