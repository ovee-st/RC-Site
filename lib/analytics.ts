import { trackServerEvent, type ServerAnalyticsEvent } from "@/lib/serverAnalytics";

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "";

type AnalyticsValue = string | number | boolean | null | undefined;
export type AnalyticsParameters = Record<string, AnalyticsValue>;
type TrackInput = ServerAnalyticsEvent & {
  event?: string;
};
type TrackOptions = {
  sendToGtag?: boolean;
  sendToServer?: boolean;
};

let lastPageViewKey: string | null = null;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function sendToDataLayer(...args: unknown[]) {
  if (typeof window === "undefined" || !GA_MEASUREMENT_ID) return;
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag === "function") {
    window.gtag(...args);
    return;
  }
  window.dataLayer.push(args);
}

function normalizeTrackInput(input: string | TrackInput, parameters: AnalyticsParameters = {}): ServerAnalyticsEvent | null {
  if (typeof input === "string") {
    if (!input) return null;
    return { event: input, parameters };
  }

  const event = input.event || input.event_name;
  if (!event) return null;
  return {
    ...input,
    event,
    event_name: event,
    parameters: {
      ...(input.parameters || {}),
      ...parameters
    }
  };
}

function pageViewKey(event: ServerAnalyticsEvent) {
  if ((event.event || event.event_name) !== "page_view") return null;
  const pageLocation = event.page_location || (typeof window !== "undefined" ? window.location.href : "");
  return pageLocation || null;
}

function sendToGtag(event: ServerAnalyticsEvent) {
  const eventName = event.event || event.event_name;
  if (!eventName) return;

  if (eventName === "page_view") {
    sendToDataLayer("config", GA_MEASUREMENT_ID, {
      page_location: event.page_location,
      page_title: event.page_title,
      page_path: typeof window !== "undefined" ? `${window.location.pathname}${window.location.search}` : undefined,
      ...(event.parameters || {})
    });
    return;
  }

  sendToDataLayer("event", eventName, { ...(event.parameters || {}), send_to: GA_MEASUREMENT_ID });
}

export function track(input: string | TrackInput, parameters: AnalyticsParameters = {}, options: TrackOptions = {}) {
  const event = normalizeTrackInput(input, parameters);
  if (!event) return;

  const nextPageViewKey = pageViewKey(event);
  if (nextPageViewKey && lastPageViewKey === nextPageViewKey) return;
  if (nextPageViewKey) lastPageViewKey = nextPageViewKey;

  if (options.sendToGtag !== false) sendToGtag(event);
  if (options.sendToServer !== false) void trackServerEvent(event);
}

export function trackEvent(eventName: string, parameters: AnalyticsParameters = {}) {
  if (!eventName) return;
  track(eventName, parameters);
}

export const analyticsEvents = {
  candidateRegistration: (method = "email") => trackEvent("candidate_registration", { method }),
  employerRegistration: (method = "email") => trackEvent("employer_registration", { method }),
  jobApplication: (jobId: string, jobTitle?: string) => trackEvent("job_application", { job_id: jobId, job_title: jobTitle }),
  resumeUpload: (fileType?: string) => trackEvent("resume_upload", { file_type: fileType }),
  candidateProPurchase: (value?: number, currency = "BDT") => trackEvent("candidate_pro_purchase", { value, currency }),
  employerSubscriptionPurchase: (planId: string, value?: number, paymentMethod?: string, currency = "BDT") => trackEvent("employer_subscription_purchase", {
    plan_id: planId,
    value,
    currency,
    payment_method: paymentMethod
  }),
  weHireForYouSubmission: (hiringType?: string, hiringVolume?: number) => trackEvent("we_hire_for_you_form_submission", {
    hiring_type: hiringType,
    hiring_volume: hiringVolume
  })
};
