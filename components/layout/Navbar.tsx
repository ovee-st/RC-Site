"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, BadgeCheck, Bell, BriefcaseBusiness, Building2, CalendarClock, CheckCircle2, CreditCard, Eye, Home, Info, LogOut, Mail, Menu, Settings, UserRound, Users, X, XCircle, type LucideIcon } from "lucide-react";
import { type MouseEvent as ReactMouseEvent, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LinkButton } from "@/components/ui/Button";
import GlobalSearch from "@/components/search/GlobalSearch";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/cn";
import { clearStoredAuthIdentity, MOCK_USER_KEY } from "@/lib/accountIdentity";
import { getBestAvatarUrl } from "@/lib/authUserSync";
import { getProfileThumbnailUrl } from "@/lib/profileImageSync";

const SITE_LOGO_LIGHT = "/mxvl-logo.webp";
const SITE_LOGO_DARK = "/mxvl-logo-dark.webp";

const navItemsByRole = {
  guest: [
  { label: "Home", href: "/" },
  { label: "Jobs", href: "/jobs" },
  { label: "Services", href: "/services" }
  ],
  candidate: [
    { label: "Home", href: "/" },
    { label: "Jobs", href: "/jobs" },
    { label: "My Applications", href: "/candidate/portal" }
  ],
  employer: [
    { label: "Home", href: "/employer" },
    { label: "Jobs", href: "/jobs" },
    { label: "Candidates", href: "/employer/candidates" },
    { label: "Talent CRM", href: "/employer/talent-crm" },
    { label: "We Hire for You", href: "/we-hire-for-you" },
    { label: "Plans", href: "/subscriptions" }
  ],
  employee: [
    { label: "Support Desk", href: "/employee" },
    { label: "Tickets", href: "/employee/tickets" },
    { label: "Live Chat", href: "/employee/live-chat" }
  ],
  support: [
    { label: "Dashboard", href: "/support" },
    { label: "Inbox", href: "/support/inbox" },
    { label: "Tickets", href: "/support/tickets" },
    { label: "Live Chat", href: "/support/live-chat" },
    { label: "Analytics", href: "/support/analytics" }
  ],
  admin: [
    { label: "Admin", href: "/admin" },
    { label: "Users", href: "/admin/users" },
    { label: "Candidates", href: "/admin/candidates" },
    { label: "Employers", href: "/admin/employers" },
    { label: "Jobs", href: "/admin/jobs" },
    { label: "Employees", href: "/admin/employees" },
    { label: "Support", href: "/admin/support" }
  ],
  viewer: [
    { label: "Admin", href: "/admin" },
    { label: "Users", href: "/admin/users" },
    { label: "Candidates", href: "/admin/candidates" },
    { label: "Employers", href: "/admin/employers" },
    { label: "Jobs", href: "/admin/jobs" },
    { label: "Employees", href: "/admin/employees" },
    { label: "Support", href: "/admin/support" }
  ]
};

const mobilePublicNavItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "Jobs", href: "/jobs", icon: BriefcaseBusiness },
  { label: "Companies", href: "/jobs#companies", icon: Building2 },
  { label: "Pricing", href: "/subscriptions", icon: CreditCard },
  { label: "About", href: "/about", icon: Info },
  { label: "Contact", href: "/contact", icon: Mail }
];

const AUTH_CHANGE_EVENT = "mx-auth-change";
const EMPLOYER_PANEL_EVENT = "mx-employer-panel-change";
const CANDIDATE_PROFILE_KEY = "mx_candidate_profile";
const EMPLOYER_PROFILE_KEY = "mx_employer_profile";
const ROLE_NOTIFICATION_STORAGE_PREFIX = "MXVL-role-cleared-notifications";

type NavbarNotification = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  href: string;
  icon: LucideIcon;
  tone: "blue" | "green" | "amber" | "red" | "slate";
};

const notificationToneClass = {
  blue: "bg-blue-50 text-blue-600 ring-blue-100 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/20",
  green: "bg-emerald-50 text-emerald-600 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20",
  amber: "bg-amber-50 text-amber-600 ring-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20",
  red: "bg-red-50 text-red-600 ring-red-100 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/20",
  slate: "bg-slate-50 text-slate-600 ring-slate-100 dark:bg-white/5 dark:text-slate-300 dark:ring-white/10"
};

