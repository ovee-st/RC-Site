import { afterEach, describe, expect, it } from "vitest";
import { GA_MEASUREMENT_ID, analyticsEvents } from "@/lib/analytics";

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
  it("does not fall back to a hard-coded measurement ID", () => {
    expect(GA_MEASUREMENT_ID).toBe(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "");
  });

  it("does not queue business events when measurement ID is missing", () => {
    const browser = installBrowserGlobals();
    analyticsEvents.jobApplication("job-1", "Operations Manager");
    expect(browser.dataLayer).toHaveLength(GA_MEASUREMENT_ID ? 1 : 0);
    if (GA_MEASUREMENT_ID) {
      expect(browser.dataLayer[0]).toEqual(expect.arrayContaining(["event", "job_application"]));
    }
  });
});
