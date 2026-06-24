import { afterEach, describe, expect, it } from "vitest";
import { DEFAULT_GA_MEASUREMENT_ID, analyticsEvents, trackPageView } from "@/lib/analytics";

const originalWindow = globalThis.window;
const originalDocument = globalThis.document;

afterEach(() => {
  if (originalWindow) Object.defineProperty(globalThis, "window", { value: originalWindow, configurable: true, writable: true });
  else delete (globalThis as any).window;
  if (originalDocument) Object.defineProperty(globalThis, "document", { value: originalDocument, configurable: true, writable: true });
  else delete (globalThis as any).document;
});

function installBrowserGlobals() {
  const windowValue = {
    dataLayer: [] as unknown[],
    location: { href: "https://mxventurelab.com/jobs" }
  };
  Object.defineProperty(globalThis, "window", { value: windowValue, configurable: true, writable: true });
  Object.defineProperty(globalThis, "document", { value: { title: "Jobs | MX Venture Lab" }, configurable: true, writable: true });
  return windowValue;
}

describe("Google Analytics utilities", () => {
  it("uses the MXVL measurement ID by default", () => {
    expect(DEFAULT_GA_MEASUREMENT_ID).toBe("G-GMHJFVM0MJ");
  });

  it("deduplicates repeated page views for the same route", () => {
    const browser = installBrowserGlobals();
    trackPageView("/jobs");
    trackPageView("/jobs");
    expect(browser.dataLayer).toHaveLength(1);
  });

  it("queues typed business events", () => {
    const browser = installBrowserGlobals();
    analyticsEvents.jobApplication("job-1", "Operations Manager");
    expect(browser.dataLayer).toHaveLength(1);
    expect(browser.dataLayer[0]).toEqual(expect.arrayContaining(["event", "job_application"]));
  });
});

