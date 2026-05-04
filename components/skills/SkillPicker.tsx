"use client";

import { useMemo, useState } from "react";
import { Check, Plus, Search } from "lucide-react";
import Input from "@/components/ui/Input";
import { bdjobsSkills } from "@/lib/bdjobsSkills";
import { cn } from "@/lib/cn";

function normalizeSkill(skill: string) {
  return skill.trim().replace(/\s+/g, " ").toLowerCase();
}

export function uniqueSkills(skills: string[]) {
  const skillMap = new Map<string, string>();

  skills.forEach((skill) => {
    const cleanedSkill = skill.trim().replace(/\s+/g, " ");
    if (!cleanedSkill) return;

    skillMap.set(normalizeSkill(cleanedSkill), cleanedSkill);
  });

  return Array.from(skillMap.values());
}

export default function SkillPicker({
  selectedSkills,
  onChange,
  compact = false
}: {
  selectedSkills: string[];
  onChange: (skills: string[]) => void;
  compact?: boolean;
}) {
  const [query, setQuery] = useState("");
  const selectedSkillKeys = useMemo(() => new Set(selectedSkills.map(normalizeSkill)), [selectedSkills]);
  const allSkills = useMemo(() => uniqueSkills([...selectedSkills, ...bdjobsSkills]).sort((a, b) => a.localeCompare(b)), [selectedSkills]);
  const visibleSkills = useMemo(() => {
    const normalizedQuery = normalizeSkill(query);
    if (!normalizedQuery) return allSkills;

    return allSkills.filter((skill) => normalizeSkill(skill).includes(normalizedQuery));
  }, [allSkills, query]);
  const canAddQuery = Boolean(query.trim()) && !selectedSkillKeys.has(normalizeSkill(query)) && !allSkills.some((skill) => normalizeSkill(skill) === normalizeSkill(query));

  const toggleSkill = (skill: string) => {
    const key = normalizeSkill(skill);

    if (selectedSkillKeys.has(key)) {
      onChange(selectedSkills.filter((item) => normalizeSkill(item) !== key));
      return;
    }

    onChange(uniqueSkills([...selectedSkills, skill]));
  };

  const addCustomSkill = () => {
    if (!query.trim()) return;

    onChange(uniqueSkills([...selectedSkills, query]));
    setQuery("");
  };

  return (
    <div className="grid gap-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && canAddQuery) {
              event.preventDefault();
              addCustomSkill();
            }
          }}
          className="pl-11"
          placeholder="Type to search or add a skill"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {selectedSkills.length ? selectedSkills.map((skill) => (
          <button
            key={skill}
            type="button"
            onClick={() => toggleSkill(skill)}
            className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-black text-primary transition hover:bg-primary/15 dark:border-blue-400/30 dark:bg-blue-400/15 dark:text-blue-200"
          >
            <Check className="h-3.5 w-3.5" />
            {skill}
          </button>
        )) : (
          <p className="text-xs font-semibold text-text-muted dark:text-slate-300">No skills selected yet. Choose from the list below.</p>
        )}
      </div>

      {canAddQuery ? (
        <button
          type="button"
          onClick={addCustomSkill}
          className="flex w-fit items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3 py-2 text-xs font-black text-primary transition hover:bg-primary/12 dark:border-blue-400/30 dark:bg-blue-400/15 dark:text-blue-200"
        >
          <Plus className="h-3.5 w-3.5" />
          Add &quot;{query.trim()}&quot;
        </button>
      ) : null}

      <div className={cn(
        "overflow-y-auto rounded-xl border border-border bg-bg/70 p-3 shadow-inner dark:border-slate-700 dark:bg-slate-900/80",
        compact ? "max-h-52" : "max-h-72"
      )}>
        <div className="grid gap-2 sm:grid-cols-2">
          {visibleSkills.map((skill) => {
            const selected = selectedSkillKeys.has(normalizeSkill(skill));

            return (
              <button
                key={skill}
                type="button"
                onClick={() => toggleSkill(skill)}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left text-xs font-bold transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-white hover:shadow-soft dark:hover:bg-slate-800",
                  selected
                    ? "border-primary/25 bg-primary/10 text-primary dark:border-blue-400/30 dark:bg-blue-400/15 dark:text-blue-200"
                    : "border-border bg-white text-text-main dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100"
                )}
              >
                <span>{skill}</span>
                <span
                  className={cn(
                    "grid h-5 w-5 shrink-0 place-items-center rounded-full border transition",
                    selected ? "border-primary bg-primary text-white" : "border-border bg-bg text-transparent dark:border-slate-600 dark:bg-slate-800"
                  )}
                >
                  <Check className="h-3.5 w-3.5" />
                </span>
              </button>
            );
          })}
        </div>

        {!visibleSkills.length ? (
          <div className="rounded-xl border border-dashed border-border p-5 text-center text-sm font-semibold text-text-muted dark:border-slate-700 dark:text-slate-300">
            No matching skills found. Type the full skill name and add it.
          </div>
        ) : null}
      </div>
    </div>
  );
}
