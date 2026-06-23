"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Eye, Mail, Search, Sparkles } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { demoCandidates } from "@/lib/demoData";
import { matchCandidateToJob } from "@/lib/ai/matching";
import type { Candidate } from "@/types";
import { cn } from "@/lib/cn";
import { useJobStore } from "@/store/useJobStore";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import { mapSupabaseJob } from "@/lib/mapSupabaseJob";
import { getBestAvatarUrl } from "@/lib/authUserSync";

const CANDIDATE_PROFILE_KEY = "mx_candidate_profile";

type CandidateAction = {
  invited?: boolean;
  shortlisted?: boolean;
};

type SavedCandidateProfile = {
  name?: string;
  title?: string;
  location?: string;
  avatar?: string | null;
  skills?: string[];
  about?: string;
  availability?: {
    immediate: boolean;
    noticePeriod?: string;
    noticeUnit?: "Days" | "Months";
    preferredJobLocation?: string;
  };
};

type RegisteredCandidate = Candidate & {
  avatar?: string;
  location?: string;
  linkedin_url?: string;
  availability?: {
    immediate: boolean;
    noticePeriod?: string;
    noticeUnit?: "Days" | "Months";
    preferredJobLocation?: string;
  };
};

type CandidateRow = {
  id?: string;
  user_id?: string;
  full_name?: string;
  name?: string;
  title?: string;
  career_level?: string;
  category?: string;
  categories?: string[];
  skills?: string[] | string;
  skills_array?: string[];
  about?: string;
  profile?: string;
  photo_url?: string;
  avatar_url?: string;
  profile_photo_url?: string;
  avatar?: string;
  location?: string;
  linkedin_url?: string;
  preferred_job_location?: string | null;
  immediate_availability?: boolean;
  notice_period_value?: string | number | null;
  notice_period_unit?: "Days" | "Months" | string | null;
};

function getInitials(name?: string | null) {
  if (!name) return "MX";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "MX";
}

function CandidateAvatar({ src, name }: { src?: string | null; name: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name} className="h-11 w-11 rounded-full object-cover ring-2 ring-gray-200" />;
  }

  return (
    <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-primary via-cyan-500 to-success text-xs font-black text-white ring-2 ring-gray-200">
      {getInitials(name)}
    </div>
  );
}

function loadRegisteredCandidates(): RegisteredCandidate[] {
  const fallbackCandidates = demoCandidates as RegisteredCandidate[];
  if (typeof window === "undefined") return fallbackCandidates;

  try {
    const saved = window.localStorage.getItem(CANDIDATE_PROFILE_KEY);
    const parsed = saved ? JSON.parse(saved) as SavedCandidateProfile : null;

    if (!parsed?.name) return fallbackCandidates;

    const localCandidate: RegisteredCandidate = {
      id: "candidate-local-profile",
      name: parsed.name,
      title: parsed.title || "Registered Candidate",
      category: "HR & Admin",
      experience: "Mid Level",
      skills: parsed.skills?.length ? parsed.skills : ["Admin", "Excel", "Coordination"],
      profile: parsed.about || "Registered candidate profile from MX Venture Lab.",
      linkedin_url: (parsed as any).linkedin_url || "",
      avatar: parsed.avatar || undefined,
      location: parsed.location || "Dhaka",
      availability: parsed.availability
        ? {
          immediate: parsed.availability.immediate,
          noticePeriod: parsed.availability.noticePeriod,
          noticeUnit: parsed.availability.noticeUnit,
          preferredJobLocation: parsed.availability.preferredJobLocation
        }
        : undefined
    };

    const withoutDuplicate = demoCandidates.filter((candidate) => candidate.name.toLowerCase() !== localCandidate.name.toLowerCase());
    return [localCandidate, ...withoutDuplicate];
  } catch {
    return fallbackCandidates;
  }
}

