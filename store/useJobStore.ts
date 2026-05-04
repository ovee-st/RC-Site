"use client";

import { create } from "zustand";
import type { Job } from "@/types";
import { demoJobs } from "@/lib/demoData";

type JobFilters = {
  categories: string[];
  experience: string[];
  jobType: string[];
  locations: string[];
  salary: number;
  skills: string[];
  search: string;
};

type JobStore = {
  jobs: Job[];
  selectedJob: Job | null;
  filters: JobFilters;
  setJobs: (jobs: Job[]) => void;
  addJob: (job: Job) => void;
  updateJob: (jobId: string, updates: Partial<Job>) => void;
  setSelectedJob: (job: Job | null) => void;
  toggleFilter: (key: "categories" | "experience" | "jobType" | "locations" | "skills", value: string) => void;
  setSalary: (salary: number) => void;
  setSearch: (search: string) => void;
  clearFilters: () => void;
};

const initialFilters: JobFilters = {
  categories: [],
  experience: [],
  jobType: [],
  locations: [],
  salary: 200000,
  skills: [],
  search: ""
};

const JOBS_KEY = "mx_jobs";

function loadJobs() {
  if (typeof window === "undefined") return demoJobs;

  try {
    const saved = window.localStorage.getItem(JOBS_KEY);
    return saved ? JSON.parse(saved) as Job[] : demoJobs;
  } catch {
    return demoJobs;
  }
}

function persistJobs(jobs: Job[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(JOBS_KEY, JSON.stringify(jobs));
}

export const useJobStore = create<JobStore>((set) => ({
  jobs: loadJobs(),
  selectedJob: null,
  filters: initialFilters,
  setJobs: (jobs) => {
    persistJobs(jobs);
    set({ jobs, selectedJob: jobs[0] || null });
  },
  addJob: (job) => set((state) => {
    const jobs = [job, ...state.jobs];
    persistJobs(jobs);
    return { jobs, selectedJob: job };
  }),
  updateJob: (jobId, updates) => set((state) => {
    const jobs = state.jobs.map((job) => job.id === jobId ? { ...job, ...updates } : job);
    const selectedJob = state.selectedJob?.id === jobId ? { ...state.selectedJob, ...updates } : state.selectedJob;
    persistJobs(jobs);
    return { jobs, selectedJob };
  }),
  setSelectedJob: (job) => set({ selectedJob: job }),
  toggleFilter: (key, value) => set((state) => {
    const current = state.filters[key];
    return {
      filters: {
        ...state.filters,
        [key]: current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
      }
    };
  }),
  setSalary: (salary) => set((state) => ({ filters: { ...state.filters, salary } })),
  setSearch: (search) => set((state) => ({ filters: { ...state.filters, search } })),
  clearFilters: () => set({ filters: initialFilters })
}));
