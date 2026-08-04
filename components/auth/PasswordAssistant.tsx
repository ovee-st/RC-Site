"use client";

import { Check, Circle, LockKeyhole } from "lucide-react";
import { cn } from "@/lib/cn";
import { getPasswordStrength } from "@/lib/passwordStrength";

const strengthTone = {
  "Very Weak": "bg-red-500",
  Weak: "bg-orange-500",
  Fair: "bg-amber-500",
  Good: "bg-blue-500",
  Strong: "bg-emerald-500"
} as const;

type PasswordAssistantProps = {
  password: string;
  capsLockOn: boolean;
  showInvalidError: boolean;
};

export default function PasswordAssistant({ password, capsLockOn, showInvalidError }: PasswordAssistantProps) {
  const assessment = getPasswordStrength(password);
  const hasInput = password.length > 0;

  return (
    <div
      className="rounded-md border border-slate-200 bg-slate-50/85 p-4 dark:border-white/10 dark:bg-white/[0.04]"
      aria-live="polite"
      aria-atomic="false"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-xs font-black text-slate-700 dark:text-slate-200">
          <LockKeyhole className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-300" aria-hidden="true" />
          <span>Password strength</span>
        </div>
        <span className="text-xs font-black text-slate-600 dark:text-slate-300">{assessment.label}</span>
      </div>

      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10"
        role="progressbar"
        aria-label="Password strength"
        aria-valuemin={0}
        aria-valuemax={5}
        aria-valuenow={assessment.score}
        aria-valuetext={`${assessment.label}, ${assessment.score} of 5 requirements met`}
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width,background-color] duration-300 ease-out motion-reduce:transition-none",
            strengthTone[assessment.label]
          )}
          style={{ width: `${assessment.progress}%` }}
        />
      </div>

      {!assessment.isValid ? (
        <div className="mt-4" aria-label="Remaining password requirements">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {hasInput ? "Still needed:" : "Your password needs:"}
          </p>
          <ul className="mt-2" role="list">
            {assessment.requirements.map((requirement) => (
              <li
                key={requirement.id}
                aria-hidden={requirement.met}
                className={cn(
                  "grid transition-[grid-template-rows,opacity,margin] duration-300 ease-out motion-reduce:transition-none",
                  requirement.met ? "mb-0 grid-rows-[0fr] opacity-0" : "mb-2 grid-rows-[1fr] opacity-100 last:mb-0"
                )}
              >
                <span className="flex min-h-0 items-center gap-2 overflow-hidden text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {requirement.met ? (
                    <Check className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                  )}
                  {requirement.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-4 flex items-start gap-2 text-xs font-bold leading-5 text-emerald-700 dark:text-emerald-300" role="status">
          <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Strong password. This password meets MXVL&apos;s security requirements.</span>
        </p>
      )}

      {capsLockOn ? (
        <p className="mt-3 text-xs font-bold text-amber-700 dark:text-amber-300" role="status">Caps Lock is on.</p>
      ) : null}

      {showInvalidError && !assessment.isValid ? (
        <p className="mt-3 text-xs font-bold text-red-700 dark:text-red-300" role="alert">
          Create a password that meets all five security requirements.
        </p>
      ) : null}
    </div>
  );
}