function mapCandidateRow(row: CandidateRow): RegisteredCandidate {
  const skills = Array.isArray(row.skills_array)
    ? row.skills_array
    : Array.isArray(row.skills)
      ? row.skills
      : String(row.skills || "")
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean);

  return {
    id: row.user_id || row.id || `candidate-${row.full_name || row.name || Date.now()}`,
    name: row.full_name || row.name || "Registered Candidate",
    title: row.title || row.career_level || "Registered Candidate",
    category: row.category || row.categories?.[0] || "Others",
    experience: row.career_level || "Any Level",
    skills: skills.length ? skills : ["Admin", "Excel", "Communication"],
    profile: row.about || row.profile || "Registered candidate profile from MX Venture Lab.",
    avatar: getBestAvatarUrl(row) || undefined,
    linkedin_url: row.linkedin_url || "",
    location: row.location || "Bangladesh",
    availability: {
      immediate: row.immediate_availability ?? true,
      noticePeriod: row.notice_period_value ? String(row.notice_period_value) : "",
      noticeUnit: row.notice_period_unit === "Months" ? "Months" : "Days",
      preferredJobLocation: row.preferred_job_location || ""
    }
  };
}

export default function EmployerCandidates() {
  const [query, setQuery] = useState("");
  const [candidates, setCandidates] = useState(() => loadRegisteredCandidates());
  const [actions, setActions] = useState<Record<string, CandidateAction>>({});
  const { jobs, setJobs } = useJobStore();
  const { user } = useAuth();
  const activeJobs = useMemo(() => jobs.filter((job) => {
    const expired = job.deadline ? new Date(`${job.deadline}T23:59:59`) < new Date() : false;
    return (!job.status || job.status === "active") && !expired;
  }), [jobs]);


  useEffect(() => {
    if (!isSupabaseConfigured || !user?.id) return;

    supabase
      .from("jobs")
      .select("*")
      .eq("employer_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setJobs(data.map(mapSupabaseJob));
      });
  }, [user?.id, setJobs]);
  useEffect(() => {
    const refreshCandidates = async () => {
      const localCandidates = loadRegisteredCandidates();

      if (!isSupabaseConfigured) {
        setCandidates(localCandidates);
        return;
      }

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        const response = token
          ? await fetch("/api/candidates/registered", {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(() => null)
          : null;

        if (response?.ok) {
          const payload = await response.json().catch(() => ({}));
          const registered = Array.isArray(payload.candidates) ? payload.candidates.map(mapCandidateRow) : [];
          if (registered.length) {
            setCandidates(registered);
            return;
          }
        }

        const { data, error } = await supabase
          .from("candidates")
          .select("id, user_id, full_name, name, title, career_level, category, categories, skills, skills_array, about, photo_url, avatar, location, linkedin_url, preferred_job_location, immediate_availability, notice_period_value, notice_period_unit");

        if (error || !data?.length) {
          setCandidates(localCandidates);
          return;
        }

        const profileIds = data.map((row) => row.user_id).filter(Boolean);
        let profileAvatars = new Map<string, string | null>();

        if (profileIds.length) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, avatar_url")
            .in("id", profileIds);

          profileAvatars = new Map(
            (profiles || []).map((profile) => [profile.id, getBestAvatarUrl(profile)])
          );
        }

        const supabaseCandidates = data.map((row) => mapCandidateRow({
          ...row,
          photo_url: row.photo_url || profileAvatars.get(row.user_id) || null
        }));
        const localNames = new Set(localCandidates.map((candidate) => candidate.name.toLowerCase()));
        const merged = [
          ...localCandidates,
          ...supabaseCandidates.filter((candidate) => !localNames.has(candidate.name.toLowerCase()))
        ];
        setCandidates(merged);
      } catch {
        setCandidates(localCandidates);
      }
    };

    refreshCandidates();
    window.addEventListener("mx-auth-change", refreshCandidates);
    window.addEventListener("storage", refreshCandidates);

    return () => {
      window.removeEventListener("mx-auth-change", refreshCandidates);
      window.removeEventListener("storage", refreshCandidates);
    };
  }, []);

  const rankedCandidates = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return candidates
      .map((candidate) => {
        const bestMatch = activeJobs
          .map((job) => ({ job, match: matchCandidateToJob(candidate, job) }))
          .sort((a, b) => b.match.score - a.match.score)[0] || null;

        return {
          candidate,
          bestMatch,
          score: bestMatch?.match.score || 0,
          searchText: [
            candidate.name,
            candidate.title,
            candidate.category,
            candidate.experience,
            ...candidate.skills
          ].join(" ").toLowerCase()
        };
      })
      .filter((item) => !normalizedQuery || item.searchText.includes(normalizedQuery))
      .sort((a, b) => b.score - a.score);
  }, [activeJobs, candidates, query]);

  const updateAction = (candidateId: string, action: keyof CandidateAction) => {
    setActions((current) => ({
      ...current,
      [candidateId]: {
        ...current[candidateId],
        [action]: true
      }
    }));
  };

  return (
    <Card className="depth-primary">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <Badge variant="primary" className="type-label text-primary">Registered Candidates</Badge>
          <h2 className="type-h2 mt-3">Find Candidates</h2>
          <p className="type-body mt-2 max-w-2xl">Browse registered candidates and compare each profile against your active job posts.</p>
          <p className="mt-2 text-xs font-bold text-text-muted dark:text-slate-300">{activeJobs.length} active job post{activeJobs.length === 1 ? "" : "s"} used for match scoring.</p>
        </div>
        <div className="relative w-full md:max-w-sm">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-11"
            placeholder="Search candidates, roles, skills..."
          />
        </div>
      </div>

      <div className="mt-6 grid gap-4">
        {rankedCandidates.map(({ candidate, bestMatch, score }, index) => {
          const action = actions[candidate.id] || {};
          const avatar = candidate.avatar || null;
          const location = candidate.location || "Bangladesh";

          return (
            <Card
              key={candidate.id}
              variant="interactive"
              className="grid gap-4 p-4 transition hover:border-primary hover:bg-primary/5 hover:ring-4 hover:ring-primary/10 dark:hover:bg-primary/10 md:grid-cols-[1fr_auto]"
            >
              <div className="flex min-w-0 items-start gap-3">
                <CandidateAvatar src={avatar} name={candidate.name} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-black text-text-main dark:text-white">{candidate.name}</h3>
                    {index === 0 ? <Badge variant="success">Top match</Badge> : null}
                    <Badge variant={score >= 80 ? "match-score" : score > 0 ? "primary" : "neutral"}>{score}% match</Badge>
                  </div>
                  <p className="type-body mt-1 text-sm">{candidate.title} | {candidate.experience} | {location}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {candidate.availability?.immediate ? (
                      <Badge variant="success" className="px-2 py-1">✓ Immediate availability</Badge>
                    ) : candidate.availability?.noticePeriod ? (
                      <Badge variant="neutral" className="px-2 py-1">Notice period: {candidate.availability.noticePeriod} {candidate.availability.noticeUnit}</Badge>
                    ) : null}
                    {candidate.availability?.preferredJobLocation ? (
                      <Badge variant="primary" className="px-2 py-1">Preferred: {candidate.availability.preferredJobLocation}</Badge>
                    ) : null}
                  </div>
                  <p className="type-body mt-1 text-xs font-semibold">Best for: {bestMatch?.job.title || "Post a job to calculate matches"}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {candidate.skills.slice(0, 6).map((skill) => (
                      <Badge key={skill} variant={bestMatch?.match.matchedSkills.includes(skill) ? "success" : "neutral"} className="px-2 py-1">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 md:justify-end">
                <Button variant="secondary" className="gap-1.5 px-3 py-2 text-xs">
                  <Eye className="h-3.5 w-3.5" />
                  View Profile
                </Button>
                <Button
                  variant={action.shortlisted ? "success" : "secondary"}
                  className="gap-1.5 px-3 py-2 text-xs"
                  onClick={() => updateAction(candidate.id, "shortlisted")}
                >
                  {action.shortlisted ? <Check className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                  {action.shortlisted ? "Shortlisted" : "Shortlist"}
                </Button>
                <Button
                  variant={action.invited ? "success" : "primary"}
                  className="gap-1.5 px-3 py-2 text-xs"
                  onClick={() => updateAction(candidate.id, "invited")}
                >
                  {action.invited ? <Check className="h-3.5 w-3.5" /> : <Mail className="h-3.5 w-3.5" />}
                  {action.invited ? "Invited" : "Invite"}
                </Button>
              </div>
            </Card>
          );
        })}

        {!rankedCandidates.length ? (
          <Card className="border-dashed p-8 text-center">
            <Sparkles className="mx-auto h-8 w-8 text-primary" />
            <h3 className="type-h3 mt-3 font-black">No candidates found</h3>
            <p className="type-body mt-2">Try searching by a broader skill, role, or category.</p>
          </Card>
        ) : null}
      </div>
    </Card>
  );
}
