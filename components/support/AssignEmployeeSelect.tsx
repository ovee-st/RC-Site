"use client";

export default function AssignEmployeeSelect({ value, onChange, employees }: { value?: string | null; onChange: (value: string) => void; employees: Array<{ id: string; full_name: string }> }) {
  return <select value={value || ""} onChange={(event) => onChange(event.target.value)} className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-bold dark:border-white/10 dark:bg-slate-900"><option value="">Unassigned</option>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.full_name}</option>)}</select>;
}