function isActiveRoute(pathname: string, href: string) {
  const [pathOnly] = href.split("?");
  if (href === "/") return pathname === "/";
  if (href.includes("#")) return false;
  return pathname === pathOnly || pathname.startsWith(`${pathOnly}/`);
}

function getNotificationTimeLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";

  const diff = Date.now() - date.getTime();
  const minutes = Math.max(1, Math.floor(diff / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getNotificationHref(role: string, type?: string) {
  if (role === "employer") {
    if (type?.includes("subscription")) return "/employer#account-settings";
    if (type?.includes("interview")) return "/employer#pipeline";
    if (type?.includes("job")) return "/jobs";
    return "/employer";
  }

  if (type?.includes("profile")) return "/candidate?view=profile";
  return "/candidate?view=applied";
}

function getNotificationIcon(type?: string): LucideIcon {
  const normalized = String(type || "").toLowerCase();
  if (normalized.includes("shortlist")) return BriefcaseBusiness;
  if (normalized.includes("interview")) return CalendarClock;
  if (normalized.includes("offer") || normalized.includes("hired")) return BadgeCheck;
  if (normalized.includes("reject")) return XCircle;
  if (normalized.includes("profile") || normalized.includes("view")) return Eye;
  if (normalized.includes("subscription")) return CreditCard;
  if (normalized.includes("apply") || normalized.includes("candidate")) return Users;
  if (normalized.includes("job") || normalized.includes("expire")) return CalendarClock;
  return Bell;
}

function getNotificationTone(type?: string): NavbarNotification["tone"] {
  const normalized = String(type || "").toLowerCase();
  if (normalized.includes("reject") || normalized.includes("expire")) return "red";
  if (normalized.includes("offer") || normalized.includes("shortlist") || normalized.includes("apply")) return "green";
  if (normalized.includes("interview") || normalized.includes("subscription")) return "amber";
  if (normalized.includes("profile") || normalized.includes("view")) return "blue";
  return "slate";
}

function normalizeRemoteNotification(row: Record<string, any>, role: string): NavbarNotification {
  const type = String(row.type || "notification").toLowerCase();
  return {
    id: `db-${row.id}`,
    title: row.title || "Platform notification",
    message: row.message || "There is a new update on your account.",
    createdAt: row.created_at || new Date().toISOString(),
    href: row.href || row.redirect_url || getNotificationHref(role, type),
    icon: getNotificationIcon(type),
    tone: getNotificationTone(type)
  };
}

function getFallbackNotifications(role: string, displayName: string): NavbarNotification[] {
  const now = Date.now();
  if (role === "candidate") {
    return [
      {
        id: "candidate-shortlisted",
        title: "Shortlist updates",
        message: "You will be notified here when an employer shortlists your profile.",
        createdAt: new Date(now - 1000 * 60 * 25).toISOString(),
        href: "/candidate?view=applied",
        icon: BriefcaseBusiness,
        tone: "green"
      },
      {
        id: "candidate-interview",
        title: "Interview schedule alerts",
        message: "Interview invitations and schedule changes will appear in this panel.",
        createdAt: new Date(now - 1000 * 60 * 55).toISOString(),
        href: "/candidate?view=applied",
        icon: CalendarClock,
        tone: "amber"
      },
      {
        id: "candidate-offer",
        title: "Offer notifications",
        message: "Offer, rejection, and hiring decisions for your applications are tracked here.",
        createdAt: new Date(now - 1000 * 60 * 90).toISOString(),
        href: "/candidate?view=applied",
        icon: BadgeCheck,
        tone: "blue"
      },
      {
        id: "candidate-profile-viewed",
        title: "Profile view alerts",
        message: `${displayName}, you will be notified when an employer views your candidate profile.`,
        createdAt: new Date(now - 1000 * 60 * 130).toISOString(),
        href: "/candidate?view=profile",
        icon: Eye,
        tone: "blue"
      }
    ];
  }

  if (role === "employer") {
    return [
      {
        id: "employer-application",
        title: "New candidate applications",
        message: "You will be notified when candidates apply to one of your active jobs.",
        createdAt: new Date(now - 1000 * 60 * 20).toISOString(),
        href: "/employer#applications",
        icon: Users,
        tone: "green"
      },
      {
        id: "employer-subscription-expiring",
        title: "Subscription expiry alerts",
        message: "Renewal reminders will appear here before your subscription expires.",
        createdAt: new Date(now - 1000 * 60 * 70).toISOString(),
        href: "/employer#account-settings",
        icon: CreditCard,
        tone: "amber"
      },
      {
        id: "employer-job-expiring",
        title: "Job post expiry alerts",
        message: "You will be notified before an active job post reaches its deadline.",
        createdAt: new Date(now - 1000 * 60 * 105).toISOString(),
        href: "/jobs",
        icon: CalendarClock,
        tone: "red"
      },
      {
        id: "employer-upcoming-interview",
        title: "Upcoming interview reminders",
        message: "Scheduled interviews with candidates will appear here before the meeting.",
        createdAt: new Date(now - 1000 * 60 * 150).toISOString(),
        href: "/employer#pipeline",
        icon: CalendarClock,
        tone: "blue"
      }
    ];
  }

  return [];
}

function dedupeNotifications(notifications: NavbarNotification[]) {
  const seen = new Set<string>();
  return notifications.filter((notification) => {
    if (seen.has(notification.id)) return false;
    seen.add(notification.id);
    return true;
  });
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

function resolveProfileAvatar(row?: Record<string, any> | null) {
  return getBestAvatarUrl(row);
}

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const [avatarUseFullImage, setAvatarUseFullImage] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [remoteNotifications, setRemoteNotifications] = useState<NavbarNotification[]>([]);
  const [clearedNotificationIds, setClearedNotificationIds] = useState<string[]>([]);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const notificationMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const mobileDrawerRef = useRef<HTMLDivElement | null>(null);
  const mobileDrawerCloseRef = useRef<HTMLButtonElement | null>(null);
  const { user, role, loading } = useAuth();
  const currentRole = role as string | null;
  const isSupportRole = currentRole === "support_agent" || currentRole === "support_senior" || currentRole === "support_manager";
  const profileHref = currentRole === "admin" || currentRole === "viewer" ? "/admin/profile" : currentRole === "employee" || isSupportRole ? "/support/profile" : currentRole === "employer" ? "/employer#profile" : "/candidate?view=profile";
  const accountHref = currentRole === "admin" || currentRole === "viewer" ? "/admin/account" : currentRole === "employee" || isSupportRole ? "/support/profile" : currentRole === "employer" ? "/employer#account-settings" : "/candidate?view=profile#account-settings";
  const displayName = user?.user_metadata?.name || user?.user_metadata?.full_name || user?.name || "MX User";
  const userRecord = user as any;
  const metadata = userRecord?.user_metadata || {};
  const fullAvatarSrc =
    profileAvatar ||
    user?.avatar ||
    userRecord?.photo_url ||
    userRecord?.avatar_url ||
    metadata.avatar_url ||
    metadata.photo_url ||
    metadata.profile_photo_url ||
    metadata.logo_url ||
    metadata.company_logo_url ||
    metadata.picture ||
    null;
  const avatarSrc = avatarUseFullImage ? fullAvatarSrc : getProfileThumbnailUrl(fullAvatarSrc);
  const effectiveAvatarSrc = avatarLoadFailed ? null : avatarSrc;
  const verified = Boolean(user?.user_metadata?.verified) || String(user?.user_metadata?.plan || "").toLowerCase() === "pro";
  const isLogoAvatar = Boolean(effectiveAvatarSrc && /mx-logo|mx[\\/_-]?venture|MX\.png/i.test(effectiveAvatarSrc));
  const initials = getInitials(displayName);
  const resolvedRole = user ? (currentRole === "admin" ? "admin" : currentRole === "viewer" ? "viewer" : isSupportRole ? "support" : currentRole === "employee" ? "employee" : currentRole === "employer" ? "employer" : "candidate") : "guest";
  const navItems = navItemsByRole[resolvedRole];
  const mobileWorkspaceItems = user
    ? navItems.filter((item) => !mobilePublicNavItems.some((publicItem) => publicItem.href === item.href))
    : [];
  const homeHref = resolvedRole === "admin" || resolvedRole === "viewer" ? "/admin" : resolvedRole === "support" ? "/support" : resolvedRole === "employee" ? "/employee" : resolvedRole === "employer" ? "/employer" : "/";
  const isAdminNavigation = resolvedRole === "admin" || resolvedRole === "viewer";
  const showRoleNotifications = Boolean(user) && (resolvedRole === "candidate" || resolvedRole === "employer");
  const notificationStorageKey = user?.id ? `${ROLE_NOTIFICATION_STORAGE_PREFIX}:${resolvedRole}:${user.id}` : `${ROLE_NOTIFICATION_STORAGE_PREFIX}:${resolvedRole}:guest`;
  const fallbackNotifications = useMemo(
    () => (showRoleNotifications ? getFallbackNotifications(resolvedRole, displayName) : []),
    [displayName, resolvedRole, showRoleNotifications]
  );
  const allRoleNotifications = useMemo(
    () => dedupeNotifications([...remoteNotifications, ...fallbackNotifications]).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [fallbackNotifications, remoteNotifications]
  );
  const visibleRoleNotifications = allRoleNotifications.filter((notification) => !clearedNotificationIds.includes(notification.id));

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const drawer = mobileDrawerRef.current;
    const menuButton = mobileMenuButtonRef.current;
    const focusableSelector = [
      "a[href]",
      "button:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      "[tabindex]:not([tabindex='-1'])"
    ].join(",");

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }

      if (event.key !== "Tab" || !drawer) return;

      const focusableElements = Array.from(drawer.querySelectorAll<HTMLElement>(focusableSelector));
      if (!focusableElements.length) {
        event.preventDefault();
        drawer.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && (activeElement === firstElement || activeElement === drawer)) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    const previousOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousTouchAction = document.body.style.touchAction;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    document.addEventListener("keydown", handleKeyDown);

    const focusFrame = window.requestAnimationFrame(() => mobileDrawerCloseRef.current?.focus());

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.touchAction = previousTouchAction;
      document.removeEventListener("keydown", handleKeyDown);
      window.requestAnimationFrame(() => menuButton?.focus());
    };
  }, [open]);

  const avatar = effectiveAvatarSrc ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={effectiveAvatarSrc}
      alt={displayName}
      onError={() => {
        if (fullAvatarSrc && avatarSrc !== fullAvatarSrc) {
          setAvatarUseFullImage(true);
          return;
        }
        setAvatarLoadFailed(true);
      }}
      className={cn(
        "h-8 w-8 rounded-full ring-2 ring-gray-200 transition hover:ring-blue-500 dark:ring-white/20 dark:hover:ring-blue-400",
        isLogoAvatar ? "bg-white p-1 object-contain" : "object-cover"
      )}
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
    if (!showRoleNotifications) {
      setClearedNotificationIds([]);
      return;
    }

    try {
      const saved = window.localStorage.getItem(notificationStorageKey);
      setClearedNotificationIds(saved ? JSON.parse(saved) : []);
    } catch {
      setClearedNotificationIds([]);
    }
  }, [notificationStorageKey, showRoleNotifications]);

  useEffect(() => {
    if (!showRoleNotifications) return;

    try {
      window.localStorage.setItem(notificationStorageKey, JSON.stringify(clearedNotificationIds));
    } catch {
      // Local storage can fail in privacy-restricted browsers; notifications still render normally.
    }
  }, [clearedNotificationIds, notificationStorageKey, showRoleNotifications]);

  useEffect(() => {
    let isMounted = true;

    async function loadNotifications() {
      if (!showRoleNotifications || !isSupabaseConfigured || !user?.id) {
        setRemoteNotifications([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("notifications")
          .select("id,type,title,message,created_at,href,redirect_url")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(12);

        if (!isMounted) return;
        if (error) {
          setRemoteNotifications([]);
          return;
        }

        setRemoteNotifications((data || []).map((row) => normalizeRemoteNotification(row, resolvedRole)));
      } catch {
        if (isMounted) setRemoteNotifications([]);
      }
    }

    loadNotifications();

    return () => {
      isMounted = false;
    };
  }, [resolvedRole, showRoleNotifications, user?.id]);

  useEffect(() => {
    if (!notificationsOpen) return;

    const handlePointerDown = (event: globalThis.MouseEvent) => {
      const target = event.target as Node | null;
      if (target && notificationMenuRef.current?.contains(target)) return;
      setNotificationsOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNotificationsOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [notificationsOpen]);

  useEffect(() => {
    if (!profileOpen) return;

    const handlePointerDown = (event: globalThis.MouseEvent) => {
      const target = event.target as Node | null;
      if (target && profileMenuRef.current?.contains(target)) return;
      setProfileOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setProfileOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [profileOpen]);

  useEffect(() => {
    let active = true;

    const loadProfileAvatar = async () => {
      if (typeof window === "undefined") return;

      let localAvatar: string | null = null;
      try {
        const key = role === "employer" ? EMPLOYER_PROFILE_KEY : role === "candidate" ? CANDIDATE_PROFILE_KEY : null;
        const savedProfile = key ? window.localStorage.getItem(key) : null;
        const savedMockUser = window.localStorage.getItem(MOCK_USER_KEY);
        const parsedProfile = savedProfile ? JSON.parse(savedProfile) : null;
        const parsedMockUser = savedMockUser ? JSON.parse(savedMockUser) : null;
        localAvatar = resolveProfileAvatar(parsedProfile) || resolveProfileAvatar(parsedMockUser);
        if (active) setProfileAvatar(localAvatar);
      } catch {
        if (active) setProfileAvatar(null);
      }

      if (!isSupabaseConfigured || !user?.id) return;
      try {
        const profileRequest = supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
        const roleRequest = role === "candidate"
          ? supabase.from("candidates").select("*").or(`user_id.eq.${user.id},id.eq.${user.id}`).limit(1).maybeSingle()
          : role === "employer"
            ? supabase.from("employers").select("*").or(`user_id.eq.${user.id},id.eq.${user.id}`).limit(1).maybeSingle()
            : Promise.resolve({ data: null });
        const [profileResult, roleResult] = await Promise.all([profileRequest, roleRequest]);
        const databaseAvatar = resolveProfileAvatar(roleResult.data) || resolveProfileAvatar(profileResult.data);
        if (active) setProfileAvatar(databaseAvatar || localAvatar || resolveProfileAvatar(user as any));
      } catch {
        if (active && !localAvatar) setProfileAvatar(resolveProfileAvatar(user as any));
      }
    };

    void loadProfileAvatar();
    const handleProfileChange = () => { void loadProfileAvatar(); };
    window.addEventListener(AUTH_CHANGE_EVENT, handleProfileChange);
    window.addEventListener("storage", handleProfileChange);

    return () => {
      active = false;
      window.removeEventListener(AUTH_CHANGE_EVENT, handleProfileChange);
      window.removeEventListener("storage", handleProfileChange);
    };
  }, [role, user?.id]);

  useEffect(() => {
    setAvatarLoadFailed(false);
    setAvatarUseFullImage(false);
  }, [fullAvatarSrc]);

  const handleLogout = async () => {
    if (typeof window !== "undefined") {
      clearStoredAuthIdentity();
      window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
    }

    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut({ scope: "local" });
      }
    } finally {
      if (typeof window !== "undefined") {
        clearStoredAuthIdentity();
        window.location.replace("/login");
      }
    }
  };

  const openEmployerPanel = (panel: "profile" | "account") => (event: ReactMouseEvent<HTMLAnchorElement>) => {
    if (role !== "employer") {
      setProfileOpen(false);
      return;
    }

    event.preventDefault();
    setProfileOpen(false);

    if (typeof window === "undefined") return;

    const hash = panel === "profile" ? "#profile" : "#account-settings";
    if (pathname !== "/employer") {
      window.location.href = `/employer${hash}`;
      return;
    }

    window.history.pushState(null, "", `/employer${hash}`);
    window.dispatchEvent(new CustomEvent(EMPLOYER_PANEL_EVENT, { detail: panel }));
  };


  const clearRoleNotifications = () => {
    setClearedNotificationIds((previous) => Array.from(new Set([...previous, ...allRoleNotifications.map((notification) => notification.id)])));
    setNotificationsOpen(false);
  };

  const notificationBell = showRoleNotifications ? (
    <div ref={notificationMenuRef} className="relative">
      <button
        type="button"
        className="relative grid h-10 w-10 place-items-center rounded-full border border-gray-200 bg-white text-text-muted shadow-secondary transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-primary hover:shadow-soft dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-blue-400/40 dark:hover:text-blue-300"
        aria-label={`${resolvedRole} notifications`}
        onClick={() => {
          setProfileOpen(false);
          setNotificationsOpen((value) => !value);
        }}
      >
        <Bell className="h-4 w-4" />
        {visibleRoleNotifications.length ? (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white ring-2 ring-white dark:ring-slate-950">
            {visibleRoleNotifications.length > 9 ? "9+" : visibleRoleNotifications.length}
          </span>
        ) : null}
      </button>
      <AnimatePresence>
        {notificationsOpen ? (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute right-0 top-full z-50 mt-3 w-[360px] overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-elevated dark:border-white/10 dark:bg-slate-950"
          >
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 p-4 dark:border-white/10">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">
                  {resolvedRole === "employer" ? "Employer alerts" : "Candidate alerts"}
                </p>
                <h3 className="mt-1 text-lg font-black text-text-main dark:text-white">Notifications</h3>
              </div>
              {visibleRoleNotifications.length ? (
                <button
                  type="button"
                  onClick={clearRoleNotifications}
                  className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-bold text-text-muted transition hover:border-blue-200 hover:text-primary dark:border-white/10 dark:text-slate-300 dark:hover:border-blue-400/40"
                >
                  Clear
                </button>
              ) : null}
            </div>
            <div className="max-h-[420px] overflow-y-auto p-2">
              {visibleRoleNotifications.length ? (
                visibleRoleNotifications.map((notification) => {
                  const Icon = notification.icon;
                  return (
                    <Link
                      key={notification.id}
                      href={notification.href}
                      onClick={() => setNotificationsOpen(false)}
                      className="flex gap-3 rounded-2xl p-3 transition hover:bg-slate-50 dark:hover:bg-white/5"
                    >
                      <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-2xl ring-1", notificationToneClass[notification.tone])}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-black text-text-main dark:text-white">{notification.title}</span>
                        <span className="mt-1 block text-xs font-semibold leading-5 text-text-muted dark:text-slate-400">{notification.message}</span>
                        <span className="mt-2 block text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                          {getNotificationTimeLabel(notification.createdAt)}
                        </span>
                      </span>
                    </Link>
                  );
                })
              ) : (
                <div className="grid place-items-center gap-2 px-6 py-10 text-center">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-primary dark:bg-blue-500/10 dark:text-blue-300">
                    <Bell className="h-5 w-5" />
                  </span>
                  <p className="text-sm font-black text-text-main dark:text-white">No new notifications</p>
                  <p className="text-xs font-semibold text-text-muted dark:text-slate-400">Fresh alerts will appear here automatically.</p>
                </div>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  ) : null;
  const profileMenu = (
    <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-gray-200 bg-white p-2 shadow-md dark:border-white/10 dark:bg-slate-950">
      <Link
        href={profileHref}
        onClick={openEmployerPanel("profile")}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-blue-50 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-white/5"
      >
        <UserRound size={15} />
        Edit Profile
      </Link>
      <Link
        href={accountHref}
        onClick={openEmployerPanel("account")}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-blue-50 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-white/5"
      >
        <Settings size={15} />
        Account Settings
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
      <div className={cn("mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6", isAdminNavigation ? "gap-3 xl:gap-4" : "gap-4 xl:gap-6 2xl:gap-10")}>
        <div className={cn("flex min-w-0 flex-1 items-center", isAdminNavigation ? "gap-4 xl:gap-5" : "gap-4 xl:gap-6 2xl:gap-8")}>
          <Link href={homeHref} className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center overflow-visible sm:h-12 sm:w-12">
              <Image src={SITE_LOGO_LIGHT} alt="MX Venture Lab logo" width={48} height={48} className="h-10 w-10 object-contain sm:h-12 sm:w-12 dark:hidden" priority />
              <Image src={SITE_LOGO_DARK} alt="MX Venture Lab logo" width={48} height={48} className="hidden h-10 w-10 object-contain sm:h-12 sm:w-12 dark:block" priority />
            </div>
            <span className="max-w-[8.5rem] truncate whitespace-nowrap text-sm font-black tracking-tight text-text-main sm:max-w-none dark:text-white">MX Venture Lab</span>
          </Link>

          <nav className={cn("hidden min-w-0 items-center whitespace-nowrap lg:flex", isAdminNavigation ? "gap-3 xl:gap-4" : "gap-3 xl:gap-5 2xl:gap-6")}>
            {navItems.map((item) => {
              const active = isActiveRoute(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group relative shrink-0 whitespace-nowrap py-2 text-sm font-medium text-gray-600 no-underline transition hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-300",
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

        <div className={cn("hidden shrink-0 justify-center lg:flex", isAdminNavigation ? "lg:w-[240px] xl:w-[280px]" : "lg:w-[220px] xl:w-[260px] 2xl:w-[320px]")}>
          <GlobalSearch className={cn(isAdminNavigation ? "md:w-[220px] lg:w-[240px] xl:w-[280px]" : "md:w-[200px] lg:w-[220px] xl:w-[260px] 2xl:w-[320px]")} />
        </div>

        <div className={cn("hidden shrink-0 items-center justify-end gap-2 lg:flex xl:gap-3", isAdminNavigation ? "w-[150px] xl:w-[170px]" : "w-[190px] xl:w-[220px] 2xl:w-[240px]")}>
          {!loading && !user ? (
            <LinkButton href="/login" className="whitespace-nowrap rounded-full px-5 py-2">Login</LinkButton>
          ) : null}
          {!loading && user ? notificationBell : null}
          {!loading && user ? (
            <div ref={profileMenuRef} className="relative">
              <button
                type="button"
                className="flex cursor-pointer items-center gap-2 rounded-full px-2 py-1.5 transition hover:bg-blue-50 dark:hover:bg-white/5"
                onClick={() => {
                  setNotificationsOpen(false);
                  setProfileOpen((value) => !value);
                }}
              >
                <span className="block h-8 w-8 shrink-0 overflow-hidden rounded-full">{avatar}</span>
                <span className="max-w-28 truncate text-sm font-medium text-text-main dark:text-white">{displayName}</span>
                {verified ? <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" /> : null}
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
          ref={mobileMenuButtonRef}
          type="button"
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
          className="focus-ring inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-text-muted hover:bg-primary/5 hover:text-primary lg:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          aria-controls="mobile-navigation"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </motion.button>
      </div>

      {typeof document !== "undefined"
        ? createPortal(
          <AnimatePresence>
            {open ? (
              <div className="fixed inset-0 z-[200] lg:hidden">
                <motion.button
                  type="button"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.275, ease: "easeOut" }}
                  className="absolute inset-0 cursor-default bg-black/40 backdrop-blur-sm"
                  aria-label="Close navigation menu"
                  tabIndex={-1}
                  onClick={() => setOpen(false)}
                />

                <motion.div
                  ref={mobileDrawerRef}
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ duration: 0.275, ease: [0.22, 1, 0.36, 1] }}
                  id="mobile-navigation"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="mobile-navigation-title"
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 z-10 flex h-[100dvh] w-[min(92vw,24rem)] max-w-full flex-col overflow-hidden border-l border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-950"
                >
                  <div className="flex min-h-[72px] shrink-0 items-center justify-between gap-4 border-b border-gray-200 px-5 dark:border-white/10">
                    <div className="min-w-0">
                      <p id="mobile-navigation-title" className="text-base font-black text-text-main dark:text-white">Menu</p>
                      <p className="mt-0.5 text-xs font-semibold text-text-muted dark:text-slate-400">Explore MX Venture Lab</p>
                    </div>
                    <button
                      ref={mobileDrawerCloseRef}
                      type="button"
                      onClick={() => setOpen(false)}
                      className="focus-ring inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-200 text-text-muted transition hover:border-primary/30 hover:bg-primary/5 hover:text-primary dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
                      aria-label="Close navigation"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5">
                    <GlobalSearch className="mb-5 w-full max-w-none focus-within:w-full [&>div:first-child]:!h-11 [&>div:first-child]:!py-0 [&_button]:min-h-11 [&_button]:min-w-11 [&_input]:min-h-11" />

                    <nav aria-label="Public navigation" className="grid gap-1">
                      {mobilePublicNavItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActiveRoute(pathname, item.href);
                        return (
                          <Link
                            key={item.label}
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className={cn(
                              "focus-ring flex min-h-12 items-center gap-3 rounded-md px-4 text-sm font-bold text-text-muted transition hover:bg-primary/5 hover:text-primary dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-blue-300",
                              active && "bg-primary/8 text-primary dark:bg-primary/15 dark:text-blue-300"
                            )}
                            aria-current={active ? "page" : undefined}
                          >
                            <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </nav>

                    {mobileWorkspaceItems.length ? (
                      <div className="mt-6 border-t border-gray-200 pt-5 dark:border-white/10">
                        <p className="mb-2 px-4 text-[11px] font-black uppercase text-text-muted dark:text-slate-400">Workspace</p>
                        <nav aria-label="Workspace navigation" className="grid gap-1">
                          {mobileWorkspaceItems.map((item) => {
                            const active = isActiveRoute(pathname, item.href);
                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setOpen(false)}
                                className={cn(
                                  "focus-ring flex min-h-12 items-center rounded-md px-4 text-sm font-bold text-text-muted transition hover:bg-primary/5 hover:text-primary dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-blue-300",
                                  active && "bg-primary/8 text-primary dark:bg-primary/15 dark:text-blue-300"
                                )}
                                aria-current={active ? "page" : undefined}
                              >
                                {item.label}
                              </Link>
                            );
                          })}
                        </nav>
                      </div>
                    ) : null}
                  </div>

                  <div className="shrink-0 border-t border-gray-200 bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 dark:border-white/10 dark:bg-slate-950">
                    {!loading && !user ? (
                      <div className="grid grid-cols-2 gap-3">
                        <Link
                          href="/login"
                          onClick={() => setOpen(false)}
                          className="focus-ring inline-flex min-h-11 items-center justify-center rounded-md border border-gray-300 px-4 text-sm font-black text-text-main transition hover:border-primary/40 hover:text-primary dark:border-white/15 dark:text-white"
                        >
                          Login
                        </Link>
                        <Link
                          href="/login"
                          onClick={() => setOpen(false)}
                          className="focus-ring inline-flex min-h-11 items-center justify-center gap-1 rounded-md bg-primary px-2 text-xs font-black text-white shadow-soft transition hover:bg-blue-700 sm:gap-2 sm:px-4 sm:text-sm"
                        >
                          Get Started <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </Link>
                      </div>
                    ) : null}

                    {!loading && user ? (
                      <div className="rounded-md border border-gray-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
                        <div className="mb-3 flex items-center gap-2">
                          <span className="block h-8 w-8 shrink-0 overflow-hidden rounded-full">{avatar}</span>
                          <div className="min-w-0">
                            <p className="flex items-center gap-1 truncate text-sm font-semibold text-text-main dark:text-white">
                              <span className="truncate">{displayName}</span>
                              {verified ? <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" /> : null}
                            </p>
                            <p className="text-xs font-medium text-text-muted">{role || "member"}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 border-t border-gray-200 pt-3 dark:border-white/10">
                          <Link href={profileHref} onClick={(event) => { setOpen(false); openEmployerPanel("profile")(event); }} className="focus-ring flex min-h-11 items-center justify-center gap-2 rounded-md bg-white px-3 text-xs font-bold text-text-muted dark:bg-white/5 dark:text-slate-300">
                            <UserRound className="h-4 w-4" /> Profile
                          </Link>
                          <Link href={accountHref} onClick={(event) => { setOpen(false); openEmployerPanel("account")(event); }} className="focus-ring flex min-h-11 items-center justify-center gap-2 rounded-md bg-white px-3 text-xs font-bold text-text-muted dark:bg-white/5 dark:text-slate-300">
                            <Settings className="h-4 w-4" /> Account
                          </Link>
                        </div>
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="focus-ring mt-2 min-h-11 w-full rounded-md px-5 text-sm font-semibold text-gray-600 transition hover:bg-red-50 hover:text-red-600 dark:text-slate-300 dark:hover:bg-red-500/10"
                        >
                          Logout
                        </button>
                      </div>
                    ) : null}
                  </div>
                </motion.div>
              </div>
            ) : null}
          </AnimatePresence>,
          document.body
        )
        : null}
    </header>
  );
}
