import type { Metadata } from "next";
import { Suspense } from "react";
import CommunicationCenter from "@/components/communications/CommunicationCenter";

export const metadata: Metadata = { title: "Communication Center", robots: { index: false, follow: false } };

export default function CommunicationCenterPage() {
  return <Suspense fallback={<div className="min-h-[60vh]" aria-label="Loading Communication Center" />}><CommunicationCenter /></Suspense>;
}
