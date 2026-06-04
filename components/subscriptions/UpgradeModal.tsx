"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Sparkles, X } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { Button, LinkButton } from "@/components/ui/Button";
import { UPGRADE_BENEFITS } from "@/lib/subscriptions";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
}

export default function UpgradeModal({
  open,
  onClose,
  title = "Unlock Better Hiring Results",
  description = "Move beyond basic posting with AI-ranked candidates, better recruiter workflows, and richer hiring analytics.",
  primaryLabel = "Upgrade Now",
  secondaryLabel = "Compare Plans"
}: UpgradeModalProps) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={onClose}
        >
          <motion.div
            className="w-full max-w-xl rounded-[28px] border border-white/70 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950"
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <Badge variant="primary" className="mb-3 gap-1">
                  <Sparkles className="h-3.5 w-3.5" /> Premium hiring
                </Badge>
                <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-900"
                aria-label="Close upgrade modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {UPGRADE_BENEFITS.map((benefit) => (
                <div
                  key={benefit}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                    <Check className="h-4 w-4" />
                  </span>
                  {benefit}
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <LinkButton href="/subscriptions" variant="primary" className="flex-1 justify-center">
                {primaryLabel}
              </LinkButton>
              <Button variant="secondary" className="flex-1 justify-center" onClick={onClose}>
                {secondaryLabel}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
