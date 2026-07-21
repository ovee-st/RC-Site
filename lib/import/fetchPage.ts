import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const MAX_REDIRECTS = 3;
const MAX_RESPONSE_BYTES = 1_500_000;
const REQUEST_TIMEOUT_MS = 10_000;
const BLOCKED_HOST_SUFFIXES = [".internal", ".local", ".localhost", ".home", ".lan"];

export class ImportFetchError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = "ImportFetchError";
  }
}

function isPrivateIpv4(address: string) {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true;
  const [a, b] = parts;
  return a === 0 || a === 10 || a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224;
}

function isPrivateIp(address: string) {
  const normalized = address.toLowerCase().split("%")[0];
  if (isIP(normalized) === 4) return isPrivateIpv4(normalized);
  if (isIP(normalized) !== 6) return true;
  if (normalized === "::" || normalized === "::1") return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb")) return true;
  const mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
  return mapped ? isPrivateIpv4(mapped) : false;
}

export function validateImportUrl(rawUrl: string) {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new ImportFetchError("Enter a valid job page URL.", "INVALID_URL");
  }

  if (!new Set(["http:", "https:"]).has(url.protocol)) {
    throw new ImportFetchError("Only HTTP and HTTPS job URLs are supported.", "UNSUPPORTED_PROTOCOL");
  }
  if (url.username || url.password) {
    throw new ImportFetchError("URLs containing credentials are not supported.", "URL_CREDENTIALS_REJECTED");
  }
  if (url.port && !new Set(["80", "443"]).has(url.port)) {
    throw new ImportFetchError("The URL uses an unsupported network port.", "UNSUPPORTED_PORT");
  }

  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
  if (hostname === "localhost" || BLOCKED_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix))) {
    throw new ImportFetchError("Internal network addresses cannot be imported.", "PRIVATE_ADDRESS");
  }
  if (isIP(hostname) && isPrivateIp(hostname)) {
    throw new ImportFetchError("Private IP addresses cannot be imported.", "PRIVATE_ADDRESS");
  }
  url.hash = "";
  return url;
}

async function assertPublicDestination(url: URL) {
  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  const results = await lookup(hostname, { all: true, verbatim: true }).catch(() => []);
  if (!results.length || results.some((result) => isPrivateIp(result.address))) {
    throw new ImportFetchError("The job URL could not be resolved to a public website.", "PRIVATE_OR_UNRESOLVED_ADDRESS");
  }
}

function robotsDisallows(robots: string, pathname: string) {
  const lines = robots.split(/\r?\n/).map((line) => line.replace(/#.*$/, "").trim()).filter(Boolean);
  let applies = false;
  for (const line of lines) {
    const [rawKey, ...valueParts] = line.split(":");
    const key = rawKey.toLowerCase();
    const value = valueParts.join(":").trim();
    if (key === "user-agent") applies = value === "*" || value.toLowerCase() === "mxvl-job-importer";
    if (applies && key === "disallow" && value && pathname.startsWith(value)) return true;
  }
  return false;
}

async function readLimitedBody(response: Response, limit = MAX_RESPONSE_BYTES) {
  const declared = Number(response.headers.get("content-length") || 0);
  if (declared > limit) throw new ImportFetchError("The job page is too large to import safely.", "RESPONSE_TOO_LARGE");
  if (!response.body) return "";

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let content = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > limit) {
      await reader.cancel();
      throw new ImportFetchError("The job page is too large to import safely.", "RESPONSE_TOO_LARGE");
    }
    content += decoder.decode(value, { stream: true });
  }
  return content + decoder.decode();
}

async function ensureRobotsPermission(url: URL, signal: AbortSignal) {
  const robotsUrl = new URL("/robots.txt", url.origin);
  await assertPublicDestination(robotsUrl);
  const response = await fetch(robotsUrl, {
    headers: { "User-Agent": "MXVL-Job-Importer/1.0" },
    redirect: "manual",
    signal
  }).catch(() => null);
  if (!response?.ok) return;
  const robots = await readLimitedBody(response, 64_000);
  if (robotsDisallows(robots, url.pathname)) {
    throw new ImportFetchError("This website does not permit automated retrieval of that page. Paste the job description instead.", "ROBOTS_DISALLOWED");
  }
}

export async function fetchJobPage(rawUrl: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    let currentUrl = validateImportUrl(rawUrl);
    await ensureRobotsPermission(currentUrl, controller.signal);

    for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
      await assertPublicDestination(currentUrl);
      const response = await fetch(currentUrl, {
        headers: {
          Accept: "text/html,text/plain;q=0.9",
          "User-Agent": "MXVL-Job-Importer/1.0"
        },
        redirect: "manual",
        signal: controller.signal
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location || redirectCount === MAX_REDIRECTS) {
          throw new ImportFetchError("The job page redirected too many times.", "TOO_MANY_REDIRECTS");
        }
        currentUrl = validateImportUrl(new URL(location, currentUrl).toString());
        continue;
      }

      if (!response.ok) {
        throw new ImportFetchError(`The job page returned HTTP ${response.status}. Paste the description manually instead.`, "RETRIEVAL_FAILED");
      }

      const contentType = response.headers.get("content-type")?.toLowerCase() || "";
      if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
        throw new ImportFetchError("This page format is not supported yet. Paste the job description instead.", "UNSUPPORTED_CONTENT_TYPE");
      }

      return {
        html: await readLimitedBody(response),
        finalUrl: currentUrl.toString(),
        contentType
      };
    }

    throw new ImportFetchError("The job page could not be retrieved.", "RETRIEVAL_FAILED");
  } catch (error) {
    if (error instanceof ImportFetchError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new ImportFetchError("The job page took too long to respond. Paste the description manually instead.", "RETRIEVAL_TIMEOUT");
    }
    throw new ImportFetchError("The job page could not be retrieved. Paste the description manually instead.", "RETRIEVAL_FAILED");
  } finally {
    clearTimeout(timeout);
  }
}
