import type { Metadata } from "next";

export const SITE_NAME = "MX Venture Lab";
export const SITE_URL = new URL("https://www.mxvlab.com");
export const DEFAULT_TITLE = "MX Venture Lab | AI-Powered Recruitment & Business Solutions";
export const DEFAULT_DESCRIPTION =
  "AI-powered recruitment platform connecting candidates and employers through smart matching, career tools, managed hiring, and business solutions.";

export const PRIVATE_ROBOTS: Metadata["robots"] = {
  index: false,
  follow: false,
  nocache: true,
  googleBot: {
    index: false,
    follow: false,
    noimageindex: true
  }
};
