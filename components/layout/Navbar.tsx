"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LinkButton } from "@/components/ui/Button";
import GlobalSearch from "@/components/search/GlobalSearch";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/cn";

const navItemsByRole = {
  guest: [
  { label: "Home", href: "/" },
  { label: "Jobs", href: "/jobs" },
  { label: "We Hire for You", href: "/#pricing" }
  ],
  candidate: [
    { label: "Home", href: "/" },
    { label: "Jobs", href: "/jobs" }
  ],
  employer: [
    { label: "Home", href: "/" },
    { label: "Jobs", href: "/jobs" },
    { label: "Candidates", href: "/employer/candidates" },
    { label: "We Hire for You", href: "/#pricing" }
  ]
};

const AUTH_CHANGE_EVENT = "mx-auth-change";
const CANDIDATE_PROFILE_KEY = "mx_candidate_profile";
const EMPLOYER_PROFILE_KEY = "mx_employer_profile";

function isActiveRoute(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href.includes("#")) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getInitials(name?: string | null) {
  if (!name) return "MX";

  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "MX";

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);
  const { user, role, loading } = useAuth();
  const dashboardHref = role === "employer" ? "/employer" : "/candidate";
  const displayName = user?.user_metadata?.name || user?.user_metadata?.full_name || user?.name || "MX User";
  const avatarSrc = profileAvatar || user?.avatar || user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;
  const initials = getInitials(displayName);
  const resolvedRole = user ? (role === "employer" ? "employer" : "candidate") : "guest";
  const navItems = navItemsByRole[resolvedRole];

  const avatar = avatarSrc ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={avatarSrc}
      alt={displayName}
      className="h-8 w-8 rounded-full object-cover ring-2 ring-gray-200 transition hover:ring-blue-500"
      style={{ aspectRatio: "1 / 1" }}
    />
  ) : (
    <div
      aria-label={displayName}
      className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 via-cyan-500 to-emerald-500 text-xs font-black text-white ring-2 ring-gray-200 transition hover:ring-blue-500"
    >
      {initials}
    </div>
  );

  useEffect(() => {
    const updateScrolled = () => setScrolled(window.scrollY > 8);
    updateScrolled();
    window.addEventListener("scroll", updateScrolled, { passive: true });
    return () => window.removeEventListener("scroll", updateScrolled);
  }, []);

  useEffect(() => {
    const loadProfileAvatar = () => {
      if (typeof window === "undefined") return;

      try {
        const key = role === "employer" ? EMPLOYER_PROFILE_KEY : CANDIDATE_PROFILE_KEY;
        const savedProfile = window.localStorage.getItem(key);
        const parsedProfile = savedProfile ? JSON.parse(savedProfile) : null;
        setProfileAvatar(parsedProfile?.photo_url || parsedProfile?.avatar || null);
      } catch {
        setProfileAvatar(null);
      }
    };

    loadProfileAvatar();
    window.addEventListener(AUTH_CHANGE_EVENT, loadProfileAvatar);
    window.addEventListener("storage", loadProfileAvatar);

    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, loadProfileAvatar);
      window.removeEventListener("storage", loadProfileAvatar);
    };
  }, [role]);

  const handleLogout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }

    if (typeof window !== "undefined") {
      window.localStorage.removeItem("mx_mock_user");
      window.location.href = "/";
    }
  };

  const profileMenu = (
    <div className="absolute right-0 top-full z-50 mt-2 w-40 rounded-xl border border-gray-200 bg-white p-2 shadow-md dark:border-white/10 dark:bg-slate-950">
      <Link
        href={dashboardHref}
        onClick={() => setProfileOpen(false)}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-blue-50 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-white/5"
      >
        <UserRound size={15} />
        Edit Profile
      </Link>
      <button
        type="button"
        onClick={handleLogout}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-600 transition hover:bg-red-50 hover:text-red-600 dark:text-slate-300 dark:hover:bg-red-500/10"
      >
        <LogOut size={15} />
        Logout
      </button>
    </div>
  );

  return (
    <header
      className={cn(
        "sticky top-0 z-50 h-16 border-b border-gray-200 bg-white/70 backdrop-blur-md transition-all duration-300 dark:border-white/10 dark:bg-slate-950/70",
        scrolled && "bg-white/64 shadow-md backdrop-blur-xl dark:bg-slate-950/62"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-10 px-6">
        <div className="flex min-w-0 flex-1 items-center gap-8">
          <Link href="/" className="flex shrink-0 items-center gap-3">
            <div className="grid h-9 w-9 place-items-center overflow-hidden rounded-xl border border-gray-200 bg-white shadow-secondary dark:border-white/10 dark:bg-slate-900">
              <Image src="/mx-logo.png" alt="MX Venture Lab logo" width={36} height={36} className="h-full w-full object-contain" priority />
            </div>
            <span className="whitespace-nowrap text-sm font-black tracking-tight text-text-main dark:text-white">MX Venture Lab</span>
          </Link>

          <nav className="hidden items-center gap-6 whitespace-nowrap lg:flex">
            {navItems.map((item) => {
              const active = isActiveRoute(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group relative whitespace-nowrap py-2 text-sm font-medium text-gray-600 no-underline transition hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-300",
                    active && "text-blue-600 dark:text-blue-300"
                  )}
                >
                  {item.label}
                  {active ? (
                    <motion.span
                      layoutId="desktop-active-nav-underline"
                      className="absolute -bottom-1.5 left-0 h-0.5 w-full rounded-full bg-blue-600"
                      transition={{ duration: 0.2, ease: "easeOut" }}
                    />
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="hidden w-[320px] shrink-0 justify-center md:flex lg:w-[420px]">
          <GlobalSearch className="md:w-[320px] md:focus-within:w-[320px] lg:focus-within:w-[420px]" />
        </div>

        <div className="hidden w-[230px] shrink-0 items-center justify-end gap-3 md:flex">
          {!loading && !user ? (
            <LinkButton href="/login" className="whitespace-nowrap rounded-full px-5 py-2">Login</LinkButton>
          ) : null}
          {!loading && user ? (
            <div className="relative">
              <button
                type="button"
                className="flex cursor-pointer items-center gap-2 rounded-full px-2 py-1.5 transition hover:bg-blue-50 dark:hover:bg-white/5"
                onClick={() => setProfileOpen((value) => !value)}
              >
                <span className="block h-8 w-8 shrink-0 overflow-hidden rounded-full">{avatar}</span>
                <span className="max-w-28 truncate text-sm font-medium text-text-main dark:text-white">{displayName}</span>
              </button>
              <AnimatePresence>
                {profileOpen ? (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.16, ease: "easeOut" }}
                  >
                    {profileMenu}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          ) : null}
        </div>

        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
          className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-md text-text-muted hover:bg-primary/5 hover:text-primary md:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-label="Toggle navigation"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </motion.button>
      </div>

      <AnimatePresence>
        {open ? (
          <>
          <motion.button
            type="button"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 top-16 z-40 bg-slate-950/20 backdrop-blur-sm md:hidden"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 28 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className="fixed right-3 top-20 z-50 w-[calc(100vw-1.5rem)] max-w-sm rounded-3xl border border-gray-200 bg-white/95 p-4 shadow-elevated backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/95 md:hidden"
          >
            <div className="grid gap-2">
              <GlobalSearch className="max-w-none" />
              {navItems.map((item) => {
                const active = isActiveRoute(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "relative rounded-xl px-4 py-3 text-sm font-semibold text-text-muted hover:bg-primary/5 hover:text-primary",
                      active && "bg-primary/8 text-primary dark:bg-primary/15 dark:text-blue-300"
                    )}
                  >
                    {item.label}
                    {active ? <span className="absolute bottom-1.5 left-4 h-0.5 w-8 rounded-full bg-primary" /> : null}
                  </Link>
                );
              })}
              <div className="grid gap-2 pt-2">
                {!loading && !user ? (
                  <LinkButton href="/login" className="w-full rounded-full px-5 py-2">Login</LinkButton>
                ) : null}
                {!loading && user ? (
                  <div className="rounded-2xl border border-gray-200 bg-white p-3 dark:border-white/10 dark:bg-white/5">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="block h-8 w-8 shrink-0 overflow-hidden rounded-full">{avatar}</span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-text-main dark:text-white">{displayName}</p>
                        <p className="text-xs font-medium text-text-muted">{role || "member"}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="mt-2 w-full rounded-full px-5 py-2 text-sm font-semibold text-gray-600 transition hover:bg-red-50 hover:text-red-600 dark:text-slate-300 dark:hover:bg-red-500/10"
                    >
                      Logout
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
