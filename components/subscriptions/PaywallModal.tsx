"use client";

import UpgradeModal from "./UpgradeModal";
import { PAYWALLS, type PaywallType } from "@/lib/subscriptions";

interface PaywallModalProps {
  open: boolean;
  type: PaywallType;
  onClose: () => void;
}

export default function PaywallModal({ open, type, onClose }: PaywallModalProps) {
  const paywall = PAYWALLS[type];

  return (
    <UpgradeModal
      open={open}
      onClose={onClose}
      title={paywall.title}
      description={paywall.description}
      primaryLabel={paywall.cta}
      secondaryLabel="Compare Plans"
    />
  );
}
