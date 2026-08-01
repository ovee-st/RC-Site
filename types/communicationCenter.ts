export type CommunicationRole = "candidate" | "employer" | "support" | "admin";
export type CommunicationSection = "notifications" | "messages" | "interviews" | "offers" | "tasks" | "ai-alerts" | "timeline";
export type EngagementSignal = "Observation" | "Recommendation" | "Estimate";
export type EngagementPriority = "low" | "medium" | "high" | "urgent";

export type RecommendedAction = {
  label: string;
  href: string;
};

export type CommunicationItem = {
  id: string;
  section: CommunicationSection;
  category: string;
  title: string;
  summary: string;
  whyItMatters: string;
  signal: EngagementSignal;
  status: string;
  priority: EngagementPriority;
  timestamp: string;
  applicationId?: string | null;
  recommendedAction: RecommendedAction;
  metadata?: Record<string, unknown>;
};

export type CommunicationContext = {
  applicationId: string;
  label: string;
};

export type CommunicationCenterResponse = {
  section: CommunicationSection;
  items: CommunicationItem[];
  contexts?: CommunicationContext[];
  total: number;
  unreadCount: number;
  hasMore: boolean;
  page: number;
};

export type NotificationPreferences = {
  email: boolean;
  inApp: boolean;
  push: boolean;
  sms: boolean;
  whatsapp: boolean;
  dailySummary: boolean;
  weeklySummary: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  categories: Record<string, boolean>;
};
