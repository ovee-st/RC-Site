export const DEFAULT_GA_MEASUREMENT_ID = "G-GMHJFVM0MJ";
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID || DEFAULT_GA_MEASUREMENT_ID;

type AnalyticsValue = string | number | boolean | null | undefined;
export type AnalyticsParameters = Record<string, AnalyticsValue>;

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

export function trackEvent(eventName: string, parameters: AnalyticsParameters = {}) {
  if (!eventName) return;
  sendToDataLayer("event", eventName, { ...parameters, send_to: GA_MEASUREMENT_ID });
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
