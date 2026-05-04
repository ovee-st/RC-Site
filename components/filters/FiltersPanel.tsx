"use client";

import { useMemo, useState } from "react";
import { BriefcaseBusiness, CalendarClock, ChevronDown, Clock3, Filter, Grid2X2, MapPin, Search, SlidersHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useJobStore } from "@/store/useJobStore";
import Badge from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import { bdjobsDepartments } from "@/lib/bdjobsDepartments";
import { bdjobsSkills } from "@/lib/bdjobsSkills";

const experienceOptions = ["Intern", "Fresher", "Mid Level", "Senior Level"];
const jobTypes = ["Full Time", "Part Time", "Intern", "Remote", "Hybrid", "On-site"];
const divisions = ["Dhaka", "Chattogram", "Rajshahi", "Khulna", "Barishal", "Sylhet", "Rangpur", "Mymensingh"];
const deadlines = ["This week", "This month", "Any time"];

function ChoiceRow({
  label,
  active,
  onToggle
}: {
  label: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left text-sm font-semibold text-text-main transition hover:bg-primary/5 hover:text-primary dark:text-white"
    >
      <span className={cn(
        "grid h-5 w-5 place-items-center rounded-full border transition",
        active ? "border-primary bg-primary text-white" : "border-border bg-surface dark:border-slate-600/70 dark:bg-slate-800"
      )}>
        {active ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
      </span>
      <span>{label}</span>
    </button>
  );
}

function FilterSection({
  id,
  title,
  icon: Icon,
  activeCount = 0,
  openSection,
  setOpenSection,
  children
}: {
  id: string;
  title: string;
  icon: typeof SlidersHorizontal;
  activeCount?: number;
  openSection: string | null;
  setOpenSection: (value: string | null) => void;
  children: React.ReactNode;
}) {
  const open = openSection === id;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-soft transition hover:border-primary/20 hover:shadow-hover dark:border-slate-700 dark:bg-slate-900">
      <button
        type="button"
        onClick={() => setOpenSection(open ? null : id)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="flex items-center gap-3">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-3.5 w-3.5" />
          </span>
          <span className="text-sm font-black text-text-main dark:text-white">{title}</span>
          {activeCount ? <Badge variant="primary" className="px-2 py-0.5">{activeCount}</Badge> : null}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-primary transition", open && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="max-h-80 overflow-y-auto border-t border-border p-3.5 dark:border-white/10">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function RangeControl({
  label,
  value,
  max,
  step,
  onChange,
  footer
}: {
  label: string;
  value: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  footer: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <h3 className="text-sm font-black text-text-main dark:text-white">{label}</h3>
        <span className="text-xs font-bold text-text-muted dark:text-slate-300">{footer}</span>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-1.5 w-full cursor-pointer accent-primary"
      />
    </div>
  );
}

export default function FiltersPanel() {
  const { filters, toggleFilter, setSalary, clearFilters } = useJobStore();
  const [openSection, setOpenSection] = useState<string | null>("quick");
  const [skillSearch, setSkillSearch] = useState("");

  const activeCount = useMemo(
    () => filters.categories.length + filters.experience.length + filters.jobType.length + filters.locations.length + filters.skills.length + (filters.salary < 200000 ? 1 : 0),
    [filters]
  );

  const visibleSkills = useMemo(() => {
    const query = skillSearch.trim().toLowerCase();
    const selected = filters.skills;
    const matching = bdjobsSkills.filter((skill) => !query || skill.toLowerCase().includes(query));
    return [...selected, ...matching.filter((skill) => !selected.includes(skill))].slice(0, 40);
  }, [skillSearch, filters.skills]);

  const toggleAndCollapse = (key: "categories" | "experience" | "jobType" | "locations" | "skills", value: string) => {
    toggleFilter(key, value);
    window.setTimeout(() => setOpenSection(null), 120);
  };

  return (
    <aside className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="type-h3 font-bold">Filters</h2>
          <p className="type-body text-xs font-semibold">{activeCount} active</p>
        </div>
        <Button type="button" onClick={clearFilters} variant="ghost" className="px-3 py-2">
          Clear all
        </Button>
      </div>

      <FilterSection id="quick" title="Quick Filter" icon={Clock3} openSection={openSection} setOpenSection={setOpenSection} activeCount={filters.salary < 200000 ? 1 : 0}>
        <div className="grid gap-3.5">
          <RangeControl
            label="Salary Range"
            value={filters.salary}
            max={200000}
            step={5000}
            onChange={setSalary}
            footer={`Up to BDT ${filters.salary.toLocaleString()}`}
          />
        </div>
      </FilterSection>

      <FilterSection id="category" title="Category/Industry" icon={Grid2X2} openSection={openSection} setOpenSection={setOpenSection} activeCount={filters.categories.length}>
        <div className="grid gap-1">
          {bdjobsDepartments.map((category) => (
            <ChoiceRow key={category} label={category} active={filters.categories.includes(category)} onToggle={() => toggleAndCollapse("categories", category)} />
          ))}
        </div>
      </FilterSection>

      <FilterSection id="location" title="Location" icon={MapPin} openSection={openSection} setOpenSection={setOpenSection} activeCount={filters.locations.length}>
        <div className="grid gap-1">
          {divisions.map((division) => (
            <ChoiceRow key={division} label={division} active={filters.locations.includes(division)} onToggle={() => toggleAndCollapse("locations", division)} />
          ))}
        </div>
      </FilterSection>

      <FilterSection id="experience" title="Experience" icon={BriefcaseBusiness} openSection={openSection} setOpenSection={setOpenSection} activeCount={filters.experience.length}>
        <div className="grid gap-1">
          {experienceOptions.map((item) => (
            <ChoiceRow key={item} label={item} active={filters.experience.includes(item)} onToggle={() => toggleAndCollapse("experience", item)} />
          ))}
        </div>
      </FilterSection>

      <FilterSection id="deadline" title="Posted/Deadline" icon={CalendarClock} openSection={openSection} setOpenSection={setOpenSection}>
        <div className="grid gap-1">
          {deadlines.map((deadline) => (
            <ChoiceRow key={deadline} label={deadline} active={false} onToggle={() => setOpenSection(null)} />
          ))}
        </div>
      </FilterSection>

      <FilterSection id="other" title="Other Filters" icon={Filter} openSection={openSection} setOpenSection={setOpenSection} activeCount={filters.jobType.length + filters.skills.length}>
        <div className="grid gap-5">
          <div>
            <h3 className="mb-2 text-sm font-black text-text-main dark:text-white">Job Type</h3>
            <div className="grid gap-1">
              {jobTypes.map((type) => (
                <ChoiceRow key={type} label={type} active={filters.jobType.includes(type)} onToggle={() => toggleAndCollapse("jobType", type)} />
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-black text-text-main dark:text-white">Skills</h3>
            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <Input
                value={skillSearch}
                onChange={(event) => setSkillSearch(event.target.value)}
                placeholder="Search skills..."
                className="pl-9"
              />
            </div>
            <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto pr-1">
              {visibleSkills.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleAndCollapse("skills", skill)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-bold transition",
                    filters.skills.includes(skill)
                      ? "border-primary bg-primary text-white shadow-soft"
                      : "border-border bg-bg text-text-muted hover:border-primary/25 hover:text-primary dark:border-slate-600/70 dark:bg-slate-800/90 dark:text-slate-100 dark:hover:text-blue-300"
                  )}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>
        </div>
      </FilterSection>

      <Button type="button" onClick={clearFilters} variant="secondary" className="w-full rounded-xl py-2.5">
        Clear All
      </Button>
    </aside>
  );
}
